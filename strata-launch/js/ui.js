const FOOTER_CLEARANCE_PX = 60;
const SPOT_STEP = 0.3; // percent of the viewport

// Picks the backdrop word for the current scroll position.
export function backdropText(t, flavor) {
  if (t < 1.9) return 'STRATA';
  if (t < 3) return flavor.word;
  return '14·11';
}

// Keeps the DOM (page colors, flavor list, chapter counter) in step with the scene.
export function createUi(root) {
  const flavorItems = [...root.querySelectorAll('#flavor-list li')];
  const chapterNames = [...root.querySelectorAll('[data-scene]')].map((el) => el.dataset.chapter);
  const chapterLinks = [...root.querySelectorAll('[data-chapter-link]')];
  const chapterNum = root.querySelector('#chapter-num');
  const chapterName = root.querySelector('#chapter-name');
  const progressFill = root.querySelector('#progress-fill');
  const progress = root.querySelector('.progress');
  const footer = root.querySelector('.footer');
  const style = root.documentElement.style;
  let activeFlavor = -1;
  let activeChapter = -1;

  const setFlavor = (flavor) => {
    style.setProperty('--bg', flavor.bg);
    style.setProperty('--deep', flavor.deep);
    if (flavor.index === activeFlavor) return;
    activeFlavor = flavor.index;
    flavorItems.forEach((li, i) => li.classList.toggle('is-active', i === activeFlavor));
  };

  const setChapter = (t) => {
    const index = Math.min(chapterNames.length - 1, Math.floor(t));
    const scrollable = root.documentElement.scrollHeight - window.innerHeight;
    progressFill.style.transform = `scaleX(${scrollable > 0 ? window.scrollY / scrollable : 0})`;
    const overFooter = footer.getBoundingClientRect().top < window.innerHeight - FOOTER_CLEARANCE_PX;
    progress.classList.toggle('is-hidden', overFooter);
    if (index === activeChapter) return;
    activeChapter = index;
    chapterNum.textContent = String(index + 1).padStart(2, '0');
    chapterName.textContent = chapterNames[index];
    chapterLinks.forEach((link) => {
      const isCurrent = Number(link.dataset.chapterLink) === index;
      if (isCurrent) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  // Moves the studio light pool to follow the can; skips sub-pixel changes to avoid repaints.
  let spot = [NaN, NaN];
  const setSpot = (ndcX, ndcY) => {
    const next = [(ndcX * 0.5 + 0.5) * 100, (-ndcY * 0.5 + 0.5) * 100];
    if (Math.abs(next[0] - spot[0]) < SPOT_STEP && Math.abs(next[1] - spot[1]) < SPOT_STEP) return;
    spot = next;
    style.setProperty('--spot-x', `${next[0].toFixed(1)}%`);
    style.setProperty('--spot-y', `${next[1].toFixed(1)}%`);
  };

  return { setFlavor, setChapter, setSpot };
}
