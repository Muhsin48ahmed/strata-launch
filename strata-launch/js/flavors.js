// Flavor palettes. `layers` colors the four strata inside the can, top to bottom.
export const FLAVORS = Object.freeze([
  {
    name: 'Yuzu Quartz', word: 'YUZU',
    bg: '#e2e7ad', can: '#a8c21a', deep: '#24300a', light: '#f3f7c9',
    layers: ['#eef5b0', '#cfe24e', '#9fb817', '#566a0c'],
  },
  {
    name: 'Ochre Mango', word: 'OCHRE',
    bg: '#f2c49a', can: '#de6a1c', deep: '#4a1d05', light: '#fde3c8',
    layers: ['#ffd9a8', '#f7a24a', '#e0701f', '#9a3f0a'],
  },
  {
    name: 'Basalt Cassis', word: 'BASALT',
    bg: '#cdc0e5', can: '#4a2a7a', deep: '#1c0e31', light: '#e8dff6',
    layers: ['#d9c6f2', '#9d79d0', '#6a43a3', '#3a1f63'],
  },
  {
    name: 'Glacier Mint', word: 'GLACIER',
    bg: '#bde2dc', can: '#1c8a81', deep: '#062d2a', light: '#dcf2ee',
    layers: ['#c6f0e8', '#6fcfc2', '#25a093', '#0c5a53'],
  },
]);

const clamp01 = (x) => Math.min(1, Math.max(0, x));

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const rgbToHex = (rgb) =>
  `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

export function mixHex(a, b, k) {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  return rgbToHex(ra.map((c, i) => c + (rb[i] - c) * k));
}

// Returns a palette blended between the two flavors either side of `t` (0..3).
export function blendFlavor(t) {
  const last = FLAVORS.length - 1;
  const i0 = Math.min(last, Math.max(0, Math.floor(t)));
  const i1 = Math.min(last, i0 + 1);
  const k = clamp01(t - i0);
  const a = FLAVORS[i0];
  const b = FLAVORS[i1];
  const nearest = k < 0.5 ? a : b;

  return {
    index: k < 0.5 ? i0 : i1,
    name: nearest.name,
    word: nearest.word,
    bg: mixHex(a.bg, b.bg, k),
    can: mixHex(a.can, b.can, k),
    deep: mixHex(a.deep, b.deep, k),
    light: mixHex(a.light, b.light, k),
    layers: a.layers.map((c, j) => mixHex(c, b.layers[j], k)),
  };
}
