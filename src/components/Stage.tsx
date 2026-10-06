import { useEffect, useRef, type RefObject } from 'react';
import type { Role } from '../types';

interface Props {
  videoRef: RefObject<HTMLVideoElement>;
  remoteStream: MediaStream | null;
  role: Role | null;
  ready: boolean;
  error: string | null;
  count: number | null;
  flash: boolean;
  previewFilter: string;
  total: number;
  taken: number;
}

function RemoteVideo({ stream, filter }: { stream: MediaStream; filter: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <video ref={ref} playsInline muted autoPlay style={{ filter }} />;
}

export default function Stage({ videoRef, remoteStream, role, ready, error, count, flash, previewFilter, total, taken }: Props) {
  const left = role !== 'guest'; // the host is always on the left of the strip
  return (
    <div>
      <div className="stage">
        <div className="tiles" style={{ ['--n' as string]: remoteStream ? 2 : 1 }}>
          <div className="tile" style={{ order: left ? 1 : 2 }}>
            <video ref={videoRef} playsInline muted autoPlay style={{ filter: previewFilter }} />
            <span className="tag">you</span>
          </div>
          {remoteStream && (
            <div className="tile" style={{ order: left ? 2 : 1 }}>
              <RemoteVideo stream={remoteStream} filter={previewFilter} />
              <span className="tag">partner</span>
            </div>
          )}
        </div>
        {!ready && <div className="placeholder">{error ?? 'Create or join a room to turn on your camera'}</div>}
        {count !== null && <div className="count">{count}</div>}
        <div className={`flash${flash ? ' on' : ''}`} />
      </div>
      <div className="dots" aria-label={`${taken} of ${total} photos taken`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`dot${i < taken ? ' full' : ''}`} />
        ))}
      </div>
    </div>
  );
}
