import { useEffect, useRef } from "react";
import {
  getOfflineTile,
  latToTileYFloat,
  lonToTileXFloat,
  polygonBBox,
} from "../lib/offlineTiles";
import type { LatLng } from "../lib/types";

/** Zoom used for previews. Matches the default download minZoom. */
const PREVIEW_ZOOM = 11;
const TILE_SIZE = 256;

type Props = {
  polygon: LatLng[];
  width: number;
  height: number;
};

/**
 * Renders a tiny preview of a saved offline region by stitching cached topo
 * tiles from IndexedDB onto a canvas, masked to the polygon shape.
 */
export function RegionPreview({ polygon, width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (polygon.length < 3) return;
    let cancelled = false;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, width, height);

    const bbox = polygonBBox(polygon);
    const xMinF = lonToTileXFloat(bbox.minLon, PREVIEW_ZOOM);
    const xMaxF = lonToTileXFloat(bbox.maxLon, PREVIEW_ZOOM);
    const yMinF = latToTileYFloat(bbox.maxLat, PREVIEW_ZOOM);
    const yMaxF = latToTileYFloat(bbox.minLat, PREVIEW_ZOOM);
    const srcW = (xMaxF - xMinF) * TILE_SIZE;
    const srcH = (yMaxF - yMinF) * TILE_SIZE;
    if (srcW <= 0 || srcH <= 0) return;

    // Fit while preserving aspect ratio (letterboxed on the fill bg).
    const scale = Math.min(width / srcW, height / srcH);
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    const offsetX = (width - drawW) / 2;
    const offsetY = (height - drawH) / 2;

    function projectLatLngToCanvas(p: LatLng): [number, number] {
      const tx = lonToTileXFloat(p.longitude, PREVIEW_ZOOM);
      const ty = latToTileYFloat(p.latitude, PREVIEW_ZOOM);
      return [
        (tx - xMinF) * TILE_SIZE * scale + offsetX,
        (ty - yMinF) * TILE_SIZE * scale + offsetY,
      ];
    }

    const xMin = Math.floor(xMinF);
    const xMax = Math.floor(xMaxF);
    const yMin = Math.floor(yMinF);
    const yMax = Math.floor(yMaxF);

    (async () => {
      ctx.save();
      ctx.beginPath();
      polygon.forEach((p, i) => {
        const [cx, cy] = projectLatLngToCanvas(p);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.closePath();
      ctx.clip();

      for (let ty = yMin; ty <= yMax; ty++) {
        for (let tx = xMin; tx <= xMax; tx++) {
          const buf = await getOfflineTile("topo", PREVIEW_ZOOM, tx, ty);
          if (cancelled || !buf) continue;
          const blob = new Blob([buf]);
          let bitmap: ImageBitmap;
          try {
            bitmap = await createImageBitmap(blob);
          } catch {
            continue;
          }
          if (cancelled) {
            bitmap.close?.();
            continue;
          }
          const tileX = (tx - xMinF) * TILE_SIZE * scale + offsetX;
          const tileY = (ty - yMinF) * TILE_SIZE * scale + offsetY;
          const tileW = TILE_SIZE * scale;
          const tileH = TILE_SIZE * scale;
          ctx.drawImage(bitmap, tileX, tileY, tileW, tileH);
          bitmap.close?.();
        }
      }
      ctx.restore();
    })();

    return () => {
      cancelled = true;
    };
  }, [polygon, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width,
        height,
        borderRadius: 8,
        background: "#1f2937",
        flexShrink: 0,
      }}
    />
  );
}
