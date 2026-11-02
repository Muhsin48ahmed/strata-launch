import { clamp } from './math.js';

const SLICES = 4;
const MIN_STRETCH = 55;
const MAX_STRETCH = 150;
const OVERHANG = '-30%';         // outer slices keep glyph parts that spill past the line box
const PEEL_X = 15;               // percent of the word's width each slice slides when fully peeled
const PEEL_Y = 14;               // percent of the word's height the slices fan apart
const DRAG_X = 9;                // percent of shear per unit of scroll lag
const DRAG_SKEW = 14;            // degrees of skew at full scroll lag
const DEPTHS = [14, 30, 50, 74]; // px each slice drifts with the cursor, back to front

const sliceClip = (i) => {
  const top = i === 0 ? OVERHANG : `${(i * 100) / SLICES}%`;
  const bottom = i === SLICES - 1 ? OVERHANG : `${((SLICES - 1 - i) * 100) / SLICES}%`;
  return `inset(${top} 0 ${bottom} 0)`;
};

const makeSpan = (className, text) => {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  return span;
};

// The backdrop wordmark cut into four horizontal strata. They peel apart with the can,
// shear against fast scrolling and drift at different depths with the cursor.
export function createStrataWord(wordEl) {
  let shownText = wordEl.textContent;
  const sizer = makeSpan('backdrop__sizer', shownText);
  const slices = Array.from({ length: SLICES }, (_, i) => {
    const slice = makeSpan('backdrop__slice', shownText);
    slice.style.clipPath = sliceClip(i);
    return slice;
  });
  wordEl.replaceChildren(sizer, ...slices);

  // peel 0..1, drag -1..1 (scroll lag, signed), pointer -1..1 per axis
  const update = ({ text, stretch, opacity, peel, drag, pointer }) => {
    if (text !== shownText) {
      shownText = text;
      [sizer, ...slices].forEach((node) => { node.textContent = text; });
    }
    wordEl.style.fontStretch = `${MIN_STRETCH + (MAX_STRETCH - MIN_STRETCH) * stretch}%`;
    wordEl.style.opacity = opacity.toFixed(3);

    const shear = clamp(drag, -1, 1);
    slices.forEach((slice, i) => {
      const fromCentre = i - (SLICES - 1) / 2;
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * peel * PEEL_X + fromCentre * shear * DRAG_X;
      const y = fromCentre * peel * PEEL_Y;
      const px = pointer.x * DEPTHS[i];
      const py = pointer.y * DEPTHS[i] * 0.5;
      slice.style.transform = `translate3d(calc(${x.toFixed(2)}% + ${px.toFixed(1)}px), calc(${y.toFixed(2)}% + ${py.toFixed(1)}px), 0) skewX(${(shear * -DRAG_SKEW).toFixed(2)}deg)`;
    });
  };

  return { update };
}
