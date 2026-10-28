'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * 3D Interactive Digital Ballot Box & Floating Ballot Card
 * 
 * Concept:
 * - Transparent frosted acrylic ballot box with brushed aluminum base and slot
 * - Folded digital ballots resting visibly inside the transparent box
 * - Floating pristine "E-Ballot" card poised above the slot with SMKN 4 official seal
 * - Gentle levitation breathing animation & mouse-guided tilt interaction
 * - Natural Apple-grade daylight studio lighting (clean, zero neon flare)
 */

function createBallotTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Card Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 720);

  // Outer Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 10;
  ctx.strokeRect(16, 16, 480, 688);

  // Top Header Banner
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(24, 24, 464, 88);

  // Header Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 21px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('E-PILKETOS SMKN 4 KOTA SERANG', 256, 60);

  ctx.font = '500 13px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#dbeafe';
  ctx.fillText('SURAT SUARA PEMILIHAN KETUA OSIS 2026', 256, 88);

  // Candidate Selection Grid (3 Columns)
  const colW = 136;
  const colGap = 16;
  const startX = 36;
  const topY = 138;
  const colH = 260;

  for (let i = 1; i <= 3; i++) {
    const x = startX + (i - 1) * (colW + colGap);

    // Box container
    ctx.fillStyle = i === 2 ? '#eff6ff' : '#f8fafc';
    ctx.strokeStyle = i === 2 ? '#2563eb' : '#cbd5e1';
    ctx.lineWidth = i === 2 ? 4 : 2;
    ctx.fillRect(x, topY, colW, colH);
    ctx.strokeRect(x, topY, colW, colH);

    // Candidate Number Badge
    ctx.fillStyle = i === 2 ? '#2563eb' : '#64748b';
    ctx.fillRect(x + colW / 2 - 20, topY + 12, 40, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('0' + i, x + colW / 2, topY + 40);

    // Candidate Silhouette Avatar Placeholder
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(x + colW / 2, topY + 105, 30, 0, Math.PI * 2);
    ctx.fill();

    // Checkbox stamp circle
    ctx.strokeStyle = i === 2 ? '#2563eb' : '#cbd5e1';
    ctx.lineWidth = i === 2 ? 3 : 2;
    ctx.beginPath();
    ctx.arc(x + colW / 2, topY + 205, 20, 0, Math.PI * 2);
    ctx.stroke();

    // Coblos Stamp on #02
    if (i === 2) {
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + colW / 2 - 8, topY + 205);
      ctx.lineTo(x + colW / 2 - 2, topY + 212);
      ctx.lineTo(x + colW / 2 + 10, topY + 198);
      ctx.stroke();
    }
  }

  // Security Verification Section
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(36, 420, 440, 110);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 420, 440, 110);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('STATUS: TERVERIFIKASI SISTEM', 54, 452);

  ctx.font = '12px monospace';
  ctx.fillStyle = '#0284c7';
  ctx.fillText('TOKEN: SMKN4-VOTE-2026-OK', 54, 480);

  // Digital barcode lines
  ctx.fillStyle = '#334155';
  for (let b = 54; b < 450; b += 8) {
    const w = (b % 3 === 0) ? 4 : 2;
    ctx.fillRect(b, 495, w, 22);
  }

  // Official Stamp Seal at bottom
  ctx.save();
  ctx.translate(256, 610);
  ctx.rotate(-0.06);
  ctx.strokeStyle = 'rgba(37, 99, 235, 0.75)';
  ctx.lineWidth = 3;
  ctx.strokeRect(-130, -32, 260, 64);

  ctx.fillStyle = '#1d4ed8';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAH - PILKETOS SMKN 4', 0, -8);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = '#2563eb';
  ctx.fillText('KOMISI PEMILIHAN OSIS 2026', 0, 14);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

export default function HeroOrb() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. WebGL Verification
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

    // 2. Three.js Scene Setup (Studio Clean Perspective)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      36,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.8, 6.4);
    camera.lookAt(0, 0, 0);

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

    // 3. Studio Daylight Lighting (Soft, Clean, Physical)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 1.9);
    mainKeyLight.position.set(5, 8, 6);
    scene.add(mainKeyLight);

    const softFillLight = new THREE.DirectionalLight(0xf1f5f9, 0.9);
    softFillLight.position.set(-6, -2, 4);
    scene.add(softFillLight);

    const rimLight = new THREE.DirectionalLight(0xe2e8f0, 1.1);
    rimLight.position.set(-3, 6, -4);
    scene.add(rimLight);

    // 4. Main Assembly Group
    const rootGroup = new THREE.Group();
    // Default 3-quarter angled perspective
    rootGroup.rotation.y = -0.38;
    rootGroup.rotation.x = 0.14;
    scene.add(rootGroup);

    // =========================================================================
    // A. 3D DIGITAL BALLOT BOX (KOTAK SUARA AKRILIK TRANSPARAN)
    // =========================================================================
    const boxGroup = new THREE.Group();
    boxGroup.position.set(0, -0.65, 0);
    rootGroup.add(boxGroup);

    // 1. Clear Frosted Acrylic Material for Box Panels
    const acrylicMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.86,
      opacity: 1.0,
      transparent: true,
      roughness: 0.08,
      ior: 1.49,
      reflectivity: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      depthWrite: false,
    });

    const boxW = 2.3;
    const boxH = 2.0;
    const boxD = 2.1;
    const wallThick = 0.04;

    // Front Wall
    const frontWall = new THREE.Mesh(
      new THREE.BoxGeometry(boxW, boxH, wallThick),
      acrylicMat
    );
    frontWall.position.z = boxD / 2;
    boxGroup.add(frontWall);

    // Back Wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(boxW, boxH, wallThick),
      acrylicMat
    );
    backWall.position.z = -boxD / 2;
    boxGroup.add(backWall);

    // Left Wall
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThick, boxH, boxD),
      acrylicMat
    );
    leftWall.position.x = -boxW / 2;
    boxGroup.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThick, boxH, boxD),
      acrylicMat
    );
    rightWall.position.x = boxW / 2;
    boxGroup.add(rightWall);

    // Base Metallic Plate (Inside bottom)
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.85,
      roughness: 0.2,
    });
    const basePlate = new THREE.Mesh(
      new THREE.BoxGeometry(boxW + 0.08, 0.08, boxD + 0.08),
      baseMat
    );
    basePlate.position.y = -boxH / 2;
    boxGroup.add(basePlate);

    // Top Lid Acrylic with Slot
    // Top lid left segment
    const lidLeft = new THREE.Mesh(
      new THREE.BoxGeometry((boxW - 1.25) / 2, wallThick, boxD),
      acrylicMat
    );
    lidLeft.position.set(-boxW / 2 + (boxW - 1.25) / 4, boxH / 2, 0);
    boxGroup.add(lidLeft);

    // Top lid right segment
    const lidRight = new THREE.Mesh(
      new THREE.BoxGeometry((boxW - 1.25) / 2, wallThick, boxD),
      acrylicMat
    );
    lidRight.position.set(boxW / 2 - (boxW - 1.25) / 4, boxH / 2, 0);
    boxGroup.add(lidRight);

    // Top lid front & back fillers around slot
    const lidFront = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, wallThick, (boxD - 0.16) / 2),
      acrylicMat
    );
    lidFront.position.set(0, boxH / 2, boxD / 4 + 0.04);
    boxGroup.add(lidFront);

    const lidBack = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, wallThick, (boxD - 0.16) / 2),
      acrylicMat
    );
    lidBack.position.set(0, boxH / 2, -boxD / 4 - 0.04);
    boxGroup.add(lidBack);

    // Precision Metallic Slot Bezel Frame
    const slotBezelMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      metalness: 0.65,
      roughness: 0.25,
    });
    const slotBezelGeo = new THREE.BoxGeometry(1.3, 0.03, 0.14);
    const slotBezel = new THREE.Mesh(slotBezelGeo, slotBezelMat);
    slotBezel.position.set(0, boxH / 2 + 0.015, 0);
    boxGroup.add(slotBezel);

    // Front Emblem / Logo Badge on Acrylic Box
    const badgeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.3,
    });
    const badge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.02, 32),
      badgeMat
    );
    badge.rotation.x = Math.PI / 2;
    badge.position.set(0, 0, boxD / 2 + 0.02);
    boxGroup.add(badge);

    // Badge Ring Accent
    const badgeRingMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      metalness: 0.8,
      roughness: 0.2,
    });
    const badgeRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.015, 16, 48),
      badgeRingMat
    );
    badgeRing.position.set(0, 0, boxD / 2 + 0.03);
    boxGroup.add(badgeRing);

    // =========================================================================
    // B. DROPPED BALLOTS INSIDE THE TRANSPARENT BOX (SURAT SUARA DI DALAM KOTAK)
    // =========================================================================
    const droppedBallotMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.35,
    });
    const droppedCardGeo = new THREE.BoxGeometry(0.9, 0.02, 0.6);

    const dropped1 = new THREE.Mesh(droppedCardGeo, droppedBallotMat);
    dropped1.position.set(-0.25, -boxH / 2 + 0.05, 0.1);
    dropped1.rotation.set(0.04, 0.35, 0.02);
    boxGroup.add(dropped1);

    const dropped2 = new THREE.Mesh(droppedCardGeo, droppedBallotMat);
    dropped2.position.set(0.3, -boxH / 2 + 0.07, -0.15);
    dropped2.rotation.set(-0.03, -0.45, 0.05);
    boxGroup.add(dropped2);

    const dropped3 = new THREE.Mesh(droppedCardGeo, droppedBallotMat);
    dropped3.position.set(-0.05, -boxH / 2 + 0.09, 0.0);
    dropped3.rotation.set(0.02, 0.15, -0.04);
    boxGroup.add(dropped3);

    // =========================================================================
    // C. ACTIVE FLOATING BALLOT CARD (SURAT SUARA MELAYANG DI ATAS SLOT)
    // =========================================================================
    const ballotTexture = createBallotTexture();

    const activeBallotMatFront = new THREE.MeshPhysicalMaterial({
      map: ballotTexture,
      roughness: 0.22,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
      metalness: 0.05,
    });

    const activeBallotMatBack = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
    });

    // Multi-material card (front face has printed ballot texture)
    const cardMaterials = [
      activeBallotMatBack, // right
      activeBallotMatBack, // left
      activeBallotMatBack, // top
      activeBallotMatBack, // bottom
      activeBallotMatFront, // front
      activeBallotMatBack, // back
    ];

    const activeBallotGeo = new THREE.BoxGeometry(1.05, 1.48, 0.015);
    const activeBallot = new THREE.Mesh(activeBallotGeo, cardMaterials);
    // Initial poise above the slot with a gentle inviting angle
    activeBallot.position.set(0, 1.25, 0);
    activeBallot.rotation.x = -0.32;
    activeBallot.rotation.y = 0.15;
    rootGroup.add(activeBallot);

    // Contact soft shadow disc beneath the box
    const shadowGeo = new THREE.PlaneGeometry(3.2, 3.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.18,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.68;
    rootGroup.add(shadowPlane);

    setIsLoaded(true);

    // 5. Interaction: Mouse Parallax & Dynamic Card Tilt
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let scrollY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      target.x = x * 0.5;
      target.y = y * 0.5;
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

    // 6. Animation Loop (Levitation Float & Mouse Interaction)
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Damped smooth mouse interpolation
      current.x += (target.x - current.x) * 0.055;
      current.y += (target.y - current.y) * 0.055;

      if (!prefersReducedMotion) {
        // Floating Ballot Card: Natural Levitation Float & Tilt towards Mouse
        const hoverBob = Math.sin(elapsedTime * 1.8) * 0.08;
        const hoverRoll = Math.sin(elapsedTime * 1.2) * 0.03;
        
        // Card lowers slightly when mouse nears center (ready-to-insert feel)
        const dip = Math.abs(current.x) * 0.08;
        activeBallot.position.y = 1.3 + hoverBob - dip;
        activeBallot.position.x = current.x * 0.25;

        // Card tilts dynamically with mouse movement
        activeBallot.rotation.x = -0.32 - current.y * 0.35;
        activeBallot.rotation.y = 0.15 + current.x * 0.45;
        activeBallot.rotation.z = hoverRoll + current.x * 0.12;

        // Gentle box turntable sway
        const boxTurntable = Math.sin(elapsedTime * 0.6) * 0.04;
        boxGroup.rotation.y = boxTurntable;
      }

      // Parallax rotation of the entire scene
      const scrollFactor = Math.min(scrollY / 800, 1);
      rootGroup.rotation.y = -0.38 + current.x * 0.35 + scrollFactor * 0.3;
      rootGroup.rotation.x = 0.14 - current.y * 0.25;
      rootGroup.position.y = Math.sin(elapsedTime * 0.9) * 0.03 - scrollFactor * 0.2;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      // Clean up geometries & materials
      acrylicMat.dispose();
      baseMat.dispose();
      slotBezelMat.dispose();
      badgeMat.dispose();
      badgeRingMat.dispose();
      droppedBallotMat.dispose();
      activeBallotMatFront.dispose();
      activeBallotMatBack.dispose();
      ballotTexture.dispose();
      shadowMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (!webglSupported) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-200">
          <div className="text-center p-6 space-y-2">
            <div className="w-16 h-16 mx-auto rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl">
              🗳️
            </div>
            <span className="text-xs uppercase tracking-widest font-mono text-slate-400 font-semibold block">
              KOTAK SUARA DIGITAL
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
      {/* Soft Daylight Neutral Shadow Backdrop */}
      <div className="absolute -z-10 w-3/4 h-3/4 rounded-full bg-slate-200/40 blur-3xl pointer-events-none" />
      <div className="absolute -z-10 w-1/2 h-1/2 rounded-full bg-blue-500/[0.04] blur-2xl pointer-events-none" />
    </div>
  );
}
