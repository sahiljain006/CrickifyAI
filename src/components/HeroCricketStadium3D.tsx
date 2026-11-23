import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface HeroCricketStadium3DProps {
  className?: string;
  isCompactViewport?: boolean;
}

const LOOP_DURATION = 5.4;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function easeOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - c, 3);
}

function easeInOutQuad(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
}

function createOutfieldTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0D3621';
  ctx.fillRect(0, 0, size, size);

  // Mowed grass stripes
  const stripeCount = 24;
  const stripeW = size / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(20, 84, 48, 0.55)' : 'rgba(10, 44, 26, 0.55)';
    ctx.fillRect(i * stripeW, 0, stripeW, size);
  }

  // Subtle turf radial spotlight vignette
  const rad = ctx.createRadialGradient(size / 2, size / 2, size * 0.08, size / 2, size / 2, size * 0.5);
  rad.addColorStop(0, 'rgba(34, 128, 70, 0.25)');
  rad.addColorStop(0.65, 'rgba(10, 42, 24, 0.1)');
  rad.addColorStop(1, 'rgba(6, 19, 13, 0.85)');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, size, size);

  // Inner 30-yard fielding circle
  ctx.strokeStyle = 'rgba(240, 248, 242, 0.48)';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.23, 0, Math.PI * 2);
  ctx.stroke();

  // Outer boundary chalk line
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(247, 252, 248, 0.85)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.44, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function createPitchTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, '#937A54');
  grad.addColorStop(0.18, '#BEA476');
  grad.addColorStop(0.5, '#CBB183');
  grad.addColorStop(0.82, '#BEA476');
  grad.addColorStop(1, '#937A54');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle rolled soil texture & good-length wear marks
  for (let i = 0; i < 1800; i++) {
    const px = Math.random() * w;
    const py = Math.random() * h;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,244,220,0.08)' : 'rgba(72,56,34,0.1)';
    ctx.fillRect(px, py, 2 + Math.random() * 3, 2 + Math.random() * 6);
  }

  // Footmark scuff patches near both ends
  const patchGrad1 = ctx.createRadialGradient(w * 0.38, h * 0.16, 4, w * 0.38, h * 0.16, 36);
  patchGrad1.addColorStop(0, 'rgba(85, 66, 42, 0.35)');
  patchGrad1.addColorStop(1, 'rgba(85, 66, 42, 0)');
  ctx.fillStyle = patchGrad1;
  ctx.fillRect(0, 0, w, h * 0.3);

  const patchGrad2 = ctx.createRadialGradient(w * 0.6, h * 0.82, 4, w * 0.6, h * 0.82, 42);
  patchGrad2.addColorStop(0, 'rgba(85, 66, 42, 0.35)');
  patchGrad2.addColorStop(1, 'rgba(85, 66, 42, 0)');
  ctx.fillStyle = patchGrad2;
  ctx.fillRect(0, h * 0.65, w, h * 0.35);

  // Crisp white crease markings at both ends
  ctx.fillStyle = '#F8FAF7';
  ctx.fillRect(18, 42, w - 36, 5);
  ctx.fillRect(10, 96, w - 20, 6);
  ctx.fillRect(28, 22, 5, 92);
  ctx.fillRect(w - 33, 22, 5, 92);

  ctx.fillRect(18, h - 47, w - 36, 5);
  ctx.fillRect(10, h - 102, w - 20, 6);
  ctx.fillRect(28, h - 114, 5, 92);
  ctx.fillRect(w - 33, h - 114, 5, 92);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function createLeatherBallTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#B91C28');
  grad.addColorStop(0.5, '#96131D');
  grad.addColorStop(1, '#680B12');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const midY = size / 2;
  ctx.fillStyle = 'rgba(55, 6, 10, 0.45)';
  ctx.fillRect(0, midY - 9, size, 18);

  for (let x = 3; x < size; x += 12) {
    ctx.fillStyle = '#FAF6EB';
    ctx.fillRect(x, midY - 5, 6, 3);
    ctx.fillRect((x + 6) % size, midY + 2, 6, 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWillowBatTexture(): THREE.CanvasTexture {
  const w = 128;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, '#D8BA85');
  grad.addColorStop(0.5, '#EFE0BC');
  grad.addColorStop(1, '#CFAF77');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle vertical willow wood grain
  for (let x = 4; x < w; x += 9) {
    ctx.fillStyle = 'rgba(138, 102, 52, 0.14)';
    ctx.fillRect(x, 0, 2, h);
  }

  // CRICKIFY emerald & electric-lime sticker band
  ctx.fillStyle = '#103B2A';
  ctx.fillRect(10, h * 0.26, w - 20, h * 0.24);
  ctx.fillStyle = '#B7F34A';
  ctx.fillRect(10, h * 0.26, w - 20, 10);
  ctx.fillRect(10, h * 0.48, w - 20, 10);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStadiumStandsTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#07120D');
  bg.addColorStop(0.45, '#0F251B');
  bg.addColorStop(1, '#123123');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Tiered horizontal seating rows
  for (let y = 16; y < h - 22; y += 11) {
    ctx.fillStyle = 'rgba(183, 243, 74, 0.05)';
    ctx.fillRect(0, y, w, 2);
    for (let x = 4; x < w; x += 9) {
      if (Math.random() > 0.28) {
        const roll = Math.random();
        ctx.fillStyle =
          roll > 0.88
            ? 'rgba(183, 243, 74, 0.55)'
            : roll > 0.72
              ? 'rgba(255, 168, 76, 0.45)'
              : 'rgba(218, 232, 222, 0.26)';
        ctx.fillRect(x, y + 3, 4, 5);
      }
    }
  }

  // Lower LED perimeter advertising ribbon
  ctx.fillStyle = '#0D291C';
  ctx.fillRect(0, h - 20, w, 20);
  ctx.fillStyle = '#B7F34A';
  ctx.fillRect(0, h - 18, w, 3);
  for (let x = 20; x < w; x += 140) {
    ctx.fillStyle = 'rgba(183, 243, 74, 0.82)';
    ctx.fillRect(x, h - 11, 72, 4);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

export const HeroCricketStadium3D: React.FC<HeroCricketStadium3DProps> = ({
  className = '',
  isCompactViewport = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const compactRef = useRef(isCompactViewport);
  compactRef.current = isCompactViewport;
  const [fallbackActive, setFallbackActive] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobileInit =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(max-width: 767px)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      setFallbackActive(true);
      return;
    }

    const gl = renderer.getContext();
    const rendererInfo = String(gl?.getParameter(gl.RENDERER) || '');
    const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererInfo);

    const width = Math.max(240, container.clientWidth || 640);
    const height = Math.max(240, container.clientHeight || 480);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSoftwareGl ? 1 : isMobileInit ? 1.5 : 2));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x07120c, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !isSoftwareGl && !isMobileInit;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07120c);
    scene.fog = new THREE.FogExp2(0x07120c, 0.0145);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, isSoftwareGl ? 0.06 : 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.2, 160);

    const disposables: Array<{ dispose: () => void }> = [];
    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      disposables.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      disposables.push(m);
      return m;
    };
    const trackTex = <T extends THREE.Texture>(t: T): T => {
      disposables.push(t);
      return t;
    };

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xdaf0ff, 0x0e2a19, 0.72);
    scene.add(hemiLight);

    const stadiumKey = new THREE.DirectionalLight(0xfff1d6, 2.45);
    stadiumKey.position.set(13, 24, 16);
    if (renderer.shadowMap.enabled) {
      stadiumKey.castShadow = true;
      stadiumKey.shadow.mapSize.set(1024, 1024);
      stadiumKey.shadow.camera.near = 2;
      stadiumKey.shadow.camera.far = 65;
      stadiumKey.shadow.camera.left = -14;
      stadiumKey.shadow.camera.right = 14;
      stadiumKey.shadow.camera.top = 14;
      stadiumKey.shadow.camera.bottom = -14;
      stadiumKey.shadow.bias = -0.0008;
    }
    scene.add(stadiumKey);

    const limeRimLight = new THREE.DirectionalLight(0xb7f34a, 1.55);
    limeRimLight.position.set(-15, 11, -14);
    scene.add(limeRimLight);

    const creaseAccentLight = new THREE.PointLight(0xffca7a, 5.2, 22, 1.4);
    creaseAccentLight.position.set(1.8, 3.6, 8.8);
    scene.add(creaseAccentLight);

    // Textures
    const outfieldTex = trackTex(createOutfieldTexture());
    const pitchTex = trackTex(createPitchTexture());
    const ballTex = trackTex(createLeatherBallTexture());
    const willowTex = trackTex(createWillowBatTexture());
    const standsTex = trackTex(createStadiumStandsTexture());

    // 1. Stadium Outfield & 22-Yard Pitch
    const outfieldGeo = trackGeo(new THREE.CircleGeometry(48, 64));
    const outfieldMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: outfieldTex,
        roughness: 0.9,
        metalness: 0.0,
      })
    );
    const outfieldMesh = new THREE.Mesh(outfieldGeo, outfieldMat);
    outfieldMesh.rotation.x = -Math.PI / 2;
    outfieldMesh.receiveShadow = renderer.shadowMap.enabled;
    scene.add(outfieldMesh);

    const pitchGeo = trackGeo(new THREE.PlaneGeometry(3.1, 21.5));
    const pitchMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: pitchTex,
        roughness: 0.86,
        metalness: 0.0,
      })
    );
    const pitchMesh = new THREE.Mesh(pitchGeo, pitchMat);
    pitchMesh.rotation.x = -Math.PI / 2;
    pitchMesh.position.y = 0.015;
    pitchMesh.receiveShadow = renderer.shadowMap.enabled;
    scene.add(pitchMesh);

    // Boundary rope
    const boundaryRopeGeo = trackGeo(new THREE.TorusGeometry(23.5, 0.12, 8, 96));
    const boundaryRopeMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xb7f34a,
        emissive: 0x2c4e10,
        emissiveIntensity: 0.45,
        roughness: 0.5,
      })
    );
    const boundaryRope = new THREE.Mesh(boundaryRopeGeo, boundaryRopeMat);
    boundaryRope.rotation.x = Math.PI / 2;
    boundaryRope.position.y = 0.1;
    scene.add(boundaryRope);

    // 2. Stadium Tiered Bowl & Crowd
    const bowlGeo = trackGeo(new THREE.CylinderGeometry(47, 29, 12.5, 64, 1, true));
    const bowlMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: standsTex,
        side: THREE.BackSide,
        roughness: 0.85,
        metalness: 0.05,
      })
    );
    const bowlMesh = new THREE.Mesh(bowlGeo, bowlMat);
    bowlMesh.position.y = 6.2;
    scene.add(bowlMesh);

    // Upper Stadium Roof Canopy Ring
    const roofRingGeo = trackGeo(new THREE.TorusGeometry(45, 2.2, 8, 64));
    const roofRingMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x10221a,
        roughness: 0.48,
        metalness: 0.4,
      })
    );
    const roofRing = new THREE.Mesh(roofRingGeo, roofRingMat);
    roofRing.rotation.x = Math.PI / 2;
    roofRing.position.y = 13.0;
    scene.add(roofRing);

    // Instanced Stadium Flash / Crowd Sparkle Nodes around upper tier
    const sparkleCount = 240;
    const sparkleGeo = trackGeo(new THREE.SphereGeometry(0.14, 6, 6));
    const sparkleMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const sparkleInstances = new THREE.InstancedMesh(sparkleGeo, sparkleMat, sparkleCount);
    const dummy = new THREE.Object3D();
    const sparkleColor = new THREE.Color();
    for (let i = 0; i < sparkleCount; i++) {
      const ang = (i / sparkleCount) * Math.PI * 2 + (i % 5) * 0.03;
      const radius = 33 + (i % 7) * 1.9;
      const elevation = 2.6 + (i % 7) * 1.35;
      dummy.position.set(Math.cos(ang) * radius, elevation, Math.sin(ang) * radius);
      dummy.scale.setScalar(0.75 + (i % 3) * 0.35);
      dummy.updateMatrix();
      sparkleInstances.setMatrixAt(i, dummy.matrix);
      if (i % 5 === 0) sparkleColor.setHex(0xb7f34a);
      else if (i % 7 === 0) sparkleColor.setHex(0xffb56b);
      else sparkleColor.setHex(0xdceee2);
      sparkleInstances.setColorAt(i, sparkleColor);
    }
    sparkleInstances.instanceMatrix.needsUpdate = true;
    if (sparkleInstances.instanceColor) sparkleInstances.instanceColor.needsUpdate = true;
    scene.add(sparkleInstances);

    // 3. Four Floodlight Towers with Animated Glow + Light Cones
    const floodlightMaterials: THREE.MeshStandardMaterial[] = [];
    const floodlightBeamMaterials: THREE.MeshBasicMaterial[] = [];
    const towerCoords: Array<[number, number]> = [
      [-28, -28],
      [28, -28],
      [-29, 25],
      [29, 25],
    ];
    const pylonGeo = trackGeo(new THREE.CylinderGeometry(0.45, 0.85, 24, 10));
    const pylonMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x1b2b23, metalness: 0.72, roughness: 0.36 }));
    const rackGeo = trackGeo(new THREE.BoxGeometry(5.6, 2.8, 0.55));
    const bankGeo = trackGeo(new THREE.PlaneGeometry(5.0, 2.2));
    const beamGeo = trackGeo(new THREE.ConeGeometry(8.5, 32, 18, 1, true));
    beamGeo.translate(0, -16, 0);

    towerCoords.forEach(([tx, tz]) => {
      const tower = new THREE.Group();
      tower.position.set(tx, 0, tz);

      const pylon = new THREE.Mesh(pylonGeo, pylonMat);
      pylon.position.y = 12;
      tower.add(pylon);

      const head = new THREE.Group();
      head.position.y = 23.6;
      head.lookAt(0 - tx, 1 - 23.6, 5 - tz);

      const rack = new THREE.Mesh(rackGeo, pylonMat);
      head.add(rack);

      const lampMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xfff5d6,
          emissiveIntensity: prefersReducedMotion ? 2.5 : 0.4,
          roughness: 0.2,
        })
      );
      floodlightMaterials.push(lampMat);

      const lampFace = new THREE.Mesh(bankGeo, lampMat);
      lampFace.position.z = 0.32;
      head.add(lampFace);

      const beamMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xe8ffd1,
          transparent: true,
          opacity: prefersReducedMotion ? 0.065 : 0.01,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      floodlightBeamMaterials.push(beamMat);

      const beamCone = new THREE.Mesh(beamGeo, beamMat);
      beamCone.rotation.x = Math.PI / 2;
      head.add(beamCone);

      tower.add(head);
      scene.add(tower);
    });

    // 4. Cricket Stumps & Bails (Striker z=+9.2, Bowler z=-9.2)
    const stumpWoodMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xf4c878,
        roughness: 0.38,
        metalness: 0.06,
      })
    );
    const stumpGeo = trackGeo(new THREE.CylinderGeometry(0.024, 0.026, 0.74, 10));
    const bailGeo = trackGeo(new THREE.CylinderGeometry(0.011, 0.011, 0.115, 8));

    const buildStumpSet = (zPos: number) => {
      const group = new THREE.Group();
      group.position.set(0, 0.015, zPos);
      [-0.115, 0, 0.115].forEach((sx) => {
        const s = new THREE.Mesh(stumpGeo, stumpWoodMat);
        s.position.set(sx, 0.37, 0);
        s.castShadow = renderer.shadowMap.enabled;
        group.add(s);
      });
      [-0.058, 0.058].forEach((bx) => {
        const b = new THREE.Mesh(bailGeo, stumpWoodMat);
        b.rotation.z = Math.PI / 2;
        b.position.set(bx, 0.75, 0);
        group.add(b);
      });
      scene.add(group);
      return group;
    };
    buildStumpSet(9.2);
    buildStumpSet(-9.2);

    // 5. Full Articulated Multi-Part 3D Batsman
    const jerseyMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x103b2a, roughness: 0.56, metalness: 0.06 })
    );
    const limeTrimMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xb7f34a,
        emissive: 0x3b5d10,
        emissiveIntensity: 0.35,
        roughness: 0.4,
      })
    );
    const trouserMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x16261e, roughness: 0.65, metalness: 0.04 })
    );
    const padMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xf3f7ef, roughness: 0.34, metalness: 0.05 })
    );
    const shoeMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x111815, roughness: 0.42, metalness: 0.15 })
    );
    const skinMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xc28a62, roughness: 0.55, metalness: 0.02 })
    );
    const helmetMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x0c2f21,
        roughness: 0.24,
        metalness: 0.2,
        clearcoat: 0.7,
        clearcoatRoughness: 0.16,
      })
    );
    const grilleMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xc8d2ce, metalness: 0.85, roughness: 0.25 })
    );
    const batGripMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x102a1f, roughness: 0.78 })
    );
    const batWillowMat = trackMat(
      new THREE.MeshStandardMaterial({ map: willowTex, roughness: 0.4, metalness: 0.04 })
    );

    const batsmanRoot = new THREE.Group();
    batsmanRoot.position.set(-0.28, 0.015, 8.28);
    // Rotate +86 deg around +Y: local +X points toward bowler (-Z), local +Z faces off-side (+X)
    batsmanRoot.rotation.y = Math.PI * 0.48;

    const pelvisPivot = new THREE.Group();
    pelvisPivot.position.y = 0.94;
    batsmanRoot.add(pelvisPivot);

    const pelvisMesh = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.165, 0.155, 0.18, 12)), trouserMat);
    pelvisMesh.castShadow = renderer.shadowMap.enabled;
    pelvisPivot.add(pelvisMesh);

    const buildLeg = (side: -1 | 1) => {
      const hip = new THREE.Group();
      hip.position.set(side * 0.11, -0.04, 0);

      const thigh = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.088, 0.072, 0.42, 10)), trouserMat);
      thigh.position.y = -0.21;
      thigh.castShadow = renderer.shadowMap.enabled;
      hip.add(thigh);

      const knee = new THREE.Group();
      knee.position.y = -0.43;
      hip.add(knee);

      const padShin = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.145, 0.44, 0.14)), padMat);
      padShin.position.set(0, -0.21, 0.025);
      padShin.castShadow = renderer.shadowMap.enabled;
      knee.add(padShin);

      const kneeRoll = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.082, 10, 10)), padMat);
      kneeRoll.position.set(0, 0.01, 0.035);
      knee.add(kneeRoll);

      const padStripe = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.148, 0.04, 0.145)), limeTrimMat);
      padStripe.position.set(0, -0.1, 0.025);
      knee.add(padStripe);

      const shoe = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.21, 0.08, 0.105)), shoeMat);
      shoe.position.set(0.03, -0.45, 0.02);
      shoe.castShadow = renderer.shadowMap.enabled;
      knee.add(shoe);

      return { hip, knee };
    };

    const frontLeg = buildLeg(1);
    const backLeg = buildLeg(-1);
    pelvisPivot.add(frontLeg.hip, backLeg.hip);

    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 0.09;
    pelvisPivot.add(torsoGroup);

    const chest = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.205, 0.165, 0.5, 14)), jerseyMat);
    chest.position.y = 0.25;
    chest.castShadow = renderer.shadowMap.enabled;
    torsoGroup.add(chest);

    const chestTrim = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.035, 0.28)), limeTrimMat);
    chestTrim.position.set(0, 0.38, 0);
    torsoGroup.add(chestTrim);

    const headGroup = new THREE.Group();
    headGroup.position.y = 0.54;
    torsoGroup.add(headGroup);

    const neck = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.058, 0.064, 0.11, 10)), skinMat);
    neck.position.y = 0.04;
    headGroup.add(neck);

    const headSphere = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.112, 16, 16)), skinMat);
    headSphere.position.y = 0.16;
    headGroup.add(headSphere);

    const helmetShell = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.128, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62)),
      helmetMat
    );
    helmetShell.position.set(0, 0.175, -0.005);
    helmetShell.castShadow = renderer.shadowMap.enabled;
    headGroup.add(helmetShell);

    const helmetPeak = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.016, 0.11)), limeTrimMat);
    helmetPeak.position.set(0, 0.19, 0.11);
    helmetPeak.rotation.x = 0.18;
    headGroup.add(helmetPeak);

    const grilleBar1 = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.108, 0.006, 6, 18, Math.PI * 0.72)), grilleMat);
    grilleBar1.rotation.set(Math.PI / 2, 0, Math.PI * 0.14);
    grilleBar1.position.set(0, 0.135, 0.045);
    headGroup.add(grilleBar1);

    const grilleBar2 = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.104, 0.006, 6, 18, Math.PI * 0.68)), grilleMat);
    grilleBar2.rotation.set(Math.PI / 2, 0, Math.PI * 0.16);
    grilleBar2.position.set(0, 0.105, 0.045);
    headGroup.add(grilleBar2);

    const buildArm = (side: -1 | 1) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.23, 0.45, 0);

      const upperArm = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.056, 0.048, 0.28, 10)), jerseyMat);
      upperArm.position.y = -0.14;
      upperArm.castShadow = renderer.shadowMap.enabled;
      shoulder.add(upperArm);

      const elbow = new THREE.Group();
      elbow.position.y = -0.28;
      shoulder.add(elbow);

      const forearm = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.046, 0.038, 0.26, 10)), skinMat);
      forearm.position.y = -0.13;
      elbow.add(forearm);

      const glove = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.082, 0.11, 0.095)), padMat);
      glove.position.set(0, -0.27, 0.02);
      elbow.add(glove);

      const cuff = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.088, 0.035, 0.1)), limeTrimMat);
      cuff.position.set(0, -0.21, 0.02);
      elbow.add(cuff);

      return { shoulder, elbow };
    };

    const frontArm = buildArm(1);
    const backArm = buildArm(-1);
    torsoGroup.add(frontArm.shoulder, backArm.shoulder);

    const batGroup = new THREE.Group();
    batGroup.position.set(0, -0.27, 0.04);

    const batHandle = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.019, 0.021, 0.3, 10)), batGripMat);
    batHandle.position.y = -0.1;
    batGroup.add(batHandle);

    const batBlade = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.038, 0.64, 0.118)), batWillowMat);
    batBlade.position.y = -0.55;
    batBlade.castShadow = renderer.shadowMap.enabled;
    batGroup.add(batBlade);

    const batSpine = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.024, 0.58, 0.048)), batWillowMat);
    batSpine.position.set(-0.022, -0.54, 0);
    batGroup.add(batSpine);

    frontArm.elbow.add(batGroup);
    scene.add(batsmanRoot);

    // 5b. Articulated 3D Bowler at Bowler's End (Runs up, bowls over the wicket, follows through)
    const bowlerJerseyMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x183454, roughness: 0.54, metalness: 0.08 })
    );
    const bowlerTrouserMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x112238, roughness: 0.64, metalness: 0.05 })
    );
    const bowlerAccentMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xff941f,
        emissive: 0x5c2c00,
        emissiveIntensity: 0.35,
        roughness: 0.42,
      })
    );
    const bowlerHairMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x1b1714, roughness: 0.78 })
    );

    const bowlerRoot = new THREE.Group();
    bowlerRoot.position.set(0.56, 0.015, -14.2);

    const bowlerPelvis = new THREE.Group();
    bowlerPelvis.position.y = 0.94;
    bowlerRoot.add(bowlerPelvis);

    const bowlerPelvisMesh = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.158, 0.148, 0.18, 12)),
      bowlerTrouserMat
    );
    bowlerPelvisMesh.castShadow = renderer.shadowMap.enabled;
    bowlerPelvis.add(bowlerPelvisMesh);

    const buildBowlerLeg = (sideX: -1 | 1) => {
      const hip = new THREE.Group();
      hip.position.set(sideX * 0.105, -0.04, 0);

      const thigh = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.082, 0.068, 0.42, 10)),
        bowlerTrouserMat
      );
      thigh.position.y = -0.21;
      thigh.castShadow = renderer.shadowMap.enabled;
      hip.add(thigh);

      const knee = new THREE.Group();
      knee.position.y = -0.43;
      hip.add(knee);

      const shin = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.066, 0.05, 0.43, 10)),
        bowlerTrouserMat
      );
      shin.position.y = -0.21;
      shin.castShadow = renderer.shadowMap.enabled;
      knee.add(shin);

      const bowlerShoe = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.105, 0.08, 0.21)),
        padMat
      );
      bowlerShoe.position.set(0, -0.445, 0.03);
      bowlerShoe.castShadow = renderer.shadowMap.enabled;
      knee.add(bowlerShoe);

      return { hip, knee };
    };

    // Facing +Z: local -X is bowler's right side, +X is bowler's left side
    const bowlerRightLeg = buildBowlerLeg(-1);
    const bowlerLeftLeg = buildBowlerLeg(1);
    bowlerPelvis.add(bowlerRightLeg.hip, bowlerLeftLeg.hip);

    const bowlerTorso = new THREE.Group();
    bowlerTorso.position.y = 0.09;
    bowlerPelvis.add(bowlerTorso);

    const bowlerChest = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.198, 0.158, 0.5, 14)),
      bowlerJerseyMat
    );
    bowlerChest.position.y = 0.25;
    bowlerChest.castShadow = renderer.shadowMap.enabled;
    bowlerTorso.add(bowlerChest);

    const bowlerChestStripe = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.31, 0.04, 0.27)),
      bowlerAccentMat
    );
    bowlerChestStripe.position.set(0, 0.37, 0);
    bowlerTorso.add(bowlerChestStripe);

    const bowlerHead = new THREE.Group();
    bowlerHead.position.y = 0.54;
    bowlerTorso.add(bowlerHead);

    const bowlerNeck = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.056, 0.062, 0.11, 10)),
      skinMat
    );
    bowlerNeck.position.y = 0.04;
    bowlerHead.add(bowlerNeck);

    const bowlerSkull = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.11, 16, 16)),
      skinMat
    );
    bowlerSkull.position.y = 0.16;
    bowlerSkull.castShadow = renderer.shadowMap.enabled;
    bowlerHead.add(bowlerSkull);

    const bowlerHair = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.116, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.55)),
      bowlerHairMat
    );
    bowlerHair.position.set(0, 0.172, -0.01);
    bowlerHead.add(bowlerHair);

    const bowlerHeadband = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.115, 0.115, 0.026, 16, 1, true)),
      bowlerAccentMat
    );
    bowlerHeadband.position.set(0, 0.19, 0);
    bowlerHead.add(bowlerHeadband);

    const buildBowlerArm = (sideX: -1 | 1) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(sideX * 0.22, 0.45, 0);

      const upperArm = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.052, 0.044, 0.28, 10)),
        bowlerJerseyMat
      );
      upperArm.position.y = -0.14;
      upperArm.castShadow = renderer.shadowMap.enabled;
      shoulder.add(upperArm);

      const elbow = new THREE.Group();
      elbow.position.y = -0.28;
      shoulder.add(elbow);

      const forearm = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.043, 0.036, 0.26, 10)),
        skinMat
      );
      forearm.position.y = -0.13;
      elbow.add(forearm);

      const wristBand = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.042, 0.042, 0.045, 10)),
        bowlerAccentMat
      );
      wristBand.position.y = -0.22;
      elbow.add(wristBand);

      const hand = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.042, 10, 10)),
        skinMat
      );
      hand.position.y = -0.265;
      elbow.add(hand);

      return { shoulder, elbow };
    };

    const bowlerRightArm = buildBowlerArm(-1);
    const bowlerLeftArm = buildBowlerArm(1);
    bowlerTorso.add(bowlerRightArm.shoulder, bowlerLeftArm.shoulder);

    scene.add(bowlerRoot);

    // 6. Red Stitched Cricket Ball + Sweet-Spot Impact Burst
    const ballGroup = new THREE.Group();
    const ballMesh = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.072, 20, 20)),
      trackMat(
        new THREE.MeshPhysicalMaterial({
          map: ballTex,
          roughness: 0.32,
          metalness: 0.04,
          clearcoat: 0.65,
          clearcoatRoughness: 0.2,
        })
      )
    );
    ballMesh.castShadow = renderer.shadowMap.enabled;
    ballGroup.add(ballMesh);

    const ballGlowMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xff6b4a,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const ballGlow = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.135, 14, 14)), ballGlowMat);
    ballGroup.add(ballGlow);
    scene.add(ballGroup);

    const impactRingMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xb7f34a,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    const impactRing = new THREE.Mesh(trackGeo(new THREE.RingGeometry(0.14, 0.24, 32)), impactRingMat);
    impactRing.position.set(-0.06, 0.56, 7.65);
    impactRing.rotation.y = 0.55;
    scene.add(impactRing);

    const pointerTarget = { x: 0, y: 0 };
    const pointerSmooth = { x: 0, y: 0 };
    const camTargetPos = new THREE.Vector3();
    const camLookTarget = new THREE.Vector3();

    const applyAnimationFrame = (totalSeconds: number, phaseSeconds: number) => {
      const lightRamp = prefersReducedMotion ? 1 : easeOutCubic(Math.min(1, totalSeconds / 1.6));
      const targetIntensity = 0.45 + lightRamp * 2.25;
      const targetBeamOpacity = 0.015 + lightRamp * 0.065;
      for (let i = 0; i < floodlightMaterials.length; i++) {
        floodlightMaterials[i].emissiveIntensity = targetIntensity;
        floodlightBeamMaterials[i].opacity = targetBeamOpacity;
      }

      const strideIn = smoothstep(1.22, 2.15, phaseSeconds);
      const resetBack = smoothstep(4.2, 5.15, phaseSeconds);
      const stride = strideIn * (1 - resetBack);

      const swingActive = smoothstep(1.92, 2.34, phaseSeconds);
      const swingFollow = smoothstep(2.34, 2.75, phaseSeconds);
      const swingProgress = (swingActive * 0.65 + swingFollow * 0.35) * (1 - resetBack);

      pelvisPivot.position.y = 0.94 - stride * 0.14;
      pelvisPivot.position.x = stride * 0.38;
      pelvisPivot.rotation.y = -stride * 0.18 + swingProgress * 0.22;

      frontLeg.hip.rotation.z = stride * 0.56;
      frontLeg.knee.rotation.z = -stride * 0.52;
      backLeg.hip.rotation.z = -stride * 0.38;
      backLeg.knee.rotation.z = -stride * 0.14;

      torsoGroup.rotation.z = -stride * 0.22;
      torsoGroup.rotation.y = 0.15 - swingProgress * 0.42;
      headGroup.rotation.y = 0.88 - swingProgress * 0.18;
      headGroup.rotation.x = 0.06;

      const backlift = smoothstep(0.25, 1.8, phaseSeconds) * (1 - smoothstep(1.92, 2.32, phaseSeconds)) * (1 - resetBack);

      frontArm.shoulder.rotation.z = -0.35 - backlift * 0.95 + swingProgress * 1.48;
      frontArm.shoulder.rotation.x = 0.22 - swingProgress * 0.28;
      frontArm.elbow.rotation.z = 0.42 + backlift * 0.35 - swingProgress * 0.25;

      backArm.shoulder.rotation.z = -0.15 - backlift * 0.72 + swingProgress * 1.25;
      backArm.shoulder.rotation.x = 0.32 - swingProgress * 0.24;
      backArm.elbow.rotation.z = 0.65 - swingProgress * 0.35;

      batGroup.rotation.z = -0.55 - backlift * 0.82 + swingProgress * 1.38;
      batGroup.rotation.x = 0.14 - swingProgress * 0.22;

      const contactTime = 2.28;
      const bounceTime = 1.68;

      if (phaseSeconds < bounceTime) {
        const u = easeInOutQuad(phaseSeconds / bounceTime);
        ballGroup.position.x = THREE.MathUtils.lerp(0.18, -0.1, u);
        ballGroup.position.z = THREE.MathUtils.lerp(-9.2, 4.6, u);
        ballGroup.position.y = (1 - u) * 1.95 + u * 0.085 + Math.sin(u * Math.PI) * 0.55;
        ballMesh.rotation.x -= 0.28;
        ballGroup.visible = phaseSeconds > 0.12;
      } else if (phaseSeconds < contactTime) {
        const u = (phaseSeconds - bounceTime) / (contactTime - bounceTime);
        ballGroup.position.x = THREE.MathUtils.lerp(-0.1, -0.06, u);
        ballGroup.position.z = THREE.MathUtils.lerp(4.6, 7.65, u);
        ballGroup.position.y = THREE.MathUtils.lerp(0.085, 0.56, easeOutCubic(u));
        ballMesh.rotation.x -= 0.34;
        ballGroup.visible = true;
      } else if (phaseSeconds < 4.45) {
        const u = Math.min(1, (phaseSeconds - contactTime) / 2.05);
        ballGroup.position.x = THREE.MathUtils.lerp(-0.06, 16.5, u);
        ballGroup.position.z = THREE.MathUtils.lerp(7.65, -15.0, u);
        ballGroup.position.y = 0.56 + Math.sin(u * Math.PI * 0.88) * 3.1 + u * 0.45;
        ballMesh.rotation.y += 0.42;
        ballMesh.rotation.z -= 0.25;
        ballGroup.visible = phaseSeconds < 4.32;
      } else {
        ballGroup.visible = false;
      }

      if (phaseSeconds >= contactTime && phaseSeconds < contactTime + 0.58) {
        const burstU = (phaseSeconds - contactTime) / 0.58;
        impactRingMat.opacity = (1 - burstU) * 0.88;
        impactRing.scale.setScalar(1 + burstU * 4.4);
      } else {
        impactRingMat.opacity = 0;
      }

      // Bowler animation synchronized to ball release at phaseSeconds = 0.13
      const releaseTime = 0.13;
      const runStart = 4.25;
      const runDuration = LOOP_DURATION - runStart + releaseTime; // 1.28s

      if (phaseSeconds >= runStart || phaseSeconds <= releaseTime) {
        const elapsedRun = phaseSeconds >= runStart ? phaseSeconds - runStart : LOOP_DURATION - runStart + phaseSeconds;
        const p = Math.max(0, Math.min(1, elapsedRun / runDuration));
        const gather = smoothstep(0.68, 1.0, p);
        const strideWave = Math.sin(p * Math.PI * 3.5) * (1 - gather * 0.45);

        bowlerRoot.position.z = THREE.MathUtils.lerp(-14.2, -9.35, easeInOutQuad(p));
        bowlerRoot.position.x = THREE.MathUtils.lerp(0.56, 0.41, p);
        bowlerRoot.rotation.y = gather * -0.18;

        bowlerPelvis.position.y = 0.94 - gather * 0.08 + Math.abs(strideWave) * 0.03;
        bowlerTorso.rotation.x = 0.14 + gather * 0.1;
        bowlerTorso.rotation.y = gather * -0.25;
        bowlerHead.rotation.y = gather * 0.2;

        bowlerRightLeg.hip.rotation.x = strideWave * 0.55 - gather * 0.38;
        bowlerRightLeg.knee.rotation.x = -Math.max(0, -strideWave) * 0.55 - gather * 0.25;
        bowlerLeftLeg.hip.rotation.x = -strideWave * 0.55 + gather * 0.52;
        bowlerLeftLeg.knee.rotation.x = -Math.max(0, strideWave) * 0.55 - gather * 0.18;

        // Bowling right arm sweeps back and overhead to -PI right at releaseTime
        const armWind = smoothstep(0.55, 1.0, p);
        bowlerRightArm.shoulder.rotation.x = THREE.MathUtils.lerp(strideWave * 0.55, -Math.PI, armWind);
        bowlerRightArm.shoulder.rotation.z = -0.1 - armWind * 0.08;
        bowlerRightArm.elbow.rotation.x = 0.25 * (1 - armWind);

        bowlerLeftArm.shoulder.rotation.x = THREE.MathUtils.lerp(-strideWave * 0.55, -1.05, armWind);
        bowlerLeftArm.elbow.rotation.x = 0.42;
      } else if (phaseSeconds <= 1.25) {
        const p = (phaseSeconds - releaseTime) / (1.25 - releaseTime);
        const settle = smoothstep(0.5, 1.0, p);
        const followSwing = easeOutCubic(Math.min(1, p / 0.58));

        bowlerRoot.position.z = THREE.MathUtils.lerp(-9.35, -7.55, easeOutCubic(p));
        bowlerRoot.position.x = THREE.MathUtils.lerp(0.41, 0.65, easeOutCubic(p));
        bowlerRoot.rotation.y = THREE.MathUtils.lerp(-0.18, 0.08, settle);

        bowlerPelvis.position.y = 0.94 - (1 - settle) * 0.08;
        bowlerTorso.rotation.x = THREE.MathUtils.lerp(0.24, 0.08, settle);
        bowlerTorso.rotation.y = THREE.MathUtils.lerp(-0.25, 0.22, followSwing) * (1 - settle * 0.6);
        bowlerHead.rotation.y = THREE.MathUtils.lerp(0.2, -0.1, settle);

        const stepWave = Math.sin(p * Math.PI * 2) * (1 - settle);
        bowlerRightLeg.hip.rotation.x = stepWave * 0.45;
        bowlerRightLeg.knee.rotation.x = -Math.abs(stepWave) * 0.35;
        bowlerLeftLeg.hip.rotation.x = -stepWave * 0.45;
        bowlerLeftLeg.knee.rotation.x = -Math.abs(stepWave) * 0.25;

        const whipArm = THREE.MathUtils.lerp(-Math.PI, -Math.PI * 1.85, followSwing);
        bowlerRightArm.shoulder.rotation.x = THREE.MathUtils.lerp(whipArm, -0.15, settle);
        bowlerRightArm.shoulder.rotation.z = THREE.MathUtils.lerp(-0.18, -0.1, settle);
        bowlerRightArm.elbow.rotation.x = settle * 0.35;

        bowlerLeftArm.shoulder.rotation.x = THREE.MathUtils.lerp(-1.05, 0.22, settle);
        bowlerLeftArm.elbow.rotation.x = 0.42;
      } else if (phaseSeconds <= 2.75) {
        const watchTurn = smoothstep(2.1, 2.55, phaseSeconds) * (1 - smoothstep(2.55, 2.75, phaseSeconds));
        bowlerRoot.position.z = -7.55;
        bowlerRoot.position.x = 0.65;
        bowlerRoot.rotation.y = 0.08 * (1 - smoothstep(2.45, 2.75, phaseSeconds));

        bowlerPelvis.position.y = 0.94;
        bowlerTorso.rotation.x = 0.08 * (1 - smoothstep(2.45, 2.75, phaseSeconds));
        bowlerTorso.rotation.y = 0.088 - watchTurn * 0.32;
        bowlerHead.rotation.y = -0.1 - watchTurn * 0.35;

        bowlerRightLeg.hip.rotation.x = 0;
        bowlerRightLeg.knee.rotation.x = 0;
        bowlerLeftLeg.hip.rotation.x = 0;
        bowlerLeftLeg.knee.rotation.x = 0;

        bowlerRightArm.shoulder.rotation.x = -0.15 * (1 - smoothstep(2.45, 2.75, phaseSeconds));
        bowlerRightArm.shoulder.rotation.z = -0.1;
        bowlerRightArm.elbow.rotation.x = 0.35;
        bowlerLeftArm.shoulder.rotation.x = 0.22 * (1 - smoothstep(2.45, 2.75, phaseSeconds));
        bowlerLeftArm.elbow.rotation.x = 0.42;
      } else {
        const p = (phaseSeconds - 2.75) / (runStart - 2.75);
        const env = Math.sin(p * Math.PI);
        const turnBack = smoothstep(0.0, 0.22, p) * (1 - smoothstep(0.78, 1.0, p));
        const jogStride = Math.sin(p * Math.PI * 4.0) * env;

        bowlerRoot.position.z = THREE.MathUtils.lerp(-7.55, -14.2, easeInOutQuad(p));
        bowlerRoot.position.x = THREE.MathUtils.lerp(0.65, 0.56, p);
        bowlerRoot.rotation.y = turnBack * Math.PI;

        bowlerPelvis.position.y = 0.94 + Math.abs(jogStride) * 0.025;
        bowlerTorso.rotation.x = 0.1 * env + (1 - env) * (p > 0.5 ? 0.14 : 0);
        bowlerTorso.rotation.y = (1 - p) * 0.088 * (1 - turnBack);
        bowlerHead.rotation.y = -0.1 * (1 - turnBack) * (1 - p);

        bowlerRightLeg.hip.rotation.x = jogStride * 0.42;
        bowlerRightLeg.knee.rotation.x = -Math.max(0, -jogStride) * 0.42;
        bowlerLeftLeg.hip.rotation.x = -jogStride * 0.42;
        bowlerLeftLeg.knee.rotation.x = -Math.max(0, jogStride) * 0.42;

        bowlerRightArm.shoulder.rotation.x = -jogStride * 0.42;
        bowlerRightArm.shoulder.rotation.z = -0.1;
        bowlerRightArm.elbow.rotation.x = 0.32;
        bowlerLeftArm.shoulder.rotation.x = jogStride * 0.42;
        bowlerLeftArm.elbow.rotation.x = 0.38;
      }

      const swoop = prefersReducedMotion ? 1 : easeOutCubic(Math.min(1, totalSeconds / 2.2));
      const compact = compactRef.current;

      if (compact) {
        camTargetPos.set(
          THREE.MathUtils.lerp(6.8, 3.0, swoop) + pointerSmooth.x * 0.45,
          THREE.MathUtils.lerp(6.5, 3.25, swoop) - pointerSmooth.y * 0.2,
          THREE.MathUtils.lerp(20.5, 15.8, swoop)
        );
        camLookTarget.set(0.0, 0.85, 6.2);
      } else {
        camTargetPos.set(
          THREE.MathUtils.lerp(8.2, 4.15, swoop) + pointerSmooth.x * 0.65,
          THREE.MathUtils.lerp(5.8, 2.55, swoop) - pointerSmooth.y * 0.24,
          THREE.MathUtils.lerp(19.2, 13.4, swoop)
        );
        camLookTarget.set(-1.85, 1.12, 5.8);
      }

      camera.position.copy(camTargetPos);
      camera.lookAt(camLookTarget);
    };

    applyAnimationFrame(prefersReducedMotion ? 2.28 : 0.45, prefersReducedMotion ? 2.28 : 0.45);
    renderer.render(scene, camera);

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || compactRef.current) return;
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerTarget.x = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width - 0.5) * 2));
      pointerTarget.y = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height - 0.5) * 2));
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(200, Math.floor(entry.contentRect.width));
      const h = Math.max(200, Math.floor(entry.contentRect.height));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      if (prefersReducedMotion) renderer.render(scene, camera);
    });
    resizeObserver.observe(container);

    let isVisible = true;
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setFallbackActive(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    let rafId = 0;
    let pacingTimer: number | null = null;
    let lastTime = performance.now();
    let totalElapsed = 0;
    let disposed = false;

    const gl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext ? gl : null;
    const scheduleAfterGpu = (fn: () => void) => {
      if (disposed) return;
      if (!isSoftwareGl) {
        rafId = window.requestAnimationFrame(fn);
        return;
      }
      if (gl2) {
        const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (sync) {
          gl2.flush();
          const pollSync = () => {
            if (disposed) {
              gl2.deleteSync(sync);
              return;
            }
            const status = gl2.clientWaitSync(sync, 0, 0);
            if (status === gl2.ALREADY_SIGNALED || status === gl2.CONDITION_SATISFIED || status === gl2.WAIT_FAILED) {
              gl2.deleteSync(sync);
              pacingTimer = window.setTimeout(() => {
                if (!disposed) rafId = window.requestAnimationFrame(fn);
              }, 100);
            } else {
              pacingTimer = window.setTimeout(pollSync, 24);
            }
          };
          pacingTimer = window.setTimeout(pollSync, 24);
          return;
        }
      }
      pacingTimer = window.setTimeout(() => {
        if (!disposed) rafId = window.requestAnimationFrame(fn);
      }, 100);
    };

    const tick = (now?: number) => {
      if (disposed || prefersReducedMotion) return;
      const timestamp = typeof now === 'number' ? now : performance.now();
      const dt = Math.min(Math.max(0.001, (timestamp - lastTime) / 1000), 0.05);
      lastTime = timestamp;

      if (isVisible && !document.hidden) {
        totalElapsed += dt;
        pointerSmooth.x += (pointerTarget.x - pointerSmooth.x) * 0.06;
        pointerSmooth.y += (pointerTarget.y - pointerSmooth.y) * 0.06;

        const phase = totalElapsed % LOOP_DURATION;
        applyAnimationFrame(totalElapsed, phase);
        renderer.render(scene, camera);
      }

      scheduleAfterGpu(() => tick());
    };

    if (!prefersReducedMotion) {
      rafId = window.requestAnimationFrame((t) => tick(t));
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      if (pacingTimer !== null) window.clearTimeout(pacingTimer);
      window.removeEventListener('pointermove', handlePointerMove);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);

      for (const item of disposables) {
        item.dispose();
      }
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (fallbackActive) {
    return (
      <div
        className={`w-full h-full bg-gradient-to-br from-[#07120C] via-[#103B2A] to-[#08150F] ${className}`}
        aria-hidden="true"
      />
    );
  }

  return <div ref={containerRef} className={`w-full h-full ${className}`} aria-hidden="true" />;
};
