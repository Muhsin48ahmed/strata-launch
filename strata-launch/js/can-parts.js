import * as THREE from 'three';

// Geometry for a 355 ml sleek can, in scene units (1 unit ≈ 46 mm).
export const CAN_RADIUS = 0.62;
export const BODY_TOP = 1.25;
export const BODY_BOTTOM = -1.45;
export const LID_LEVEL = 1.435;
const SEGMENTS = 128;
const PROFILE_STEPS = 120;

const v2 = (x, y) => new THREE.Vector2(x, y);

// Smooth a sparse profile into a dense one so the lathe has no faceting on the curves.
const smoothProfile = (points) => new THREE.SplineCurve(points).getPoints(PROFILE_STEPS);

// Shoulder, necked-in double seam, countersink and the lid panel.
const TOP_PROFILE = [
  v2(CAN_RADIUS, BODY_TOP), v2(0.62, 1.29), v2(0.6, 1.34), v2(0.565, 1.39), v2(0.538, 1.425),
  v2(0.532, 1.445), v2(0.545, 1.46), v2(0.548, 1.478), v2(0.538, 1.492), v2(0.522, 1.488),
  v2(0.515, 1.47), v2(0.508, 1.43), v2(0.498, 1.418), v2(0.488, 1.428), v2(0.47, 1.432),
  v2(0.25, 1.435), v2(0, LID_LEVEL),
];

// Bottom taper, stand ring and the pressure dome.
const BOTTOM_PROFILE = [
  v2(CAN_RADIUS, BODY_BOTTOM), v2(0.62, -1.48), v2(0.6, -1.53), v2(0.56, -1.575), v2(0.51, -1.605),
  v2(0.47, -1.6), v2(0.445, -1.57), v2(0.4, -1.53), v2(0.3, -1.5), v2(0.15, -1.485), v2(0, -1.48),
];

function roundedRect(shape, x, y, w, h, r) {
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
}

// Half of the printed sleeve. Each half samples its own half of the label texture.
export function createSleeveHalf(index, materials, centerY) {
  const geometry = new THREE.CylinderGeometry(
    CAN_RADIUS, CAN_RADIUS, BODY_TOP - BODY_BOTTOM, SEGMENTS / 2, 1, true, index * Math.PI, Math.PI,
  );
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i += 1) uv.setX(i, (index + uv.getX(i)) / 2);

  const half = new THREE.Group();
  half.position.y = centerY;
  half.add(new THREE.Mesh(geometry, materials.label));
  const inner = new THREE.Mesh(geometry, materials.aluInner);
  inner.scale.setScalar(0.992);
  half.add(inner);
  return half;
}

export function createTab(materials) {
  const shape = new THREE.Shape();
  roundedRect(shape, -0.1, -0.17, 0.2, 0.34, 0.08);
  const hole = new THREE.Path();
  hole.absellipse(0, 0.075, 0.055, 0.045, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.01, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 24,
  });
  geometry.rotateX(-Math.PI / 2);

  const tab = new THREE.Group();
  tab.add(new THREE.Mesh(geometry, materials.lid));
  const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), materials.lid);
  rivet.scale.y = 0.5;
  rivet.position.set(0, 0.012, 0.06);
  tab.add(rivet);
  return tab;
}

export function createTop(materials) {
  const lid = new THREE.Group();
  lid.add(new THREE.Mesh(new THREE.LatheGeometry(smoothProfile(TOP_PROFILE), SEGMENTS), materials.lid));

  // Score line around the pour opening, then the opening panel itself.
  const score = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 48), materials.aluDark);
  score.scale.set(0.16, 0.11, 0.1);
  score.rotation.x = -Math.PI / 2;
  score.position.set(0, LID_LEVEL + 0.002, 0.27);
  lid.add(score);

  const tab = createTab(materials);
  lid.add(tab);
  return { lid, tab };
}

export function createBottom(materials) {
  return new THREE.Mesh(new THREE.LatheGeometry(smoothProfile(BOTTOM_PROFILE), SEGMENTS), materials.alu);
}

// Soft studio shadow: a tight contact core inside a wide, faint falloff.
export function createShadow() {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.scale(1, h / w);

  const blob = (radius, alpha) => {
    const grad = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, radius);
    grad.addColorStop(0, `rgba(0,0,0,${alpha})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, w);
  };
  blob(w * 0.5, 0.22);
  blob(w * 0.22, 0.42);

  const material = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.5), material);
  shadow.rotation.x = -Math.PI / 2;
  return shadow;
}
