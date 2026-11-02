const SCRUB = 0.6;           // seconds the type trails the scrollbar
const CHAR_STAGGER = 0.05;
const RISE = { yPercent: 125, rotate: 14, opacity: 0 };
const SETTLED = { yPercent: 0, rotate: 0, opacity: 1 };
const LEAVE = { yPercent: -125, rotate: -10, opacity: 0 };
const HERO_SLIDE = 0.42;     // share of the viewport width each hero line travels
const FOOTER_STAGGER = 0.3;

const COMPACT_QUERY = '(max-width: 819px)';

// Sticky panels stay put while their section scrolls, so they are timed from the section.
// On compact screens the panel is a card at the bottom, so its headline arrives later.
// Flowing copy is timed from the headline itself.
function rangesFor(el) {
  if (el.closest('.scene__sticky')) {
    const isCompact = () => window.matchMedia(COMPACT_QUERY).matches;
    return {
      trigger: el.closest('[data-scene]'),
      enter: [() => (isCompact() ? 'top 50%' : 'top 85%'), () => (isCompact() ? 'top 0%' : 'top 20%')],
      leave: ['bottom bottom+=25%', 'bottom 75%'],
    };
  }
  return { trigger: el, enter: ['top 100%', 'top 55%'], leave: ['top 30%', 'top -10%'] };
}

const scrubbed = (trigger, [start, end]) => ({ trigger, start, end, scrub: SCRUB, invalidateOnRefresh: true });

// Re-splits on resize and font load; each split rebuilds its tweens in a fresh context.
function splitWithTweens(gsap, SplitText, el, options, build) {
  let ctx = null;
  SplitText.create(el, {
    ...options,
    autoSplit: true,
    onSplit: (split) => {
      ctx?.revert();
      ctx = gsap.context(() => build(split));
    },
  });
}

// Letters rise out of a mask as the section arrives and lift away as it leaves, both tied to scroll.
function revealHeadline(gsap, SplitText, el) {
  const { trigger, enter, leave } = rangesFor(el);
  splitWithTweens(gsap, SplitText, el, { type: 'lines,chars', mask: 'lines' }, ({ chars }) => {
    gsap.set(chars, { transformOrigin: '0% 100%' });
    gsap.fromTo(chars, RISE, {
      ...SETTLED, ease: 'power3.out', stagger: CHAR_STAGGER, scrollTrigger: scrubbed(trigger, enter),
    });
    gsap.fromTo(chars, SETTLED, {
      ...LEAVE, ease: 'power2.in', stagger: CHAR_STAGGER, immediateRender: false, scrollTrigger: scrubbed(trigger, leave),
    });
  });
}

// The two hero lines shear apart in opposite directions as you scroll off the hero.
function peelHero(gsap, heading) {
  const lines = [...heading.querySelectorAll('.line')];
  lines.forEach((line, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    gsap.to(line, {
      x: () => side * window.innerWidth * HERO_SLIDE,
      skewX: side * -12,
      opacity: 0.15,
      ease: 'none',
      scrollTrigger: { trigger: heading.closest('[data-scene]'), start: 'top top', end: 'bottom 25%', scrub: SCRUB, invalidateOnRefresh: true },
    });
  });
}

// The footer wordmark stacks up letter by letter as the page runs out.
function stackFooterWord(gsap, SplitText, el) {
  splitWithTweens(gsap, SplitText, el, { type: 'chars' }, ({ chars }) => {
    gsap.fromTo(chars, { yPercent: 105 }, {
      yPercent: 0, ease: 'power2.out', stagger: FOOTER_STAGGER,
      scrollTrigger: scrubbed(el.closest('footer'), ['top 90%', 'bottom bottom']),
    });
  });
}

export function setupSplitReveals(gsap, SplitText, root) {
  root.querySelectorAll('[data-split]').forEach((el) => revealHeadline(gsap, SplitText, el));
  const hero = root.querySelector('.panel--hero .display');
  if (hero) peelHero(gsap, hero);
  const footerWord = root.querySelector('.footer__word');
  if (footerWord) stackFooterWord(gsap, SplitText, footerWord);
}
