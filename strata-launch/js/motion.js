import { loadScript } from './load-script.js';
import { setupSplitReveals } from './split-reveals.js';
import { setupVelocityTicker } from './velocity-ticker.js';
import { setupMagnetic } from './magnetic.js';

const GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist';
const GSAP_FILES = ['gsap.min.js', 'ScrollTrigger.min.js', 'SplitText.min.js'];

// GSAP layer on top of the 3D scene: scrubbed headlines, the velocity ticker and magnetic CTAs.
// Only imported when reduced motion is off.
export async function setupMotion(smooth) {
  await Promise.all(GSAP_FILES.map((file) => loadScript(`${GSAP_CDN}/${file}`)));
  const { gsap, ScrollTrigger, SplitText } = window;
  if (!gsap || !ScrollTrigger || !SplitText) throw new Error('GSAP globals missing after load');

  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (smooth) {
    smooth.lenis.on('scroll', ScrollTrigger.update);
    smooth.useTicker(gsap.ticker);
  }

  setupVelocityTicker(gsap, document.querySelector('.ticker__track'));
  // Hands the ticker band from its CSS loop to the velocity loop above.
  document.documentElement.classList.add('has-motion');
  setupMagnetic(gsap, [...document.querySelectorAll('.btn')]);
  setupSplitReveals(gsap, SplitText, document);
  ScrollTrigger.refresh();
}
