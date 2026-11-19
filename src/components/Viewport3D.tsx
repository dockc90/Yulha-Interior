import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useStudioStore } from '../store/useStudioStore';
import { getMaterialById } from '../data/materials';
import { getThreeTexture } from '../utils/proceduralTextures';
import { KelvinTemp, Room, Wall } from '../types/interior';
import { Camera, Eye, EyeOff, Sun, Sunset, Moon } from 'lucide-react';

function kelvinToHex(k: KelvinTemp): number {
  if (k === '3000K') return 0xffc978;
  if (k === '4000K') return 0xfff1d6;
  return 0xf4f8ff;
}

export const Viewport3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const lightsRef = useRef<{
    ambient: THREE.AmbientLight;
    hemi: THREE.HemisphereLight;
    keyFill: THREE.DirectionalLight;
    rimFill: THREE.DirectionalLight;
  } | null>(null);
  const [lightingMood, setLightingMood] = useState<'day' | 'sunset' | 'night'>('day');

  const {
    plan,
    selection,
    editorTool,
    cameraPreset,
    showFurniture,
    showCeilingIn3D,
    syncMode,
    renderVersion3D,
    selectTarget,
    toggleDemolishWall,
    setShowCeilingIn3D,
    setCameraPreset,
  } = useStudioStore();

  // Store latest handlers in refs for raycaster click
  const stateRef = useRef({
    editorTool,
    selectTarget,
    toggleDemolishWall,
  });
  stateRef.current = { editorTool, selectTarget, toggleDemolishWall };

  // Initialize Three.js Scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f3f1);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      48,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      120
    );
    camera.position.set(14, 13, 15);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true, // Enables PNG snapshot export
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 1.5;
    controls.maxDistance = 35;
    controlsRef.current = controls;

    // Studio Gallery Lighting (soft 3-point bounce + soft shadows)
    const ambient = new THREE.AmbientLight(0xfffdf9, 0.58);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xffffff, 0xd6d3cd, 0.85);
    scene.add(hemi);

    const keyFill = new THREE.DirectionalLight(0xfffcf5, 0.52);
    keyFill.position.set(-10, 18, 12);
    keyFill.castShadow = true;
    keyFill.shadow.mapSize.width = 1024;
    keyFill.shadow.mapSize.height = 1024;
    keyFill.shadow.camera.near = 2;
    keyFill.shadow.camera.far = 45;
    keyFill.shadow.camera.left = -14;
    keyFill.shadow.camera.right = 14;
    keyFill.shadow.camera.top = 14;
    keyFill.shadow.camera.bottom = -14;
    keyFill.shadow.bias = -0.0005;
    scene.add(keyFill);

    const rimFill = new THREE.DirectionalLight(0xeef4ff, 0.28);
    rimFill.position.set(14, 10, -10);
    scene.add(rimFill);

    lightsRef.current = { ambient, hemi, keyFill, rimFill };

    // Subtle gallery ground grid
    const grid = new THREE.GridHelper(32, 32, 0xd8d6d0, 0xebeae6);
    grid.position.y = -0.025;
    scene.add(grid);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Raycaster for 3D clicking
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      downPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const hits = raycaster.intersectObjects(modelGroup.children, true);
      for (const hit of hits) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj && !obj.userData?.target) {
          obj = obj.parent;
        }
        if (obj?.userData?.target) {
          const target = obj.userData.target;
          if (
            stateRef.current.editorTool === 'demolish' &&
            target.kind === 'wall'
          ) {
            stateRef.current.toggleDemolishWall(target.id);
          } else {
            stateRef.current.selectTarget(target);
          }
          break;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Even studio background (sunlight simulation removed)

  // Camera Presets
  useEffect(() => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    const cx = plan.width / 2;
    const cz = plan.depth / 2;

    if (cameraPreset === 'iso') {
      cam.position.set(cx + 8, 12, cz + 11);
      ctrl.target.set(cx, 0.6, cz);
    } else if (cameraPreset === 'living') {
      const living = plan.rooms.find((r) => r.type === 'living') || plan.rooms[0];
      const lx =
        living.polygon.reduce((s, p) => s + p.x, 0) / living.polygon.length;
      const lz =
        living.polygon.reduce((s, p) => s + p.y, 0) / living.polygon.length;
      cam.position.set(lx + 2.5, 2.2, lz + 3.2);
      ctrl.target.set(lx, 1.0, lz);
    } else if (cameraPreset === 'kitchen') {
      const kit = plan.rooms.find((r) => r.type === 'kitchen') || plan.rooms[0];
      const kx = kit.polygon.reduce((s, p) => s + p.x, 0) / kit.polygon.length;
      const kz = kit.polygon.reduce((s, p) => s + p.y, 0) / kit.polygon.length;
      cam.position.set(kx - 2.2, 2.1, kz - 2.6);
      ctrl.target.set(kx, 0.9, kz);
    } else if (cameraPreset === 'master') {
      const m = plan.rooms.find((r) => r.type === 'master') || plan.rooms[0];
      const mx = m.polygon.reduce((s, p) => s + p.x, 0) / m.polygon.length;
      const mz = m.polygon.reduce((s, p) => s + p.y, 0) / m.polygon.length;
      cam.position.set(mx + 2.2, 2.1, mz + 2.4);
      ctrl.target.set(mx, 0.8, mz);
    } else if (cameraPreset === 'first_person') {
      const living = plan.rooms.find((r) => r.type === 'living') || plan.rooms[0];
      const lx =
        living.polygon.reduce((s, p) => s + p.x, 0) / living.polygon.length;
      const lz =
        living.polygon.reduce((s, p) => s + p.y, 0) / living.polygon.length;
      cam.position.set(lx - 1.2, 1.62, lz + 1.4);
      ctrl.target.set(lx + 1.5, 1.45, lz - 1.0);
    }
    ctrl.update();
  }, [cameraPreset, plan.id]);

  const lastRenderVerRef = useRef<number>(0);

  // Rebuild 3D Apartment Geometry whenever Plan / Selection / Toggles change
  useEffect(() => {
    const group = modelGroupRef.current;
    if (!group) return;
    if (
      syncMode === 'manual' &&
      lastRenderVerRef.current === renderVersion3D &&
      group.children.length > 0
    ) {
      return;
    }
    lastRenderVerRef.current = renderVersion3D;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }

    // Center offset? We keep world coordinates [0..width, 0..depth] directly so 2D & 3D match 1:1!
    // 1. Rooms (Floors + Optional Ceilings / 우물천장)
    plan.rooms.forEach((room: Room) => {
      const xs = room.polygon.map((p) => p.x);
      const zs = room.polygon.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minZ = Math.min(...zs);
      const maxZ = Math.max(...zs);
      const rw = maxX - minX;
      const rd = maxZ - minZ;

      const floorMatData = getMaterialById(room.floorMaterialId);
      const tex = getThreeTexture(
        floorMatData,
        Math.max(1, rw / 1.6),
        Math.max(1, rd / 1.6),
        room.floorDirection || 'horizontal'
      );

      const isSelected =
        selection?.kind === 'room' && selection.id === room.id;

      const shape = new THREE.Shape();
      room.polygon.forEach((p, i) => {
        if (i === 0) shape.moveTo(p.x, p.y);
        else shape.lineTo(p.x, p.y);
      });
      shape.closePath();

      const floorGeo = new THREE.ShapeGeometry(shape);
      floorGeo.rotateX(Math.PI / 2);

      const floorMat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: floorMatData.roughness,
        metalness: floorMatData.metalness || 0.05,
        emissive: isSelected ? new THREE.Color(0x0284c7) : new THREE.Color(0x000000),
        emissiveIntensity: isSelected ? 0.18 : 0,
        side: THREE.DoubleSide,
      });

      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.receiveShadow = true;
      floorMesh.userData = { target: { kind: 'room', id: room.id } };
      group.add(floorMesh);

      // Ceiling & 우물천장
      if (showCeilingIn3D || cameraPreset === 'first_person') {
        const ceilMatData = getMaterialById(room.ceilingMaterialId);
        const ceilTex = getThreeTexture(ceilMatData, rw / 2, rd / 2);
        const ceilMat = new THREE.MeshStandardMaterial({
          map: ceilTex,
          roughness: ceilMatData.roughness,
          side: THREE.DoubleSide,
        });

        const cx = (minX + maxX) / 2;
        const cz = (minZ + maxZ) / 2;

        if (room.ceilingType === 'flat' || rw < 2 || rd < 2) {
          const cGeo = new THREE.PlaneGeometry(rw, rd);
          cGeo.rotateX(Math.PI / 2);
          const cMesh = new THREE.Mesh(cGeo, ceilMat);
          cMesh.position.set(cx, 2.4, cz);
          cMesh.userData = { target: { kind: 'ceiling', roomId: room.id } };
          group.add(cMesh);
        } else {
          // Recessed 우물천장 (Well ceiling) with T5 indirect glow!
          const margin = 0.55;
          const outerShape = new THREE.Shape();
          outerShape.moveTo(-rw / 2, -rd / 2);
          outerShape.lineTo(rw / 2, -rd / 2);
          outerShape.lineTo(rw / 2, rd / 2);
          outerShape.lineTo(-rw / 2, rd / 2);
          outerShape.closePath();

          const iw = rw - margin * 2;
          const id = rd - margin * 2;
          const hole = new THREE.Path();
          if (room.ceilingType === 'well_round') {
            const r = Math.min(0.45, iw * 0.2, id * 0.2);
            hole.moveTo(-iw / 2 + r, -id / 2);
            hole.lineTo(iw / 2 - r, -id / 2);
            hole.quadraticCurveTo(iw / 2, -id / 2, iw / 2, -id / 2 + r);
            hole.lineTo(iw / 2, id / 2 - r);
            hole.quadraticCurveTo(iw / 2, id / 2, iw / 2 - r, id / 2);
            hole.lineTo(-iw / 2 + r, id / 2);
            hole.quadraticCurveTo(-iw / 2, id / 2, -iw / 2, id / 2 - r);
            hole.lineTo(-iw / 2, -id / 2 + r);
            hole.quadraticCurveTo(-iw / 2, -id / 2, -iw / 2 + r, -id / 2);
          } else {
            hole.moveTo(-iw / 2, -id / 2);
            hole.lineTo(iw / 2, -id / 2);
            hole.lineTo(iw / 2, id / 2);
            hole.lineTo(-iw / 2, id / 2);
            hole.closePath();
          }
          outerShape.holes.push(hole);

          const soffitGeo = new THREE.ShapeGeometry(outerShape);
          soffitGeo.rotateX(Math.PI / 2);
          const soffitMesh = new THREE.Mesh(soffitGeo, ceilMat);
          soffitMesh.position.set(cx, 2.4, cz);
          soffitMesh.userData = { target: { kind: 'ceiling', roomId: room.id } };
          group.add(soffitMesh);

          // Upper recessed well cap
          const wellCapGeo = new THREE.PlaneGeometry(iw + 0.1, id + 0.1);
          wellCapGeo.rotateX(Math.PI / 2);
          const wellCapMesh = new THREE.Mesh(wellCapGeo, ceilMat);
          wellCapMesh.position.set(cx, 2.56, cz);
          wellCapMesh.userData = { target: { kind: 'ceiling', roomId: room.id } };
          group.add(wellCapMesh);

          // T5 Indirect LED Glow Strip
          if (room.indirectLightOn) {
            const glowColor = kelvinToHex(room.indirectLightColor);
            const stripMat = new THREE.MeshBasicMaterial({
              color: glowColor,
            });
            const stripThick = 0.04;
            const s1 = new THREE.Mesh(
              new THREE.BoxGeometry(iw, stripThick, stripThick),
              stripMat
            );
            s1.position.set(cx, 2.46, cz - id / 2);
            const s2 = s1.clone();
            s2.position.set(cx, 2.46, cz + id / 2);
            const s3 = new THREE.Mesh(
              new THREE.BoxGeometry(stripThick, stripThick, id),
              stripMat
            );
            s3.position.set(cx - iw / 2, 2.46, cz);
            const s4 = s3.clone();
            s4.position.set(cx + iw / 2, 2.46, cz);
            group.add(s1, s2, s3, s4);
          }
        }
      }
    });

    // 2. Walls & Openings
    plan.walls.forEach((wall: Wall) => {
      if (wall.demolished) return;

      const dx = wall.x2 - wall.x1;
      const dz = wall.y2 - wall.y1;
      const len = Math.hypot(dx, dz);
      if (len < 0.05) return;

      const angle = Math.atan2(dz, dx);
      const wallGroup = new THREE.Group();
      wallGroup.position.set(wall.x1, 0, wall.y1);
      wallGroup.rotation.y = -angle;

      const isWallSel = selection?.kind === 'wall' && selection.id === wall.id;
      const frontMatData = getMaterialById(wall.frontMaterialId);
      const backMatData = getMaterialById(wall.backMaterialId);

      const frontTex = getThreeTexture(frontMatData, Math.max(1, len / 1.5), 1.5);
      const backTex = getThreeTexture(backMatData, Math.max(1, len / 1.5), 1.5);

      const sideMat = new THREE.MeshStandardMaterial({
        color: isWallSel ? 0x38bdf8 : 0xd4d4d8,
        roughness: 0.75,
      });

      const topCapMat = new THREE.MeshStandardMaterial({
        color: isWallSel ? 0x2383e2 : 0x252a33,
        roughness: 0.65,
      });

      const baseboardMat = new THREE.MeshStandardMaterial({
        color: 0xf4f4f2,
        roughness: 0.5,
      });

      const makeWallMat = (tex: THREE.CanvasTexture, rough: number) =>
        new THREE.MeshStandardMaterial({
          map: tex,
          roughness: rough,
          emissive: isWallSel ? new THREE.Color(0x0284c7) : new THREE.Color(0x000000),
          emissiveIntensity: isWallSel ? 0.22 : 0,
        });

      const fMat = makeWallMat(frontTex, frontMatData.roughness);
      const bMat = makeWallMat(backTex, backMatData.roughness);

      // Sort openings along wall
      const sortedOps = [...wall.openings].sort((a, b) => a.offset - b.offset);

      const addWallBox = (
        xStart: number,
        xEnd: number,
        yBottom: number,
        yTop: number
      ) => {
        const w = xEnd - xStart;
        const h = yTop - yBottom;
        if (w <= 0.01 || h <= 0.01) return;
        const geo = new THREE.BoxGeometry(w, h, wall.thickness);
        // BoxGeometry face order: +x, -x, +y (top cap), -y, +z (front), -z (back)
        const useTopCap = yTop >= wall.height - 0.05;
        const mats = [sideMat, sideMat, useTopCap ? topCapMat : sideMat, sideMat, fMat, bMat];
        const mesh = new THREE.Mesh(geo, mats);
        mesh.position.set(xStart + w / 2, yBottom + h / 2, 0);
        mesh.userData = { target: { kind: 'wall', id: wall.id } };
        wallGroup.add(mesh);

        // Sleek 7cm baseboard molding on ground-touching walls
        if (yBottom <= 0.01) {
          const bb = new THREE.Mesh(
            new THREE.BoxGeometry(w, 0.07, wall.thickness + 0.012),
            baseboardMat
          );
          bb.position.set(xStart + w / 2, 0.035, 0);
          wallGroup.add(bb);
        }
      };

      let cursor = 0;
      sortedOps.forEach((op) => {
        const center = op.offset * len;
        const opStart = Math.max(cursor, center - op.width / 2);
        const opEnd = Math.min(len, center + op.width / 2);

        // Solid wall before opening
        addWallBox(cursor, opStart, 0, wall.height);

        // Sill below window
        if (op.sillHeight > 0.01) {
          addWallBox(opStart, opEnd, 0, op.sillHeight);
        }
        // Lintel above opening
        if (op.sillHeight + op.height < wall.height - 0.01) {
          addWallBox(opStart, opEnd, op.sillHeight + op.height, wall.height);
        }

        // Opening Frame & Glass/Door Panel
        const frameMatData = getMaterialById(op.frameMaterialId);
        const frameTex = getThreeTexture(frameMatData, 1, 1);
        const isOpSel =
          selection?.kind === 'opening' && selection.openingId === op.id;

        const frameMat = new THREE.MeshStandardMaterial({
          map: frameTex,
          roughness: frameMatData.roughness,
          emissive: isOpSel ? new THREE.Color(0x0284c7) : new THREE.Color(0x000000),
          emissiveIntensity: isOpSel ? 0.3 : 0,
        });

        const opW = opEnd - opStart;
        const opCx = (opStart + opEnd) / 2;
        const opCy = op.sillHeight + op.height / 2;
        const frameDepth = wall.thickness + 0.03;

        // Frame border (top, left, right)
        const fThick = 0.05;
        const topBar = new THREE.Mesh(
          new THREE.BoxGeometry(opW, fThick, frameDepth),
          frameMat
        );
        topBar.position.set(opCx, op.sillHeight + op.height - fThick / 2, 0);

        const leftBar = new THREE.Mesh(
          new THREE.BoxGeometry(fThick, op.height, frameDepth),
          frameMat
        );
        leftBar.position.set(opStart + fThick / 2, opCy, 0);

        const rightBar = new THREE.Mesh(
          new THREE.BoxGeometry(fThick, op.height, frameDepth),
          frameMat
        );
        rightBar.position.set(opEnd - fThick / 2, opCy, 0);

        [topBar, leftBar, rightBar].forEach((m) => {
          m.userData = {
            target: { kind: 'opening', wallId: wall.id, openingId: op.id },
          };
          wallGroup.add(m);
        });

        if (op.type === 'window') {
          const glassMat = new THREE.MeshStandardMaterial({
            color: 0xbae6fd,
            transparent: true,
            opacity: 0.28,
            roughness: 0.08,
            metalness: 0.2,
          });
          const glass = new THREE.Mesh(
            new THREE.BoxGeometry(opW - fThick * 2, op.height - fThick * 2, 0.02),
            glassMat
          );
          glass.position.set(opCx, opCy, 0);
          glass.userData = {
            target: { kind: 'opening', wallId: wall.id, openingId: op.id },
          };
          wallGroup.add(glass);

          // Center mullion + Wood Venetian Blinds on large living room windows
          if (opW >= 1.8) {
            const mullion = new THREE.Mesh(
              new THREE.BoxGeometry(0.035, op.height - fThick * 2, frameDepth * 0.8),
              frameMat
            );
            mullion.position.set(opCx, opCy, 0);
            wallGroup.add(mullion);

            const blindMat = new THREE.MeshStandardMaterial({ color: 0xa67c52, roughness: 0.65 });
            const blindTop = op.sillHeight + op.height - fThick - 0.06;
            for (let b = 0; b < 7; b++) {
              const slat = new THREE.Mesh(
                new THREE.BoxGeometry(opW - fThick * 2.4, 0.012, 0.035),
                blindMat
              );
              slat.position.set(opCx, blindTop - b * 0.08, 0.01);
              slat.rotation.x = 0.25;
              wallGroup.add(slat);
            }
          }
        } else if (op.type === 'door' || op.type === 'entrance') {
          const doorLeaf = new THREE.Mesh(
            new THREE.BoxGeometry(opW - fThick * 2, op.height - fThick, 0.04),
            frameMat
          );
          doorLeaf.position.set(opCx, opCy - fThick / 2, 0);
          doorLeaf.castShadow = true;
          doorLeaf.userData = {
            target: { kind: 'opening', wallId: wall.id, openingId: op.id },
          };
          wallGroup.add(doorLeaf);
        } else if (op.type === 'sliding_door') {
          const glassMat = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0,
            transparent: true,
            opacity: 0.45,
            roughness: 0.15,
          });
          const panel = new THREE.Mesh(
            new THREE.BoxGeometry(opW - fThick * 2, op.height - fThick, 0.03),
            glassMat
          );
          panel.position.set(opCx, opCy - fThick / 2, 0);
          panel.userData = {
            target: { kind: 'opening', wallId: wall.id, openingId: op.id },
          };
          wallGroup.add(panel);
        }

        cursor = opEnd;
      });

      addWallBox(cursor, len, 0, wall.height);
      group.add(wallGroup);
    });

    // 3. Lights
    plan.lights.forEach((lt) => {
      const lGroup = new THREE.Group();
      lGroup.position.set(lt.x, 2.38, lt.y);
      const colorHex = kelvinToHex(lt.kelvin);

      if (lt.type === 'ceiling_fan') {
        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.13, 0.13, 0.16, 20),
          new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.35, metalness: 0.3 })
        );
        lGroup.add(hub);
        const walnutMat = new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.45 });
        for (let i = 0; i < 3; i++) {
          const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.62, 0.018, 0.13),
            walnutMat
          );
          const a = (i * Math.PI * 2) / 3;
          blade.position.set(Math.cos(a) * 0.36, -0.03, Math.sin(a) * 0.36);
          blade.rotation.y = -a;
          lGroup.add(blade);
        }
      } else if (lt.type === 'pendant') {
        const cord = new THREE.Mesh(
          new THREE.CylinderGeometry(0.01, 0.01, 0.65, 8),
          new THREE.MeshStandardMaterial({ color: 0x1e293b })
        );
        cord.position.y = -0.32;
        const shade = new THREE.Mesh(
          new THREE.ConeGeometry(0.22, 0.18, 20, 1, true),
          new THREE.MeshStandardMaterial({
            color: 0xf1f5f9,
            side: THREE.DoubleSide,
          })
        );
        shade.position.y = -0.65;
        lGroup.add(cord, shade);
      } else {
        const bulb = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16),
          new THREE.MeshBasicMaterial({
            color: lt.on ? colorHex : 0x64748b,
          })
        );
        lGroup.add(bulb);
      }

      if (lt.on) {
        const ptLight = new THREE.PointLight(colorHex, 0.9, 7.5, 1.6);
        ptLight.position.y = lt.type === 'pendant' ? -0.75 : -0.15;
        lGroup.add(ptLight);
      }

      lGroup.userData = { target: { kind: 'light', id: lt.id } };
      group.add(lGroup);
    });

    // 4. Furniture (bespoke multi-part studio models + soft contact shadow)
    if (showFurniture) {
      const contactShadowMat = new THREE.MeshBasicMaterial({
        color: 0x0f172a,
        transparent: true,
        opacity: 0.11,
        depthWrite: false,
      });

      plan.furniture.forEach((f) => {
        const fGroup = new THREE.Group();
        fGroup.position.set(f.x, 0, f.y);
        fGroup.rotation.y = -f.rotation;

        const isSel = selection?.kind === 'furniture' && selection.id === f.id;
        const baseMat = new THREE.MeshStandardMaterial({
          color: f.color,
          roughness: 0.65,
          emissive: isSel ? new THREE.Color(0x0284c7) : new THREE.Color(0x000000),
          emissiveIntensity: isSel ? 0.25 : 0,
        });

        // Grounding contact shadow under furniture
        if (f.category !== 'shower') {
          const cs = new THREE.Mesh(
            new THREE.PlaneGeometry(f.width * 1.06, f.depth * 1.06),
            contactShadowMat
          );
          cs.rotation.x = -Math.PI / 2;
          cs.position.y = 0.008;
          fGroup.add(cs);
        }

        if (f.category === 'sofa') {
          const isWide = f.width >= f.depth;
          const legMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4, metalness: 0.5 });
          const plinth = new THREE.Mesh(new THREE.BoxGeometry(f.width * 0.96, 0.08, f.depth * 0.94), legMat);
          plinth.position.y = 0.06;
          const seat = new THREE.Mesh(new THREE.BoxGeometry(f.width, 0.28, f.depth), baseMat);
          seat.position.y = 0.24;
          const back = new THREE.Mesh(
            new THREE.BoxGeometry(isWide ? f.width : 0.22, f.height * 0.62, isWide ? 0.22 : f.depth),
            baseMat
          );
          back.position.set(isWide ? 0 : -f.width / 2 + 0.11, 0.52, isWide ? -f.depth / 2 + 0.11 : 0);
          // Angled headrest bolster
          const headrest = new THREE.Mesh(
            new THREE.BoxGeometry(isWide ? f.width * 0.92 : 0.16, 0.18, isWide ? 0.16 : f.depth * 0.92),
            baseMat
          );
          headrest.position.set(isWide ? 0 : -f.width / 2 + 0.13, 0.82, isWide ? -f.depth / 2 + 0.13 : 0);
          // Armrests
          const arm1 = new THREE.Mesh(
            new THREE.BoxGeometry(isWide ? 0.18 : f.width * 0.85, 0.22, isWide ? f.depth * 0.85 : 0.18),
            baseMat
          );
          arm1.position.set(isWide ? -f.width / 2 + 0.09 : 0, 0.44, isWide ? 0 : -f.depth / 2 + 0.09);
          const arm2 = arm1.clone();
          arm2.position.set(isWide ? f.width / 2 - 0.09 : 0, 0.44, isWide ? 0 : f.depth / 2 - 0.09);
          // Sage-green accent cushions
          const cushionMat = new THREE.MeshStandardMaterial({ color: 0x849b87, roughness: 0.82 });
          const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.11), cushionMat);
          p1.position.set(isWide ? -f.width * 0.28 : -f.width * 0.22, 0.48, isWide ? -f.depth * 0.2 : -f.depth * 0.28);
          p1.rotation.x = 0.22;
          const p2 = p1.clone();
          p2.position.set(isWide ? f.width * 0.28 : -f.width * 0.22, 0.48, isWide ? -f.depth * 0.2 : f.depth * 0.28);
          // Matching Ottoman
          const otto = new THREE.Mesh(
            new THREE.BoxGeometry(isWide ? 0.78 : 0.62, 0.32, isWide ? 0.62 : 0.78),
            baseMat
          );
          otto.position.set(isWide ? 0 : f.width / 2 + 0.65, 0.18, isWide ? f.depth / 2 + 0.65 : 0);
          fGroup.add(plinth, seat, back, headrest, arm1, arm2, p1, p2, otto);
        } else if (f.category === 'tv_stand') {
          const consoleMesh = new THREE.Mesh(
            new THREE.BoxGeometry(f.width, 0.34, f.depth),
            new THREE.MeshStandardMaterial({ color: 0xe7e2da, roughness: 0.55 })
          );
          consoleMesh.position.y = 0.19;
          // Wall-mounted large OLED TV above console
          const tvBezel = new THREE.Mesh(
            new THREE.BoxGeometry(f.width * 0.88, 0.96, 0.035),
            new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.25, metalness: 0.5 })
          );
          tvBezel.position.set(0, 1.32, -f.depth * 0.25);
          const tvScreen = new THREE.Mesh(
            new THREE.PlaneGeometry(f.width * 0.85, 0.91),
            new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8, emissiveIntensity: 0.28, roughness: 0.15 })
          );
          tvScreen.position.set(0, 1.32, -f.depth * 0.25 + 0.019);
          fGroup.add(consoleMesh, tvBezel, tvScreen);
        } else if (f.category === 'bed') {
          const frameMat = new THREE.MeshStandardMaterial({ color: 0x8b7b6b, roughness: 0.72 });
          const frame = new THREE.Mesh(new THREE.BoxGeometry(f.width, 0.22, f.depth), frameMat);
          frame.position.y = 0.14;
          const mattress = new THREE.Mesh(
            new THREE.BoxGeometry(f.width * 0.94, 0.24, f.depth * 0.94),
            new THREE.MeshStandardMaterial({ color: 0xf8f7f4, roughness: 0.85 })
          );
          mattress.position.y = 0.35;
          const duvet = new THREE.Mesh(
            new THREE.BoxGeometry(f.width * 0.96, 0.08, f.depth * 0.62),
            new THREE.MeshStandardMaterial({ color: 0xd6cfc4, roughness: 0.88 })
          );
          duvet.position.set(0, 0.46, f.depth * 0.16);
          const headboard = new THREE.Mesh(
            new THREE.BoxGeometry(f.width * 1.02, 1.02, 0.12),
            new THREE.MeshStandardMaterial({ color: 0x6e6256, roughness: 0.7 })
          );
          headboard.position.set(0, 0.51, -f.depth / 2 + 0.06);
          const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
          const pil1 = new THREE.Mesh(new THREE.BoxGeometry(f.width * 0.36, 0.11, 0.38), pillowMat);
          pil1.position.set(-f.width * 0.22, 0.51, -f.depth * 0.32);
          const pil2 = pil1.clone();
          pil2.position.x = f.width * 0.22;
          fGroup.add(frame, mattress, duvet, headboard, pil1, pil2);
        } else if (f.category === 'dining') {
          const top = new THREE.Mesh(
            new THREE.BoxGeometry(f.width, 0.045, f.depth),
            new THREE.MeshStandardMaterial({ color: 0xd6bfa6, roughness: 0.42 })
          );
          top.position.y = f.height;
          const legMat = new THREE.MeshStandardMaterial({ color: 0xb08d6a, roughness: 0.5 });
          [-f.width * 0.42, f.width * 0.42].forEach((lx) => {
            [-f.depth * 0.38, f.depth * 0.38].forEach((lz) => {
              const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.02, f.height, 12), legMat);
              leg.position.set(lx, f.height / 2, lz);
              fGroup.add(leg);
            });
          });
          // Glass vase + greenery centerpiece
          const vase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.06, 0.16, 12),
            new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.65, roughness: 0.1 })
          );
          vase.position.y = f.height + 0.1;
          const plant = new THREE.Mesh(
            new THREE.SphereGeometry(0.09, 10, 10),
            new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.85 })
          );
          plant.position.y = f.height + 0.22;
          fGroup.add(vase, plant);
          // 4 upholstered cream fabric dining chairs
          const chairMat = new THREE.MeshStandardMaterial({ color: 0xf3ede2, roughness: 0.78 });
          [-f.width * 0.26, f.width * 0.26].forEach((cx) => {
            [-1, 1].forEach((side) => {
              const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.4), chairMat);
              seat.position.set(cx, 0.45, side * (f.depth * 0.54));
              const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.05), chairMat);
              back.position.set(cx, 0.66, side * (f.depth * 0.72));
              fGroup.add(seat, back);
            });
          });
          fGroup.add(top);
        } else if (f.category === 'kitchen_counter' || f.category === 'island') {
          const body = new THREE.Mesh(
            new THREE.BoxGeometry(f.width, f.height - 0.04, f.depth),
            new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.55 })
          );
          body.position.y = (f.height - 0.04) / 2;
          const stoneTop = new THREE.Mesh(
            new THREE.BoxGeometry(f.width + 0.02, 0.04, f.depth + 0.02),
            new THREE.MeshStandardMaterial({ color: 0xfafaf9, roughness: 0.22 })
          );
          stoneTop.position.y = f.height - 0.02;
          // Toe-kick warm indirect LED glow
          const toeGlow = new THREE.Mesh(
            new THREE.BoxGeometry(f.width * 0.96, 0.03, f.depth * 0.94),
            new THREE.MeshBasicMaterial({ color: 0xfde68a })
          );
          toeGlow.position.y = 0.02;
          fGroup.add(body, stoneTop, toeGlow);
          if (f.category === 'kitchen_counter' && f.width > 1.2) {
            const sink = new THREE.Mesh(
              new THREE.BoxGeometry(0.55, 0.02, 0.42),
              new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.75, roughness: 0.25 })
            );
            sink.position.set(-f.width * 0.22, f.height + 0.005, 0);
            const faucet = new THREE.Mesh(
              new THREE.CylinderGeometry(0.015, 0.018, 0.24, 10),
              new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.15 })
            );
            faucet.position.set(-f.width * 0.22, f.height + 0.12, -f.depth * 0.24);
            const induction = new THREE.Mesh(
              new THREE.BoxGeometry(0.58, 0.015, 0.46),
              new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.15, metalness: 0.2 })
            );
            induction.position.set(f.width * 0.24, f.height + 0.005, 0);
            // Upper wall cabinets + warm under-cabinet LED strip
            const upperCab = new THREE.Mesh(
              new THREE.BoxGeometry(f.width, 0.68, f.depth * 0.58),
              new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.5 })
            );
            upperCab.position.set(0, 2.04, -f.depth * 0.2);
            const underLed = new THREE.Mesh(
              new THREE.BoxGeometry(f.width * 0.96, 0.015, 0.03),
              new THREE.MeshBasicMaterial({ color: 0xfef08a })
            );
            underLed.position.set(0, 1.69, -f.depth * 0.05);
            fGroup.add(sink, faucet, induction, upperCab, underLed);
          }
        } else if (f.category === 'toilet') {
          const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.18 });
          const tank = new THREE.Mesh(
            new THREE.BoxGeometry(f.width, 0.72, f.depth * 0.34),
            ceramicMat
          );
          tank.position.set(0, 0.36, -f.depth * 0.33);
          const bowl = new THREE.Mesh(
            new THREE.CylinderGeometry(f.width * 0.42, f.width * 0.34, 0.4, 20),
            ceramicMat
          );
          bowl.position.set(0, 0.2, f.depth * 0.14);
          fGroup.add(tank, bowl);
        } else if (f.category === 'vanity') {
          const cabinet = new THREE.Mesh(
            new THREE.BoxGeometry(f.width, 0.8, f.depth),
            new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35 })
          );
          cabinet.position.y = 0.4;
          const basin = new THREE.Mesh(
            new THREE.CylinderGeometry(f.width * 0.32, f.width * 0.28, 0.08, 20),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 })
          );
          basin.position.y = 0.82;
          fGroup.add(cabinet, basin);
        } else if (f.category === 'shower') {
          const glassMat = new THREE.MeshStandardMaterial({
            color: 0xdbeafe,
            transparent: true,
            opacity: 0.26,
            roughness: 0.08,
            metalness: 0.15,
          });
          const booth = new THREE.Mesh(
            new THREE.BoxGeometry(f.width, f.height, f.depth),
            glassMat
          );
          booth.position.y = f.height / 2;
          fGroup.add(booth);
        } else if (f.category === 'bathtub') {
          const tubMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.18 });
          const tub = new THREE.Mesh(
            new THREE.BoxGeometry(f.width, f.height, f.depth),
            tubMat
          );
          tub.position.y = f.height / 2;
          const inner = new THREE.Mesh(
            new THREE.BoxGeometry(f.width * 0.86, 0.05, f.depth * 0.78),
            new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2 })
          );
          inner.position.y = f.height - 0.02;
          fGroup.add(tub, inner);
        } else if (f.category === 'fridge_cabinet') {
          // 4도어 키친핏 냉장고 + 상부장 + 블랙 틈새 라인 (첨부 이미지 스타일)
          const doorColor = f.materialId ? getMaterialById(f.materialId).baseColor : f.color || '#F5F3EE';
          const cabMat = new THREE.MeshStandardMaterial({ color: doorColor, roughness: 0.3 });
          const gapMat = new THREE.MeshStandardMaterial({ color: 0x1a1c1f, roughness: 0.5 });

          const body = new THREE.Mesh(new THREE.BoxGeometry(f.width, f.height, f.depth), gapMat);
          body.position.y = f.height / 2;
          body.castShadow = true;

          // Upper storage cabinet
          const upper = new THREE.Mesh(
            new THREE.BoxGeometry(f.width - 0.02, 0.42, f.depth + 0.01),
            cabMat
          );
          upper.position.set(0, f.height - 0.22, 0.005);

          // 4 doors (2 top, 2 bottom)
          const doorW = (f.width - 0.05) / 2;
          const topH = (f.height - 0.52) * 0.58;
          const botH = (f.height - 0.52) * 0.4;
          [-1, 1].forEach((side) => {
            const topDoor = new THREE.Mesh(
              new THREE.BoxGeometry(doorW, topH, 0.03),
              cabMat
            );
            topDoor.position.set(side * (doorW / 2 + 0.008), f.height - 0.46 - topH / 2, f.depth / 2 + 0.006);
            const botDoor = new THREE.Mesh(
              new THREE.BoxGeometry(doorW, botH, 0.03),
              cabMat
            );
            botDoor.position.set(side * (doorW / 2 + 0.008), botH / 2 + 0.03, f.depth / 2 + 0.006);
            fGroup.add(topDoor, botDoor);
          });
          fGroup.add(body, upper);
        } else if (f.category === 'tall_cabinet') {
          // 첨부 이미지 3(1번 오픈장+홈바) vs 4(2번 와이드 홈바) 옵션 3D 모델!
          const doorColor = f.materialId ? getMaterialById(f.materialId).baseColor : '#F3EFEA';
          const cabMat = new THREE.MeshStandardMaterial({ color: doorColor, roughness: 0.4 });
          const woodMat = new THREE.MeshStandardMaterial({ color: 0xb68655, roughness: 0.55 });
          const frameMat = new THREE.MeshStandardMaterial({ color: 0x2b2d30, roughness: 0.4 });
          const ledMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });

          const base = new THREE.Mesh(new THREE.BoxGeometry(f.width, f.height, f.depth), cabMat);
          base.position.y = f.height / 2;
          base.castShadow = true;
          fGroup.add(base);

          if (f.variant === 'option1') {
            // 좌측 오픈 장식장 + 우측 우드 홈바 니치장
            const niche = new THREE.Mesh(
              new THREE.BoxGeometry(f.width * 0.45, 0.72, 0.08),
              woodMat
            );
            niche.position.set(f.width * 0.22, 1.35, f.depth / 2 - 0.02);
            const ledStrip = new THREE.Mesh(
              new THREE.BoxGeometry(f.width * 0.42, 0.015, 0.03),
              ledMat
            );
            ledStrip.position.set(f.width * 0.22, 1.69, f.depth / 2);
            const glassShelf = new THREE.Mesh(
              new THREE.BoxGeometry(f.width * 0.42, 1.75, 0.05),
              frameMat
            );
            glassShelf.position.set(-f.width * 0.24, 1.05, f.depth / 2 - 0.01);
            fGroup.add(niche, ledStrip, glassShelf);
          } else {
            // 2번: 와이드 우드 홈바 니치장 + 간접등
            const niche = new THREE.Mesh(
              new THREE.BoxGeometry(f.width * 0.9, 0.78, 0.08),
              woodMat
            );
            niche.position.set(0, 1.32, f.depth / 2 - 0.02);
            const ledStrip = new THREE.Mesh(
              new THREE.BoxGeometry(f.width * 0.86, 0.015, 0.03),
              ledMat
            );
            ledStrip.position.set(0, 1.69, f.depth / 2);
            fGroup.add(niche, ledStrip);
          }
        } else if (f.category === 'induction') {
          const glassMat = new THREE.MeshStandardMaterial({
            color: f.materialId ? getMaterialById(f.materialId).baseColor : 0x16181d,
            roughness: 0.12,
            metalness: 0.25,
          });
          const plate = new THREE.Mesh(new THREE.BoxGeometry(f.width, 0.03, f.depth), glassMat);
          plate.position.y = 0.015;
          fGroup.add(plate);
          // 3 burner rings
          [-f.width * 0.24, 0.08, f.width * 0.26].forEach((bx, bi) => {
            const ring = new THREE.Mesh(
              new THREE.RingGeometry(0.055, 0.068, 24),
              new THREE.MeshBasicMaterial({ color: 0x9ca3af, side: THREE.DoubleSide })
            );
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(bx, 0.032, bi === 1 ? -0.1 : 0.08);
            fGroup.add(ring);
          });
        } else {
          const box = new THREE.Mesh(
            new THREE.BoxGeometry(f.width, f.height, f.depth),
            baseMat
          );
          box.position.y = f.height / 2;
          fGroup.add(box);
        }

        fGroup.userData = { target: { kind: 'furniture', id: f.id } };
        group.add(fGroup);
      });
    }

    // 5. Wall Fixtures (콘센트 · 스위치 · 월패드 · 반매립 TV)
    (plan.fixtures || []).forEach((fix) => {
      const wall = plan.walls.find((w) => w.id === fix.wallId && !w.demolished);
      if (!wall) return;
      const dx = wall.x2 - wall.x1;
      const dy = wall.y2 - wall.y1;
      const len = Math.hypot(dx, dy);
      if (len < 0.1) return;
      const angle = Math.atan2(dy, dx);
      const wx = wall.x1 + dx * fix.offset;
      const wz = wall.y1 + dy * fix.offset;
      const nx = -dy / len;
      const nz = dx / len;
      const sign = fix.side === 'back' ? -1 : 1;
      const offsetDist = wall.thickness / 2 + 0.008;

      const fixMat = getMaterialById(fix.materialId || 'el-legrand-white');
      const isSelected = selection?.kind === 'fixture' && selection.id === fix.id;

      const fxGroup = new THREE.Group();
      fxGroup.position.set(wx + nx * offsetDist * sign, fix.elevation, wz + nz * offsetDist * sign);
      fxGroup.rotation.y = -angle + (sign < 0 ? Math.PI : 0);

      const plateMat = new THREE.MeshStandardMaterial({
        color: isSelected ? '#2383E2' : fixMat.baseColor,
        roughness: fixMat.roughness,
        metalness: fixMat.metalness ?? 0.1,
      });

      if (fix.type === 'wall_tv') {
        const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.94, 0.03), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3 }));
        const screen = new THREE.Mesh(
          new THREE.BoxGeometry(1.59, 0.88, 0.01),
          new THREE.MeshStandardMaterial({ color: 0x1e3a5f, emissive: 0x1e3a5f, emissiveIntensity: 0.35, roughness: 0.15 })
        );
        screen.position.z = 0.015;
        fxGroup.add(bezel, screen);
      } else if (fix.type === 'wallpad') {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.018), plateMat);
        const screen = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.14, 0.008),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x1e293b, emissiveIntensity: 0.4, roughness: 0.15 })
        );
        screen.position.z = 0.009;
        fxGroup.add(frame, screen);
      } else if (fix.type === 'switch_2') {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.125, 0.012), plateMat);
        const btn1 = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.055, 0.008), plateMat);
        btn1.position.set(-0.016, 0, 0.008);
        const btn2 = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.055, 0.008), plateMat);
        btn2.position.set(0.016, 0, 0.008);
        fxGroup.add(plate, btn1, btn2);
      } else {
        // outlet_2
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.012), plateMat);
        const sockMat = new THREE.MeshStandardMaterial({ color: fixMat.secondaryColor || '#D8D8D4', roughness: 0.4 });
        [-0.028, 0.028].forEach((sx) => {
          const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.01, 16), sockMat);
          sock.rotation.x = Math.PI / 2;
          sock.position.set(sx, 0, 0.005);
          fxGroup.add(sock);
        });
        fxGroup.add(plate);
      }

      fxGroup.userData = { target: { kind: 'fixture', id: fix.id } };
      group.add(fxGroup);
    });
  }, [plan, selection, showFurniture, showCeilingIn3D, cameraPreset, syncMode, renderVersion3D]);

  useEffect(() => {
    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    const lights = lightsRef.current;
    if (!scene || !renderer || !lights) return;

    if (lightingMood === 'day') {
      scene.background = new THREE.Color(0xf3f3f1);
      lights.ambient.color.setHex(0xfffdf9);
      lights.ambient.intensity = 0.58;
      lights.hemi.color.setHex(0xffffff);
      lights.hemi.groundColor.setHex(0xd6d3cd);
      lights.hemi.intensity = 0.85;
      lights.keyFill.color.setHex(0xfffcf5);
      lights.keyFill.intensity = 0.48;
      lights.rimFill.color.setHex(0xeef4ff);
      lights.rimFill.intensity = 0.28;
      renderer.toneMappingExposure = 1.05;
    } else if (lightingMood === 'sunset') {
      scene.background = new THREE.Color(0xefe6db);
      lights.ambient.color.setHex(0xffd8b0);
      lights.ambient.intensity = 0.45;
      lights.hemi.color.setHex(0xffdfb8);
      lights.hemi.groundColor.setHex(0xb89f8d);
      lights.hemi.intensity = 0.72;
      lights.keyFill.color.setHex(0xffb46b);
      lights.keyFill.intensity = 0.68;
      lights.rimFill.color.setHex(0xd6c8ff);
      lights.rimFill.intensity = 0.22;
      renderer.toneMappingExposure = 1.02;
    } else {
      scene.background = new THREE.Color(0x161b24);
      lights.ambient.color.setHex(0x4c5a78);
      lights.ambient.intensity = 0.28;
      lights.hemi.color.setHex(0x3a4863);
      lights.hemi.groundColor.setHex(0x1f2229);
      lights.hemi.intensity = 0.35;
      lights.keyFill.color.setHex(0x9bb5e8);
      lights.keyFill.intensity = 0.22;
      lights.rimFill.color.setHex(0x6c82ad);
      lights.rimFill.intensity = 0.18;
      renderer.toneMappingExposure = 0.92;
    }
  }, [lightingMood]);

  const handleScreenshot = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const dataUrl = renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${plan.complexName}_${plan.typeName}_3D.png`;
    a.click();
  };

  return (
    <div className="relative w-full h-full bg-[#F3F3F1] overflow-hidden">
      {/* Top-left 3D badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-[#E9E9E7] shadow-xs px-3 py-1.5 rounded-lg text-xs">
        <span className="w-2 h-2 rounded-full bg-[#0F7B6C]" />
        <span className="font-semibold text-[#37352F]">3D 실시간 모델</span>
        <span className="text-[#D3D1CB]">|</span>
        <span className="text-[#787774]">클릭해 바닥·벽·문틀·천장 자재 적용</span>
      </div>

      {/* Top-right 3D Camera & Lighting Quick Bar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-[#E9E9E7] shadow-xs p-1 rounded-lg">
        {(
          [
            ['iso', '전체뷰'],
            ['living', '거실'],
            ['kitchen', '주방'],
            ['master', '안방'],
            ['first_person', '1인칭'],
          ] as const
        ).map(([preset, label]) => (
          <button
            key={preset}
            onClick={() => setCameraPreset(preset)}
            className={`px-2 py-1 text-xs rounded-md transition ${
              cameraPreset === preset
                ? 'bg-[#EBF5FF] text-[#2383E2] font-semibold'
                : 'text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE]'
            }`}
          >
            {label}
          </button>
        ))}

        <div className="w-px h-4 bg-[#E9E9E7] mx-0.5" />

        {(
          [
            ['day', '주간', <Sun key="d" className="w-3.5 h-3.5" />],
            ['sunset', '노을', <Sunset key="s" className="w-3.5 h-3.5" />],
            ['night', '야간', <Moon key="n" className="w-3.5 h-3.5" />],
          ] as const
        ).map(([mood, label, icon]) => (
          <button
            key={mood}
            onClick={() => setLightingMood(mood)}
            title={`${label} 조명 분위기`}
            className={`px-1.5 py-1 text-xs rounded-md flex items-center gap-1 transition ${
              lightingMood === mood
                ? mood === 'night'
                  ? 'bg-[#1F2937] text-amber-300 font-semibold'
                  : mood === 'sunset'
                  ? 'bg-[#FAEBDD] text-[#D9730D] font-semibold'
                  : 'bg-[#FFF9DB] text-[#B45309] font-semibold'
                : 'text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE]'
            }`}
          >
            {icon}
            <span className="hidden xl:inline">{label}</span>
          </button>
        ))}

        <div className="w-px h-4 bg-[#E9E9E7] mx-0.5" />

        <button
          onClick={() => setShowCeilingIn3D(!showCeilingIn3D)}
          className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 transition ${
            showCeilingIn3D
              ? 'bg-[#FAEBDD] text-[#D9730D] font-semibold'
              : 'text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE]'
          }`}
          title="3D 우물천장 & 간접등 표시 토글"
        >
          {showCeilingIn3D ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
          <span>천장/우물</span>
        </button>

        <button
          onClick={handleScreenshot}
          className="p-1.5 text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE] rounded-md transition"
          title="3D 렌더 스냅샷 저장 (PNG)"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
};
