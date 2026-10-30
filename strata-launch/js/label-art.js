// Artwork for the printed sleeve. Canvas size matches the sleeve: circumference 3.9 : height 2.7.
// u = 0 is the front seam (where the sleeve splits); u = 0.25 / 0.75 carry the wordmark.
export const W = 2048;
export const H = 1408;

const TAU = Math.PI * 2;
const DISPLAY_FONT = 'Anybody, "Arial Narrow", sans-serif';
export const MONO_FONT = '"IBM Plex Mono", ui-monospace, Menlo, monospace';
export const FONT_LOADS = [`900 100px ${DISPLAY_FONT}`, `500 30px ${MONO_FONT}`, `600 30px ${MONO_FONT}`];

const BARE_METAL = '#d9dde2';
const BAND_TOPS = [0.6, 0.68, 0.76, 0.84, 0.92];
const BAND_WAVES = [2, 3, 2, 4, 3];
const RIM_BAND = 20;
const PINSTRIPE_Y = H * 0.575;
const WORDMARK_XS = [W * 0.25, W * 0.75];
const STRATA_NAMES = ['ELECTROLYTES', 'CAFFEINE', 'BOTANICALS', 'FINISH'];
const INGREDIENTS = 'INGREDIENTS: CARBONATED WATER, ALLULOSE, ACIDS (CITRIC ACID, MALIC ACID), NATURAL FLAVOURINGS, '
  + 'GREEN TEA EXTRACT, GUAYUSA EXTRACT, L-THEANINE, SODIUM CITRATE, POTASSIUM CITRATE, MAGNESIUM LACTATE, '
  + 'RHODIOLA ROSEA EXTRACT, LION’S MANE EXTRACT, MONK FRUIT EXTRACT. STORE COOL. SERVE CHILLED.';
const BARCODE_DIGITS = '5 060954 274915';

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const lines = text.split(' ').reduce((acc, word) => {
    const last = acc[acc.length - 1];
    const next = last ? `${last} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) return [...acc.slice(0, -1), next];
    return [...acc, word];
  }, ['']);
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight));
}

// The vertical STRATA glyphs; shared by the colour and metalness passes so they line up exactly.
function wordmarkGlyphs(ctx, x, fill) {
  const target = H * 0.5;
  ctx.save();
  ctx.translate(x, H * 0.3);
  ctx.rotate(-Math.PI / 2);
  ctx.font = `900 ultra-condensed 300px ${DISPLAY_FONT}`;
  const size = Math.round(300 * (target / ctx.measureText('STRATA').width));
  ctx.font = `900 ultra-condensed ${size}px ${DISPLAY_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = fill;
  ctx.fillText('STRATA', 0, 0);
  ctx.restore();
  return size;
}

// Areas left as unprinted aluminium: rim bands, a pinstripe and the wordmarks.
function bareAreas(ctx, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, W, RIM_BAND);
  ctx.fillRect(0, H - RIM_BAND, W, RIM_BAND);
  ctx.fillRect(0, PINSTRIPE_Y, W, 5);
  WORDMARK_XS.forEach((x) => wordmarkGlyphs(ctx, x, fill));
}

function strataBands(ctx, f) {
  const colors = [f.light, f.layers[1], f.layers[2], f.layers[3], f.deep];
  colors.forEach((color, b) => {
    const top = BAND_TOPS[b] * H;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) {
      // Whole numbers of waves keep the band seamless where u wraps from 1 back to 0.
      ctx.lineTo(x, top + Math.sin((x / W) * TAU * BAND_WAVES[b] + b * 1.7) * 14);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  });
}

function wordmarkCaptions(ctx, f) {
  WORDMARK_XS.forEach((x) => {
    ctx.save();
    ctx.translate(x + 150, H * 0.3);
    ctx.rotate(-Math.PI / 2);
    ctx.font = `500 26px ${MONO_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = f.deep;
    ctx.fillText('SPARKLING ENERGY  ·  4 STRATA  ·  355 ML', 0, 0);
    ctx.restore();

    ctx.font = `600 38px ${MONO_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = f.light;
    ctx.fillText(f.name.toUpperCase(), x, H * 0.962);
  });
}

function strataColumn(ctx, f, x, top) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = f.deep;
  ctx.font = `600 30px ${MONO_FONT}`;
  ctx.fillText('CORE SAMPLE / 355 ML', x, top);
  STRATA_NAMES.forEach((name, i) => {
    const y = top + 30 + i * 80;
    ctx.fillStyle = f.layers[i];
    ctx.fillRect(x, y, 60, 66);
    ctx.strokeStyle = f.deep;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, 60, 66);
    ctx.fillStyle = f.deep;
    ctx.font = `500 26px ${MONO_FONT}`;
    ctx.fillText(`0${i + 1}  ${name}`, x + 82, y + 44);
  });
}

function barcode(ctx, x, y) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 14, y - 14, 300, 150);
  ctx.fillStyle = '#111111';
  let cursor = x;
  for (let i = 0; i < 46; i += 1) {
    const width = [3, 5, 8][(i * 7 + (i >> 2)) % 3];
    if (i % 2 === 0) ctx.fillRect(cursor, y, width, 92);
    cursor += width + 2;
  }
  ctx.font = `500 22px ${MONO_FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(BARCODE_DIGITS, x, y + 122);
}

function backPanel(ctx, f) {
  const x = W * 0.5 - 160;
  strataColumn(ctx, f, x, H * 0.1);
  barcode(ctx, x + 8, H * 0.39);

  ctx.font = `500 19px ${MONO_FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = f.deep;
  wrapText(ctx, INGREDIENTS, 56, H * 0.1, 300, 27);
  ['HIGH CAFFEINE CONTENT', '(338 MG/L). NOT FOR', 'CHILDREN OR PREGNANT', 'OR BREAST-FEEDING', 'WOMEN.'].forEach((line, i) => {
    ctx.fillText(line, 1250, H * 0.12 + i * 27);
  });
  ['♲ RECYCLE ME  ALU', '℮ 355 ML', 'L2611 14:02', 'BEST BEFORE: SEE BASE'].forEach((line, i) => {
    ctx.fillText(line, 1250, H * 0.36 + i * 30);
  });
}

export function paintColor(ctx, f) {
  ctx.fillStyle = f.can;
  ctx.fillRect(0, 0, W, H);
  strataBands(ctx, f);
  bareAreas(ctx, BARE_METAL);
  wordmarkCaptions(ctx, f);
  backPanel(ctx, f);
}

// White = bare aluminium (metalness 1), dark grey = printed ink with a faint metallic sheen.
export function paintMetalness(ctx) {
  ctx.fillStyle = '#262626';
  ctx.fillRect(0, 0, W, H);
  bareAreas(ctx, '#ffffff');
}
