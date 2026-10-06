import { useCallback, useEffect, useRef, useState } from 'react';
import { PHOTO_H, PHOTO_W } from '../lib/constants';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (): Promise<boolean> => {
    if (streamRef.current) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        await v.play();
      }
      setReady(true);
      setError(null);
      return true;
    } catch {
      setError('The camera is blocked. Allow camera access in your browser, then try again.');
      return false;
    }
  }, []);

  const getStream = useCallback(() => streamRef.current, []);

  /** Grabs the current frame, cropped to 4:3 and mirrored like the preview. */
  const grab = useCallback((): HTMLCanvasElement | null => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const c = document.createElement('canvas');
    c.width = PHOTO_W;
    c.height = PHOTO_H;
    let sw = v.videoWidth;
    let sh = (sw * 3) / 4;
    if (sh > v.videoHeight) {
      sh = v.videoHeight;
      sw = (sh * 4) / 3;
    }
    const ctx = c.getContext('2d')!;
    ctx.translate(PHOTO_W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, (v.videoWidth - sw) / 2, (v.videoHeight - sh) / 2, sw, sh, 0, 0, PHOTO_W, PHOTO_H);
    return c;
  }, []);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    },
    [],
  );

  return { videoRef, ready, error, start, getStream, grab };
}
