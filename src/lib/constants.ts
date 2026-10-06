import type { FilterOption, LayoutOption, Option, PairId } from '../types';

export const LAYOUTS: LayoutOption[] = [
  { id: 'strip3', label: 'Strip of 3', count: 3 },
  { id: 'strip4', label: 'Strip of 4', count: 4 },
];

export const PAIRS: Option<PairId>[] = [
  { id: 'side', label: 'Side by side' },
  { id: 'stack', label: 'Stacked' },
];

export const FILTERS: FilterOption[] = [
  { id: 'none', label: 'Plain', preview: 'none' },
  { id: 'bw', label: 'Black & white', preview: 'grayscale(1) contrast(1.15)' },
  { id: 'retro', label: 'Retro', preview: 'sepia(.3) saturate(1.3) contrast(.9) brightness(1.1)' },
  { id: 'sepia', label: 'Sepia', preview: 'sepia(.9)' },
  { id: 'grain', label: 'Grain + light leak', preview: 'sepia(.2) contrast(1.05)' },
];

export const PHOTO_W = 640;
export const PHOTO_H = 480;
