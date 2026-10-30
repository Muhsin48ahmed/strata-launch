import * as THREE from 'three';

// Condensation for the sleeve: a bump map for the droplet domes and a roughness map
// that makes each droplet glossier than the printed label around it.
const W = 1024;
const H = 704;
const SMALL_DROPS = 900;
const LARGE_DROPS = 70;

const rand = (min, max) => min + Math.random() * (max - min);

function createDrops() {
  const small = Array.from({ length: SMALL_DROPS }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(1.2, 3.6), s: rand(0.8, 1.15) }));
  const large = Array.from({ length: LARGE_DROPS }, () => ({ x: rand(0, W), y: rand(H * 0.05, H * 0.95), r: rand(5, 11), s: rand(1.1, 1.6) }));
  return [...small, ...large];
}

// Draw every drop, repeating those near the left/right edges so the wrap seam stays hidden.
function paintDrops(ctx, drops, paintOne) {
  drops.forEach((drop) => {
    paintOne(ctx, drop.x, drop);
    if (drop.x < drop.r * 2) paintOne(ctx, drop.x + W, drop);
    if (drop.x > W - drop.r * 2) paintOne(ctx, drop.x - W, drop);
  });
}

function bumpDrop(ctx, x, { y, r, s }) {
  const grad = ctx.createRadialGradient(x, y - r * 0.2, 0, x, y, r);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.6, '#9a9a9a');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roughDrop(ctx, x, { y, r, s }) {
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.9, r * s * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
}

function makeTexture(background, drops, paintOne) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, W, H);
  paintDrops(ctx, drops, paintOne);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export function createCondensation() {
  const drops = createDrops();
  return {
    bumpMap: makeTexture('#000000', drops, bumpDrop),
    roughnessMap: makeTexture('#ffffff', drops, roughDrop),
  };
}
