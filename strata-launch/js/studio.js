import * as THREE from 'three';

// A product-photography light set, baked into an environment map:
// two tall strip softboxes front-left and front-right (the long vertical highlights on the can),
// a large overhead softbox, two thin rim strips behind, and a dim grey sweep for bounce.
const SWEEP_GREY = 0x7e8186;
const LIGHTS = [
  { size: [1.4, 9], pos: [-4.2, 0.5, 3.6], intensity: 7 },
  { size: [0.9, 9], pos: [4.6, 0.5, 3.0], intensity: 4.5 },
  { size: [7, 4], pos: [0, 6.5, 0.5], intensity: 3.2 },
  { size: [0.35, 9], pos: [-3.4, 0.5, -4.5], intensity: 9 },
  { size: [0.35, 9], pos: [3.4, 0.5, -4.5], intensity: 9 },
];

function softbox({ size, pos, intensity }) {
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  material.color.setScalar(intensity);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), material);
  panel.position.set(...pos);
  panel.lookAt(0, 0, 0);
  return panel;
}

export function createStudioEnvironment(renderer) {
  const studio = new THREE.Scene();
  const sweep = new THREE.Mesh(
    new THREE.SphereGeometry(14, 32, 16),
    new THREE.MeshBasicMaterial({ color: SWEEP_GREY, side: THREE.BackSide }),
  );
  studio.add(sweep, ...LIGHTS.map(softbox));

  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(studio, 0.02).texture;
  pmrem.dispose();
  return texture;
}
