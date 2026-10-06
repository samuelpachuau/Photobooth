import type { FilterId, LayoutId, PairId } from '../types';
import { applyFilter } from './filters';

const PAD = 36, GAP = 22, CAP = 140, IN = 10;
const FONT = 'Gaegu, "Comic Sans MS", cursive';
// size of ONE person's photo inside a frame
const CELL = { side: { w: 260, h: 300 }, stack: { w: 400, h: 225 } } as const;

function heart(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.beginPath();
  c.moveTo(x, y + s * 0.3);
  c.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
  c.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.75, x, y + s);
  c.bezierCurveTo(x, y + s * 0.75, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
  c.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
  c.fillStyle = '#ffc9d6';
  c.fill();
  c.stroke();
}

function sparkle(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.beginPath();
  c.moveTo(x, y - s);
  c.quadraticCurveTo(x, y, x + s, y);
  c.quadraticCurveTo(x, y, x, y + s);
  c.quadraticCurveTo(x, y, x - s, y);
  c.quadraticCurveTo(x, y, x, y - s);
  c.stroke();
}

function drawCover(c: CanvasRenderingContext2D, src: HTMLCanvasElement, x: number, y: number, w: number, h: number) {
  const k = Math.max(w / src.width, h / src.height);
  const sw = w / k, sh = h / k;
  c.drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, x, y, w, h);
  c.strokeRect(x, y, w, h);
}

/** Builds the finished strip (host photos on the left/top, guest on the right/bottom). */
export async function renderStrip(
  hostShots: HTMLCanvasElement[],
  guestShots: HTMLCanvasElement[],
  _layout: LayoutId,
  pair: PairId,
  filter: FilterId,
  caption: string,
): Promise<string> {
  try {
    await document.fonts.load('700 44px Gaegu');
  } catch {
    /* fall back to the system font */
  }
  const n = hostShots.length;
  const { w: cw, h: ch } = CELL[pair];
  const side = pair === 'side';
  const FW = side ? cw * 2 + IN : cw;
  const FH = side ? ch : ch * 2 + IN;
  const W = FW + PAD * 2;
  const H = PAD + n * FH + (n - 1) * GAP + CAP + PAD / 2;

  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#fff';
  c.fillRect(0, 0, W, H);
  c.strokeStyle = '#222';
  c.lineWidth = 3;
  c.lineJoin = 'round';
  c.lineCap = 'round';

  for (let i = 0; i < n; i++) {
    const x = PAD, y = PAD + i * (FH + GAP);
    const a = applyFilter(hostShots[i], filter, 1234 + i * 77);
    const b = applyFilter(guestShots[i], filter, 4321 + i * 91);
    drawCover(c, a, x, y, cw, ch);
    drawCover(c, b, side ? x + cw + IN : x, side ? y : y + ch + IN, cw, ch);
    heart(c, x + FW / 2, y + FH / 2 - 16, 32); // sticker where the two photos meet
  }

  const cy = H - CAP + 60;
  c.fillStyle = '#222';
  c.textAlign = 'center';
  c.font = `700 52px ${FONT}`;
  c.fillText(caption.trim() || 'us', W / 2, cy);
  c.font = `400 30px ${FONT}`;
  c.fillText(
    new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
    W / 2,
    cy + 40,
  );
  heart(c, PAD + 16, cy - 34, 34);
  heart(c, W - PAD - 16, cy - 34, 34);
  sparkle(c, PAD + 70, cy + 22, 12);
  sparkle(c, W - PAD - 70, cy + 22, 12);
  sparkle(c, W - PAD + 6, PAD - 12, 10);
  return cv.toDataURL('image/png');
}
