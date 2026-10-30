import * as THREE from 'three';
import { W, H, FONT_LOADS, paintColor, paintMetalness } from './label-art.js';

function createCanvasTexture(maxAnisotropy, colorSpace) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = colorSpace;
  texture.anisotropy = Math.min(8, maxAnisotropy);
  return { ctx: canvas.getContext('2d'), texture };
}

// The printed sleeve: a colour texture redrawn per flavor, plus a static metalness map.
export function createLabel(maxAnisotropy) {
  const color = createCanvasTexture(maxAnisotropy, THREE.SRGBColorSpace);
  const metal = createCanvasTexture(maxAnisotropy, THREE.NoColorSpace);
  let lastFlavor = null;

  const drawMetal = () => {
    paintMetalness(metal.ctx);
    metal.texture.needsUpdate = true;
  };

  const draw = (flavor) => {
    paintColor(color.ctx, flavor);
    color.texture.needsUpdate = true;
    lastFlavor = flavor;
  };

  drawMetal();

  // Web fonts arrive after the first paint; repaint both maps once they are ready.
  if (document.fonts?.load) {
    Promise.all(FONT_LOADS.map((font) => document.fonts.load(font)))
      .then(() => {
        drawMetal();
        if (lastFlavor) draw(lastFlavor);
      })
      .catch((err) => console.warn('STRATA: label fonts failed to load, using fallbacks.', err));
  }

  return { texture: color.texture, metalnessMap: metal.texture, draw };
}
