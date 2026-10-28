'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Clean Studio 3D Hero Orb
 * 
 * Aesthetic: Apple / Minimalist Industrial Design (Clean, Physical, Non-Neon)
 * - Frosted pearl porcelain core sphere with physical clearcoat reflections
 * - Dual whisper-thin brushed titanium & satin slate precision gimbal rings
 * - Pure studio daylight illumination (zero electric neon / zero emissive glow)
 * - Delicate, subtle micro-dust particles with soft natural blending
 * - Damped mouse parallax and gentle breathing levitation
 */
export default function HeroOrb() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. WebGL Support Verification
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        return Boolean(
          window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        );
      } catch {
        return false;
      }
    };

    if (!checkWebGL()) {
      setWebglSupported(false);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 2. Three.js Scene Setup (Studio Clean Architecture)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 6.0;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    container.appendChild(renderer.domElement);

    // 3. Natural Studio Lighting (Soft White & Daylight - Zero Neon)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const softFillLight = new THREE.DirectionalLight(0xf1f5f9, 0.9);
    softFillLight.position.set(-5, -2, 4);
    scene.add(softFillLight);

    const softRimLight = new THREE.DirectionalLight(0xe2e8f0, 0.8);
    softRimLight.position.set(-3, 4, -4);
    scene.add(softRimLight);

    // 4. Group Assembly
    const group = new THREE.Group();
    scene.add(group);

    // A. Frosted Pearl Ceramic Core Sphere
    const sphereGeo = new THREE.SphereGeometry(1.3, 64, 64);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.18,
      metalness: 0.08,
      clearcoat: 0.95,
      clearcoatRoughness: 0.06,
      reflectivity: 0.85,
      ior: 1.48,
    });
    const coreSphere = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(coreSphere);

    // B. Precision Gimbal Ring 1 (Brushed Titanium Equator - Minimalist & Fine)
    const ring1Geo = new THREE.TorusGeometry(1.85, 0.015, 20, 120);
    const ring1Mat = new THREE.MeshPhysicalMaterial({
      color: 0xd1d5db,
      metalness: 0.85,
      roughness: 0.22,
      clearcoat: 0.6,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    group.add(ring1);

    // C. Precision Gimbal Ring 2 (Satin Slate Navy - Subtle & Matte)
    const ring2Geo = new THREE.TorusGeometry(2.15, 0.012, 20, 120);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.65,
      roughness: 0.35,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2.7;
    ring2.rotation.y = Math.PI / 6.0;
    group.add(ring2);

    // D. Delicate Natural Micro-Dust (Soft & Muted, Normal Blending - NO neon flare)
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Palette: Sophisticated muted tones (Slate, Soft Sky, Subtle Indigo, Soft Amber)
    const palette = [
      { r: 0.38, g: 0.52, b: 0.72 }, // Soft Sky
      { r: 0.45, g: 0.55, b: 0.68 }, // Slate
      { r: 0.52, g: 0.48, b: 0.75 }, // Soft Indigo
      { r: 0.75, g: 0.62, b: 0.48 }, // Soft Amber
    ];

    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.7 + Math.random() * 1.5;
      const sinPhi = Math.sin(phi);

      positions[i * 3] = r * sinPhi * Math.cos(theta);
      positions[i * 3 + 1] = r * sinPhi * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const color = palette[i % palette.length];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.024,
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.NormalBlending, // NormalBlending avoids over-saturated neon glow
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    group.add(particleSystem);

    setIsLoaded(true);

    // 5. Interaction: Mouse Parallax & Smooth Momentum
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let scrollY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      target.x = x * 0.45;
      target.y = y * 0.45;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // 6. Animation Loop (Calm, Elegant Drift)
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Damped smooth mouse interpolation
      current.x += (target.x - current.x) * 0.05;
      current.y += (target.y - current.y) * 0.05;

      if (!prefersReducedMotion) {
        // Slow core rotation
        coreSphere.rotation.y = elapsedTime * 0.12;
        coreSphere.rotation.x = elapsedTime * 0.06;

        // Subtle, quiet floating pulse
        const pulse = 1.0 + Math.sin(elapsedTime * 1.4) * 0.01;
        coreSphere.scale.set(pulse, pulse, pulse);

        // Minimalist counter-rotations
        ring1.rotation.z = elapsedTime * 0.16;
        ring1.rotation.x = Math.sin(elapsedTime * 0.28) * 0.22;

        ring2.rotation.y = -elapsedTime * 0.14;
        ring2.rotation.z = Math.cos(elapsedTime * 0.22) * 0.26;

        particleSystem.rotation.y = elapsedTime * 0.05;
      }

      // Parallax rotation & gentle levitation
      const scrollFactor = Math.min(scrollY / 800, 1);
      group.rotation.y = current.x + scrollFactor * 0.45;
      group.rotation.x = -current.y + scrollFactor * 0.2;
      group.position.y = Math.sin(elapsedTime * 1.0) * 0.06 - scrollFactor * 0.25;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      sphereGeo.dispose();
      sphereMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (!webglSupported) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-slate-100 shadow-sm flex items-center justify-center border border-slate-200">
          <div className="w-40 h-40 rounded-full bg-white shadow-inner flex items-center justify-center">
            <span className="text-xs uppercase tracking-widest font-mono text-slate-400 font-semibold">
              E-PILKETOS 3D
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        ref={mountRef}
        className={`w-full h-full transition-opacity duration-1000 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {/* Soft Daylight Neutral Shadow Backdrop (NO neon colored aura) */}
      <div className="absolute -z-10 w-3/4 h-3/4 rounded-full bg-slate-200/40 blur-3xl pointer-events-none" />
      <div className="absolute -z-10 w-1/2 h-1/2 rounded-full bg-blue-500/[0.04] blur-2xl pointer-events-none" />
    </div>
  );
}
