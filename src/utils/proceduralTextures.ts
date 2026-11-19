import * as THREE from 'three';
import { MaterialItem } from '../types/interior';

const textureCache = new Map<string, THREE.CanvasTexture>();
const swatchCache = new Map<string, string>();

function drawPatternToCanvas(
  ctx: CanvasRenderingContext2D,
  size: number,
  mat: MaterialItem
) {
  ctx.fillStyle = mat.baseColor;
  ctx.fillRect(0, 0, size, size);

  const sec = mat.secondaryColor || mat.baseColor;

  switch (mat.pattern) {
    case 'oak_plank':
    case 'wide_plank': {
      const rows = mat.pattern === 'wide_plank' ? 4 : 6;
      const rowH = size / rows;
      for (let r = 0; r < rows; r++) {
        const y = r * rowH;
        // Subtle plank tone variation
        ctx.fillStyle = r % 2 === 0 ? mat.baseColor : sec;
        ctx.globalAlpha = r % 2 === 0 ? 1 : 0.35;
        ctx.fillRect(0, y, size, rowH);
        ctx.globalAlpha = 1;

        // Wood grain lines
        ctx.strokeStyle = sec;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.25;
        for (let g = 0; g < 8; g++) {
          const gy = y + ((g + 0.5) / 8) * rowH;
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.bezierCurveTo(
            size * 0.33,
            gy + (g % 2 === 0 ? 2 : -2),
            size * 0.66,
            gy + (g % 2 === 0 ? -2 : 2),
            size,
            gy
          );
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Plank seam
        ctx.strokeStyle = 'rgba(40, 25, 10, 0.28)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();

        // Staggered vertical joint
        const jointX = ((r * 0.37 + 0.2) % 1) * size;
        ctx.beginPath();
        ctx.moveTo(jointX, y);
        ctx.lineTo(jointX, y + rowH);
        ctx.stroke();
      }
      break;
    }

    case 'herringbone': {
      const step = size / 4;
      ctx.strokeStyle = 'rgba(35, 20, 8, 0.32)';
      ctx.lineWidth = 1.5;
      for (let y = -size; y < size * 2; y += step) {
        for (let x = -size; x < size * 2; x += step) {
          const alt = ((Math.round(x / step) + Math.round(y / step)) & 1) === 0;
          ctx.fillStyle = alt ? mat.baseColor : sec;
          ctx.globalAlpha = alt ? 0.9 : 0.45;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + step, y + step * 0.5);
          ctx.lineTo(x + step * 0.5, y + step * 1.5);
          ctx.lineTo(x - step * 0.5, y + step);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.stroke();
        }
      }
      break;
    }

    case 'marble_tile': {
      const tiles = 2;
      const tSize = size / tiles;
      // Subtle marble veins
      ctx.strokeStyle = sec;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.45;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo((i * 47) % size, 0);
        ctx.bezierCurveTo(
          size * 0.3,
          size * 0.3 + i * 10,
          size * 0.7,
          size * 0.6 - i * 8,
          (i * 83 + 50) % size,
          size
        );
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Grout lines
      ctx.strokeStyle = 'rgba(130, 125, 118, 0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= tiles; i++) {
        ctx.beginPath();
        ctx.moveTo(i * tSize, 0);
        ctx.lineTo(i * tSize, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * tSize);
        ctx.lineTo(size, i * tSize);
        ctx.stroke();
      }
      break;
    }

    case 'concrete_tile': {
      const tiles = 2;
      const tSize = size / tiles;
      ctx.fillStyle = sec;
      for (let i = 0; i < 120; i++) {
        ctx.globalAlpha = 0.08 + (i % 5) * 0.03;
        const px = (i * 73) % size;
        const py = (i * 137) % size;
        ctx.fillRect(px, py, 3, 3);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(60, 60, 60, 0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= tiles; i++) {
        ctx.beginPath();
        ctx.moveTo(i * tSize, 0);
        ctx.lineTo(i * tSize, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * tSize);
        ctx.lineTo(size, i * tSize);
        ctx.stroke();
      }
      break;
    }

    case 'linen': {
      ctx.strokeStyle = sec;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.28;
      for (let i = 0; i < size; i += 6) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }

    case 'plaster': {
      ctx.fillStyle = sec;
      for (let i = 0; i < 180; i++) {
        ctx.globalAlpha = 0.12;
        const px = (i * 53) % size;
        const py = (i * 97) % size;
        ctx.beginPath();
        ctx.arc(px, py, (i % 4) + 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }

    case 'wood_film': {
      ctx.strokeStyle = sec;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.35;
      for (let y = 0; y < size; y += 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(size * 0.4, y + 3, size * 0.7, y - 3, size, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }

    case 'louver': {
      const slats = 12;
      const w = size / slats;
      for (let i = 0; i < slats; i++) {
        ctx.fillStyle = mat.baseColor;
        ctx.fillRect(i * w, 0, w * 0.7, size);
        ctx.fillStyle = sec;
        ctx.fillRect(i * w + w * 0.7, 0, w * 0.3, size);
      }
      break;
    }

    default:
      break;
  }
}

export function getThreeTexture(
  mat: MaterialItem,
  repeatX = 1,
  repeatY = 1,
  direction: 'horizontal' | 'vertical' = 'horizontal'
): THREE.CanvasTexture {
  const key = `${mat.id}_${repeatX.toFixed(2)}_${repeatY.toFixed(2)}_${direction}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  drawPatternToCanvas(ctx, 256, mat);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  if (direction === 'vertical') {
    tex.center.set(0.5, 0.5);
    tex.rotation = Math.PI / 2;
  }
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;

  textureCache.set(key, tex);
  return tex;
}

export function getMaterialSwatchUrl(mat: MaterialItem): string {
  const cached = swatchCache.get(mat.id);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  drawPatternToCanvas(ctx, 96, mat);
  const url = canvas.toDataURL('image/png');
  swatchCache.set(mat.id, url);
  return url;
}
