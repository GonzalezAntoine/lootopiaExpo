export const C = {
  bg: '#0E0C09',
  surface: '#1A1710',
  surfaceAlt: '#211E14',
  border: '#2E2B1E',
  borderFocus: '#C9A84C',
  gold: '#C9A84C',
  goldLight: '#E8C96A',
  goldDim: '#7A6128',
  text: '#EDE8D8',
  textMuted: '#8A8470',
  textFaint: '#504C3D',
  accent: '#5C8A5E',
  error: '#C0504A',
  silver: '#A8A8B0',
  bronze: '#A0643C',
} as const;

export const MEDAL = [
  { color: C.gold, label: '1er', bg: '#2A2310' },
  { color: C.silver, label: '2ème', bg: '#1E1E22' },
  { color: C.bronze, label: '3ème', bg: '#221A14' },
] as const;

export type ColorKey = keyof typeof C;