/**
 * The tactical board is its own art direction: a dark-blue coaching surface
 * with a bright pitch. It deliberately does not reuse the app's light pages.
 */
export const Tactical = {
  bg: '#324B79',
  bgDeep: '#223A5E',
  bgLine: 'rgba(255,255,255,0.045)',

  panel: 'rgba(18,34,60,0.62)',
  panelSolid: '#1E3558',
  panelSoft: 'rgba(18,34,60,0.38)',

  border: 'rgba(255,255,255,0.42)',
  borderSoft: 'rgba(255,255,255,0.16)',

  text: '#FFFFFF',
  textDim: 'rgba(255,255,255,0.66)',
  textFaint: 'rgba(255,255,255,0.40)',

  pitchFrame: '#12B90B',
  stripe1: '#008C10',
  stripe2: '#079D08',
  stripe3: '#13B900',
  pitchLine: 'rgba(255,255,255,0.92)',

  home: '#FF1717',
  away: '#1677FF',
  gk: '#FFE600',
  cone: '#FF7800',
  ball: '#F7F7F7',

  save: '#55D83B',
  saveInk: '#0B1A06',
  ai: '#36C9C4',
  aiInk: '#06201F',

  danger: '#E24B4A',
  selected: '#B6FF6A',
  black: '#050A12',
  white: '#FFFFFF',
} as const;
