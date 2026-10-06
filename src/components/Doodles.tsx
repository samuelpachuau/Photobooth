const HEART = 'M20 35C8 26 3 19 3 12a8.5 8.5 0 0 1 17-2 8.5 8.5 0 0 1 17 2c0 7-5 14-17 23z';
const STAR = 'M20 3c1 9 4 16 17 17-13 1-16 8-17 17-1-9-4-16-17-17 13-1 16-8 17-17z';

/** Decorative hand-drawn doodles behind the page. */
export default function Doodles() {
  return (
    <>
      <svg className="doodle pink" style={{ left: '4%', top: 34, width: 46 }} viewBox="0 0 40 38" aria-hidden="true">
        <path d={HEART} />
      </svg>
      <svg className="doodle" style={{ right: '5%', top: 50, width: 38 }} viewBox="0 0 40 40" aria-hidden="true">
        <path d={STAR} />
      </svg>
      <svg className="doodle pink" style={{ right: '12%', top: 120, width: 26, transform: 'rotate(14deg)' }} viewBox="0 0 40 38" aria-hidden="true">
        <path d={HEART} />
      </svg>
    </>
  );
}
