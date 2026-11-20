import * as THREE from 'three';
import { MaterialCatalogItem } from '../types/design';

const mapCache = new Map<string, THREE.CanvasTexture>();
const bumpCache = new Map<string, THREE.CanvasTexture>();

function hexRgb(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function buildColorMap(item: MaterialCatalogItem, rx = 2, ry = 2): THREE.CanvasTexture {
  const key = `${item.id}_${rx.toFixed(1)}_${ry.toFixed(1)}`;
  const hit = mapCache.get(key);
  if (hit) return hit;

  const s = 512;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = item.color;
  ctx.fillRect(0, 0, s, s);
  const rgb = hexRgb(item.color);

  if (item.pattern === 'porcelain_600') {
    const step = s / 2;
    for (let i = 0; i < 4200; i++) {
      const d = (Math.random() - 0.5) * 14;
      ctx.fillStyle = `rgba(${Math.min(255, Math.max(0, rgb.r + d))},${Math.min(
        255,
        Math.max(0, rgb.g + d)
      )},${Math.min(255, Math.max(0, rgb.b + d))},0.32)`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 7, 5);
    }
    ctx.strokeStyle = item.subColor || '#D8D2C6';
    ctx.lineWidth = 2.5;
    for (let k = 0; k <= s; k += step) {
      ctx.beginPath();
      ctx.moveTo(k, 0);
      ctx.lineTo(k, s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, k);
      ctx.lineTo(s, k);
      ctx.stroke();
    }
  } else if (item.pattern === 'wide_oak') {
    const ph = s / 4;
    for (let r = 0; r < 4; r++) {
      const y0 = r * ph;
      const sh = (r % 2 === 0 ? 1 : -1) * 7;
      ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, rgb.r + sh))},${Math.min(
        255,
        Math.max(0, rgb.g + sh)
      )},${Math.min(255, Math.max(0, rgb.b + sh))})`;
      ctx.fillRect(0, y0, s, ph);

      ctx.strokeStyle = item.subColor || 'rgba(85,55,28,0.22)';
      ctx.globalAlpha = 0.24;
      ctx.lineWidth = 1.4;
      for (let g = 0; g < 18; g++) {
        const gy = y0 + Math.random() * ph;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(s * 0.33, gy + (Math.random() - 0.5) * 5, s * 0.66, gy + (Math.random() - 0.5) * 5, s, gy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.14)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(s, y0);
      ctx.stroke();
    }
  } else if (item.pattern === 'louver_wood') {
    const sw = s / 16;
    for (let x = 0; x < s; x += sw) {
      ctx.fillStyle = item.color;
      ctx.fillRect(x, 0, sw - 4, s);
      ctx.fillStyle = item.subColor || '#6B4829';
      ctx.fillRect(x + sw - 4, 0, 4, s);
    }
  } else if (item.pattern === 'stucco') {
    for (let i = 0; i < 6000; i++) {
      const d = (Math.random() - 0.5) * 12;
      ctx.fillStyle = `rgba(${Math.min(255, Math.max(0, rgb.r + d))},${Math.min(
        255,
        Math.max(0, rgb.g + d)
      )},${Math.min(255, Math.max(0, rgb.b + d))},0.3)`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 3, 3);
    }
  } else if (item.pattern === 'fabric') {
    ctx.strokeStyle = 'rgba(0,0,0,0.045)';
    ctx.lineWidth = 1;
    for (let i = 0; i < s; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(s, i);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.colorSpace = THREE.SRGBColorSpace;
  mapCache.set(key, tex);
  return tex;
}

export function buildBumpMap(item: MaterialCatalogItem, rx = 2, ry = 2): THREE.CanvasTexture | undefined {
  if (item.pattern === 'solid' || item.pattern === 'matte_pet') return undefined;
  const key = `b_${item.id}_${rx.toFixed(1)}_${ry.toFixed(1)}`;
  const hit = bumpCache.get(key);
  if (hit) return hit;

  const s = 256;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, s, s);

  if (item.pattern === 'porcelain_600') {
    ctx.strokeStyle = '#242424';
    ctx.lineWidth = 3;
    for (let k = 0; k <= s; k += s / 2) {
      ctx.beginPath();
      ctx.moveTo(k, 0);
      ctx.lineTo(k, s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, k);
      ctx.lineTo(s, k);
      ctx.stroke();
    }
  } else if (item.pattern === 'louver_wood') {
    const sw = s / 16;
    for (let x = 0; x < s; x += sw) {
      ctx.fillStyle = '#d4d4d4';
      ctx.fillRect(x, 0, sw - 3, s);
      ctx.fillStyle = '#2e2e2e';
      ctx.fillRect(x + sw - 3, 0, 3, s);
    }
  } else {
    for (let i = 0; i < 2800; i++) {
      const v = 108 + Math.floor(Math.random() * 44);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 3, 2);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  bumpCache.set(key, tex);
  return tex;
}

export function createScenicTvTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 288;
  const ctx = c.getContext('2d')!;
  const sky = ctx.createLinearGradient(0, 0, 0, 170);
  sky.addColorStop(0, '#3B82F6');
  sky.addColorStop(1, '#DBEAFE');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 512, 170);
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(0, 170);
  ctx.lineTo(100, 74);
  ctx.lineTo(195, 134);
  ctx.lineTo(315, 52);
  ctx.lineTo(435, 125);
  ctx.lineTo(512, 85);
  ctx.lineTo(512, 170);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(315, 52);
  ctx.lineTo(280, 82);
  ctx.lineTo(320, 78);
  ctx.lineTo(348, 90);
  ctx.closePath();
  ctx.fill();
  const lake = ctx.createLinearGradient(0, 170, 0, 288);
  lake.addColorStop(0, '#2563EB');
  lake.addColorStop(1, '#1E3A8A');
  ctx.fillStyle = lake;
  ctx.fillRect(0, 170, 512, 118);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
