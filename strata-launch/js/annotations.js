import * as THREE from 'three';
import { CAN_RADIUS, CORE_RADIUS, SPLIT_DISTANCE } from './can.js';

const CHIP_GAP_PX = 18;
const SHOW_FROM = 0.8;

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
};

// Callout chips with leader lines, pinned to each stratum's right edge.
// Chip text comes from the strata list in the page, so the copy lives in one place.
export function createAnnotations(listEl, overlayEl) {
  const items = [...listEl.querySelectorAll('li')].map((li) => {
    const line = el('span', 'chip-line');
    const dot = el('span', 'chip-dot');
    const chip = el('div', 'chip');
    chip.append(
      el('span', 'chip__num', `Stratum ${li.dataset.num}`),
      el('span', 'chip__name', li.querySelector('.strata-list__name').textContent),
      el('span', 'chip__dose', li.dataset.dose),
    );
    overlayEl.append(line, dot, chip);
    return { li, line, dot, chip };
  });

  const anchor = new THREE.Vector3();
  const edge = new THREE.Vector3();

  const toScreen = (vec, camera, viewport) => {
    vec.project(camera);
    return [(vec.x * 0.5 + 0.5) * viewport.width, (-vec.y * 0.5 + 0.5) * viewport.height];
  };

  const update = (layers, camera, viewport, state) => {
    const e = state.explode;
    const visible = e > SHOW_FROM;
    overlayEl.style.visibility = visible ? 'visible' : 'hidden';

    const focusIndex = e > 0.5 ? Math.round(state.focus) : -1;
    items.forEach(({ li }, i) => li.classList.toggle('is-focus', i === focusIndex));
    if (!visible) return;

    const opacity = String((e - SHOW_FROM) / (1 - SHOW_FROM));
    items.forEach(({ line, dot, chip }, i) => {
      const layer = layers[i];
      const [ax, ay] = toScreen(layer.localToWorld(anchor.set(CORE_RADIUS, 0, 0)), camera, viewport);
      const reach = (CAN_RADIUS + SPLIT_DISTANCE * e + 0.12) / layer.scale.x;
      const [ex] = toScreen(layer.localToWorld(edge.set(reach, 0, 0)), camera, viewport);
      const chipX = ex + CHIP_GAP_PX;

      dot.style.transform = `translate3d(${ax}px, ${ay}px, 0)`;
      line.style.transform = `translate3d(${ax}px, ${ay}px, 0) scaleX(${Math.max(1, chipX - ax)})`;
      chip.style.transform = `translate3d(${chipX}px, ${ay}px, 0) translateY(-50%)`;
      chip.classList.toggle('is-focus', i === focusIndex);
      [line, dot, chip].forEach((node) => { node.style.opacity = opacity; });
    });
  };

  return { update };
}
