import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useProjectStore } from '../store/useProjectStore';
import { getMaterial } from '../data/catalog';
import { createTvScreenTexture, getMaterialBump, getMaterialMap } from '../utils/pbrTextures';
import { Camera, Eye, EyeOff, Sun, Sunset, Moon } from 'lucide-react';

function kelvinHex(k: '3000K' | '4000K' | '5700K') {
  if (k === '3000K') return 0xffcf87;
  if (k === '4000K') return 0xfff0d4;
  return 0xf3f7ff;
}

export const Studio3DViewport: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const worldRef = useRef<THREE.Group | null>(null);
  const fanRotorsRef = useRef<THREE.Group[]>([]);
  const lightsRef = useRef<{
    ambient: THREE.AmbientLight;
    hemi: THREE.HemisphereLight;
    key: THREE.DirectionalLight;
    rim: THREE.DirectionalLight;
  } | null>(null);
  const lastVerRef = useRef<number>(0);

  const {
    project,
    selection,
    showCeiling,
    lightingMood,
    cameraPreset,
    autoSync3D,
    render3DVersion,
    setSelection,
    setShowCeiling,
    setLightingMood,
    setCameraPreset,
  } = useProjectStore();

  const tvTexRef = useRef<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f3ef);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(46, el.clientWidth / Math.max(1, el.clientHeight), 0.1, 100);
    camera.position.set(11, 9.5, 14.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Realistic PBR studio reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.45;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI / 2 - 0.015;
    controls.minDistance = 1.4;
    controls.maxDistance = 30;
    controlsRef.current = controls;

    const ambient = new THREE.AmbientLight(0xfffdf9, 0.5);
    const hemi = new THREE.HemisphereLight(0xffffff, 0xd8d2c8, 0.65);
    const key = new THREE.DirectionalLight(0xfffaf0, 0.72);
    key.position.set(-8, 16, 12);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 40;
    key.shadow.camera.left = -14;
    key.shadow.camera.right = 14;
    key.shadow.camera.top = 14;
    key.shadow.camera.bottom = -14;
    key.shadow.bias = -0.0004;

    const rim = new THREE.DirectionalLight(0xeef5ff, 0.25);
    rim.position.set(12, 8, -10);
    scene.add(ambient, hemi, key, rim);
    lightsRef.current = { ambient, hemi, key, rim };

    const grid = new THREE.GridHelper(32, 32, 0xdad7d0, 0xedece8);
    grid.position.y = -0.02;
    scene.add(grid);

    const world = new THREE.Group();
    scene.add(world);
    worldRef.current = world;

    tvTexRef.current = createTvScreenTexture();

    // Click Raycasting
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down = { x: 0, y: 0 };
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(world.children, true);
      for (const hit of hits) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && !cur.userData?.target) cur = cur.parent;
        if (cur?.userData?.target) {
          setSelection(cur.userData.target);
          return;
        }
      }
      setSelection(null);
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);

    const ro = new ResizeObserver(() => {
      if (!el) return;
      camera.aspect = el.clientWidth / Math.max(1, el.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    });
    ro.observe(el);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      fanRotorsRef.current.forEach((rotor) => {
        if (rotor.userData.spin) rotor.rotation.y += 0.045;
      });
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      pmrem.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [setSelection]);

  // Camera Presets
  useEffect(() => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    const cx = project.width / 2;
    const cz = project.depth / 2;

    if (cameraPreset === 'iso') {
      cam.position.set(cx + 8, 10, cz + 10.5);
      ctrl.target.set(cx, 0.8, cz);
    } else if (cameraPreset === 'living') {
      cam.position.set(1.2, 1.55, 8.8);
      ctrl.target.set(4.5, 1.35, 6.8);
    } else if (cameraPreset === 'kitchen') {
      cam.position.set(2.8, 1.65, 4.9);
      ctrl.target.set(3.4, 1.25, 1.4);
    } else if (cameraPreset === 'master') {
      cam.position.set(7.2, 1.7, 8.8);
      ctrl.target.set(9.4, 1.1, 6.8);
    } else if (cameraPreset === 'first_person') {
      cam.position.set(2.0, 1.58, 7.6);
      ctrl.target.set(5.4, 1.45, 3.0);
    }
    ctrl.update();
  }, [cameraPreset, project.id, project.width, project.depth]);

  // Lighting Mood
  useEffect(() => {
    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    const l = lightsRef.current;
    if (!scene || !renderer || !l) return;
    if (lightingMood === 'day') {
      scene.background = new THREE.Color(0xf4f3ef);
      l.ambient.color.setHex(0xfffdf9);
      l.ambient.intensity = 0.5;
      l.hemi.intensity = 0.65;
      l.key.color.setHex(0xfffaf0);
      l.key.intensity = 0.72;
      renderer.toneMappingExposure = 1.04;
      scene.environmentIntensity = 0.45;
    } else if (lightingMood === 'sunset') {
      scene.background = new THREE.Color(0xeee2d3);
      l.ambient.color.setHex(0xffd4a8);
      l.ambient.intensity = 0.42;
      l.hemi.intensity = 0.52;
      l.key.color.setHex(0xffab62);
      l.key.intensity = 0.85;
      renderer.toneMappingExposure = 1.0;
      scene.environmentIntensity = 0.35;
    } else {
      scene.background = new THREE.Color(0x161a22);
      l.ambient.color.setHex(0x475569);
      l.ambient.intensity = 0.25;
      l.hemi.intensity = 0.25;
      l.key.color.setHex(0x94a3b8);
      l.key.intensity = 0.22;
      renderer.toneMappingExposure = 0.95;
      scene.environmentIntensity = 0.2;
    }
  }, [lightingMood]);

  // Rebuild 3D Geometry
  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    if (!autoSync3D && lastVerRef.current === render3DVersion && world.children.length > 0) return;
    lastVerRef.current = render3DVersion;

    while (world.children.length > 0) world.remove(world.children[0]);
    fanRotorsRef.current = [];

    // 1. Rooms (Floors + Well Ceiling + Cove Lights)
    project.rooms.forEach((rm) => {
      const floorSpec = getMaterial(rm.floorMaterialId);
      const xs = rm.polygon.map((p) => p.x);
      const zs = rm.polygon.map((p) => p.y);
      const spanX = Math.max(1, Math.max(...xs) - Math.min(...xs));
      const spanZ = Math.max(1, Math.max(...zs) - Math.min(...zs));

      const shape = new THREE.Shape();
      rm.polygon.forEach((p, idx) => {
        if (idx === 0) shape.moveTo(p.x, -p.y);
        else shape.lineTo(p.x, -p.y);
      });
      shape.closePath();

      const floorGeo = new THREE.ShapeGeometry(shape);
      floorGeo.rotateX(-Math.PI / 2);

      const isSel = selection?.kind === 'room' && selection.id === rm.id;
      const floorMat = new THREE.MeshStandardMaterial({
        map: getMaterialMap(floorSpec, spanX / 1.2, spanZ / 1.2),
        bumpMap: getMaterialBump(floorSpec, spanX / 1.2, spanZ / 1.2),
        bumpScale: 0.004,
        roughness: floorSpec.roughness,
        metalness: floorSpec.metalness,
        emissive: isSel ? new THREE.Color(0x0f7b6c) : new THREE.Color(0x000000),
        emissiveIntensity: isSel ? 0.12 : 0,
      });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.receiveShadow = true;
      floorMesh.userData = { target: { kind: 'room', id: rm.id } };
      world.add(floorMesh);

      if (showCeiling) {
        const ceilSpec = getMaterial(rm.ceilingMaterialId);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minZ = Math.min(...zs);
        const maxZ = Math.max(...zs);
        const cx = (minX + maxX) / 2;
        const cz = (minZ + maxZ) / 2;

        if (rm.ceilingType === 'well_cove') {
          const ceilY = 2.52;
          const plate = new THREE.Mesh(
            new THREE.PlaneGeometry(spanX, spanZ),
            new THREE.MeshStandardMaterial({ color: ceilSpec.color, roughness: 0.85, side: THREE.DoubleSide })
          );
          plate.rotation.x = Math.PI / 2;
          plate.position.set(cx, ceilY, cz);
          world.add(plate);

          // Cove LED strip frame
          const inset = 0.55;
          const cw = Math.max(0.6, spanX - inset * 2);
          const cd = Math.max(0.6, spanZ - inset * 2);
          const ledColor = rm.coveLightOn ? kelvinHex(rm.coveKelvin) : 0x555555;
          const ledMat = new THREE.MeshBasicMaterial({ color: ledColor });
          [
            [cw, 0.03, cx, ceilY - 0.05, minZ + inset],
            [cw, 0.03, cx, ceilY - 0.05, maxZ - inset],
            [0.03, cd, minX + inset, ceilY - 0.05, cz],
            [0.03, cd, maxX - inset, ceilY - 0.05, cz],
          ].forEach(([w, d, x, y, z]) => {
            const strip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.025, d), ledMat);
            strip.position.set(x, y, z);
            world.add(strip);
          });

          if (rm.coveLightOn) {
            const ptLight = new THREE.PointLight(ledColor, lightingMood === 'night' ? 1.8 : 0.7, 9, 1.4);
            ptLight.position.set(cx, 2.25, cz);
            world.add(ptLight);
          }
        }
      }
    });

    // 2. Walls & Openings (with Wood Blinds & Glass Sliding Doors)
    project.walls.forEach((w) => {
      const dx = w.x2 - w.x1;
      const dz = w.y2 - w.y1;
      const len = Math.hypot(dx, dz);
      if (len < 0.05) return;
      const angle = Math.atan2(dz, dx);

      const wallGroup = new THREE.Group();
      wallGroup.position.set(w.x1, 0, w.y1);
      wallGroup.rotation.y = -angle;

      const ops = project.openings
        .filter((o) => o.wallId === w.id)
        .sort((a, b) => a.offset - b.offset);

      const frontSpec = getMaterial(w.frontMaterialId);
      const isSel = selection?.kind === 'wall' && selection.id === w.id;
      const wallMat = new THREE.MeshStandardMaterial({
        map: getMaterialMap(frontSpec, Math.max(1, len / 2), 1.5),
        bumpMap: getMaterialBump(frontSpec, Math.max(1, len / 2), 1.5),
        bumpScale: 0.005,
        roughness: frontSpec.roughness,
        metalness: frontSpec.metalness,
        emissive: isSel ? new THREE.Color(0x2383e2) : new THREE.Color(0x000000),
        emissiveIntensity: isSel ? 0.15 : 0,
      });

      const addWallBlock = (sx: number, ex: number, by: number, ty: number) => {
        const bw = ex - sx;
        const bh = ty - by;
        if (bw <= 0.02 || bh <= 0.02) return;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, w.thickness), wallMat);
        mesh.position.set(sx + bw / 2, by + bh / 2, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { target: { kind: 'wall', id: w.id } };
        wallGroup.add(mesh);
      };

      let cursor = 0;
      ops.forEach((op) => {
        const center = op.offset * len;
        const s = Math.max(cursor, center - op.width / 2);
        const e = Math.min(len, center + op.width / 2);
        addWallBlock(cursor, s, 0, w.height);
        if (op.sillHeight > 0.01) addWallBlock(s, e, 0, op.sillHeight);
        if (op.sillHeight + op.height < w.height - 0.01) {
          addWallBlock(s, e, op.sillHeight + op.height, w.height);
        }

        const fSpec = getMaterial(op.frameMaterialId);
        const isOpSel = selection?.kind === 'opening' && selection.id === op.id;
        const frameMat = new THREE.MeshStandardMaterial({
          map: getMaterialMap(fSpec, 1, 1),
          color: isOpSel ? '#2383E2' : fSpec.color,
          roughness: fSpec.roughness,
          metalness: fSpec.metalness,
        });

        const opGroup = new THREE.Group();
        opGroup.position.set(center, op.sillHeight, 0);
        opGroup.userData = { target: { kind: 'opening', id: op.id } };

        const fw = e - s;
        const fh = op.height;
        const frameT = 0.05;
        const leftPost = new THREE.Mesh(new THREE.BoxGeometry(frameT, fh, w.thickness + 0.03), frameMat);
        leftPost.position.set(-fw / 2 + frameT / 2, fh / 2, 0);
        const rightPost = new THREE.Mesh(new THREE.BoxGeometry(frameT, fh, w.thickness + 0.03), frameMat);
        rightPost.position.set(fw / 2 - frameT / 2, fh / 2, 0);
        const topBar = new THREE.Mesh(new THREE.BoxGeometry(fw, frameT, w.thickness + 0.03), frameMat);
        topBar.position.set(0, fh - frameT / 2, 0);
        opGroup.add(leftPost, rightPost, topBar);

        if (op.kind === 'window_blind') {
          const glass = new THREE.Mesh(
            new THREE.BoxGeometry(fw - 0.08, fh - 0.08, 0.015),
            new THREE.MeshPhysicalMaterial({
              color: 0xdbeafe,
              transparent: true,
              opacity: 0.32,
              roughness: 0.06,
              transmission: 0.65,
            })
          );
          glass.position.set(0, fh / 2, 0);
          opGroup.add(glass);

          // Wood Blinds (like reference image 1!)
          if (op.hasBlind) {
            const slatMat = new THREE.MeshStandardMaterial({ color: fSpec.color, roughness: 0.48 });
            const blindTop = fh * 0.96;
            const blindBottom = fh * 0.42;
            for (let y = blindBottom; y <= blindTop; y += 0.055) {
              const slat = new THREE.Mesh(new THREE.BoxGeometry(fw - 0.1, 0.01, 0.045), slatMat);
              slat.position.set(0, y, w.thickness / 2 + 0.02);
              slat.rotation.x = 0.25;
              opGroup.add(slat);
            }
          }
        } else if (op.kind === 'sliding_glass_door') {
          const glass = new THREE.Mesh(
            new THREE.BoxGeometry(fw - 0.08, fh - 0.06, 0.015),
            new THREE.MeshPhysicalMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.28, roughness: 0.08 })
          );
          glass.position.set(0, fh / 2, 0);
          opGroup.add(glass);
        } else {
          // Solid door leaf
          const door = new THREE.Mesh(new THREE.BoxGeometry(fw - 0.08, fh - 0.04, 0.04), frameMat);
          door.position.set(0, fh / 2, 0);
          door.castShadow = true;
          opGroup.add(door);
        }

        wallGroup.add(opGroup);
        cursor = e;
      });
      addWallBlock(cursor, len, 0, w.height);
      world.add(wallGroup);
    });

    // 3. Objects (Appliances, Kitchen, Furniture, Outlets, Switches, Lights, Ceiling Fan)
    project.objects.forEach((obj) => {
      const spec = getMaterial(obj.materialId);
      const isSel = selection?.kind === 'object' && selection.id === obj.id;
      const g = new THREE.Group();
      g.position.set(obj.x, obj.elevation, obj.y);
      g.rotation.y = -obj.rotation;
      g.userData = { target: { kind: 'object', id: obj.id } };

      const baseMat = new THREE.MeshStandardMaterial({
        map: getMaterialMap(spec, 1, 1),
        color: isSel ? '#3B82F6' : spec.color,
        roughness: spec.roughness,
        metalness: spec.metalness,
      });

      if (obj.kind === 'fridge_4door') {
        const gapMat = new THREE.MeshStandardMaterial({ color: 0x181a1d, roughness: 0.45 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(obj.width, obj.height, obj.depth), gapMat);
        body.position.y = obj.height / 2;
        body.castShadow = true;

        const upper = new THREE.Mesh(new THREE.BoxGeometry(obj.width - 0.02, 0.4, obj.depth + 0.01), baseMat);
        upper.position.set(0, obj.height - 0.21, 0.005);

        const dw = (obj.width - 0.05) / 2;
        const th = (obj.height - 0.5) * 0.58;
        const bh = (obj.height - 0.5) * 0.4;
        [-1, 1].forEach((s) => {
          const td = new THREE.Mesh(new THREE.BoxGeometry(dw, th, 0.03), baseMat);
          td.position.set(s * (dw / 2 + 0.008), obj.height - 0.45 - th / 2, obj.depth / 2 + 0.006);
          const bd = new THREE.Mesh(new THREE.BoxGeometry(dw, bh, 0.03), baseMat);
          bd.position.set(s * (dw / 2 + 0.008), bh / 2 + 0.03, obj.depth / 2 + 0.006);
          g.add(td, bd);
        });
        g.add(body, upper);
      } else if (obj.kind === 'tall_homebar') {
        const woodMat = new THREE.MeshStandardMaterial({ color: 0xb68655, roughness: 0.52 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x26282c, roughness: 0.4 });
        const ledMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });
        const body = new THREE.Mesh(new THREE.BoxGeometry(obj.width, obj.height, obj.depth), baseMat);
        body.position.y = obj.height / 2;
        body.castShadow = true;
        g.add(body);

        if (obj.variant === 'option1') {
          const niche = new THREE.Mesh(new THREE.BoxGeometry(obj.width * 0.45, 0.72, 0.06), woodMat);
          niche.position.set(obj.width * 0.22, 1.32, obj.depth / 2 - 0.01);
          const led = new THREE.Mesh(new THREE.BoxGeometry(obj.width * 0.42, 0.015, 0.02), ledMat);
          led.position.set(obj.width * 0.22, 1.66, obj.depth / 2 + 0.01);
          const openRack = new THREE.Mesh(new THREE.BoxGeometry(obj.width * 0.42, 1.8, 0.05), darkMat);
          openRack.position.set(-obj.width * 0.24, 1.05, obj.depth / 2 - 0.01);
          g.add(niche, led, openRack);
        } else {
          const niche = new THREE.Mesh(new THREE.BoxGeometry(obj.width * 0.88, 0.76, 0.06), woodMat);
          niche.position.set(0, 1.32, obj.depth / 2 - 0.01);
          const led = new THREE.Mesh(new THREE.BoxGeometry(obj.width * 0.84, 0.015, 0.02), ledMat);
          led.position.set(0, 1.68, obj.depth / 2 + 0.01);
          g.add(niche, led);
        }
      } else if (obj.kind === 'island_counter' || obj.kind === 'kitchen_sink') {
        const cab = new THREE.Mesh(new THREE.BoxGeometry(obj.width, obj.height - 0.04, obj.depth), baseMat);
        cab.position.y = (obj.height - 0.04) / 2;
        cab.castShadow = true;
        const top = new THREE.Mesh(
          new THREE.BoxGeometry(obj.width + 0.03, 0.04, obj.depth + 0.03),
          new THREE.MeshStandardMaterial({ color: 0xf7f5f0, roughness: 0.22 })
        );
        top.position.y = obj.height - 0.02;
        g.add(cab, top);

        if (obj.kind === 'island_counter') {
          // Under-toe-kick indirect LED
          const kickLed = new THREE.Mesh(
            new THREE.BoxGeometry(obj.width * 0.94, 0.02, obj.depth * 0.92),
            new THREE.MeshBasicMaterial({ color: 0xfde68a })
          );
          kickLed.position.y = 0.02;
          g.add(kickLed);
        } else {
          // Sink bowl + faucet + upper cabinet
          const sink = new THREE.Mesh(
            new THREE.BoxGeometry(0.75, 0.02, 0.46),
            new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.7, roughness: 0.25 })
          );
          sink.position.set(0.4, obj.height + 0.005, 0);
          const upper = new THREE.Mesh(new THREE.BoxGeometry(obj.width, 0.68, 0.36), baseMat);
          upper.position.set(0, 2.05, -obj.depth * 0.22);
          g.add(sink, upper);
        }
      } else if (obj.kind === 'induction_3') {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(obj.width, 0.025, obj.depth), baseMat);
        plate.position.y = 0.015;
        g.add(plate);
        [-0.18, 0.06, 0.2].forEach((bx, bi) => {
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.055, 0.068, 24),
            new THREE.MeshBasicMaterial({ color: 0x9ca3af, side: THREE.DoubleSide })
          );
          ring.rotation.x = -Math.PI / 2;
          ring.position.set(bx, 0.03, bi === 1 ? -0.1 : 0.08);
          g.add(ring);
        });
      } else if (obj.kind === 'sofa_modular') {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(obj.width, 0.38, obj.depth), baseMat);
        seat.position.y = 0.19;
        seat.castShadow = true;
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.44, obj.depth), baseMat);
        back.position.set(-obj.width / 2 + 0.12, 0.56, 0);
        const ottoman = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.36, 0.95), baseMat);
        ottoman.position.set(obj.width + 0.55, 0.18, 0);
        ottoman.castShadow = true;
        g.add(seat, back, ottoman);
      } else if (obj.kind === 'dining_set') {
        const top = new THREE.Mesh(new THREE.BoxGeometry(obj.width, 0.045, obj.depth), baseMat);
        top.position.y = obj.height - 0.02;
        top.castShadow = true;
        g.add(top);
        [-obj.width * 0.4, obj.width * 0.4].forEach((lx) =>
          [-obj.depth * 0.38, obj.depth * 0.38].forEach((lz) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, obj.height, 12), baseMat);
            leg.position.set(lx, obj.height / 2, lz);
            g.add(leg);
          })
        );
      } else if (obj.kind === 'bed_queen') {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(obj.width, 0.28, obj.depth), baseMat);
        frame.position.y = 0.14;
        const matt = new THREE.Mesh(
          new THREE.BoxGeometry(obj.width - 0.08, 0.24, obj.depth - 0.12),
          new THREE.MeshStandardMaterial({ color: 0xf8f6f2, roughness: 0.85 })
        );
        matt.position.y = 0.4;
        const head = new THREE.Mesh(new THREE.BoxGeometry(obj.width, 1.05, 0.12), baseMat);
        head.position.set(0, 0.52, -obj.depth / 2 + 0.06);
        g.add(frame, matt, head);
      } else if (obj.kind === 'ceiling_fan') {
        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.11, 0.2, 24),
          new THREE.MeshStandardMaterial({ color: 0x1f2024, roughness: 0.35 })
        );
        const rotor = new THREE.Group();
        rotor.userData.spin = Boolean(obj.on);
        for (let b = 0; b < 3; b++) {
          const blade = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.018, 0.13), baseMat);
          blade.position.x = 0.32;
          const pivot = new THREE.Group();
          pivot.rotation.y = (b * Math.PI * 2) / 3;
          pivot.add(blade);
          rotor.add(pivot);
        }
        fanRotorsRef.current.push(rotor);
        g.add(hub, rotor);
      } else if (obj.kind === 'downlight') {
        const trim = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16),
          new THREE.MeshBasicMaterial({ color: obj.on ? 0xfff0c2 : 0x6b7280 })
        );
        g.add(trim);
        if (obj.on) {
          const spot = new THREE.PointLight(0xffe4b5, lightingMood === 'night' ? 1.1 : 0.35, 5, 1.8);
          spot.position.y = -0.15;
          g.add(spot);
        }
      } else if (obj.kind === 'wall_tv') {
        const bezel = new THREE.Mesh(
          new THREE.BoxGeometry(obj.width, obj.height, 0.03),
          new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3 })
        );
        const screen = new THREE.Mesh(
          new THREE.BoxGeometry(obj.width - 0.05, obj.height - 0.05, 0.01),
          new THREE.MeshBasicMaterial({ map: tvTexRef.current || undefined })
        );
        screen.position.z = 0.016;
        g.add(bezel, screen);
      } else if (obj.kind === 'wallpad') {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(obj.width, obj.height, 0.018), baseMat);
        const screen = new THREE.Mesh(
          new THREE.BoxGeometry(obj.width - 0.03, obj.height - 0.03, 0.008),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x1e293b, emissiveIntensity: 0.45 })
        );
        screen.position.z = 0.01;
        g.add(frame, screen);
      } else if (obj.kind === 'switch_2') {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(obj.width, obj.height, 0.012), baseMat);
        const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.055, 0.008), baseMat);
        b1.position.set(-0.016, 0, 0.008);
        const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.055, 0.008), baseMat);
        b2.position.set(0.016, 0, 0.008);
        g.add(plate, b1, b2);
      } else {
        // outlet_2
        const plate = new THREE.Mesh(new THREE.BoxGeometry(obj.width, obj.height, 0.012), baseMat);
        const sockMat = new THREE.MeshStandardMaterial({ color: spec.accentColor || '#D6D5D0', roughness: 0.4 });
        [-0.028, 0.028].forEach((sx) => {
          const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.01, 16), sockMat);
          sock.rotation.x = Math.PI / 2;
          sock.position.set(sx, 0, 0.005);
          g.add(sock);
        });
        g.add(plate);
      }

      world.add(g);
    });
  }, [project, selection, showCeiling, lightingMood, autoSync3D, render3DVersion]);

  const handleSnapshot = () => {
    const r = rendererRef.current;
    if (!r) return;
    const a = document.createElement('a');
    a.href = r.domElement.toDataURL('image/png');
    a.download = `${project.title}_3D.png`;
    a.click();
  };

  return (
    <div className="relative w-full h-full bg-[#F4F3EF] overflow-hidden">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-[#E9E9E7] shadow-xs px-3 py-1.5 rounded-lg text-xs">
        <span className="w-2 h-2 rounded-full bg-[#0F7B6C]" />
        <span className="font-semibold text-[#37352F]">3D 스튜디오</span>
        <span className="text-[#D3D1CB]">|</span>
        <span className="text-[#787774]">바닥·벽·콘센트·가전 클릭 시 자재 교체</span>
      </div>

      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-[#E9E9E7] shadow-xs p-1 rounded-lg">
        {(
          [
            ['iso', '전체'],
            ['living', '거실'],
            ['kitchen', '주방'],
            ['master', '안방'],
            ['first_person', '1인칭'],
          ] as const
        ).map(([p, label]) => (
          <button
            key={p}
            onClick={() => setCameraPreset(p)}
            className={`px-2 py-1 text-xs rounded-md transition ${
              cameraPreset === p
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
            ['day', <Sun key="d" className="w-3.5 h-3.5" />],
            ['sunset', <Sunset key="s" className="w-3.5 h-3.5" />],
            ['night', <Moon key="n" className="w-3.5 h-3.5" />],
          ] as const
        ).map(([m, icon]) => (
          <button
            key={m}
            onClick={() => setLightingMood(m)}
            className={`p-1.5 rounded-md transition ${
              lightingMood === m
                ? 'bg-[#1F2937] text-amber-300'
                : 'text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE]'
            }`}
            title={m}
          >
            {icon}
          </button>
        ))}

        <button
          onClick={() => setShowCeiling(!showCeiling)}
          className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 transition ${
            showCeiling ? 'bg-[#FAEBDD] text-[#D9730D] font-semibold' : 'text-[#787774]'
          }`}
        >
          {showCeiling ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>천장</span>
        </button>

        <button
          onClick={handleSnapshot}
          className="p-1.5 text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE] rounded-md"
          title="PNG 저장"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
};
