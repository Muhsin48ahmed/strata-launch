const SCROLL_LERP = 0.085;

const targetFor = (hash) => (hash === '#top' ? 0 : document.querySelector(hash));

// Inertial page scrolling via Lenis (loaded as a global). Falls back to native scroll.
export function setupSmoothScroll(reduceMotion) {
  const Lenis = window.Lenis;
  if (reduceMotion || typeof Lenis !== 'function') return null;

  const lenis = new Lenis({ lerp: SCROLL_LERP, smoothWheel: true });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const target = targetFor(link.getAttribute('href'));
    if (target === null) return;
    event.preventDefault();
    lenis.scrollTo(target, { duration: 1.6 });
  });

  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
  return lenis;
}
