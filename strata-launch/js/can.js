import * as THREE from 'three';
import { createCondensation } from './droplets.js';
import {
  CAN_RADIUS, BODY_TOP, BODY_BOTTOM, LID_LEVEL,
  createSleeveHalf, createTop, createBottom, createShadow,
} from './can-parts.js';

export { CAN_RADIUS };
export const CORE_RADIUS = 0.5;
export const SPLIT_DISTANCE = 0.95;
const LAYER_COUNT = 4;
const LAYER_HEIGHT = 0.6;
const LAYER_GAP = 0.05;
const LAYER_SPREAD = 0.2;
const CORE_CENTER = (BODY_TOP + BODY_BOTTOM) / 2;
const LID_LIFT = 0.85;
const TAB_LIFT = 0.4;
const TAB_OFFSET = { y: LID_LEVEL + 0.008, z: -0.04 };
const BOTTOM_DROP = 0.6;
const SHADOW_Y = BODY_BOTTOM - 0.36;

function createMaterials(label) {
  const { bumpMap, roughnessMap } = createCondensation();
  return {
    // Spun aluminium: anisotropy follows the lathe's circumference, giving circular brushing on the lid.
    lid: new THREE.MeshPhysicalMaterial({
      color: 0xe4e7eb, metalness: 1, roughness: 0.3, anisotropy: 0.85, side: THREE.DoubleSide,
    }),
    alu: new THREE.MeshPhysicalMaterial({
      color: 0xd9dde2, metalness: 1, roughness: 0.26, anisotropy: 0.6, side: THREE.DoubleSide,
    }),
    aluInner: new THREE.MeshStandardMaterial({ color: 0xc4c9d0, metalness: 1, roughness: 0.38, side: THREE.BackSide }),
    aluDark: new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 1, roughness: 0.4 }),
    // Printed sleeve: ink is dielectric, the unprinted wordmark and bands stay bare metal.
    label: new THREE.MeshPhysicalMaterial({
      map: label.texture, metalnessMap: label.metalnessMap, metalness: 1,
      roughness: 0.38, roughnessMap, bumpMap, bumpScale: 1.4,
      clearcoat: 0.6, clearcoatRoughness: 0.18,
    }),
  };
}

function createCore() {
  const core = new THREE.Group();
  const geometry = new THREE.CylinderGeometry(CORE_RADIUS, CORE_RADIUS, LAYER_HEIGHT, 96);
  const layers = Array.from({ length: LAYER_COUNT }, () => {
    const material = new THREE.MeshPhysicalMaterial({
      roughness: 0.07, transmission: 0.4, thickness: 0.9, ior: 1.34,
      attenuationDistance: 0.8, clearcoat: 1, clearcoatRoughness: 0.04,
      sheen: 0.4, emissiveIntensity: 0.06,
    });
    const layer = new THREE.Mesh(geometry, material);
    core.add(layer);
    return layer;
  });
  return { core, layers };
}

// Builds the can rig: rig (position, scale) > body (tilt, spin) > parts.
export function createCan(label) {
  const materials = createMaterials(label);
  const rig = new THREE.Group();
  const body = new THREE.Group();
  const shadow = createShadow();
  shadow.position.y = SHADOW_Y;
  rig.add(shadow, body);

  const halves = [0, 1].map((i) => createSleeveHalf(i, materials, CORE_CENTER));
  const { lid, tab } = createTop(materials);
  const bottom = createBottom(materials);
  const { core, layers } = createCore();
  body.add(...halves, lid, bottom, core);

  const setFlavor = (flavor) => {
    layers.forEach((layer, i) => {
      layer.material.color.set(flavor.layers[i]);
      layer.material.emissive.set(flavor.layers[i]);
      layer.material.attenuationColor.set(flavor.layers[i]);
    });
  };

  const apply = (s) => {
    const e = s.explode;
    rig.position.set(s.posX, s.posY, 0);
    rig.scale.setScalar(s.scale);
    body.rotation.set(s.tiltX, s.rotY, s.tiltZ, 'XZY');

    halves[0].position.x = e * SPLIT_DISTANCE;
    halves[0].rotation.y = -e * 0.35;
    halves[1].position.x = -e * SPLIT_DISTANCE;
    halves[1].rotation.y = e * 0.35;

    lid.position.y = e * LID_LIFT;
    tab.position.set(0, TAB_OFFSET.y + e * TAB_LIFT, TAB_OFFSET.z);
    tab.rotation.x = -e * 0.7;
    bottom.position.y = -e * BOTTOM_DROP;

    core.visible = e > 0.002;
    const pitch = LAYER_HEIGHT + LAYER_GAP + e * LAYER_SPREAD;
    layers.forEach((layer, i) => {
      const focus = Math.max(0, 1 - Math.abs(s.focus - i)) * e;
      layer.position.set(focus * 0.12, CORE_CENTER + (1.5 - i) * pitch, 0);
      layer.scale.setScalar(1 + focus * 0.05);
      layer.material.emissiveIntensity = 0.06 + focus * 0.4;
    });

    shadow.material.opacity = 1 - e * 0.55;
    shadow.position.y = SHADOW_Y - e * BOTTOM_DROP;
  };

  // Where the can sits on screen, in normalised device coordinates (-1..1).
  const screenPoint = new THREE.Vector3();
  const screenPosition = (camera) => {
    screenPoint.setFromMatrixPosition(rig.matrixWorld).project(camera);
    return [screenPoint.x, screenPoint.y];
  };

  return { rig, layers, setFlavor, apply, screenPosition };
}
