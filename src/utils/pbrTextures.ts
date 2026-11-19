import * as THREE from 'three';
import { MaterialSpec } from '../types/studio';

const texCache = new Map<string, THREE.CanvasTexture>();
const bumpCache = new Map<string, THREE.CanvasTexture>();

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

export function getMaterialMap(mat: MaterialSpec, repeatX = 2, repeatY = 2): THREE.CanvasTexture {
  const key = `${mat.id}_${repeatX.toFixed(1)}_${repeatY.toFixed(1)}`;
  const cached = texCache.get(key);
  if (cached) return cached;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = mat.color;
  ctx.fillRect(0, 0, size, size);

  const base = hexToRgb(mat.color);

  if (mat.pattern === 'tile_600') {
    // 2x2 tiles per texture tile with subtle stone mottling + thin grout
    const step = size / 2;
    for (let i = 0; i < 4500; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const delta = (Math.random() - 0.5) * 14;
      ctx.fillStyle = `rgba(${Math.min(255, Math.max(0, base.r + delta))},${Math.min(
        255,
        Math.max(0, base.g + delta)
      )},${Math.min(255, Math.max(0, base.b + delta))},0.35)`;
      ctx.fillRect(x, y, 6, 4);
    }
    ctx.strokeStyle = mat.accentColor || '#D8D2C6';
    ctx.lineWidth = 3;
    for (let k = 0; k <= size; k += step) {
      ctx.beginPath();
      ctx.moveTo(k, 0);
      ctx.lineTo(k, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, k);
      ctx.lineTo(size, k);
      ctx.stroke();
    }
  } else if (mat.pattern === 'wide_oak') {
    const plankH = size / 4;
    for (let row = 0; row < 4; row++) {
      const y0 = row * plankH;
      const shade = (row % 2 === 0 ? 1 : -1) * 7;
      ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, base.r + shade))},${Math.min(
        255,
        Math.max(0, base.g + shade)
      )},${Math.min(255, Math.max(0, base.b + shade))})`;
      ctx.fillRect(0, y0, size, plankH);

      // Wood grain streaks
      ctx.strokeStyle = mat.accentColor || 'rgba(90,60,30,0.18)';
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 1.5;
      for (let g = 0; g < 18; g++) {
        const gy = y0 + Math.random() * plankH;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(size * 0.33, gy + (Math.random() - 0.5) * 6, size * 0.66, gy + (Math.random() - 0.5) * 6, size, gy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Plank seam
      ctx.strokeStyle = 'rgba(0,0,0,0.14)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(size, y0);
      ctx.stroke();
    }
  } else if (mat.pattern === 'louver_wood') {
    const slatW = size / 16;
    for (let x = 0; x < size; x += slatW) {
      ctx.fillStyle = mat.color;
      ctx.fillRect(x, 0, slatW - 4, size);
      ctx.fillStyle = mat.accentColor || '#6B4829';
      ctx.fillRect(x + slatW - 4, 0, 4, size);
    }
  } else if (mat.pattern === 'stucco') {
    for (let i = 0; i < 6500; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const d = (Math.random() - 0.5) * 12;
      ctx.fillStyle = `rgba(${Math.min(255, Math.max(0, base.r + d))},${Math.min(
        255,
        Math.max(0, base.g + d)
      )},${Math.min(255, Math.max(0, base.b + d))},0.3)`;
      ctx.fillRect(x, y, 3, 3);
    }
  } else if (mat.pattern === 'fabric') {
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
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
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, tex);
  return tex;
}

export function getMaterialBump(mat: MaterialSpec, repeatX = 2, repeatY = 2): THREE.CanvasTexture | undefined {
  if (mat.pattern === 'solid' || mat.pattern === 'matte_pet') return undefined;
  const key = `bump_${mat.id}_${repeatX.toFixed(1)}_${repeatY.toFixed(1)}`;
  const cached = bumpCache.get(key);
  if (cached) return cached;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  if (mat.pattern === 'tile_600') {
    const step = size / 2;
    ctx.strokeStyle = '#202020';
    ctx.lineWidth = 3;
    for (let k = 0; k <= size; k += step) {
      ctx.beginPath();
      ctx.moveTo(k, 0);
      ctx.lineTo(k, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, k);
      ctx.lineTo(size, k);
      ctx.stroke();
    }
  } else if (mat.pattern === 'louver_wood') {
    const slatW = size / 16;
    for (let x = 0; x < size; x += slatW) {
      ctx.fillStyle = '#d0d0d0';
      ctx.fillRect(x, 0, slatW - 3, size);
      ctx.fillStyle = '#303030';
      ctx.fillRect(x + slatW - 3, 0, 3, size);
    }
  } else {
    for (let i = 0; i < 3000; i++) {
      const v = 110 + Math.floor(Math.random() * 40);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 3, 2);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  bumpCache.set(key, tex);
  return tex;
}

export function createTvScreenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 288;
  const ctx = canvas.getContext('2d')!;

  // Sky & mountain lake scenic wallpaper (like reference image 1)
  const sky = ctx.createLinearGradient(0, 0, 0, 170);
  sky.addColorStop(0, '#60A5FA');
  sky.addColorStop(1, '#DBEAFE');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 512, 170);

  // Mountains
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(0, 170);
  ctx.lineTo(95, 78);
  ctx.lineTo(190, 138);
  ctx.lineTo(310, 58);
  ctx.lineTo(430, 128);
  ctx.lineTo(512, 90);
  ctx.lineTo(512, 170);
  ctx.closePath();
  ctx.fill();

  // Snow caps
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(310, 58);
  ctx.lineTo(276, 86);
  ctx.lineTo(315, 82);
  ctx.lineTo(345, 92);
  ctx.closePath();
  ctx.fill();

  // Lake reflection
  const lake = ctx.createLinearGradient(0, 170, 0, 288);
  lake.addColorStop(0, '#3B82F6');
  lake.addColorStop(1, '#1E3A8A');
  ctx.fillStyle = lake;
  ctx.fillRect(0, 170, 512, 118);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
