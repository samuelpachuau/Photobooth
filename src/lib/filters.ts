import type { FilterId } from '../types';
import { PHOTO_H, PHOTO_W } from './constants';

/** Tiny seeded random so grain looks the same on every re-render. */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}

function lightLeak(ctx: CanvasRenderingContext2D, withPink: boolean) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.filter = 'blur(22px)'; // softens the edges where supported
  const shape = (color: string, pts: [number, number][]) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.fill();
  };
  shape('rgba(255,105,60,.38)', [[-20, -20], [110, -20], [50, 500], [-20, 500]]);
  shape('rgba(255,190,110,.28)', [[110, -20], [170, -20], [120, 500], [60, 500]]);
  if (withPink) shape('rgba(255,120,170,.3)', [[560, -20], [660, -20], [660, 160], [590, 120]]);
  ctx.restore();
}

/** Returns a new canvas with the effect applied. The source is untouched. */
export function applyFilter(src: HTMLCanvasElement, id: FilterId, seed: number): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = PHOTO_W;
  out.height = PHOTO_H;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(src, 0, 0);
  if (id === 'none') return out;

  const img = ctx.getImageData(0, 0, PHOTO_W, PHOTO_H);
  const d = img.data;
  const rnd = makeRng(seed);

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];
    if (id === 'bw') {
      const l = (0.299 * r + 0.587 * g + 0.114 * b - 128) * 1.15 + 128;
      r = g = b = l;
    } else if (id === 'sepia') {
      const R = 0.393 * r + 0.769 * g + 0.189 * b;
      const G = 0.349 * r + 0.686 * g + 0.168 * b;
      const B = 0.272 * r + 0.534 * g + 0.131 * b;
      r = R; g = G; b = B;
    } else if (id === 'retro') {
      const n = (rnd() - 0.5) * 18;
      r = r * 0.85 + 42 + n;
      g = g * 0.84 + 30 + n;
      b = b * 0.78 + 36 + n;
    } else if (id === 'grain') {
      const n = (rnd() - 0.5) * 70;
      r = r * 1.03 + 10 + n;
      g = g * 0.98 + 4 + n;
      b = b * 0.9 + n;
    }
    d[i] = r; d[i + 1] = g; d[i + 2] = b; // Uint8ClampedArray clamps for us
  }
  ctx.putImageData(img, 0, 0);

  if (id === 'retro' || id === 'grain') lightLeak(ctx, id === 'grain');
  return out;
}
