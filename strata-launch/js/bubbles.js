import * as THREE from 'three';

// Carbonation shot like macro photography: sharp ringed bubbles near the can's depth,
// big defocused bokeh discs in front, faint soft ones far behind. Scrolling makes them rise faster.
const BANDS = [
  { count: 26, size: 0.62, opacity: 0.32, z: [3, 6.5], speed: 0.1, texture: 'bokeh' },
  { count: 60, size: 0.13, opacity: 0.85, z: [-1.5, 1.5], speed: 0.22, texture: 'bubble' },
  { count: 60, size: 0.2, opacity: 0.35, z: [-9, -4], speed: 0.14, texture: 'bokeh' },
];
const SPREAD_X = 7;
const Y_MIN = -4.2;
const Y_MAX = 4.2;
const SCROLL_FIZZ = 40;

const rand = (min, max) => min + Math.random() * (max - min);

function spriteTexture(paint) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  paint(canvas.getContext('2d'), size / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const radial = (ctx, c, stops) => {
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
  stops.forEach(([at, alpha]) => grad.addColorStop(at, `rgba(255,255,255,${alpha})`));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, c * 2, c * 2);
};

const TEXTURES = {
  // Defocused disc with the slightly brighter edge real lens bokeh has.
  bokeh: () => spriteTexture((ctx, c) => radial(ctx, c, [[0, 0.32], [0.72, 0.42], [0.86, 0.3], [1, 0]])),
  // In-focus bubble: clear centre, bright meniscus rim and a specular dot.
  bubble: () => spriteTexture((ctx, c) => {
    radial(ctx, c, [[0, 0], [0.55, 0.04], [0.8, 0.85], [0.92, 0.35], [1, 0]]);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(c * 0.68, c * 0.66, c * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }),
};

function createBand(band) {
  const positions = new Float32Array(band.count * 3);
  const speeds = Float32Array.from({ length: band.count }, () => rand(0.6, 1.4));
  for (let i = 0; i < band.count; i += 1) {
    positions.set([rand(-SPREAD_X, SPREAD_X), rand(Y_MIN, Y_MAX), rand(band.z[0], band.z[1])], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    map: TEXTURES[band.texture](), size: band.size, sizeAttenuation: true,
    transparent: true, opacity: band.opacity, depthWrite: false, toneMapped: false,
  });
  return { points: new THREE.Points(geometry, material), positions, speeds, band };
}

export function createBubbles() {
  const bands = BANDS.map(createBand);
  const group = new THREE.Group();
  group.add(...bands.map((b) => b.points));

  const update = (dt, time, boost) => {
    const fizz = 1 + boost * SCROLL_FIZZ;
    bands.forEach(({ points, positions, speeds, band }) => {
      for (let i = 0; i < band.count; i += 1) {
        const yi = i * 3 + 1;
        positions[yi] += dt * band.speed * speeds[i] * fizz;
        if (positions[yi] > Y_MAX) positions[yi] = Y_MIN;
        positions[yi - 1] += Math.sin(time * 1.2 + i) * dt * 0.03;
      }
      points.geometry.attributes.position.needsUpdate = true;
    });
  };

  return { mesh: group, update };
}
