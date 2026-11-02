const SCROLL_LERP = 0.085;

const targetFor = (hash) => (hash === '#top' ? 0 : document.querySelector(hash));

// Inertial page scrolling via Lenis (loaded as a global). Falls back to native scroll.
// Runs on its own frame loop until GSAP's ticker takes over (see useTicker).
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

  let rafId = 0;
  const raf = (time) => {
    lenis.raf(time);
    rafId = requestAnimationFrame(raf);
  };
  rafId = requestAnimationFrame(raf);

  // One clock for Lenis and ScrollTrigger, so scrubbed tweens never trail the scroll by a frame.
  // performance.now() keeps the time base Lenis already saw from requestAnimationFrame.
  const useTicker = (ticker) => {
    cancelAnimationFrame(rafId);
    ticker.add(() => lenis.raf(performance.now()));
    ticker.lagSmoothing(0);
  };

  return { lenis, useTicker };
}
