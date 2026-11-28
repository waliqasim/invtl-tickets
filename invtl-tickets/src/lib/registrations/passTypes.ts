// Pass colors the gate team uses to tell guests apart at a glance.
export type PassType = 'spectator' | 'featured' | 'showcase' | 'vip';

export const PASS_TYPES: Record<PassType, { label: string; bg: string; fg: string; darkBg: boolean }> = {
  spectator: { label: 'Spectator', bg: '#FFFFFF', fg: '#000000', darkBg: false },
  featured: { label: 'Featured car', bg: '#E10600', fg: '#FFFFFF', darkBg: true },
  showcase: { label: 'Main showcase', bg: '#FFE500', fg: '#000000', darkBg: false },
  vip: { label: 'VIP', bg: '#1F51FF', fg: '#FFFFFF', darkBg: true },
};

export function passTypeOf(v: unknown): PassType {
  return v === 'featured' || v === 'showcase' || v === 'vip' ? v : 'spectator';
}
