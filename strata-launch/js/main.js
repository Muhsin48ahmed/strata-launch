import { createStage } from './scene.js';
import { createCan } from './can.js';
import { createLabel } from './label.js';
import { createBubbles } from './bubbles.js';
import { createAnnotations } from './annotations.js';
import { blendFlavor } from './flavors.js';
import { createScrollClock, sampleState } from './timeline.js';
import { createUi, backdropText } from './ui.js';
import { createStrataWord } from './strata-word.js';
import { createPointer } from './pointer.js';
import { damp } from './math.js';
import { createIntro } from './intro.js';
import { setupSmoothScroll } from './smooth.js';
import { setupCountdown, setupWaitlist } from './waitlist.js';

const TAU = Math.PI * 2;
const SPIN_SPEED = 0.45;       // radians per second while idling
const SCROLL_DAMPING = 9;      // higher follows the scrollbar more tightly
const FLAVOR_EPSILON = 0.002;
const MAX_DT = 0.05;
const ENTRANCE_DROP = 3.4;     // how far below its mark the can starts
const ENTRANCE_TURNS = 0.75;
const CURSOR_TURN = 0.32;      // radians the can turns toward the cursor at the screen edge
const CURSOR_TILT = 0.2;
const CURSOR_SHIFT = 0.14;     // world units the can slides toward the cursor
const DRAG_GAIN = 7;           // scroll lag (in sections) to backdrop shear
const FLAVOR_PEEL = 0.7;       // how far the wordmark peels while the can turns between flavors

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Angle to add so the can turns to the nearest full turn (front seam facing the camera).
const toNearestTurn = (angle) => Math.round(angle / TAU) * TAU - angle;

// Final pose for this frame: the scroll state plus spin, explode alignment, the entrance
// and a lean toward the cursor.
function composePose(s, spin, entrance, pointer) {
  const base = spin + s.flavor * TAU;
  const away = 1 - entrance;
  return {
    ...s,
    rotY: base + toNearestTurn(base) * s.explode + away * TAU * ENTRANCE_TURNS + pointer.x * CURSOR_TURN,
    posX: s.posX + pointer.x * CURSOR_SHIFT,
    posY: s.posY - away * ENTRANCE_DROP - pointer.y * CURSOR_SHIFT * 0.5,
    tiltX: s.tiltX + pointer.y * CURSOR_TILT,
    tiltZ: s.tiltZ - away * 0.5 - pointer.x * CURSOR_TILT * 0.5,
    wordOpacity: s.wordOpacity * entrance,
  };
}

// 0 while a flavor sits still, rising to 1 halfway through the turn to the next one.
const flavorTurn = (flavor) => Math.sin(Math.PI * (flavor % 1));

function backdropMotion(s, lag) {
  if (reduceMotion) return { peel: 0, drag: 0 };
  return { peel: Math.max(s.explode, flavorTurn(s.flavor) * FLAVOR_PEEL), drag: lag * DRAG_GAIN };
}

function startScene(intro) {
  const stage = createStage(document.getElementById('stage'));
  const label = createLabel(stage.renderer.capabilities.getMaxAnisotropy());
  const can = createCan(label);
  const bubbles = createBubbles();
  stage.scene.add(can.rig, bubbles.mesh);

  const annotations = createAnnotations(document.getElementById('strata-list'), document.getElementById('chips'));
  const ui = createUi(document);
  const word = createStrataWord(document.getElementById('backdrop-word'));
  const pointer = createPointer(finePointer && !reduceMotion);
  const clock = createScrollClock([...document.querySelectorAll('[data-scene]')]);

  const onResize = () => {
    stage.resize();
    clock.measure();
  };
  window.addEventListener('resize', onResize);
  window.addEventListener('load', clock.measure);
  document.fonts?.ready.then(clock.measure).catch((err) => console.warn('STRATA: fonts not ready.', err));

  stage.renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    console.error('STRATA: WebGL context lost; showing the static fallback.');
    document.documentElement.classList.add('no-webgl');
  });

  const sim = { t: clock.read(), spin: 0, time: 0, flavor: -1, last: performance.now(), frames: 0 };

  const frame = (now) => {
    const dt = Math.min(MAX_DT, (now - sim.last) / 1000);
    sim.last = now;
    sim.time += dt;

    const target = clock.read();
    const lag = target - sim.t;
    sim.t = reduceMotion ? target : damp(sim.t, target, SCROLL_DAMPING, dt);

    const s = sampleState(sim.t, stage.viewport.isCompact);
    if (!reduceMotion) sim.spin += dt * SPIN_SPEED * s.spin;
    const cursor = pointer.sample(dt);
    const pose = composePose(s, sim.spin, intro.entrance(now), cursor);

    const flavor = blendFlavor(s.flavor);
    if (Math.abs(s.flavor - sim.flavor) > FLAVOR_EPSILON) {
      sim.flavor = s.flavor;
      label.draw(flavor);
      can.setFlavor(flavor);
      ui.setFlavor(flavor);
    }

    can.apply(pose);
    bubbles.update(reduceMotion ? 0 : dt, sim.time, Math.abs(lag));
    word.update({
      text: backdropText(sim.t, flavor), stretch: pose.word, opacity: pose.wordOpacity,
      ...backdropMotion(s, lag), pointer: cursor,
    });
    ui.setChapter(sim.t);

    stage.scene.updateMatrixWorld();
    ui.setSpot(...can.screenPosition(stage.camera));
    annotations.update(can.layers, stage.camera, stage.viewport, pose);
    stage.renderer.render(stage.scene, stage.camera);

    sim.frames += 1;
    if (sim.frames === 2) intro.sceneReady();
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

setupCountdown(document.getElementById('countdown'));
setupWaitlist(document.getElementById('waitlist'), document.getElementById('waitlist-status'));
const smooth = setupSmoothScroll(reduceMotion);
const intro = createIntro(document, reduceMotion);

// Scroll-scrubbed type, the velocity ticker and magnetic buttons load once the page has loaded
// and the main thread is idle, and not at all under reduced motion; without them the page stays static.
const whenIdle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 2000 }) : window.setTimeout(fn, 1));
const loadMotion = () => import('./motion.js')
  .then(({ setupMotion }) => setupMotion(smooth))
  .catch((err) => console.warn('STRATA: scroll motion unavailable; page stays static.', err));
if (!reduceMotion) {
  if (document.readyState === 'complete') whenIdle(loadMotion);
  else window.addEventListener('load', () => whenIdle(loadMotion), { once: true });
}

try {
  startScene(intro);
} catch (err) {
  console.error('STRATA: could not start the 3D scene; showing the static fallback.', err);
  document.documentElement.classList.add('no-webgl');
  intro.finish();
}
