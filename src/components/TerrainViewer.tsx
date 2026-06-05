import { useEffect, useRef } from "react";
import * as THREE from "three";

interface TerrainViewerProps {
  heightmap: string | HTMLImageElement;
  scale?: number; // Height exaggeration factor (default 100)
  containerStyle?: React.CSSProperties;
}

export function TerrainViewer({
  heightmap,
  scale = 100,
  containerStyle,
}: TerrainViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Create scene with dark gray background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      10000000,
    );
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Load and process heightmap
    const loadHeightmap = () => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      const onImageLoad = () => {
        // Create canvas to read pixel data
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;

        const gridWidth = img.width;
        const gridHeight = img.height;
        const radiusMeters = Math.max(gridWidth, gridHeight) / 2;

        // Generate terrain mesh from heightmap
        const geometry = new THREE.BufferGeometry();

        // Find min/max elevation for normalization
        let minElev = Infinity;
        let maxElev = -Infinity;

        for (let i = 0; i < gridHeight; i++) {
          for (let j = 0; j < gridWidth; j++) {
            const pixelIdx = (i * gridWidth + j) * 4;
            // Use grayscale value (average of RGB)
            const gray =
              (data[pixelIdx]! + data[pixelIdx + 1]! + data[pixelIdx + 2]!) /
              3 /
              255;
            const elevation = gray * scale;

            minElev = Math.min(minElev, elevation);
            maxElev = Math.max(maxElev, elevation);
          }
        }

        // Build vertices and vertex colors
        const vertices: number[] = [];
        const colors: number[] = [];

        for (let i = 0; i < gridHeight; i++) {
          for (let j = 0; j < gridWidth; j++) {
            const pixelIdx = (i * gridWidth + j) * 4;
            const gray =
              (data[pixelIdx]! + data[pixelIdx + 1]! + data[pixelIdx + 2]!) /
              3 /
              255;
            const elevation = gray * scale;

            // Position in 3D space (x=east, y=elevation, z=north)
            const x = (j / (gridWidth - 1) - 0.5) * radiusMeters * 2;
            const z = (i / (gridHeight - 1) - 0.5) * radiusMeters * 2;
            const y = elevation;

            vertices.push(x, y, z);

            // Color based on elevation gradient
            const elevRange = maxElev - minElev;
            const normElev =
              elevRange > 0 ? (elevation - minElev) / elevRange : 0.5;

            let r, g, b;
            if (normElev < 0.5) {
              const t = normElev * 2;
              const darkness = 40 + t * 80;
              r = darkness;
              g = darkness;
              b = darkness;
            } else {
              const t = (normElev - 0.5) * 2;
              const brightness = 120 + t * 135;
              r = brightness;
              g = brightness;
              b = brightness;
            }

            colors.push(r / 255, g / 255, b / 255);
          }
        }

        // Build faces (triangles)
        const indices: number[] = [];
        for (let i = 0; i < gridHeight - 1; i++) {
          for (let j = 0; j < gridWidth - 1; j++) {
            const a = i * gridWidth + j;
            const b = i * gridWidth + (j + 1);
            const c = (i + 1) * gridWidth + j;
            const d = (i + 1) * gridWidth + (j + 1);

            indices.push(a, c, b);
            indices.push(b, c, d);
          }
        }

        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(new Float32Array(vertices), 3),
        );
        geometry.setAttribute(
          "color",
          new THREE.BufferAttribute(new Float32Array(colors), 3),
        );
        geometry.setIndex(
          new THREE.BufferAttribute(new Uint32Array(indices), 1),
        );
        geometry.computeVertexNormals();

        // Create material that uses vertex colors
        const material = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.8,
          metalness: 0.0,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Add lighting for dark grayscale theme
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1000, 2000, 1000);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // Position camera at the center of the mesh
        const centerElev = (minElev + maxElev) / 2;
        const eyeHeight = 1.7; // Human eye height in meters
        camera.position.set(0, centerElev + eyeHeight, 0);

        // Mouse and touch controls
        let isDragging = false;
        let previousPosition = { x: 0, y: 0 };
        let previousTouchDistance = 0;
        let yaw = 0; // Horizontal rotation (Y axis)
        let pitch = 0; // Vertical rotation (X axis)

        const updateCameraRotation = () => {
          // Clamp pitch to prevent flipping
          const maxPitch = Math.PI / 2.2;
          pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));

          // Apply rotation using Euler angles (YXZ order for FPS-style camera)
          camera.rotation.order = "YXZ";
          camera.rotation.y = yaw;
          camera.rotation.x = pitch;
        };

        const handleDrag = (deltaX: number, deltaY: number) => {
          yaw += deltaX * 0.005;
          pitch += deltaY * 0.005;
          updateCameraRotation();
        };

        const getTouchDistance = (touches: TouchList) => {
          if (touches.length < 2) return 0;
          const dx = touches[0]!.clientX - touches[1]!.clientX;
          const dy = touches[0]!.clientY - touches[1]!.clientY;
          return Math.sqrt(dx * dx + dy * dy);
        };

        const handleZoom = (deltaDistance: number) => {
          // For POV mode, move camera forward/backward along its looking direction
          const direction = new THREE.Vector3(0, 0, -1); // Default forward direction
          direction.applyQuaternion(camera.quaternion);
          direction.normalize();

          // Move 10 units per 100 pixels of scroll
          const moveDistance = (deltaDistance / 100) * 10;
          camera.position.addScaledVector(direction, moveDistance);
        };

        // Mouse events
        renderer.domElement.addEventListener("mousedown", (e) => {
          isDragging = true;
          previousPosition = { x: e.clientX, y: e.clientY };
        });

        renderer.domElement.addEventListener("mousemove", (e) => {
          if (isDragging) {
            const deltaX = e.clientX - previousPosition.x;
            const deltaY = e.clientY - previousPosition.y;
            handleDrag(deltaX, deltaY);
            previousPosition = { x: e.clientX, y: e.clientY };
          }
        });

        renderer.domElement.addEventListener("mouseup", () => {
          isDragging = false;
        });

        renderer.domElement.addEventListener("wheel", (e) => {
          e.preventDefault();
          handleZoom(e.deltaY);
        });

        // Touch events
        renderer.domElement.addEventListener("touchstart", (e) => {
          if (e.touches.length === 1) {
            isDragging = true;
            previousPosition = {
              x: e.touches[0]!.clientX,
              y: e.touches[0]!.clientY,
            };
          } else if (e.touches.length === 2) {
            isDragging = false;
            previousTouchDistance = getTouchDistance(e.touches);
          }
        });

        renderer.domElement.addEventListener("touchmove", (e) => {
          e.preventDefault();
          if (e.touches.length === 1 && isDragging) {
            const deltaX = e.touches[0]!.clientX - previousPosition.x;
            const deltaY = e.touches[0]!.clientY - previousPosition.y;
            handleDrag(deltaX, deltaY);
            previousPosition = {
              x: e.touches[0]!.clientX,
              y: e.touches[0]!.clientY,
            };
          } else if (e.touches.length === 2) {
            const touchDistance = getTouchDistance(e.touches);
            if (previousTouchDistance > 0) {
              const delta = touchDistance - previousTouchDistance;
              handleZoom(-delta);
            }
            previousTouchDistance = touchDistance;
          }
        });

        renderer.domElement.addEventListener("touchend", () => {
          isDragging = false;
          previousTouchDistance = 0;
        });

        // Handle window resize
        const handleResize = () => {
          const newWidth = containerRef.current?.clientWidth ?? width;
          const newHeight = containerRef.current?.clientHeight ?? height;
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        };

        window.addEventListener("resize", handleResize);

        // Animation loop
        const animate = () => {
          requestAnimationFrame(animate);
          renderer.render(scene, camera);
        };

        animate();

        // Cleanup for this heightmap load
        return () => {
          window.removeEventListener("resize", handleResize);
          renderer.domElement.removeEventListener(
            "mousedown",
            undefined as any,
          );
          renderer.domElement.removeEventListener(
            "mousemove",
            undefined as any,
          );
          renderer.domElement.removeEventListener("mouseup", undefined as any);
          renderer.domElement.removeEventListener("wheel", undefined as any);
          renderer.domElement.removeEventListener(
            "touchstart",
            undefined as any,
          );
          renderer.domElement.removeEventListener(
            "touchmove",
            undefined as any,
          );
          renderer.domElement.removeEventListener("touchend", undefined as any);
          geometry.dispose();
          material.dispose();
        };
      };

      if (typeof heightmap === "string") {
        img.src = heightmap;
        img.onload = onImageLoad;
        img.onerror = () => console.error("Failed to load heightmap image");
      } else {
        // Already an image element
        img.src = heightmap.src;
        if (heightmap.complete) {
          onImageLoad();
        } else {
          img.onload = onImageLoad;
          img.onerror = () => console.error("Failed to load heightmap image");
        }
      }
    };

    loadHeightmap();

    // Cleanup for the entire component
    return () => {
      if (
        rendererRef.current &&
        containerRef.current?.contains(rendererRef.current.domElement)
      ) {
        containerRef.current?.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, [heightmap]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        ...containerStyle,
      }}
    />
  );
}
