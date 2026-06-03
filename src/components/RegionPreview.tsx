import { useEffect, useRef } from "react";
import {
  getOfflineTile,
  latToTileYFloat,
  lonToTileXFloat,
  type OfflineRegionBounds,
} from "../lib/offlineTiles";

/** Zoom used for previews. Matches the default download minZoom. */
const PREVIEW_ZOOM = 11;
const TILE_SIZE = 256;

type Props = {
  bounds: OfflineRegionBounds;
  width: number;
  height: number;
};

/**
 * Renders a tiny preview of a saved offline region by stitching cached topo
 * tiles from IndexedDB onto a canvas, cropped to the region bounds.
 */
export function RegionPreview({ bounds, width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, width, height);

    const xMinF = lonToTileXFloat(bounds.minLon, PREVIEW_ZOOM);
    const xMaxF = lonToTileXFloat(bounds.maxLon, PREVIEW_ZOOM);
    const yMinF = latToTileYFloat(bounds.maxLat, PREVIEW_ZOOM);
    const yMaxF = latToTileYFloat(bounds.minLat, PREVIEW_ZOOM);
    const srcW = (xMaxF - xMinF) * TILE_SIZE;
    const srcH = (yMaxF - yMinF) * TILE_SIZE;
    if (srcW <= 0 || srcH <= 0) return;

    // Fit while preserving aspect ratio (letterboxed on the fill bg).
    const scale = Math.min(width / srcW, height / srcH);
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    const offsetX = (width - drawW) / 2;
    const offsetY = (height - drawH) / 2;

    const xMin = Math.floor(xMinF);
    const xMax = Math.floor(xMaxF);
    const yMin = Math.floor(yMinF);
    const yMax = Math.floor(yMaxF);

    (async () => {
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
    })();

    return () => {
      cancelled = true;
    };
  }, [bounds, width, height]);

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
