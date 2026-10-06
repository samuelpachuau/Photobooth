import { PHOTO_H, PHOTO_W } from './constants';

/** Turns a received image data URL back into a canvas. */
export function loadCanvas(url: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = PHOTO_W;
      c.height = PHOTO_H;
      c.getContext('2d')!.drawImage(img, 0, 0, PHOTO_W, PHOTO_H);
      resolve(c);
    };
    img.onerror = () => reject(new Error('Could not read photo'));
    img.src = url;
  });
}
