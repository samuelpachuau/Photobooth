export type LayoutId = 'strip3' | 'strip4';
export type PairId = 'side' | 'stack';
export type FilterId = 'none' | 'bw' | 'retro' | 'sepia' | 'grain';
export type Role = 'host' | 'guest';

export interface Option<T extends string> {
  id: T;
  label: string;
}
export interface LayoutOption extends Option<LayoutId> {
  count: number;
}
export interface FilterOption extends Option<FilterId> {
  /** CSS filter used for the live camera preview only */
  preview: string;
}
