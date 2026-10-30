import * as THREE from 'three';
import { createStudioEnvironment } from './studio.js';

const COMPACT_BREAKPOINT = 820;
const MAX_PIXEL_RATIO = 2;

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Khronos PBR Neutral keeps the label's brand colours true instead of filmic-desaturated.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  scene.environment = createStudioEnvironment(renderer);
  scene.environmentIntensity = 1;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0.15, 10.2);
  camera.lookAt(0, 0, 0);

  // Direct lights add a soft diffuse key on the printed ink; reflections come from the studio map.
  const key = new THREE.DirectionalLight(0xfff6ec, 1.1);
  key.position.set(-4, 5, 5);
  const fill = new THREE.HemisphereLight(0xffffff, 0x8a8f96, 0.55);
  scene.add(key, fill);

  const viewport = { width: 1, height: 1, isCompact: false };

  const resize = () => {
    viewport.width = window.innerWidth;
    viewport.height = window.innerHeight;
    viewport.isCompact = viewport.width < COMPACT_BREAKPOINT;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
    renderer.setSize(viewport.width, viewport.height, false);
    camera.aspect = viewport.width / viewport.height;
    camera.updateProjectionMatrix();
  };

  resize();
  return { renderer, scene, camera, viewport, resize };
}
