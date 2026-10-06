import { useState } from 'react';
import type { PeerStatus } from '../hooks/usePeer';

interface Props {
  status: PeerStatus;
  onCreate: () => Promise<string>;
  onJoin: (code: string) => Promise<string>;
  onAnswer: (code: string) => Promise<void>;
}

type Mode = 'choose' | 'host' | 'guest';

export default function ConnectPanel({ status, onCreate, onJoin, onAnswer }: Props) {
  const [mode, setMode] = useState<Mode>('choose');
  const [mine, setMine] = useState('');
  const [theirs, setTheirs] = useState('');
  const [working, setWorking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setWorking(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    }
    setWorking(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(mine);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* the text box can still be copied by hand */
    }
  };

  const codeBox = (
    <>
      <textarea readOnly value={mine} aria-label="Your code" onFocus={(e) => e.currentTarget.select()} />
      <button className="btn small white" onClick={copy}>{copied ? 'Copied!' : 'Copy code'}</button>
    </>
  );

  return (
    <div className="connect">
      {mode === 'choose' && (
        <>
          <h2>Connect with Puia</h2>
          <p>You swap two codes in any chat app. After that, your cameras connect directly.</p>
          <div className="actions left">
            <button className="btn" disabled={working} onClick={() => run(async () => { setMine(await onCreate()); setMode('host'); })}>
              Create a room
            </button>
            <button className="btn white" onClick={() => setMode('guest')}>Join a room</button>
          </div>
        </>
      )}

      {mode === 'host' && (
        <>
          <h2>1. Send this code</h2>
          <p>Message it to your partner and keep this page open.</p>
          {codeBox}
          <h2>2. Paste their reply</h2>
          <textarea value={theirs} onChange={(e) => setTheirs(e.target.value)} placeholder="Paste their reply code here" aria-label="Reply code" />
          <button className="btn" disabled={working || !theirs.trim()} onClick={() => run(() => onAnswer(theirs))}>
            {status === 'connecting' ? 'Connecting…' : 'Connect'}
          </button>
        </>
      )}

      {mode === 'guest' && !mine && (
        <>
          <h2>1. Paste their code</h2>
          <textarea value={theirs} onChange={(e) => setTheirs(e.target.value)} placeholder="Paste the room code here" aria-label="Room code" />
          <button className="btn" disabled={working || !theirs.trim()} onClick={() => run(async () => setMine(await onJoin(theirs)))}>
            {working ? 'Working…' : 'Make my reply code'}
          </button>
        </>
      )}

      {mode === 'guest' && mine && (
        <>
          <h2>2. Send this back</h2>
          <p>Message it to your partner and keep this page open. You will join automatically.</p>
          {codeBox}
        </>
      )}

      {err && <p className="err" role="alert">{err}</p>}
    </div>
  );
}
