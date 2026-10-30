import { createStage } from './scene.js';
import { createCan } from './can.js';
import { createLabel } from './label.js';
import { createBubbles } from './bubbles.js';
import { createAnnotations } from './annotations.js';
import { blendFlavor } from './flavors.js';
import { createScrollClock, sampleState } from './timeline.js';
import { createUi, backdropText } from './ui.js';
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

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt));

// Angle to add so the can turns to the nearest full turn (front seam facing the camera).
const toNearestTurn = (angle) => Math.round(angle / TAU) * TAU - angle;

// Final pose for this frame: the scroll state plus spin, explode alignment and the entrance.
function composePose(s, spin, entrance) {
  const base = spin + s.flavor * TAU;
  const away = 1 - entrance;
  return {
    ...s,
    rotY: base + toNearestTurn(base) * s.explode + away * TAU * ENTRANCE_TURNS,
    posY: s.posY - away * ENTRANCE_DROP,
    tiltZ: s.tiltZ - away * 0.5,
    wordOpacity: s.wordOpacity * entrance,
  };
}

function startScene(intro) {
  const stage = createStage(document.getElementById('stage'));
  const label = createLabel(stage.renderer.capabilities.getMaxAnisotropy());
  const can = createCan(label);
  const bubbles = createBubbles();
  stage.scene.add(can.rig, bubbles.mesh);

  const annotations = createAnnotations(document.getElementById('strata-list'), document.getElementById('chips'));
  const ui = createUi(document);
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
    const velocity = Math.abs(target - sim.t);
    sim.t = reduceMotion ? target : damp(sim.t, target, SCROLL_DAMPING, dt);

    const s = sampleState(sim.t, stage.viewport.isCompact);
    if (!reduceMotion) sim.spin += dt * SPIN_SPEED * s.spin;
    const pose = composePose(s, sim.spin, intro.entrance(now));

    const flavor = blendFlavor(s.flavor);
    if (Math.abs(s.flavor - sim.flavor) > FLAVOR_EPSILON) {
      sim.flavor = s.flavor;
      label.draw(flavor);
      can.setFlavor(flavor);
      ui.setFlavor(flavor);
    }

    can.apply(pose);
    bubbles.update(reduceMotion ? 0 : dt, sim.time, velocity);
    ui.setBackdrop(backdropText(sim.t, flavor), pose.word, pose.wordOpacity);
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
setupSmoothScroll(reduceMotion);
const intro = createIntro(document, reduceMotion);

try {
  startScene(intro);
} catch (err) {
  console.error('STRATA: could not start the 3D scene; showing the static fallback.', err);
  document.documentElement.classList.add('no-webgl');
  intro.finish();
}
