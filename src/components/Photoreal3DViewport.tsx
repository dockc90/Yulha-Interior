import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { useDesignStore } from '../store/useDesignStore';
import { getCatalogItem } from '../data/brandCatalog';
import { buildBumpMap, buildColorMap, createScenicTvTexture } from '../utils/realisticTextures';
import { Camera, Eye, EyeOff } from 'lucide-react';

function kelvinHex(k: '3000K' | '4000K' | '5700K') {
  if (k === '3000K') return 0xffcf87;
  if (k === '4000K') return 0xfff0d4;
  return 0xf3f7ff;
}

export const Photoreal3DViewport: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const worldRef = useRef<THREE.Group | null>(null);
  const rotorsRef = useRef<THREE.Group[]>([]);
  const tvTexRef = useRef<THREE.CanvasTexture | null>(null);

  const {
    published3DPlan,
    selection,
    showCeiling,
    cameraView,
    setSelection,
    setShowCeiling,
    setCameraView,
  } = useDesignStore();

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
    renderer.toneMappingExposure = 1.03;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Post-processing subtle Bloom for indirect LED coves & downlights
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(el.clientWidth, el.clientHeight),
      0.16, // subtle photorealistic glow
      0.45,
      0.88
    );
    composer.addPass(bloom);
    composerRef.current = composer;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.48;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI / 2 - 0.015;
    controls.minDistance = 1.4;
    controls.maxDistance = 30;
    controlsRef.current = controls;

    const ambient = new THREE.AmbientLight(0xffffff, 0.72);
    const hemi = new THREE.HemisphereLight(0xffffff, 0xe8e6e0, 0.68);
    const key = new THREE.DirectionalLight(0xffffff, 0.65);
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
    scene.add(ambient, hemi, key);

    const grid = new THREE.GridHelper(32, 32, 0xdad7d0, 0xedece8);
    grid.position.y = -0.02;
    scene.add(grid);

    const world = new THREE.Group();
    scene.add(world);
    worldRef.current = world;
    tvTexRef.current = createScenicTvTexture();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down = { x: 0, y: 0 };
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
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
      composer.setSize(el.clientWidth, el.clientHeight);
    });
    ro.observe(el);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      rotorsRef.current.forEach((r) => {
        if (r.userData.spin) r.rotation.y += 0.04;
      });
      controls.update();
      composer.render();
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      pmrem.dispose();
      composer.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [setSelection]);

  useEffect(() => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    const cx = published3DPlan.width / 2;
    const cz = published3DPlan.depth / 2;
    if (cameraView === 'iso') {
      cam.position.set(cx + 8, 10, cz + 10.5);
      ctrl.target.set(cx, 0.8, cz);
    } else if (cameraView === 'living') {
      cam.position.set(1.3, 1.55, 8.8);
      ctrl.target.set(4.5, 1.35, 6.8);
    } else if (cameraView === 'kitchen') {
      cam.position.set(2.8, 1.6, 4.9);
      ctrl.target.set(3.4, 1.25, 1.4);
    } else if (cameraView === 'master') {
      cam.position.set(7.2, 1.7, 8.8);
      ctrl.target.set(9.4, 1.1, 6.8);
    } else if (cameraView === 'walk') {
      cam.position.set(2.0, 1.58, 7.6);
      ctrl.target.set(5.4, 1.45, 3.0);
    }
    ctrl.update();
  }, [cameraView, published3DPlan.id, published3DPlan.width, published3DPlan.depth]);

  // Rebuild 3D World whenever published3DPlan or visual state changes
  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    while (world.children.length > 0) world.remove(world.children[0]);
    rotorsRef.current = [];

    // 1. Spaces (Floors + Well Ceilings + LED Cove Lights)
    published3DPlan.spaces.forEach((sp) => {
      const fl = getCatalogItem(sp.floorMaterialId);
      const isSel = selection?.kind === 'space' && selection.id === sp.id;
      const floorGeo = new THREE.PlaneGeometry(sp.width, sp.depth);
      floorGeo.rotateX(-Math.PI / 2);
      const floorMat = new THREE.MeshStandardMaterial({
        map: buildColorMap(fl, Math.max(1, sp.width / 1.2), Math.max(1, sp.depth / 1.2)),
        bumpMap: buildBumpMap(fl, Math.max(1, sp.width / 1.2), Math.max(1, sp.depth / 1.2)),
        bumpScale: 0.004,
        roughness: fl.roughness,
        metalness: fl.metalness,
        emissive: isSel ? new THREE.Color(0x0f7b6c) : new THREE.Color(0x000000),
        emissiveIntensity: isSel ? 0.12 : 0,
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.position.set(sp.x + sp.width / 2, 0, sp.y + sp.depth / 2);
      floor.receiveShadow = true;
      floor.userData = { target: { kind: 'space', id: sp.id } };
      world.add(floor);

      if (showCeiling) {
        const cl = getCatalogItem(sp.ceilingMaterialId);
        const cx = sp.x + sp.width / 2;
        const cz = sp.y + sp.depth / 2;
        if (sp.ceilingType === 'well_cove') {
          const ceilY = 2.52;
          const plate = new THREE.Mesh(
            new THREE.PlaneGeometry(sp.width, sp.depth),
            new THREE.MeshStandardMaterial({ color: cl.color, roughness: 0.85, side: THREE.DoubleSide })
          );
          plate.rotation.x = Math.PI / 2;
          plate.position.set(cx, ceilY, cz);
          world.add(plate);

          const inset = 0.55;
          const cw = Math.max(0.6, sp.width - inset * 2);
          const cd = Math.max(0.6, sp.depth - inset * 2);
          const ledCol = sp.coveLightOn ? kelvinHex(sp.coveKelvin) : 0x555555;
          const ledMat = new THREE.MeshBasicMaterial({ color: ledCol });
          [
            [cw, 0.03, cx, ceilY - 0.05, sp.y + inset],
            [cw, 0.03, cx, ceilY - 0.05, sp.y + sp.depth - inset],
            [0.03, cd, sp.x + inset, ceilY - 0.05, cz],
            [0.03, cd, sp.x + sp.width - inset, ceilY - 0.05, cz],
          ].forEach(([w, d, x, y, z]) => {
            const strip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.025, d), ledMat);
            strip.position.set(x, y, z);
            world.add(strip);
          });

          if (sp.coveLightOn) {
            const pt = new THREE.PointLight(ledCol, 0.75, 9, 1.4);
            pt.position.set(cx, 2.25, cz);
            world.add(pt);
          }
        }
      }
    });

    // 2. Walls & Openings
    published3DPlan.walls.forEach((w) => {
      const dx = w.x2 - w.x1;
      const dz = w.y2 - w.y1;
      const len = Math.hypot(dx, dz);
      if (len < 0.05) return;
      const angle = Math.atan2(dz, dx);

      const wg = new THREE.Group();
      wg.position.set(w.x1, 0, w.y1);
      wg.rotation.y = -angle;

      const wSpec = getCatalogItem(w.materialId);
      const isSel = selection?.kind === 'wall' && selection.id === w.id;
      const wMat = new THREE.MeshStandardMaterial({
        map: buildColorMap(wSpec, Math.max(1, len / 2), 1.5),
        bumpMap: buildBumpMap(wSpec, Math.max(1, len / 2), 1.5),
        bumpScale: 0.005,
        roughness: wSpec.roughness,
        metalness: wSpec.metalness,
        emissive: isSel ? new THREE.Color(0x2563eb) : new THREE.Color(0x000000),
        emissiveIntensity: isSel ? 0.14 : 0,
      });

      const addBlock = (sx: number, ex: number, by: number, ty: number) => {
        const bw = ex - sx;
        const bh = ty - by;
        if (bw <= 0.02 || bh <= 0.02) return;
        const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, w.thickness), wMat);
        m.position.set(sx + bw / 2, by + bh / 2, 0);
        m.castShadow = true;
        m.receiveShadow = true;
        m.userData = { target: { kind: 'wall', id: w.id } };
        wg.add(m);
      };

      const ops = published3DPlan.openings
        .filter((o) => o.wallId === w.id)
        .sort((a, b) => a.offset - b.offset);

      let cursor = 0;
      ops.forEach((op) => {
        const center = op.offset * len;
        const s = Math.max(cursor, center - op.width / 2);
        const e = Math.min(len, center + op.width / 2);
        addBlock(cursor, s, 0, w.height);
        if (op.sillHeight > 0.01) addBlock(s, e, 0, op.sillHeight);
        if (op.sillHeight + op.height < w.height - 0.01) addBlock(s, e, op.sillHeight + op.height, w.height);

        const fSpec = getCatalogItem(op.frameMaterialId);
        const isOpSel = selection?.kind === 'opening' && selection.id === op.id;
        const fMat = new THREE.MeshStandardMaterial({
          map: buildColorMap(fSpec, 1, 1),
          color: isOpSel ? '#93C5FD' : '#FFFFFF',
          roughness: fSpec.roughness,
          metalness: fSpec.metalness,
        });

        const og = new THREE.Group();
        og.position.set(center, op.sillHeight, 0);
        og.userData = { target: { kind: 'opening', id: op.id } };
        const fw = e - s;
        const fh = op.height;
        const ft = 0.05;
        const lp = new THREE.Mesh(new THREE.BoxGeometry(ft, fh, w.thickness + 0.03), fMat);
        lp.position.set(-fw / 2 + ft / 2, fh / 2, 0);
        const rp = new THREE.Mesh(new THREE.BoxGeometry(ft, fh, w.thickness + 0.03), fMat);
        rp.position.set(fw / 2 - ft / 2, fh / 2, 0);
        const tb = new THREE.Mesh(new THREE.BoxGeometry(fw, ft, w.thickness + 0.03), fMat);
        tb.position.set(0, fh - ft / 2, 0);
        const bb = new THREE.Mesh(new THREE.BoxGeometry(fw, ft, w.thickness + 0.03), fMat);
        bb.position.set(0, ft / 2, 0);
        og.add(lp, rp, tb, bb);

        if (op.type === 'window_blind') {
          const glass = new THREE.Mesh(
            new THREE.BoxGeometry(fw - 0.08, fh - 0.08, 0.012),
            new THREE.MeshPhysicalMaterial({ color: 0xeff6ff, transparent: true, opacity: 0.24, roughness: 0.05 })
          );
          glass.position.set(0, fh / 2, 0);
          og.add(glass);

          // Mullion dividers for large windows (4-panel look like ref image 1)
          if (fw > 2.4) {
            [-fw * 0.25, 0, fw * 0.25].forEach((mx) => {
              const mul = new THREE.Mesh(new THREE.BoxGeometry(0.035, fh - 0.08, w.thickness * 0.7), fMat);
              mul.position.set(mx, fh / 2, 0);
              og.add(mul);
            });
          }

          // Clean wood blinds hanging in top 38% only so view stays open
          if (op.hasBlind) {
            const slatMat = new THREE.MeshStandardMaterial({ color: fSpec.color, roughness: 0.45 });
            for (let y = fh * 0.62; y <= fh * 0.94; y += 0.055) {
              const slat = new THREE.Mesh(new THREE.BoxGeometry(fw - 0.12, 0.008, 0.03), slatMat);
              slat.position.set(0, y, w.thickness / 2 + 0.015);
              slat.rotation.x = 0.2;
              og.add(slat);
            }
          }
        } else if (op.type === 'sliding_glass') {
          const glass = new THREE.Mesh(
            new THREE.BoxGeometry(fw - 0.08, fh - 0.06, 0.015),
            new THREE.MeshPhysicalMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.26, roughness: 0.08 })
          );
          glass.position.set(0, fh / 2, 0);
          og.add(glass);
        } else {
          const leaf = new THREE.Mesh(new THREE.BoxGeometry(fw - 0.08, fh - 0.04, 0.04), fMat);
          leaf.position.set(0, fh / 2, 0);
          leaf.castShadow = true;
          og.add(leaf);
        }

        wg.add(og);
        cursor = e;
      });
      addBlock(cursor, len, 0, w.height);
      world.add(wg);
    });

    // 3. Props (Appliances, Kitchen, Furniture, Outlets, Switches, Lights, Ceiling Fan)
    published3DPlan.props.forEach((pr) => {
      const spec = getCatalogItem(pr.materialId);
      const isSel = selection?.kind === 'prop' && selection.id === pr.id;
      const g = new THREE.Group();
      g.position.set(pr.x, pr.elevation, pr.y);
      g.rotation.y = -pr.rotation;
      g.userData = { target: { kind: 'prop', id: pr.id } };

      const baseMat = new THREE.MeshStandardMaterial({
        map: buildColorMap(spec, 1, 1),
        color: isSel ? '#93C5FD' : '#FFFFFF',
        roughness: spec.roughness,
        metalness: spec.metalness,
      });

      if (pr.type === 'fridge_4door') {
        const gap = new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.45 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(pr.width, pr.height, pr.depth - 0.03), baseMat);
        body.position.set(0, pr.height / 2, -0.015);
        body.castShadow = true;
        const recess = new THREE.Mesh(new THREE.BoxGeometry(pr.width - 0.02, pr.height - 0.04, 0.02), gap);
        recess.position.set(0, pr.height / 2, pr.depth / 2 - 0.02);

        const upper = new THREE.Mesh(new THREE.BoxGeometry(pr.width - 0.01, 0.42, 0.035), baseMat);
        upper.position.set(0, pr.height - 0.22, pr.depth / 2);
        const dw = (pr.width - 0.05) / 2;
        const th = (pr.height - 0.52) * 0.58;
        const bh = (pr.height - 0.52) * 0.4;
        [-1, 1].forEach((s) => {
          const td = new THREE.Mesh(new THREE.BoxGeometry(dw, th, 0.035), baseMat);
          td.position.set(s * (dw / 2 + 0.01), pr.height - 0.47 - th / 2, pr.depth / 2);
          const bd = new THREE.Mesh(new THREE.BoxGeometry(dw, bh, 0.035), baseMat);
          bd.position.set(s * (dw / 2 + 0.01), bh / 2 + 0.03, pr.depth / 2);
          g.add(td, bd);
        });
        g.add(body, recess, upper);
      } else if (pr.type === 'tall_homebar') {
        const wood = new THREE.MeshStandardMaterial({ color: 0xb68655, roughness: 0.52 });
        const dark = new THREE.MeshStandardMaterial({ color: 0x26282c, roughness: 0.4 });
        const led = new THREE.MeshBasicMaterial({ color: 0xfde68a });
        const body = new THREE.Mesh(new THREE.BoxGeometry(pr.width, pr.height, pr.depth), baseMat);
        body.position.y = pr.height / 2;
        body.castShadow = true;
        g.add(body);
        if (pr.variant === 'option1') {
          const niche = new THREE.Mesh(new THREE.BoxGeometry(pr.width * 0.45, 0.72, 0.06), wood);
          niche.position.set(pr.width * 0.22, 1.32, pr.depth / 2 - 0.01);
          const strip = new THREE.Mesh(new THREE.BoxGeometry(pr.width * 0.42, 0.015, 0.02), led);
          strip.position.set(pr.width * 0.22, 1.66, pr.depth / 2 + 0.01);
          const rack = new THREE.Mesh(new THREE.BoxGeometry(pr.width * 0.42, 1.8, 0.05), dark);
          rack.position.set(-pr.width * 0.24, 1.05, pr.depth / 2 - 0.01);
          g.add(niche, strip, rack);
        } else {
          const niche = new THREE.Mesh(new THREE.BoxGeometry(pr.width * 0.88, 0.76, 0.06), wood);
          niche.position.set(0, 1.32, pr.depth / 2 - 0.01);
          const strip = new THREE.Mesh(new THREE.BoxGeometry(pr.width * 0.84, 0.015, 0.02), led);
          strip.position.set(0, 1.68, pr.depth / 2 + 0.01);
          g.add(niche, strip);
        }
      } else if (pr.type === 'island_counter' || pr.type === 'kitchen_sink') {
        const cab = new THREE.Mesh(new THREE.BoxGeometry(pr.width, pr.height - 0.04, pr.depth), baseMat);
        cab.position.y = (pr.height - 0.04) / 2;
        cab.castShadow = true;
        const top = new THREE.Mesh(
          new THREE.BoxGeometry(pr.width + 0.03, 0.04, pr.depth + 0.03),
          new THREE.MeshStandardMaterial({ color: 0xf7f5f0, roughness: 0.22 })
        );
        top.position.y = pr.height - 0.02;
        g.add(cab, top);
        if (pr.type === 'island_counter') {
          const kickLed = new THREE.Mesh(
            new THREE.BoxGeometry(pr.width * 0.94, 0.02, pr.depth * 0.92),
            new THREE.MeshBasicMaterial({ color: 0xfde68a })
          );
          kickLed.position.y = 0.02;
          g.add(kickLed);
        } else {
          const sink = new THREE.Mesh(
            new THREE.BoxGeometry(0.75, 0.02, 0.46),
            new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.78, roughness: 0.2 })
          );
          sink.position.set(0.3, pr.height + 0.005, 0);
          const faucetMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.85, roughness: 0.15 });
          const faucetStem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.28, 12), faucetMat);
          faucetStem.position.set(0.3, pr.height + 0.14, -0.2);
          const faucetSpout = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.14), faucetMat);
          faucetSpout.position.set(0.3, pr.height + 0.28, -0.14);
          const upper = new THREE.Mesh(new THREE.BoxGeometry(pr.width, 0.68, 0.36), baseMat);
          upper.position.set(0, 2.05, -pr.depth * 0.22);
          const underLed = new THREE.Mesh(
            new THREE.BoxGeometry(pr.width * 0.94, 0.015, 0.025),
            new THREE.MeshBasicMaterial({ color: 0xfef08a })
          );
          underLed.position.set(0, 1.7, -pr.depth * 0.1);
          g.add(sink, faucetStem, faucetSpout, upper, underLed);
        }
      } else if (pr.type === 'induction_3') {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(pr.width, 0.025, pr.depth), baseMat);
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
      } else if (pr.type === 'sofa_modular') {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(pr.width, 0.38, pr.depth), baseMat);
        seat.position.y = 0.19;
        seat.castShadow = true;
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.48, pr.depth), baseMat);
        back.position.set(-pr.width / 2 + 0.12, 0.58, 0);
        // Sage green accent cushions (like reference image 1)
        const cushionMat = new THREE.MeshStandardMaterial({ color: 0x8fa392, roughness: 0.85 });
        [-pr.depth * 0.28, pr.depth * 0.28].forEach((cz) => {
          const cush = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.36), cushionMat);
          cush.position.set(-pr.width / 2 + 0.32, 0.54, cz);
          cush.rotation.z = -0.22;
          g.add(cush);
        });
        const otto = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.36, 0.95), baseMat);
        otto.position.set(pr.width + 0.55, 0.18, 0);
        otto.castShadow = true;
        g.add(seat, back, otto);
      } else if (pr.type === 'dining_set') {
        const top = new THREE.Mesh(new THREE.BoxGeometry(pr.width, 0.045, pr.depth), baseMat);
        top.position.y = pr.height - 0.02;
        top.castShadow = true;
        g.add(top);
        [-pr.width * 0.4, pr.width * 0.4].forEach((lx) =>
          [-pr.depth * 0.38, pr.depth * 0.38].forEach((lz) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, pr.height, 12), baseMat);
            leg.position.set(lx, pr.height / 2, lz);
            g.add(leg);
          })
        );
        // 4 Dining chairs + small table vase (like reference image 2)
        const chairSeatMat = new THREE.MeshStandardMaterial({ color: 0xf2ece1, roughness: 0.78 });
        [-pr.width * 0.26, pr.width * 0.26].forEach((cx) => {
          [-pr.depth * 0.68, pr.depth * 0.68].forEach((cz) => {
            const cSeat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.42), chairSeatMat);
            cSeat.position.set(cx, 0.44, cz);
            const cBack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.04), chairSeatMat);
            cBack.position.set(cx, 0.64, cz + (cz > 0 ? 0.19 : -0.19));
            const cLeg = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.36), baseMat);
            cLeg.position.set(cx, 0.21, cz);
            g.add(cSeat, cBack, cLeg);
          });
        });
        const vase = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.05, 0.12, 12),
          new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.2 })
        );
        vase.position.set(0, pr.height + 0.06, 0);
        const plant = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 12, 10),
          new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.8 })
        );
        plant.position.set(0, pr.height + 0.17, 0);
        g.add(vase, plant);
      } else if (pr.type === 'bed_queen') {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(pr.width, 0.28, pr.depth), baseMat);
        frame.position.y = 0.14;
        const matt = new THREE.Mesh(
          new THREE.BoxGeometry(pr.width - 0.08, 0.24, pr.depth - 0.12),
          new THREE.MeshStandardMaterial({ color: 0xf8f6f2, roughness: 0.85 })
        );
        matt.position.y = 0.4;
        const head = new THREE.Mesh(new THREE.BoxGeometry(pr.width, 1.05, 0.12), baseMat);
        head.position.set(0, 0.52, -pr.depth / 2 + 0.06);
        g.add(frame, matt, head);
      } else if (pr.type === 'ceiling_fan') {
        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.11, 0.2, 24),
          new THREE.MeshStandardMaterial({ color: 0x1f2024, roughness: 0.35 })
        );
        const rotor = new THREE.Group();
        rotor.userData.spin = Boolean(pr.powerOn);
        for (let b = 0; b < 3; b++) {
          const blade = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.018, 0.13), baseMat);
          blade.position.x = 0.32;
          const pv = new THREE.Group();
          pv.rotation.y = (b * Math.PI * 2) / 3;
          pv.add(blade);
          rotor.add(pv);
        }
        rotorsRef.current.push(rotor);
        g.add(hub, rotor);
      } else if (pr.type === 'downlight') {
        const trim = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16),
          new THREE.MeshBasicMaterial({ color: pr.powerOn ? 0xfff0c2 : 0x6b7280 })
        );
        g.add(trim);
        if (pr.powerOn) {
          const sp = new THREE.PointLight(0xffe4b5, 0.35, 5, 1.8);
          sp.position.y = -0.15;
          g.add(sp);
        }
      } else if (pr.type === 'wall_tv') {
        const bezel = new THREE.Mesh(
          new THREE.BoxGeometry(pr.width, pr.height, 0.03),
          new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3 })
        );
        const scr = new THREE.Mesh(
          new THREE.BoxGeometry(pr.width - 0.05, pr.height - 0.05, 0.01),
          new THREE.MeshBasicMaterial({ map: tvTexRef.current || undefined })
        );
        scr.position.z = 0.016;
        g.add(bezel, scr);
      } else if (pr.type === 'wallpad') {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(pr.width, pr.height, 0.018), baseMat);
        const scr = new THREE.Mesh(
          new THREE.BoxGeometry(pr.width - 0.03, pr.height - 0.03, 0.008),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x1e293b, emissiveIntensity: 0.45 })
        );
        scr.position.z = 0.01;
        g.add(frame, scr);
      } else if (pr.type === 'switch_2') {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(pr.width, pr.height, 0.012), baseMat);
        const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.055, 0.008), baseMat);
        b1.position.set(-0.016, 0, 0.008);
        const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.055, 0.008), baseMat);
        b2.position.set(0.016, 0, 0.008);
        g.add(plate, b1, b2);
      } else {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(pr.width, pr.height, 0.012), baseMat);
        const sockMat = new THREE.MeshStandardMaterial({ color: spec.subColor || '#D5D4CE', roughness: 0.4 });
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
  }, [published3DPlan, selection, showCeiling]);

  const handleSnapshot = () => {
    const r = rendererRef.current;
    if (!r) return;
    const a = document.createElement('a');
    a.href = r.domElement.toDataURL('image/png');
    a.download = `${published3DPlan.name}_3D.png`;
    a.click();
  };

  return (
    <div className="relative w-full h-full bg-[#F4F3EF] overflow-hidden">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/95 border border-[#E9E9E7] shadow-xs px-3 py-1.5 rounded-lg text-xs">
        <span className="w-2 h-2 rounded-full bg-[#0F7B6C]" />
        <span className="font-semibold text-[#37352F]">3D 스튜디오</span>
        <span className="text-[#D3D1CB]">|</span>
        <span className="text-[#787774]">영역 클릭 후 우측에서 자재·가전·콘센트 선택</span>
      </div>

      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/95 border border-[#E9E9E7] shadow-xs p-1 rounded-lg">
        {(
          [
            ['iso', '전체'],
            ['living', '거실'],
            ['kitchen', '주방'],
            ['master', '안방'],
            ['walk', '1인칭'],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setCameraView(v)}
            className={`px-2 py-1 text-xs rounded-md transition ${
              cameraView === v ? 'bg-[#EBF5FF] text-[#2383E2] font-semibold' : 'text-[#787774] hover:text-[#37352F]'
            }`}
          >
            {label}
          </button>
        ))}

        <div className="w-px h-4 bg-[#E9E9E7] mx-0.5" />

        <button
          onClick={() => setShowCeiling(!showCeiling)}
          className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 ${
            showCeiling ? 'bg-[#FAEBDD] text-[#D9730D] font-semibold' : 'text-[#787774]'
          }`}
        >
          {showCeiling ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>천장</span>
        </button>

        <button
          onClick={handleSnapshot}
          className="p-1.5 text-[#787774] hover:text-[#37352F] rounded-md"
          title="3D 스냅샷 저장"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
};
