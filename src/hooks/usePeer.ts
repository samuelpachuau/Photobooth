import { useEffect, useRef, useState } from 'react';
import { decodeCode, encodeCode } from '../lib/code';
import type { FilterId, LayoutId, PairId } from '../types';

export type PeerStatus = 'idle' | 'hosting' | 'joining' | 'connecting' | 'connected' | 'failed';

/** Messages sent over the data channel (the host drives the session). */
export type Msg =
  | { k: 'settings'; layout: LayoutId; pair: PairId; filter: FilterId; caption: string }
  | { k: 'start' }
  | { k: 'tick'; n: number | null }
  | { k: 'snap'; i: number }
  | { k: 'reset' };
type FrameMsg = { k: 'frame'; i: number; p: number; n: number; d: string };

// STUN only helps each browser learn its public address. Video and photos still go
// directly between the two of you.
const ICE: RTCConfiguration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const CHUNK = 12000;
const CODE_ERR = 'That code did not work. Make sure you copied all of it.';

function waitForIce(pc: RTCPeerConnection) {
  return new Promise<void>((resolve) => {
    if (pc.iceGatheringState === 'complete') return resolve();
    const done = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', done);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', done);
    setTimeout(resolve, 4000); // use whatever was gathered if it takes too long
  });
}

export function usePeer(onMessage: (m: Msg) => void, onFrame: (i: number, url: string) => void) {
  const [status, setStatus] = useState<PeerStatus>('idle');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const inbox = useRef(new Map<number, { parts: string[]; got: number }>());
  const cbs = useRef({ onMessage, onFrame });
  cbs.current = { onMessage, onFrame };

  const handle = (raw: string) => {
    const m = JSON.parse(raw) as Msg | FrameMsg;
    if (m.k !== 'frame') return cbs.current.onMessage(m);
    let e = inbox.current.get(m.i);
    if (!e || e.parts.length !== m.n) {
      e = { parts: new Array<string>(m.n), got: 0 };
      inbox.current.set(m.i, e);
    }
    if (e.parts[m.p] === undefined) {
      e.parts[m.p] = m.d;
      e.got++;
    }
    if (e.got === m.n) {
      inbox.current.delete(m.i);
      cbs.current.onFrame(m.i, e.parts.join(''));
    }
  };

  const bind = (dc: RTCDataChannel) => {
    dcRef.current = dc;
    dc.onopen = () => setStatus('connected');
    dc.onclose = () => setStatus((s) => (s === 'connected' ? 'failed' : s));
    dc.onmessage = (ev) => handle(ev.data as string);
  };

  const setup = (stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pc.ontrack = (e) => setRemoteStream(e.streams[0]);
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') setStatus('failed');
    };
    pcRef.current = pc;
    return pc;
  };

  /** Host, step 1: returns the code to send to your partner. */
  const createRoom = async (stream: MediaStream) => {
    const pc = setup(stream);
    bind(pc.createDataChannel('booth'));
    await pc.setLocalDescription(await pc.createOffer());
    await waitForIce(pc);
    setStatus('hosting');
    return encodeCode(pc.localDescription!);
  };

  /** Guest: paste the host's code, returns the reply code to send back. */
  const join = async (code: string, stream: MediaStream) => {
    const offer = await decodeCode(code);
    const pc = setup(stream);
    pc.ondatachannel = (e) => bind(e.channel);
    try {
      await pc.setRemoteDescription(offer);
      await pc.setLocalDescription(await pc.createAnswer());
    } catch {
      throw new Error(CODE_ERR);
    }
    await waitForIce(pc);
    setStatus('joining');
    return encodeCode(pc.localDescription!);
  };

  /** Host, step 2: paste the guest's reply code. */
  const acceptAnswer = async (code: string) => {
    const answer = await decodeCode(code);
    try {
      await pcRef.current!.setRemoteDescription(answer);
    } catch {
      throw new Error(CODE_ERR);
    }
    setStatus('connecting');
  };

  const send = (m: Msg | FrameMsg) => {
    if (dcRef.current?.readyState === 'open') dcRef.current.send(JSON.stringify(m));
  };

  /** Sends one photo in small pieces (data channels have message size limits). */
  const sendFrame = (i: number, canvas: HTMLCanvasElement) => {
    const url = canvas.toDataURL('image/jpeg', 0.85);
    const n = Math.ceil(url.length / CHUNK);
    for (let p = 0; p < n; p++) send({ k: 'frame', i, p, n, d: url.slice(p * CHUNK, (p + 1) * CHUNK) });
  };

  useEffect(() => () => pcRef.current?.close(), []);

  return { status, remoteStream, createRoom, join, acceptAnswer, send, sendFrame };
}
