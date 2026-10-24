'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function HeroOrb() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Check WebGL support
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

    // 2. Three.js Scene Setup (Clean studio environment)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 6;

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

    // 3. Natural studio lighting (Soft white key, fill, and rim lights — NO neon)
    const ambientLight = new THREE.AmbientLight(0xf8fafc, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(5, 6, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.9);
    fillLight.position.set(-5, -3, -3);
    scene.add(fillLight);

    // Subtle blue reflection light
    const subtleAccentLight = new THREE.PointLight(0x3b82f6, 1.2, 10);
    subtleAccentLight.position.set(2, -3, 2);
    scene.add(subtleAccentLight);

    // 4. Clean Metallic Structures
    const group = new THREE.Group();
    scene.add(group);

    // Inner Pearl/Silver Sphere
    const coreGeo = new THREE.SphereGeometry(1.35, 64, 64);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.85,
      roughness: 0.18,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // Clean Silver Gyroscope Rings
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.8,
      roughness: 0.25,
    });

    const ring1Geo = new THREE.TorusGeometry(1.85, 0.022, 16, 100);
    const ring1 = new THREE.Mesh(ring1Geo, ringMat);
    group.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(2.1, 0.018, 16, 100);
    const ring2 = new THREE.Mesh(ring2Geo, ringMat);
    ring2.rotation.x = Math.PI / 2.5;
    group.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(2.35, 0.015, 16, 100);
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.75,
      roughness: 0.3,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.y = Math.PI / 3;
    group.add(ring3);

    // Fine wireframe geometric sphere
    const cageGeo = new THREE.IcosahedronGeometry(1.58, 2);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    group.add(cageMesh);

    setIsLoaded(true);

    // 5. Interaction: Mouse Parallax & Scroll
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let scrollY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      target.x = x * 0.4;
      target.y = y * 0.4;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Resize handler
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

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      current.x += (target.x - current.x) * 0.05;
      current.y += (target.y - current.y) * 0.05;

      if (!prefersReducedMotion) {
        coreMesh.rotation.y = elapsedTime * 0.12;
        coreMesh.rotation.x = elapsedTime * 0.07;

        ring1.rotation.z = elapsedTime * 0.2;
        ring1.rotation.x = Math.sin(elapsedTime * 0.3) * 0.3;

        ring2.rotation.y = -elapsedTime * 0.18;
        ring2.rotation.z = Math.cos(elapsedTime * 0.25) * 0.4;

        ring3.rotation.x = elapsedTime * 0.15;
        ring3.rotation.y = elapsedTime * 0.12;

        cageMesh.rotation.y = -elapsedTime * 0.05;
      }

      const scrollFactor = Math.min(scrollY / 800, 1);
      group.rotation.y = current.x + scrollFactor * 0.7;
      group.rotation.x = -current.y + scrollFactor * 0.3;
      group.position.y = -scrollFactor * 0.4;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      coreGeo.dispose();
      coreMat.dispose();
      ring1Geo.dispose();
      ring2Geo.dispose();
      ring3Geo.dispose();
      ringMat.dispose();
      ring3Mat.dispose();
      cageGeo.dispose();
      cageMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (!webglSupported) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-slate-200 via-white to-slate-200 shadow-md flex items-center justify-center border border-slate-200">
          <div className="w-40 h-40 rounded-full bg-slate-100 flex items-center justify-center">
            <span className="text-xs uppercase tracking-widest font-mono text-slate-500 font-medium">
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
      {/* Soft daylight shadow underneath */}
      <div className="absolute -z-10 w-3/4 h-3/4 rounded-full bg-slate-300/30 blur-3xl pointer-events-none" />
    </div>
  );
}
