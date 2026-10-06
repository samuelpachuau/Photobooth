import { useEffect, useRef } from 'react';

interface Props {
  url: string;
  onRetake?: () => void;
}

export default function Result({ url, onRetake }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const download = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'our-photobooth.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <section className="result" ref={ref}>
      <h2>our strip!</h2>
      <img src={url} alt="Your photobooth strip" />
      <div className="actions">
        <button className="btn" onClick={download}>Download</button>
        {onRetake ? (
          <button className="btn white" onClick={onRetake}>Retake</button>
        ) : (
          <p className="hint">Ask your partner to press Start for another round.</p>
        )}
      </div>
    </section>
  );
}
