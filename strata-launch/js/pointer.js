import { damp } from './math.js';

const FOLLOW = 3.2; // lower trails the cursor further behind

// Cursor position in -1..1 from the viewport centre, eased so things lag behind it.
// Stays at rest on touch screens and under reduced motion.
export function createPointer(enabled) {
  const target = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };

  if (enabled) {
    window.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      target.x = (event.clientX / window.innerWidth) * 2 - 1;
      target.y = (event.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => {
      target.x = 0;
      target.y = 0;
    });
  }

  const sample = (dt) => {
    eased.x = damp(eased.x, target.x, FOLLOW, dt);
    eased.y = damp(eased.y, target.y, FOLLOW, dt);
    return eased;
  };

  return { sample };
}
