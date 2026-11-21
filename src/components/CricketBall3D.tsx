import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface CricketBall3DProps {
  size?: number;
  interactive?: boolean;
  className?: string;
}

function createLeatherTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, '#a61b1b');
    grad.addColorStop(0.5, '#8c1414');
    grad.addColorStop(1, '#6c0d0d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Subtle leather grain
    for (let i = 0; i < 1800; i++) {
      const x = (i * 73) % 512;
      const y = (i * 139) % 256;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)';
      ctx.fillRect(x, y, 2, 2);
    }

    // Center stitched white seam band
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.fillRect(0, 118, 512, 20);
    ctx.strokeStyle = '#F8FAF2';
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(0, 122);
    ctx.lineTo(512, 122);
    ctx.moveTo(0, 134);
    ctx.lineTo(512, 134);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function isSoftwareWebGL(gl: WebGLRenderingContext | WebGL2RenderingContext | null): boolean {
  if (!gl) return true;
  try {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '');
      if (/swiftshader|llvmpipe|software/i.test(renderer)) {
        return true;
      }
    }
  } catch {
    // ignore probe restriction
  }
  return false;
}

export const CricketBall3D: React.FC<CricketBall3DProps> = ({
  size = 112,
  interactive = true,
  className = '',
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let pmrem: THREE.PMREMGenerator | null = null;
    let envRT: THREE.WebGLRenderTarget | null = null;
    let leatherTex: THREE.CanvasTexture | null = null;
    let rafId = 0;

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      const gl = renderer.getContext();
      if (!gl || isSoftwareWebGL(gl)) {
        renderer.dispose();
        setUseFallback(true);
        return;
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(size, size);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      host.innerHTML = '';
      host.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
      camera.position.set(0, 0.15, 3.3);

      pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      envRT = pmrem.fromScene(roomEnv, 0.04);
      scene.environment = envRT.texture;
      roomEnv.dispose();

      const keyLight = new THREE.DirectionalLight(0xfff5e0, 2.2);
      keyLight.position.set(2.5, 3.2, 3.5);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0xa8d94e, 1.1);
      rimLight.position.set(-2.5, -1.2, 1.5);
      scene.add(rimLight);

      const ballGroup = new THREE.Group();
      scene.add(ballGroup);

      leatherTex = createLeatherTexture();
      const sphereGeo = new THREE.SphereGeometry(0.92, 36, 28);
      const sphereMat = new THREE.MeshStandardMaterial({
        map: leatherTex,
        roughness: 0.36,
        metalness: 0.08,
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      ballGroup.add(sphereMesh);

      // Raised white seam torus highlight
      const seamGeo = new THREE.TorusGeometry(0.922, 0.022, 10, 56);
      const seamMat = new THREE.MeshStandardMaterial({
        color: 0xf8faf2,
        roughness: 0.45,
        metalness: 0.05,
      });
      const seamMesh = new THREE.Mesh(seamGeo, seamMat);
      seamMesh.rotation.x = Math.PI / 2;
      ballGroup.add(seamMesh);

      ballGroup.rotation.z = 0.42;
      ballGroup.rotation.x = 0.28;

      let targetTiltX = 0.28;
      let targetTiltY = 0;

      const onPointerMove = (e: PointerEvent) => {
        if (!interactive) return;
        const rect = host.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        targetTiltY = nx * 0.45;
        targetTiltX = 0.28 + ny * 0.3;
      };

      if (interactive) {
        host.addEventListener('pointermove', onPointerMove);
      }

      const renderFrame = () => {
        if (!renderer || !scene || !camera) return;
        if (!prefersReducedMotion) {
          ballGroup.rotation.y += 0.014;
          ballGroup.rotation.x += (targetTiltX - ballGroup.rotation.x) * 0.08;
          if (interactive) {
            ballGroup.rotation.z = 0.42 + targetTiltY * 0.25;
          }
          renderer.render(scene, camera);
          rafId = window.requestAnimationFrame(renderFrame);
        } else {
          renderer.render(scene, camera);
        }
      };

      renderFrame();

      return () => {
        window.cancelAnimationFrame(rafId);
        if (interactive) {
          host.removeEventListener('pointermove', onPointerMove);
        }
        sphereGeo.dispose();
        sphereMat.dispose();
        seamGeo.dispose();
        seamMat.dispose();
        leatherTex?.dispose();
        envRT?.dispose();
        pmrem?.dispose();
        renderer?.dispose();
        if (host.contains(renderer?.domElement as Node)) {
          host.innerHTML = '';
        }
      };
    } catch {
      renderer?.dispose();
      setUseFallback(true);
    }
  }, [size, interactive]);

  if (useFallback) {
    return (
      <div
        className={`relative inline-flex items-center justify-center select-none ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_14px_24px_rgba(23,37,26,0.28)]">
          <defs>
            <radialGradient id="crickify-ball-3d-fallback" cx="32%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="55%" stopColor="#991B1B" />
              <stop offset="100%" stopColor="#450A0A" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="44" fill="url(#crickify-ball-3d-fallback)" />
          <ellipse cx="36" cy="30" rx="12" ry="7" fill="rgba(255,255,255,0.22)" transform="rotate(-24 36 30)" />
          <path
            d="M 16 25 Q 50 50 84 75"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeDasharray="5 4"
            strokeLinecap="round"
          />
          <path
            d="M 20 20 Q 54 45 88 70"
            fill="none"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="2.2"
            strokeDasharray="5 4"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center ${className}`}
      aria-hidden="true"
    />
  );
};

export const CricketBallLoader: React.FC<{ label?: string; compact?: boolean }> = ({
  label = 'Loading CRICKIFY...',
  compact = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${compact ? 'text-xs' : 'text-sm'} font-semibold text-[#397B32]`}>
      <span className="relative inline-flex items-center justify-center w-6 h-6 shrink-0">
        <svg viewBox="0 0 36 36" className="w-6 h-6 animate-spin" style={{ animationDuration: '1.35s' }}>
          <defs>
            <radialGradient id="crickify-loader-ball" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="65%" stopColor="#991B1B" />
              <stop offset="100%" stopColor="#5C0D0D" />
            </radialGradient>
          </defs>
          <circle cx="18" cy="18" r="15" fill="url(#crickify-loader-ball)" />
          <path
            d="M 7 11 Q 18 18 29 25"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeDasharray="2.8 2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span>{label}</span>
    </div>
  );
};
