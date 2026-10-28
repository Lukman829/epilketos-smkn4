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

    // 2. Three.js Scene Setup (Apple / Antigravity Aesthetic)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 6.2;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);

    // 3. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xf8fafc, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 7, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x06b6d4, 1.2);
    fillLight.position.set(-6, -3, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x3b82f6, 1.8);
    rimLight.position.set(-4, 5, -5);
    scene.add(rimLight);

    // Internal glowing point light
    const innerGlow = new THREE.PointLight(0x3b82f6, 2.5, 8);
    innerGlow.position.set(0, 0, 0);
    scene.add(innerGlow);

    // 4. Group Assembly (Antigravity Gyroscope Structure)
    const group = new THREE.Group();
    scene.add(group);

    // A. Inner Metallic Glass Sphere
    const sphereGeo = new THREE.SphereGeometry(1.28, 64, 64);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      metalness: 0.92,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.95,
      ior: 1.5,
    });
    const coreSphere = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(coreSphere);

    // B. Geometric Polyhedral Shell (Icosahedron Wireframe with Soft Glow)
    const cageGeo = new THREE.IcosahedronGeometry(1.58, 2);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    group.add(cageMesh);

    // C. Gyroscopic Ring 1 (Polished Mirror Titanium Equator)
    const ring1Geo = new THREE.TorusGeometry(1.88, 0.026, 24, 120);
    const ring1Mat = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.1,
      clearcoat: 1.0,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    group.add(ring1);

    // D. Gyroscopic Ring 2 (Sapphire Electric Blue Tilted Ring)
    const ring2Geo = new THREE.TorusGeometry(2.16, 0.022, 24, 120);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.35,
      metalness: 0.85,
      roughness: 0.2,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2.6;
    group.add(ring2);

    // E. Gyroscopic Ring 3 (Cyan Polar Precision Ring)
    const ring3Geo = new THREE.TorusGeometry(2.42, 0.018, 24, 120);
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: 0x0891b2,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.25,
      metalness: 0.8,
      roughness: 0.25,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.y = Math.PI / 3.2;
    group.add(ring3);

    // F. Google Antigravity Radial Particle Constellation (Radial Iris Rays)
    const particleCount = 420;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const getAntigravityRgb = (deg: number) => {
      const d = ((deg % 360) + 360) % 360;
      const stops = [
        { deg: 0, r: 0.23, g: 0.51, b: 0.96 },   // #3b82f6 Blue
        { deg: 45, r: 0.31, g: 0.27, b: 0.90 },  // #4f46e5 Indigo
        { deg: 90, r: 0.49, g: 0.23, b: 0.93 },  // #7c3aed Purple
        { deg: 135, r: 0.86, g: 0.15, b: 0.47 }, // #db2777 Magenta
        { deg: 180, r: 0.94, g: 0.27, b: 0.27 }, // #ef4444 Coral Red
        { deg: 225, r: 0.98, g: 0.45, b: 0.09 }, // #f97316 Orange
        { deg: 270, r: 0.96, g: 0.62, b: 0.04 }, // #f59e0b Amber
        { deg: 315, r: 0.02, g: 0.71, b: 0.83 }, // #06b6d4 Cyan
        { deg: 360, r: 0.23, g: 0.51, b: 0.96 },
      ];
      for (let s = 0; s < stops.length - 1; s++) {
        if (d >= stops[s].deg && d <= stops[s + 1].deg) {
          const t = (d - stops[s].deg) / (stops[s + 1].deg - stops[s].deg);
          return {
            r: stops[s].r + t * (stops[s + 1].r - stops[s].r),
            g: stops[s].g + t * (stops[s + 1].g - stops[s].g),
            b: stops[s].b + t * (stops[s + 1].b - stops[s].b),
          };
        }
      }
      return { r: 0.23, g: 0.51, b: 0.96 };
    };

    for (let i = 0; i < particleCount; i++) {
      const spokeCount = 36;
      const spokeIndex = i % spokeCount;
      const baseAngle = (spokeIndex / spokeCount) * Math.PI * 2;
      const angle = baseAngle + (Math.random() - 0.5) * 0.14;

      const r = 1.75 + Math.pow(Math.random(), 0.75) * 1.85;
      const z = (Math.random() - 0.5) * 1.1 * (r / 2.8);

      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.sin(angle) * r;
      positions[i * 3 + 2] = z;

      const deg = ((angle * 180 / Math.PI) + 360) % 360;
      const rgb = getAntigravityRgb(deg);
      colors[i * 3] = rgb.r;
      colors[i * 3 + 1] = rgb.g;
      colors[i * 3 + 2] = rgb.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
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
      target.x = x * 0.55;
      target.y = y * 0.55;
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

    // 6. Animation Loop with Organic Breathing & Fluid Rotation
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Damped smooth mouse interpolation
      current.x += (target.x - current.x) * 0.06;
      current.y += (target.y - current.y) * 0.06;

      if (!prefersReducedMotion) {
        // Core rotation
        coreSphere.rotation.y = elapsedTime * 0.15;
        coreSphere.rotation.x = elapsedTime * 0.08;

        // Floating breathing pulse
        const pulse = 1.0 + Math.sin(elapsedTime * 1.5) * 0.015;
        coreSphere.scale.set(pulse, pulse, pulse);

        // Gyroscopic counter-rotations
        ring1.rotation.z = elapsedTime * 0.22;
        ring1.rotation.x = Math.sin(elapsedTime * 0.35) * 0.32;

        ring2.rotation.y = -elapsedTime * 0.2;
        ring2.rotation.z = Math.cos(elapsedTime * 0.28) * 0.42;

        ring3.rotation.x = elapsedTime * 0.16;
        ring3.rotation.y = elapsedTime * 0.14;

        // Cage & particle system slow drift
        cageMesh.rotation.y = -elapsedTime * 0.06;
        cageMesh.rotation.x = elapsedTime * 0.03;
        particleSystem.rotation.y = elapsedTime * 0.08;
        particleSystem.rotation.z = elapsedTime * 0.05;
      }

      // Parallax rotation & subtle levitation
      const scrollFactor = Math.min(scrollY / 800, 1);
      group.rotation.y = current.x + scrollFactor * 0.65;
      group.rotation.x = -current.y + scrollFactor * 0.25;
      group.position.y = Math.sin(elapsedTime * 1.2) * 0.08 - scrollFactor * 0.35;

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
      cageGeo.dispose();
      cageMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      ring3Geo.dispose();
      ring3Mat.dispose();
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
      {/* Soft Ambient Daylight Backdrop Glow */}
      <div className="absolute -z-10 w-4/5 h-4/5 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -z-10 w-3/5 h-3/5 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" />
    </div>
  );
}
