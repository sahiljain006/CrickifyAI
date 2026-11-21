import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface HeroCricketBall3DProps {
  className?: string;
}

function createLeatherTextures(): {
  colorTex: THREE.CanvasTexture;
  bumpTex: THREE.CanvasTexture;
} {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  // Rich crimson leather gradient
  const grad = cCtx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#A51822');
  grad.addColorStop(0.45, '#8E131B');
  grad.addColorStop(1, '#6C0C13');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Subtle leather pore grain
  for (let i = 0; i < 4500; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 0.6 + Math.random() * 1.4;
    cCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 190, 190, 0.06)' : 'rgba(30, 4, 6, 0.14)';
    cCtx.beginPath();
    cCtx.arc(x, y, r, 0, Math.PI * 2);
    cCtx.fill();

    bCtx.fillStyle = Math.random() > 0.5 ? 'rgba(220,220,220,0.22)' : 'rgba(40,40,40,0.25)';
    bCtx.beginPath();
    bCtx.arc(x, y, r, 0, Math.PI * 2);
    bCtx.fill();
  }

  // Equator seam band (stitched center ridge)
  const midY = size / 2;
  cCtx.fillStyle = 'rgba(70, 8, 12, 0.45)';
  cCtx.fillRect(0, midY - 14, size, 28);

  const stitchRows = [-7, 0, 7];
  stitchRows.forEach((offsetY, rowIdx) => {
    const step = 16;
    for (let x = 4; x < size; x += step) {
      const shiftX = rowIdx === 1 ? 8 : 0;
      cCtx.fillStyle = '#F7F3E6';
      cCtx.beginPath();
      cCtx.roundRect((x + shiftX) % size, midY + offsetY - 2, 9, 4, 2);
      cCtx.fill();

      bCtx.fillStyle = '#FFFFFF';
      bCtx.beginPath();
      bCtx.roundRect((x + shiftX) % size, midY + offsetY - 2, 9, 4, 2);
      bCtx.fill();
    }
  });

  const colorTex = new THREE.CanvasTexture(colorCanvas);
  colorTex.colorSpace = THREE.SRGBColorSpace;
  colorTex.anisotropy = 4;

  const bumpTex = new THREE.CanvasTexture(bumpCanvas);
  bumpTex.anisotropy = 4;

  return { colorTex, bumpTex };
}

export const HeroCricketBall3D: React.FC<HeroCricketBall3DProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fallbackActive, setFallbackActive] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(max-width: 767px)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setFallbackActive(true);
      return;
    }

    const gl = renderer.getContext();
    const rendererInfo = String(gl?.getParameter(gl.RENDERER) || '');
    const isSoftwareGl = /SwiftShader|llvmpipe|Software/i.test(rendererInfo);

    const width = Math.max(160, container.clientWidth || 240);
    const height = Math.max(160, container.clientHeight || 240);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSoftwareGl ? 1 : isMobile ? 1.5 : 2));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, isSoftwareGl ? 0.06 : 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 30);
    camera.position.set(0, 0.15, 3.6);
    camera.lookAt(0, 0, 0);

    // Stadium Key + Lime Rim + Soft Grass Fill Lighting
    const hemi = new THREE.HemisphereLight(0xfff4dd, 0x1d4d2e, 0.8);
    scene.add(hemi);

    const stadiumKey = new THREE.DirectionalLight(0xfff1d0, 2.5);
    stadiumKey.position.set(3.2, 4.0, 4.2);
    scene.add(stadiumKey);

    const limeRim = new THREE.DirectionalLight(0xa8d94e, 1.55);
    limeRim.position.set(-3.6, -1.8, -2.5);
    scene.add(limeRim);

    const warmBack = new THREE.PointLight(0xff941f, 3.5, 10, 1.4);
    warmBack.position.set(-2.2, 2.5, -2.0);
    scene.add(warmBack);

    // 3D Cricket Ball Group
    const { colorTex, bumpTex } = createLeatherTextures();
    const ballGroup = new THREE.Group();
    ballGroup.rotation.set(0.32, -0.5, 0.48);

    const sphereGeo = new THREE.SphereGeometry(0.92, isMobile ? 36 : 48, isMobile ? 36 : 48);
    const leatherMat = new THREE.MeshPhysicalMaterial({
      map: colorTex,
      bumpMap: bumpTex,
      bumpScale: 0.014,
      roughness: 0.34,
      metalness: 0.04,
      clearcoat: 0.58,
      clearcoatRoughness: 0.24,
      envMapIntensity: 1.05,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, leatherMat);
    ballGroup.add(sphereMesh);

    // Raised 3D stitched seam rings around equator
    const stitchMat = new THREE.MeshStandardMaterial({
      color: 0xfaf6eb,
      roughness: 0.45,
      metalness: 0.02,
    });
    const seamGeo = new THREE.TorusGeometry(0.924, 0.011, 8, 64);
    const seamMain = new THREE.Mesh(seamGeo, stitchMat);
    seamMain.rotation.x = Math.PI / 2;
    ballGroup.add(seamMain);

    const seamEdgeGeo = new THREE.TorusGeometry(0.92, 0.008, 6, 56);
    const seamUpper = new THREE.Mesh(seamEdgeGeo, stitchMat);
    seamUpper.rotation.x = Math.PI / 2;
    seamUpper.position.y = 0.036;
    ballGroup.add(seamUpper);

    const seamLower = new THREE.Mesh(seamEdgeGeo, stitchMat);
    seamLower.rotation.x = Math.PI / 2;
    seamLower.position.y = -0.036;
    ballGroup.add(seamLower);

    // Subtle glowing stadium lime orbit arc around ball
    const orbitGeo = new THREE.TorusGeometry(1.18, 0.012, 8, 72, Math.PI * 1.15);
    const orbitMat = new THREE.MeshBasicMaterial({
      color: 0xa8d94e,
      transparent: true,
      opacity: 0.55,
    });
    const orbitArc = new THREE.Mesh(orbitGeo, orbitMat);
    orbitArc.rotation.set(1.1, 0.35, -0.4);
    scene.add(orbitArc);
    scene.add(ballGroup);

    // Initial render
    renderer.render(scene, camera);

    const pointerTarget = { x: 0, y: 0 };
    const pointerSmooth = { x: 0, y: 0 };

    const handlePointerMove = (e: PointerEvent) => {
      if (isMobile) return;
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerTarget.x = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width - 0.5) * 2));
      pointerTarget.y = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height - 0.5) * 2));
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(120, Math.floor(entry.contentRect.width));
      const h = Math.max(120, Math.floor(entry.contentRect.height));
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
    let elapsed = 0;
    let disposed = false;

    const tick = (now: number) => {
      if (disposed || prefersReducedMotion) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (isVisible && !document.hidden) {
        elapsed += dt;
        pointerSmooth.x += (pointerTarget.x - pointerSmooth.x) * 0.06;
        pointerSmooth.y += (pointerTarget.y - pointerSmooth.y) * 0.06;

        ballGroup.rotation.y = -0.5 + elapsed * 0.72 + pointerSmooth.x * 0.35;
        ballGroup.rotation.x = 0.32 + Math.sin(elapsed * 0.9) * 0.14 - pointerSmooth.y * 0.25;
        ballGroup.position.y = Math.sin(elapsed * 1.7) * 0.08;
        orbitArc.rotation.z = -0.4 + elapsed * 0.45;

        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        pacingTimer = window.setTimeout(() => {
          rafId = window.requestAnimationFrame(tick);
        }, 40);
      } else {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    if (!prefersReducedMotion) {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      if (pacingTimer !== null) window.clearTimeout(pacingTimer);
      window.removeEventListener('pointermove', handlePointerMove);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);

      sphereGeo.dispose();
      seamGeo.dispose();
      seamEdgeGeo.dispose();
      orbitGeo.dispose();
      leatherMat.dispose();
      stitchMat.dispose();
      orbitMat.dispose();
      colorTex.dispose();
      bumpTex.dispose();
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (fallbackActive) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 140 140" className="w-36 h-36 animate-ball-float drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]" aria-hidden="true">
          <defs>
            <radialGradient id="fallback-ball-3d" cx="32%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="52%" stopColor="#991B1B" />
              <stop offset="100%" stopColor="#450A0A" />
            </radialGradient>
          </defs>
          <circle cx="70" cy="70" r="54" fill="url(#fallback-ball-3d)" />
          <path
            d="M 28 38 Q 70 70 112 102"
            fill="none"
            stroke="#FAF6EB"
            strokeWidth="4.5"
            strokeDasharray="6 5"
            strokeLinecap="round"
          />
          <path
            d="M 32 33 Q 74 65 116 97"
            fill="none"
            stroke="#FAF6EB"
            strokeWidth="2"
            strokeDasharray="4 5"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>
      </div>
    );
  }

  return <div ref={containerRef} className={`w-full h-full ${className}`} aria-hidden="true" />;
};
