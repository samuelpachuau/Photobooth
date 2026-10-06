import type { Option } from '../types';

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (id: T) => void;
  disabled?: boolean;
}

export default function Chips<T extends string>({ options, value, onChange, disabled }: Props<T>) {
  return (
    <div className="row">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className="chip"
          aria-pressed={o.id === value}
          disabled={disabled}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
