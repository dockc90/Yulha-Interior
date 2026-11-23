import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Eye, EyeOff, Footprints, RotateCw, Trash2 } from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';
import { getMat } from '../data/materialsDb';
import { getBumpMap, getTextureMap, createTvTexture } from '../utils/pbrMaps';
import { projectBounds } from '../engine/cadGraph';
import { FloorProject, MaterialItem, SceneItem, WallOpening } from '../types/planner';

const MM_TO_M = 1;

function makePbrMat(
  item: MaterialItem,
  rx: number,
  ry: number,
  isSelected: boolean,
  extra?: Partial<THREE.MeshStandardMaterialParameters>,
): THREE.MeshStandardMaterial {
  const map = getTextureMap(item, rx, ry);
  const bumpMap = getBumpMap(item, rx, ry);
  return new THREE.MeshStandardMaterial({
    color: isSelected ? '#93C5FD' : '#FFFFFF',
    map,
    bumpMap,
    bumpScale: bumpMap ? 0.01 : 0,
    roughness: item.roughness,
    metalness: item.metalness,
    ...extra,
  });
}

function buildPropMesh(
  item: SceneItem,
  isSelected: boolean,
  fanBladesOut: THREE.Object3D[],
): THREE.Group {
  const group = new THREE.Group();
  const matItem = getMat(item.materialId);
  const w = item.width * MM_TO_M;
  const d = item.depth * MM_TO_M;
  const h = item.height * MM_TO_M;
  const elev = item.elevation * MM_TO_M;

  const baseMat = makePbrMat(matItem, 1, 1, isSelected);
  const darkMat = new THREE.MeshStandardMaterial({
    color: isSelected ? '#60A5FA' : '#1E293B',
    roughness: 0.35,
    metalness: 0.45,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: '#E2E8F0',
    roughness: 0.15,
    metalness: 0.88,
  });
  const whiteMat = new THREE.MeshStandardMaterial({
    color: isSelected ? '#BFDBFE' : '#F8FAFC',
    roughness: 0.35,
  });
  const accentPillowMat = new THREE.MeshStandardMaterial({
    color: '#8C9B8E',
    roughness: 0.85,
  });
  const oakMat = new THREE.MeshStandardMaterial({
    color: isSelected ? '#93C5FD' : '#C8A57B',
    roughness: 0.5,
  });

  const addBox = (
    bw: number,
    bh: number,
    bd: number,
    px: number,
    py: number,
    pz: number,
    mat: THREE.Material,
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat);
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  switch (item.kind) {
    case 'sofa_modular': {
      // Base frame + legs
      addBox(w * 0.96, 0.06, d * 0.92, 0, 0.09, 0, oakMat);
      [
        [-w * 0.44, -d * 0.4],
        [w * 0.44, -d * 0.4],
        [-w * 0.44, d * 0.4],
        [w * 0.44, d * 0.4],
      ].forEach(([lx, lz]) => addBox(0.04, 0.06, 0.04, lx, 0.03, lz, darkMat));

      // Seat cushions (3 modules)
      const seats = 3;
      const sw = (w - 0.18) / seats;
      for (let i = 0; i < seats; i++) {
        const sx = -w / 2 + 0.09 + sw * (i + 0.5);
        addBox(sw - 0.02, h * 0.34, d * 0.88, sx, 0.12 + h * 0.17, d * 0.04, baseMat);
      }
      // Backrest & armrests
      addBox(w, h * 0.56, d * 0.22, 0, 0.12 + h * 0.42, -d * 0.38, baseMat);
      addBox(0.14, h * 0.52, d * 0.94, -w / 2 + 0.07, 0.12 + h * 0.26, 0, baseMat);
      addBox(0.14, h * 0.52, d * 0.94, w / 2 - 0.07, 0.12 + h * 0.26, 0, baseMat);
      // Throw pillows
      addBox(0.38, 0.32, 0.12, -w * 0.32, 0.12 + h * 0.42, -d * 0.2, accentPillowMat).rotation.x = -0.25;
      addBox(0.38, 0.32, 0.12, w * 0.32, 0.12 + h * 0.42, -d * 0.2, accentPillowMat).rotation.x = -0.25;
      break;
    }
    case 'coffee_table': {
      addBox(w, 0.032, d, 0, h - 0.016, 0, baseMat);
      [
        [-w * 0.42, -d * 0.38],
        [w * 0.42, -d * 0.38],
        [-w * 0.42, d * 0.38],
        [w * 0.42, d * 0.38],
      ].forEach(([lx, lz]) => addBox(0.03, h - 0.032, 0.03, lx, (h - 0.032) / 2, lz, darkMat));
      // Decorative tray
      addBox(0.32, 0.02, 0.22, 0.1, h + 0.01, 0, oakMat);
      break;
    }
    case 'rug_round': {
      const rug = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, h, 48), baseMat);
      rug.position.set(0, h / 2, 0);
      rug.receiveShadow = true;
      group.add(rug);
      break;
    }
    case 'wall_tv': {
      addBox(w + 0.024, h + 0.024, 0.028, 0, elev + h / 2, -0.01, darkMat);
      const screenMat = new THREE.MeshStandardMaterial({
        map: createTvTexture(),
        roughness: 0.12,
        metalness: 0.12,
        emissive: new THREE.Color('#1E293B'),
        emissiveIntensity: 0.28,
      });
      addBox(w, h, 0.012, 0, elev + h / 2, 0.01, screenMat);
      break;
    }
    case 'aircon_stand': {
      addBox(w, h, d, 0, h / 2, 0, baseMat);
      addBox(w * 0.78, h * 0.36, 0.016, 0, h * 0.68, d * 0.505, whiteMat);
      break;
    }
    case 'island_counter': {
      // Waterfall stone top & sides
      addBox(w - 0.06, h - 0.04, d * 0.9, 0, (h - 0.04) / 2, 0, baseMat);
      addBox(w, 0.04, d, 0, h - 0.02, 0, whiteMat);
      addBox(0.04, h, d, -w / 2 + 0.02, h / 2, 0, whiteMat);
      addBox(0.04, h, d, w / 2 - 0.02, h / 2, 0, whiteMat);
      // Warm toe-kick LED strip
      const ledMat = new THREE.MeshStandardMaterial({
        color: '#FFFBEB',
        emissive: new THREE.Color('#FDE68A'),
        emissiveIntensity: 1.4,
      });
      addBox(w - 0.12, 0.02, 0.02, 0, 0.04, d * 0.44, ledMat);
      break;
    }
    case 'dining_set':
    case 'desk_set': {
      addBox(w, 0.042, d, 0, h - 0.021, 0, baseMat);
      const lx = w * 0.42;
      const lz = d * 0.38;
      [
        [-lx, -lz],
        [lx, -lz],
        [-lx, lz],
        [lx, lz],
      ].forEach(([px, pz]) => addBox(0.055, h - 0.042, 0.055, px, (h - 0.042) / 2, pz, oakMat));
      if (item.kind === 'dining_set') {
        [-w * 0.25, w * 0.25].forEach((cx) => {
          [-d * 0.62, d * 0.62].forEach((cz) => {
            addBox(0.42, 0.04, 0.4, cx, 0.45, cz, baseMat);
            addBox(0.42, 0.36, 0.04, cx, 0.65, cz + (cz > 0 ? 0.18 : -0.18), baseMat);
            addBox(0.035, 0.44, 0.035, cx - 0.16, 0.22, cz - 0.15, oakMat);
            addBox(0.035, 0.44, 0.035, cx + 0.16, 0.22, cz - 0.15, oakMat);
            addBox(0.035, 0.44, 0.035, cx - 0.16, 0.22, cz + 0.15, oakMat);
            addBox(0.035, 0.44, 0.035, cx + 0.16, 0.22, cz + 0.15, oakMat);
          });
        });
      }
      break;
    }
    case 'fridge_4door': {
      addBox(w, h, d, 0, h / 2, 0, darkMat);
      const pw = w * 0.485;
      addBox(pw, h * 0.56, 0.025, -w * 0.248, h * 0.71, d * 0.505, baseMat);
      addBox(pw, h * 0.56, 0.025, w * 0.248, h * 0.71, d * 0.505, baseMat);
      addBox(pw, h * 0.39, 0.025, -w * 0.248, h * 0.205, d * 0.505, baseMat);
      addBox(pw, h * 0.39, 0.025, w * 0.248, h * 0.205, d * 0.505, baseMat);
      // Recessed handle trim
      addBox(w * 0.96, 0.015, 0.01, 0, h * 0.42, d * 0.515, darkMat);
      break;
    }
    case 'induction_3': {
      addBox(w, h, d, 0, elev + h / 2, 0, darkMat);
      const ringMat = new THREE.MeshStandardMaterial({ color: '#CBD5E1', roughness: 0.2 });
      [-w * 0.25, 0.02, w * 0.27].forEach((rx, idx) => {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(idx === 1 ? 0.08 : 0.06, idx === 1 ? 0.095 : 0.072, 24),
          ringMat,
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(rx, elev + h + 0.002, idx === 0 ? -0.06 : 0.04);
        group.add(ring);
      });
      break;
    }
    case 'kitchen_sink': {
      addBox(w, h - 0.04, d, 0, (h - 0.04) / 2, 0, baseMat);
      addBox(w + 0.02, 0.04, d + 0.02, 0, h - 0.02, 0, whiteMat);
      // Stainless sink basin & gooseneck faucet
      addBox(0.7, 0.015, 0.46, -w * 0.22, h + 0.005, 0, chromeMat);
      addBox(0.03, 0.28, 0.03, -w * 0.22, h + 0.14, -d * 0.34, chromeMat);
      addBox(0.03, 0.03, 0.16, -w * 0.22, h + 0.28, -d * 0.27, chromeMat);
      // Upper cabinets
      addBox(w, 0.72, 0.36, 0, 1.85, -d * 0.22, baseMat);
      const ledMat = new THREE.MeshStandardMaterial({
        color: '#FFFBEB',
        emissive: new THREE.Color('#FDE68A'),
        emissiveIntensity: 1.5,
      });
      addBox(w - 0.1, 0.015, 0.02, 0, 1.48, -d * 0.22, ledMat);
      break;
    }
    case 'tall_homebar':
    case 'wardrobe': {
      addBox(w, h, d, 0, h / 2, 0, baseMat);
      const doors = Math.max(2, Math.round(w / 0.6));
      for (let i = 1; i < doors; i++) {
        const sx = -w / 2 + (w / doors) * i;
        addBox(0.006, h - 0.04, 0.01, sx, h / 2, d / 2 + 0.003, darkMat);
      }
      break;
    }
    case 'bed_queen': {
      addBox(w, 0.26, d, 0, 0.13, 0, oakMat);
      addBox(w * 0.92, 0.22, d * 0.88, 0, 0.37, d * 0.04, whiteMat);
      // Folded duvet blanket
      addBox(w * 0.94, 0.24, d * 0.56, 0, 0.38, d * 0.18, baseMat);
      // Upholstered headboard
      addBox(w * 1.06, Math.max(h, 1.05), 0.12, 0, Math.max(h, 1.05) / 2, -d * 0.47, baseMat);
      // Pillows
      addBox(w * 0.34, 0.12, 0.38, -w * 0.22, 0.54, -d * 0.3, whiteMat);
      addBox(w * 0.34, 0.12, 0.38, w * 0.22, 0.54, -d * 0.3, whiteMat);
      break;
    }
    case 'bathtub': {
      addBox(w, h, d, 0, h / 2, 0, whiteMat);
      addBox(w * 0.88, 0.04, d * 0.8, 0, h + 0.01, 0, new THREE.MeshStandardMaterial({ color: '#E0F2FE', roughness: 0.15 }));
      break;
    }
    case 'vanity': {
      addBox(w, h * 0.72, d, 0, h * 0.36, 0, baseMat);
      addBox(w + 0.02, 0.05, d + 0.02, 0, h * 0.745, 0, whiteMat);
      addBox(0.025, 0.16, 0.025, 0, h + 0.08, -d * 0.32, chromeMat);
      const mirrorMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', metalness: 0.92, roughness: 0.06 });
      addBox(w * 0.85, 0.75, 0.02, 0, h + 0.54, -d * 0.45, mirrorMat);
      break;
    }
    case 'toilet': {
      addBox(w, h * 0.48, d * 0.72, 0, h * 0.24, d * 0.12, whiteMat);
      addBox(w * 0.92, h * 0.52, d * 0.28, 0, h * 0.58, -d * 0.34, whiteMat);
      break;
    }
    case 'shower_booth': {
      const glassMat = new THREE.MeshStandardMaterial({
        color: '#E0F2FE',
        transparent: true,
        opacity: 0.3,
        roughness: 0.08,
      });
      addBox(0.03, h, d, -w / 2, h / 2, 0, glassMat);
      addBox(w, h, 0.03, 0, h / 2, d / 2, glassMat);
      break;
    }
    case 'ceiling_fan': {
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.18, 24), darkMat);
      hub.position.set(0, elev + h * 0.6, 0);
      group.add(hub);
      const spinner = new THREE.Group();
      spinner.position.set(0, elev + h * 0.45, 0);
      for (let i = 0; i < 3; i++) {
        const bladePivot = new THREE.Group();
        bladePivot.rotation.y = (i * Math.PI * 2) / 3;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(w * 0.46, 0.018, 0.14), baseMat);
        blade.position.x = w * 0.24;
        blade.rotation.x = 0.15;
        blade.castShadow = true;
        bladePivot.add(blade);
        spinner.add(bladePivot);
      }
      group.add(spinner);
      fanBladesOut.push(spinner);
      break;
    }
    case 'downlight': {
      const trim = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.02, 20), whiteMat);
      trim.position.set(0, elev, 0);
      const emit = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.022, 20),
        new THREE.MeshStandardMaterial({
          color: '#FFFBEB',
          emissive: new THREE.Color('#FEF3C7'),
          emissiveIntensity: 2.0,
        }),
      );
      emit.position.set(0, elev - 0.002, 0);
      group.add(trim, emit);
      break;
    }
    case 'outlet_2':
    case 'switch_2':
    case 'wallpad': {
      addBox(w, h, d, 0, elev, 0, baseMat);
      addBox(w * 0.32, h * 0.55, d * 0.4, -w * 0.22, elev, d * 0.4, whiteMat);
      addBox(w * 0.32, h * 0.55, d * 0.4, w * 0.22, elev, d * 0.4, whiteMat);
      break;
    }
  }

  group.position.set(item.x * MM_TO_M, 0, item.y * MM_TO_M);
  group.rotation.y = -item.rotation;
  group.userData = { targetKind: 'item', targetId: item.id };
  group.traverse((obj) => {
    obj.userData = { targetKind: 'item', targetId: item.id };
  });
  return group;
}

function buildOpeningMesh(op: WallOpening, wallThickM: number, wallHeightM: number, isSelected: boolean): THREE.Group {
  const g = new THREE.Group();
  const w = op.width * MM_TO_M;
  const h = Math.min(op.height * MM_TO_M, wallHeightM - 0.05);
  const sill = op.sillHeight * MM_TO_M;
  const matItem = getMat(op.frameMaterialId);
  const frameMat = makePbrMat(matItem, 1, 1, isSelected);
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#DFF4FF',
    transparent: true,
    opacity: 0.32,
    roughness: 0.06,
    metalness: 0.15,
  });

  if (op.kind === 'window') {
    const f = 0.045;
    const topF = new THREE.Mesh(new THREE.BoxGeometry(w, f, wallThickM * 0.9), frameMat);
    topF.position.set(0, sill + h - f / 2, 0);
    const botF = new THREE.Mesh(new THREE.BoxGeometry(w, f, wallThickM * 0.9), frameMat);
    botF.position.set(0, sill + f / 2, 0);
    const leftF = new THREE.Mesh(new THREE.BoxGeometry(f, h, wallThickM * 0.9), frameMat);
    leftF.position.set(-w / 2 + f / 2, sill + h / 2, 0);
    const rightF = new THREE.Mesh(new THREE.BoxGeometry(f, h, wallThickM * 0.9), frameMat);
    rightF.position.set(w / 2 - f / 2, sill + h / 2, 0);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(w - f * 2, h - f * 2, 0.015), glassMat);
    glass.position.set(0, sill + h / 2, 0);
    g.add(topF, botF, leftF, rightF, glass);

    if (op.hasBlind) {
      const blindMat = new THREE.MeshStandardMaterial({ color: '#B5895A', roughness: 0.5 });
      for (let sy = sill + h * 0.45; sy < sill + h - 0.08; sy += 0.06) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(w - f * 2.2, 0.012, 0.045), blindMat);
        slat.position.set(0, sy, 0.01);
        slat.rotation.x = 0.25;
        g.add(slat);
      }
    }
  } else if (op.kind === 'sliding_glass') {
    const pw = w / 3;
    for (let i = -1; i <= 1; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(pw - 0.03, h - 0.06, 0.02), glassMat);
      p.position.set(i * pw, h / 2, i * 0.025);
      g.add(p);
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, h, 0.03),
        new THREE.MeshStandardMaterial({ color: '#1E293B', metalness: 0.4, roughness: 0.35 }),
      );
      mullion.position.set(i * pw - pw / 2, h / 2, i * 0.025);
      g.add(mullion);
    }
  } else {
    const f = 0.045;
    const leftF = new THREE.Mesh(new THREE.BoxGeometry(f, h, wallThickM * 1.04), frameMat);
    leftF.position.set(-w / 2 + f / 2, h / 2, 0);
    const rightF = new THREE.Mesh(new THREE.BoxGeometry(f, h, wallThickM * 1.04), frameMat);
    rightF.position.set(w / 2 - f / 2, h / 2, 0);
    const topF = new THREE.Mesh(new THREE.BoxGeometry(w, f, wallThickM * 1.04), frameMat);
    topF.position.set(0, h - f / 2, 0);

    const doorLeafPivot = new THREE.Group();
    doorLeafPivot.position.set(-w / 2 + f, 0, 0);
    doorLeafPivot.rotation.y = 0.35;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(w - f * 2, h - f, 0.04), frameMat);
    leaf.position.set((w - f * 2) / 2, (h - f) / 2, 0);
    leaf.castShadow = true;
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.022, 0.08),
      new THREE.MeshStandardMaterial({ color: '#D4AF37', metalness: 0.85, roughness: 0.2 }),
    );
    handle.position.set(w - f * 2 - 0.09, 1.0, 0);
    doorLeafPivot.add(leaf, handle);
    g.add(leftF, rightF, topF, doorLeafPivot);
  }

  g.traverse((obj) => {
    obj.userData = { targetKind: 'opening', targetId: op.id };
  });
  return g;
}

export const Viewport3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneGroupRef = useRef<THREE.Group | null>(null);
  const fanSpinnersRef = useRef<THREE.Object3D[]>([]);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const project = usePlannerStore((s) => s.project);
  const rooms = usePlannerStore((s) => s.rooms);
  const selection = usePlannerStore((s) => s.selection);
  const viewMode = usePlannerStore((s) => s.viewMode);
  const showCeiling = usePlannerStore((s) => s.showCeiling);
  const snapshotTrigger = usePlannerStore((s) => s.snapshotTrigger);

  const setViewMode = usePlannerStore((s) => s.setViewMode);
  const setShowCeiling = usePlannerStore((s) => s.setShowCeiling);
  const setSelection = usePlannerStore((s) => s.setSelection);
  const moveSceneItem = usePlannerStore((s) => s.moveSceneItem);
  const pushHistorySnapshot = usePlannerStore((s) => s.pushHistorySnapshot);
  const rotateSelected = usePlannerStore((s) => s.rotateSelected);
  const deleteSelected = usePlannerStore((s) => s.deleteSelected);

  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;
  const projectRef = useRef(project);
  projectRef.current = project;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#EBF0F5');

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;

    // Neutral studio daylight + crisp shadow tuning
    const amb = new THREE.AmbientLight(0xffffff, 0.72);
    const hemi = new THREE.HemisphereLight(0xffffff, 0xe8e4dc, 0.72);
    const dir = new THREE.DirectionalLight(0xfffdf9, 0.75);
    dir.position.set(9, 15, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.bias = -0.0004;
    dir.shadow.normalBias = 0.018;
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 45;
    dir.shadow.camera.left = -14;
    dir.shadow.camera.right = 14;
    dir.shadow.camera.top = 14;
    dir.shadow.camera.bottom = -14;
    scene.add(amb, hemi, dir);

    // Architectural studio matte floor plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: '#E5E8EC', roughness: 0.92, metalness: 0 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);
    sceneGroupRef.current = worldGroup;

    const camera = new THREE.PerspectiveCamera(46, container.clientWidth / container.clientHeight, 0.1, 120);
    camera.position.set(11, 10, 13);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(5.9, 0.8, 4.6);
    controls.update();
    controlsRef.current = controls;

    const keys = new Set<string>();
    let walkYaw = 0;
    let walkPitch = 0;
    let isLooking = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    let draggingItemId: string | null = null;
    let dragSnapshot: FloorProject | null = null;
    const dragOffset = new THREE.Vector3();

    const onPointerDown = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (viewModeRef.current === 'walk') {
        isLooking = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(worldGroup.children, true);
      if (hits.length > 0) {
        const hit = hits[0].object;
        const { targetKind, targetId } = hit.userData || {};
        if (targetKind === 'room' && targetId) {
          setSelection({ kind: 'room', key: targetId });
        } else if (targetKind === 'wall' && targetId) {
          setSelection({ kind: 'wall', id: targetId });
        } else if (targetKind === 'opening' && targetId) {
          setSelection({ kind: 'opening', id: targetId });
        } else if (targetKind === 'item' && targetId) {
          setSelection({ kind: 'item', id: targetId });
          if (viewModeRef.current !== 'walk' && e.button === 0) {
            const it = projectRef.current.items.find((x) => x.id === targetId);
            const intersectPt = new THREE.Vector3();
            if (it && raycaster.ray.intersectPlane(floorPlane, intersectPt)) {
              draggingItemId = targetId;
              dragSnapshot = JSON.parse(JSON.stringify(projectRef.current)) as FloorProject;
              dragOffset.set(it.x * MM_TO_M - intersectPt.x, 0, it.y * MM_TO_M - intersectPt.z);
              controls.enabled = false;
            }
          }
        }
      } else if (viewModeRef.current !== 'walk') {
        setSelection(null);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (viewModeRef.current === 'walk' && isLooking) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        walkYaw -= dx * 0.004;
        walkPitch = Math.max(-0.7, Math.min(0.7, walkPitch - dy * 0.004));
        camera.rotation.order = 'YXZ';
        camera.rotation.y = walkYaw;
        camera.rotation.x = walkPitch;
        return;
      }

      if (draggingItemId) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const intersectPt = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(floorPlane, intersectPt)) {
          const nx = Math.round(((intersectPt.x + dragOffset.x) / MM_TO_M) * 20) / 20;
          const ny = Math.round(((intersectPt.z + dragOffset.z) / MM_TO_M) * 20) / 20;
          moveSceneItem(draggingItemId, nx, ny, false);
        }
      }
    };

    const onPointerUp = () => {
      isLooking = false;
      if (draggingItemId && dragSnapshot) {
        pushHistorySnapshot(dragSnapshot);
      }
      draggingItemId = null;
      dragSnapshot = null;
      if (viewModeRef.current !== 'walk') {
        controls.enabled = true;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => keys.add(e.code);
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const resizeObs = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w < 10 || h < 10) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObs.observe(container);

    let rafId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);

      // Gentle ceiling fan rotation
      for (const spinner of fanSpinnersRef.current) {
        spinner.rotation.y += dt * 1.4;
      }

      if (viewModeRef.current === 'walk') {
        const speed = 3.2 * dt;
        const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, camera.rotation.y, 0));
        const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, camera.rotation.y, 0));
        if (keys.has('KeyW') || keys.has('ArrowUp')) camera.position.addScaledVector(forward, speed);
        if (keys.has('KeyS') || keys.has('ArrowDown')) camera.position.addScaledVector(forward, -speed);
        if (keys.has('KeyA') || keys.has('ArrowLeft')) camera.position.addScaledVector(right, -speed);
        if (keys.has('KeyD') || keys.has('ArrowRight')) camera.position.addScaledVector(right, speed);
        camera.position.y = 1.62;
      } else {
        controls.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObs.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      pmrem.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    if (viewMode === 'walk') {
      ctrl.enabled = false;
      const mainRoom = rooms.find((r) => r.name.includes('거실')) ?? rooms[0];
      const cx = (mainRoom?.centroid.x ?? 5.5) * MM_TO_M;
      const cz = (mainRoom?.centroid.y ?? 5.5) * MM_TO_M;
      cam.position.set(cx, 1.62, cz);
      cam.rotation.order = 'YXZ';
      cam.rotation.set(0, 0, 0);
    } else {
      ctrl.enabled = true;
      const b = projectBounds(project);
      const cx = ((b.minX + b.maxX) / 2) * MM_TO_M;
      const cz = ((b.minY + b.maxY) / 2) * MM_TO_M;
      ctrl.target.set(cx, 0.8, cz);
      cam.position.set(cx + 6.5, 8.8, cz + 8.5);
      ctrl.update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, project.id]);

  useEffect(() => {
    const group = sceneGroupRef.current;
    if (!group) return;
    while (group.children.length > 0) {
      const child = group.children.pop()!;
      group.remove(child);
    }
    fanSpinnersRef.current = [];

    const nodeMap = new Map(project.nodes.map((n) => [n.id, n]));
    const skirtingMat = new THREE.MeshStandardMaterial({ color: '#F5F4F0', roughness: 0.45 });

    for (const room of rooms) {
      if (room.polygon.length < 3) continue;
      const shape = new THREE.Shape();
      room.polygon.forEach((pt, idx) => {
        const x = pt.x * MM_TO_M;
        const z = pt.y * MM_TO_M;
        if (idx === 0) shape.moveTo(x, -z);
        else shape.lineTo(x, -z);
      });
      shape.closePath();

      const floorGeo = new THREE.ShapeGeometry(shape);
      floorGeo.rotateX(-Math.PI / 2);

      const isSel = selection?.kind === 'room' && selection.key === room.key;
      const matItem = getMat(room.floorMaterialId);
      const floorMat = makePbrMat(matItem, 0.7, 0.7, isSel);
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.receiveShadow = true;
      floorMesh.userData = { targetKind: 'room', targetId: room.key };
      group.add(floorMesh);

      if (showCeiling || viewMode === 'walk') {
        const ceilGeo = new THREE.ShapeGeometry(shape);
        ceilGeo.rotateX(Math.PI / 2);
        const ceilMat = new THREE.MeshStandardMaterial({
          color: '#FFFFFF',
          roughness: 0.85,
          side: THREE.DoubleSide,
        });
        const ceilMesh = new THREE.Mesh(ceilGeo, ceilMat);
        ceilMesh.position.y = 2.45;
        group.add(ceilMesh);

        if (room.ceilingType === 'well_cove' && room.coveLightOn) {
          const coveLight = new THREE.PointLight('#FFF3D6', 1.2, 8);
          coveLight.position.set(room.centroid.x, 2.3, room.centroid.y);
          group.add(coveLight);
        }
      }
    }

    for (const wall of project.walls) {
      const a = nodeMap.get(wall.startId);
      const b = nodeMap.get(wall.endId);
      if (!a || !b) continue;
      const dx = (b.x - a.x) * MM_TO_M;
      const dz = (b.y - a.y) * MM_TO_M;
      const wallLen = Math.hypot(dx, dz);
      if (wallLen < 0.05) continue;

      const thick = wall.thickness * MM_TO_M;
      const height = wall.height * MM_TO_M;
      const angle = Math.atan2(dz, dx);
      const isSel = selection?.kind === 'wall' && selection.id === wall.id;
      const wallMat = makePbrMat(getMat(wall.frontMaterialId), 0.5, 0.5, isSel);

      const wallContainer = new THREE.Group();
      wallContainer.position.set(a.x * MM_TO_M, 0, a.y * MM_TO_M);
      wallContainer.rotation.y = -angle;

      const ops = project.openings
        .filter((op) => op.wallId === wall.id)
        .sort((o1, o2) => o1.offset - o2.offset);

      let cursor = 0;
      for (const op of ops) {
        const centerDist = op.offset * wallLen;
        const opW = Math.min(op.width * MM_TO_M, wallLen * 0.85);
        const startDist = Math.max(cursor, centerDist - opW / 2);
        const endDist = Math.min(wallLen, centerDist + opW / 2);

        if (startDist - cursor > 0.02) {
          const segLen = startDist - cursor;
          const seg = new THREE.Mesh(new THREE.BoxGeometry(segLen, height, thick), wallMat);
          seg.position.set(cursor + segLen / 2, height / 2, 0);
          seg.castShadow = true;
          seg.receiveShadow = true;
          seg.userData = { targetKind: 'wall', targetId: wall.id };
          wallContainer.add(seg);

          // Baseboard skirting
          const skirt = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.045, thick + 0.016), skirtingMat);
          skirt.position.set(cursor + segLen / 2, 0.0225, 0);
          wallContainer.add(skirt);
        }

        const opTop = Math.min(height, (op.sillHeight + op.height) * MM_TO_M);
        if (height - opTop > 0.03) {
          const headerH = height - opTop;
          const header = new THREE.Mesh(new THREE.BoxGeometry(endDist - startDist, headerH, thick), wallMat);
          header.position.set((startDist + endDist) / 2, opTop + headerH / 2, 0);
          header.castShadow = true;
          header.userData = { targetKind: 'wall', targetId: wall.id };
          wallContainer.add(header);
        }

        const sillH = op.sillHeight * MM_TO_M;
        if (sillH > 0.03) {
          const sill = new THREE.Mesh(new THREE.BoxGeometry(endDist - startDist, sillH, thick), wallMat);
          sill.position.set((startDist + endDist) / 2, sillH / 2, 0);
          sill.castShadow = true;
          sill.userData = { targetKind: 'wall', targetId: wall.id };
          wallContainer.add(sill);
        }

        const opMesh = buildOpeningMesh(
          op,
          thick,
          height,
          selection?.kind === 'opening' && selection.id === op.id,
        );
        opMesh.position.set((startDist + endDist) / 2, 0, 0);
        wallContainer.add(opMesh);

        cursor = endDist;
      }

      if (wallLen - cursor > 0.02) {
        const tailLen = wallLen - cursor;
        const tail = new THREE.Mesh(new THREE.BoxGeometry(tailLen, height, thick), wallMat);
        tail.position.set(cursor + tailLen / 2, height / 2, 0);
        tail.castShadow = true;
        tail.receiveShadow = true;
        tail.userData = { targetKind: 'wall', targetId: wall.id };
        wallContainer.add(tail);

        const skirt = new THREE.Mesh(new THREE.BoxGeometry(tailLen, 0.045, thick + 0.016), skirtingMat);
        skirt.position.set(cursor + tailLen / 2, 0.0225, 0);
        wallContainer.add(skirt);
      }

      group.add(wallContainer);
    }

    for (const item of project.items) {
      const isSel = selection?.kind === 'item' && selection.id === item.id;
      group.add(buildPropMesh(item, isSel, fanSpinnersRef.current));
    }
  }, [project, rooms, selection, showCeiling, viewMode]);

  useEffect(() => {
    if (snapshotTrigger === 0) return;
    const renderer = rendererRef.current;
    if (!renderer) return;
    const url = renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title || 'interior-3d'}.png`;
    a.click();
  }, [snapshotTrigger, project.title]);

  const setCameraPreset = (preset: 'iso' | 'top' | 'living') => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    if (viewMode === 'walk') setViewMode('3d');
    const b = projectBounds(project);
    const cx = ((b.minX + b.maxX) / 2) * MM_TO_M;
    const cz = ((b.minY + b.maxY) / 2) * MM_TO_M;
    if (preset === 'top') {
      ctrl.target.set(cx, 0, cz);
      cam.position.set(cx, 15.5, cz + 0.01);
    } else if (preset === 'living') {
      const liv = rooms.find((r) => r.name.includes('거실')) ?? rooms[0];
      const lx = (liv?.centroid.x ?? 5.5) * MM_TO_M;
      const lz = (liv?.centroid.y ?? 5.5) * MM_TO_M;
      ctrl.target.set(lx, 1.1, lz - 1.5);
      cam.position.set(lx + 2.4, 2.1, lz + 2.6);
    } else {
      ctrl.target.set(cx, 0.8, cz);
      cam.position.set(cx + 6.5, 8.8, cz + 8.5);
    }
    ctrl.update();
  };

  return (
    <div className="relative w-full h-full bg-slate-100 select-none overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />

      <div className="absolute top-3 left-3 flex items-center gap-2 bg-white/95 backdrop-blur border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm text-xs text-slate-600">
        <span className="font-semibold text-slate-800">
          {viewMode === 'walk' ? '1인칭 워크스루' : '3D 실사 스튜디오'}
        </span>
        <span className="text-slate-300">|</span>
        <span>
          {viewMode === 'walk'
            ? 'WASD / 방향키 이동 · 화면 드래그 시선 회전'
            : '영역 클릭 시 좌측 자재 탭 자동 전환 · 가구 드래그 이동'}
        </span>
      </div>

      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur border border-slate-200 rounded-lg p-1 shadow-sm text-xs">
        <button
          onClick={() => setCameraPreset('iso')}
          className="px-2.5 py-1 rounded font-medium text-slate-700 hover:bg-slate-100"
        >
          전체 3D
        </button>
        <button
          onClick={() => setCameraPreset('top')}
          className="px-2.5 py-1 rounded font-medium text-slate-700 hover:bg-slate-100"
        >
          탑뷰
        </button>
        <button
          onClick={() => setCameraPreset('living')}
          className="px-2.5 py-1 rounded font-medium text-slate-700 hover:bg-slate-100"
        >
          거실 시선
        </button>
        <div className="w-px h-4 bg-slate-200 mx-0.5" />
        <button
          onClick={() => setShowCeiling(!showCeiling)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium ${
            showCeiling ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          {showCeiling ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          천장
        </button>
        <button
          onClick={() => setViewMode(viewMode === 'walk' ? '3d' : 'walk')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium ${
            viewMode === 'walk' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Footprints className="w-3.5 h-3.5" />
          {viewMode === 'walk' ? '워크스루 종료' : '1인칭 걷기'}
        </button>
      </div>

      {selection && selection.kind !== 'room' && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur border border-slate-200 rounded-lg p-1.5 shadow-sm">
          {selection.kind === 'item' && (
            <button
              onClick={() => rotateSelected(45)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded"
            >
              <RotateCw className="w-3.5 h-3.5" />
              회전
            </button>
          )}
          <button
            onClick={deleteSelected}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded"
          >
            <Trash2 className="w-3.5 h-3.5" />
            삭제
          </button>
        </div>
      )}
    </div>
  );
};
