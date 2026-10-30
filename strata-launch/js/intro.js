const MIN_LOADER_MS = 1100;   // long enough for the bars to fill once
const MAX_LOADER_MS = 3500;   // never hold the page longer than this
const FONT_TIMEOUT_MS = 1500;
const ENTRANCE_MS = 1600;

const easeOutCubic = (k) => 1 - (1 - k) ** 3;
const wait = (ms) => new Promise((resolve) => { window.setTimeout(resolve, ms); });

// Runs the loader, then flags the page ready so the hero copy and the can can enter.
export function createIntro(root, reduceMotion) {
  const html = root.documentElement;
  const loader = root.getElementById('loader');
  const count = root.getElementById('loader-count');
  const startedAt = performance.now();
  let readyAt = null;

  const finish = () => {
    if (readyAt !== null) return;
    readyAt = performance.now();
    if (count) count.textContent = '100';
    loader?.classList.add('is-done');
    html.classList.add('is-ready');
  };

  const tickCount = () => {
    if (readyAt !== null || !count) return;
    const k = Math.min(0.97, (performance.now() - startedAt) / (MIN_LOADER_MS * 1.3));
    count.textContent = String(Math.round(easeOutCubic(k) * 100)).padStart(3, '0');
    requestAnimationFrame(tickCount);
  };

  // Call once the first frame has rendered.
  const sceneReady = () => {
    const fonts = root.fonts?.ready ?? Promise.resolve();
    const elapsed = performance.now() - startedAt;
    Promise.race([fonts, wait(FONT_TIMEOUT_MS)])
      .then(() => wait(Math.max(0, MIN_LOADER_MS - elapsed)))
      .then(finish)
      .catch((err) => {
        console.warn('STRATA: intro wait failed; revealing the page.', err);
        finish();
      });
  };

  // 0 before the loader lifts, easing to 1 as the can settles into place.
  const entrance = (now) => {
    if (reduceMotion) return readyAt === null ? 0 : 1;
    if (readyAt === null) return 0;
    return easeOutCubic(Math.min(1, (now - readyAt) / ENTRANCE_MS));
  };

  requestAnimationFrame(tickCount);
  window.setTimeout(finish, MAX_LOADER_MS);
  return { sceneReady, finish, entrance };
}
