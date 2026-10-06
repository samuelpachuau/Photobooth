import { useEffect, useRef, useState } from 'react';
import Chips from './components/Chips';
import ConnectPanel from './components/ConnectPanel';
import Doodles from './components/Doodles';
import Result from './components/Result';
import Stage from './components/Stage';
import { useCamera } from './hooks/useCamera';
import { usePeer, type Msg } from './hooks/usePeer';
import { FILTERS, LAYOUTS, PAIRS } from './lib/constants';
import { loadCanvas } from './lib/image';
import { renderStrip } from './lib/strip';
import type { FilterId, LayoutId, PairId, Role } from './types';

type Shots = HTMLCanvasElement[];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const setAt = (a: Shots, i: number, v: HTMLCanvasElement) => {
  const n = [...a];
  n[i] = v;
  return n;
};
const have = (a: Shots, t: number) => Array.from({ length: t }, (_, i) => a[i]).every(Boolean);
const filled = (a: Shots) => a.filter(Boolean).length;

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [layout, setLayout] = useState<LayoutId>('strip3');
  const [pair, setPair] = useState<PairId>('side');
  const [filter, setFilter] = useState<FilterId>('bw');
  const [caption, setCaption] = useState('us ♡');
  const [mine, setMine] = useState<Shots>([]);
  const [theirs, setTheirs] = useState<Shots>([]);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const cam = useCamera();
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const blink = async () => {
    setFlash(true);
    await sleep(70);
    setFlash(false);
  };
  const clearAll = () => {
    setMine([]);
    setTheirs([]);
    setResultUrl(null);
  };

  // Messages from the other person.
  const onMessage = (m: Msg) => {
    if (m.k === 'settings') {
      setLayout(m.layout);
      setPair(m.pair);
      setFilter(m.filter);
      setCaption(m.caption);
    } else if (m.k === 'start') {
      clearAll();
      setStarted(true);
      setBusy(true);
    } else if (m.k === 'tick') {
      setCount(m.n);
    } else if (m.k === 'snap') {
      const f = cam.grab();
      if (f) {
        setMine((p) => setAt(p, m.i, f));
        peer.sendFrame(m.i, f);
      }
      void blink();
    } else if (m.k === 'reset') {
      clearAll();
      setBusy(false);
    }
  };
  const onFrame = async (i: number, url: string) => {
    const c = await loadCanvas(url);
    setTheirs((p) => setAt(p, i, c));
  };
  const peer = usePeer(onMessage, onFrame);

  const connected = peer.status === 'connected';
  const total = LAYOUTS.find((l) => l.id === layout)!.count;
  const done = have(mine, total) && have(theirs, total);
  const previewFilter = FILTERS.find((f) => f.id === filter)!.preview;
  const isHost = role === 'host';

  // The host's settings are shared with the guest.
  useEffect(() => {
    if (isHost && connected) peer.send({ k: 'settings', layout, pair, filter, caption });
  }, [isHost, connected, layout, pair, filter, caption]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build the strip once both of you have all the photos.
  useEffect(() => {
    if (!done) return;
    setBusy(false);
    let cancelled = false;
    const t = setTimeout(async () => {
      const hostShots = isHost ? mine : theirs;
      const guestShots = isHost ? theirs : mine;
      const url = await renderStrip(hostShots.slice(0, total), guestShots.slice(0, total), layout, pair, filter, caption);
      if (!cancelled) setResultUrl(url);
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [done, mine, theirs, isHost, total, layout, pair, filter, caption]);

  const onCreate = async () => {
    if (!(await cam.start())) throw new Error('Allow camera access first, then try again.');
    setRole('host');
    return peer.createRoom(cam.getStream()!);
  };
  const onJoin = async (code: string) => {
    if (!(await cam.start())) throw new Error('Allow camera access first, then try again.');
    setRole('guest');
    return peer.join(code, cam.getStream()!);
  };

  const changeLayout = (id: LayoutId) => {
    setLayout(id);
    clearAll();
    peer.send({ k: 'reset' });
  };

  const run = async () => {
    if (busy || !isHost) return;
    setBusy(true);
    setStarted(true);
    clearAll();
    peer.send({ k: 'start' });
    await sleep(500);
    for (let i = 0; i < total; i++) {
      for (let t = 3; t > 0; t--) {
        if (!alive.current) return;
        setCount(t);
        peer.send({ k: 'tick', n: t });
        await sleep(900);
      }
      setCount(null);
      peer.send({ k: 'tick', n: null });
      peer.send({ k: 'snap', i });
      const f = cam.grab();
      if (f) {
        setMine((p) => setAt(p, i, f));
        peer.sendFrame(i, f);
      }
      void blink();
      await sleep(900);
    }
  };

  const retake = () => {
    clearAll();
    setBusy(false);
    peer.send({ k: 'reset' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Doodles />
      <div className="wrap">
        <h1>Puia & Dolkar's photobooth</h1>
        <p className="sub">for Zawngi ♡</p>
        {peer.status === 'failed' && (
          <p className="banner" role="alert">Connection lost. Refresh both pages and connect again.</p>
        )}
        <div className="main">
          <Stage
            videoRef={cam.videoRef}
            remoteStream={peer.remoteStream}
            role={role}
            ready={cam.ready}
            error={cam.error}
            count={count}
            flash={flash}
            previewFilter={previewFilter}
            total={total}
            taken={filled(mine)}
          />
          <div className="panel">
            {connected ? (
              <>
                {!isHost && <p className="hint">Your partner picks the style and presses Start. Get ready to smile!</p>}
                <h2>Layout</h2>
                <Chips options={LAYOUTS} value={layout} onChange={changeLayout} disabled={busy || !isHost} />
                <h2>Together</h2>
                <Chips options={PAIRS} value={pair} onChange={setPair} disabled={busy || !isHost} />
                <h2>Effect</h2>
                <Chips options={FILTERS} value={filter} onChange={setFilter} disabled={busy || !isHost} />
                <h2>Caption</h2>
                <input
                  value={caption}
                  maxLength={28}
                  aria-label="Caption"
                  disabled={!isHost}
                  onChange={(e) => setCaption(e.target.value)}
                />
                {isHost && (
                  <button className="btn" onClick={run} disabled={busy}>
                    {started ? 'Start again' : 'Start'}
                  </button>
                )}
              </>
            ) : (
              <ConnectPanel status={peer.status} onCreate={onCreate} onJoin={onJoin} onAnswer={peer.acceptAnswer} />
            )}
          </div>
        </div>
        {resultUrl && <Result url={resultUrl} onRetake={isHost ? retake : undefined} />}
        <p className="note">Created for Zawngi only.</p>
      </div>
    </>
  );
}
