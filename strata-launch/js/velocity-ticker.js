import { clamp, damp } from './math.js';

const BASE_SPEED = 2.6;      // percent of the track per second at rest
const SPEED_PER_PX = 0.012;  // extra percent per second for each px/s of scroll
const MAX_SPEED = 60;
const SKEW_PER_PX = 0.006;   // degrees of lean per px/s of scroll
const MAX_SKEW = 16;
const VELOCITY_EASE = 6;
const MIN_DIRECTION_PX = 40; // scroll speed (px/s) that flips the ticker's direction

// The ticker runs on its own, then speeds up, leans and follows the direction you scroll.
// The track holds its items twice, so wrapping at -50% loops seamlessly.
export function setupVelocityTicker(gsap, track) {
  if (!track) return;
  const setX = gsap.quickSetter(track, 'xPercent');
  const setSkew = gsap.quickSetter(track, 'skewX', 'deg');
  const wrap = gsap.utils.wrap(-50, 0);
  let offset = 0;
  let direction = -1;
  let velocity = 0;
  let lastY = window.scrollY;

  gsap.ticker.add((_time, deltaMs) => {
    const dt = Math.min(0.1, deltaMs / 1000);
    if (dt <= 0) return;
    const y = window.scrollY;
    velocity = damp(velocity, (y - lastY) / dt, VELOCITY_EASE, dt);
    lastY = y;
    if (Math.abs(velocity) > MIN_DIRECTION_PX) direction = velocity > 0 ? -1 : 1;

    const speed = Math.min(MAX_SPEED, BASE_SPEED + Math.abs(velocity) * SPEED_PER_PX);
    offset = wrap(offset + direction * speed * dt);
    setX(offset);
    setSkew(clamp(-velocity * SKEW_PER_PX, -MAX_SKEW, MAX_SKEW));
  });
}
