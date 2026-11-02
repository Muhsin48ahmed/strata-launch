const REACH_PX = 50;   // how far outside the button the pull starts
const PULL = 0.38;     // share of the cursor's offset from centre the button follows
const LIFT_PX = 2;     // the hover lift, done here because the inline transform overrides :hover
const SETTLE = { duration: 0.7, ease: 'elastic.out(1, 0.4)' };
const FOLLOW = { duration: 0.35, ease: 'power3.out' };

// Cursor offset from the button's resting centre (its current magnetic shift removed).
function offsetFrom(gsap, btn, event) {
  const rect = btn.getBoundingClientRect();
  const dx = event.clientX - (rect.left - gsap.getProperty(btn, 'x') + rect.width / 2);
  const dy = event.clientY - (rect.top - gsap.getProperty(btn, 'y') + rect.height / 2);
  const isNear = Math.abs(dx) < rect.width / 2 + REACH_PX && Math.abs(dy) < rect.height / 2 + REACH_PX;
  const isOver = Math.abs(dx) < rect.width / 2 && Math.abs(dy) < rect.height / 2;
  return { btn, dx, dy, isNear, isOver, distance: Math.hypot(dx, dy) };
}

// The nearest button leans toward a nearby mouse cursor; the rest spring back.
// Only one pulls at a time so neighbouring buttons never collide.
export function setupMagnetic(gsap, buttons) {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  buttons.forEach((btn) => btn.classList.add('is-magnetic'));
  let active = null;

  const settle = () => {
    if (active) gsap.to(active, { x: 0, y: 0, ...SETTLE, overwrite: 'auto' });
    active = null;
  };

  window.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    const nearest = buttons
      .map((btn) => offsetFrom(gsap, btn, event))
      .filter((hit) => hit.isNear)
      .reduce((best, hit) => (best && best.distance <= hit.distance ? best : hit), null);

    if (active !== nearest?.btn) settle();
    if (!nearest) return;
    active = nearest.btn;
    const lift = nearest.isOver ? LIFT_PX : 0;
    gsap.to(nearest.btn, { x: nearest.dx * PULL, y: nearest.dy * PULL - lift, ...FOLLOW, overwrite: 'auto' });
  }, { passive: true });
  // A scroll or the cursor leaving the window would otherwise leave a button pulled out of place.
  document.documentElement.addEventListener('pointerleave', settle);
  window.addEventListener('scroll', settle, { passive: true });
}
