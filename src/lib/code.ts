/**
 * Connection codes: a WebRTC session description, compressed and base64-encoded
 * so it is short enough to paste into a chat message.
 */
const BAD_CODE = 'That code did not work. Make sure you copied all of it.';

const toB64 = (u: Uint8Array) => {
  let s = '';
  u.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
};
const fromB64 = (s: string) => Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0));

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function encodeCode(desc: RTCSessionDescriptionInit): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify({ type: desc.type, sdp: desc.sdp }));
  if ('CompressionStream' in window) return 'z' + toB64(await pipe(bytes, new CompressionStream('deflate')));
  return 'r' + toB64(bytes);
}

export async function decodeCode(code: string): Promise<RTCSessionDescriptionInit> {
  try {
    const t = code.replace(/\s+/g, '');
    const bytes = fromB64(t.slice(1));
    const raw = t[0] === 'z' ? await pipe(bytes, new DecompressionStream('deflate')) : bytes;
    return JSON.parse(new TextDecoder().decode(raw));
  } catch {
    throw new Error(BAD_CODE);
  }
}
