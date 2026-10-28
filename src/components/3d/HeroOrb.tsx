'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Next-Gen Product Showcase: 3D Digital Ballot Vault on Exhibition Pedestal
 * 
 * Aesthetic: Apple Keynote / Product Launch Exhibition
 * - Architectural stepped studio pedestal (podium pameran) with fine accent groove
 * - Museum-grade Digital Ballot Vault: crystal optical acrylic chamber & anodized aluminum pillars
 * - Visible deposited ballots inside the transparent chamber
 * - Floating pristine "E-Ballot" card poised above the slot with responsive magnetic tilt
 * - Studio Keynote Lighting Rig: overhead spotlight, key studio lights, and soft ground shadow
 * - Slow motorized showroom turntable rotation with damped mouse inspection
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

function createDisplayScreenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Sleek Dark OLED Display Glass
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 160);

  // Subtle border glow
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 508, 156);

  // Status Indicator Dot (Active Green)
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(36, 40, 8, 0, Math.PI * 2);
  ctx.fill();

  // Status Text
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('PILKETOS DIGITAL VAULT • v2.6', 56, 45);

  // Main School Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('SMKN 4 KOTA SERANG', 34, 90);

  // Subtitle
  ctx.fillStyle = '#38bdf8';
  ctx.font = '500 13px system-ui, sans-serif';
  ctx.fillText('SISTEM VOTING TERENKRIPSI • TRANSPARAN & ADIL', 34, 122);

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

    // 2. Three.js Scene Setup (Cinematic Exhibition View)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      36,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    // Elevated 3/4 beauty angle looking down slightly at the exhibition stage
    camera.position.set(0, 1.4, 6.8);
    camera.lookAt(0, -0.15, 0);

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

    // 3. Exhibition Stage Lighting Rig
    // A. Soft Ambient Daylight
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambientLight);

    // B. Keynote Overhead Spotlight focused on the exhibition stage
    const spotLight = new THREE.SpotLight(0xffffff, 2.5, 14, Math.PI / 4, 0.4, 0.8);
    spotLight.position.set(0, 7.5, 2.5);
    spotLight.target.position.set(0, -0.3, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);

    // C. Studio Key Light (Sculpts glass and metal specular highlights)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(5, 7, 5);
    scene.add(keyLight);

    // D. Soft Fill Light (Illuminates shadow side naturally)
    const fillLight = new THREE.DirectionalLight(0xf1f5f9, 0.95);
    fillLight.position.set(-6, -1, 4);
    scene.add(fillLight);

    // E. Crisp Rim Highlight
    const rimLight = new THREE.DirectionalLight(0xe2e8f0, 1.1);
    rimLight.position.set(-3, 5, -5);
    scene.add(rimLight);

    // 4. Main Exhibition Stand Group (Motorized Turntable)
    const showcaseTurntable = new THREE.Group();
    scene.add(showcaseTurntable);

    // =========================================================================
    // A. ARCHITECTURAL EXHIBITION PEDESTAL (PODIUM PAMERAN PRODUK)
    // =========================================================================
    const pedestalGroup = new THREE.Group();
    showcaseTurntable.add(pedestalGroup);

    // Material: Matte Studio Ceramic / Cast Stone
    const pedestalMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      roughness: 0.28,
      metalness: 0.08,
      clearcoat: 0.5,
      clearcoatRoughness: 0.15,
    });

    // Tier 1: Main Base Plinth
    const plinth1 = new THREE.Mesh(
      new THREE.CylinderGeometry(2.35, 2.45, 0.32, 64),
      pedestalMat
    );
    plinth1.position.y = -1.55;
    pedestalGroup.add(plinth1);

    // Tier 2: Upper Plinth Step
    const plinth2 = new THREE.Mesh(
      new THREE.CylinderGeometry(2.18, 2.22, 0.14, 64),
      pedestalMat
    );
    plinth2.position.y = -1.32;
    pedestalGroup.add(plinth2);

    // Accent Ring: Precision Anodized Cobalt Groove
    const accentRingMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      metalness: 0.85,
      roughness: 0.2,
    });
    const accentRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.014, 16, 64),
      accentRingMat
    );
    accentRing.rotation.x = Math.PI / 2;
    accentRing.position.y = -1.25;
    pedestalGroup.add(accentRing);

    // Ground Soft Contact Shadow
    const groundShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 5.2),
      new THREE.MeshBasicMaterial({
        color: 0x64748b,
        transparent: true,
        opacity: 0.14,
      })
    );
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.y = -1.72;
    showcaseTurntable.add(groundShadow);

    // =========================================================================
    // B. DIGITAL BALLOT TERMINAL / VAULT (PRODUK KOTAK SUARA GENERASI BARU)
    // =========================================================================
    const terminalGroup = new THREE.Group();
    terminalGroup.position.set(0, -1.24, 0);
    showcaseTurntable.add(terminalGroup);

    const vaultW = 2.1;
    const vaultH = 1.85;
    const vaultD = 1.95;

    // 1. Brushed Aluminum Terminal Base Plate
    const brushedMetalMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.22,
    });

    const terminalBase = new THREE.Mesh(
      new THREE.BoxGeometry(vaultW + 0.1, 0.09, vaultD + 0.1),
      brushedMetalMat
    );
    terminalBase.position.y = 0.045;
    terminalGroup.add(terminalBase);

    // 2. Four Museum-Grade Architectural Corner Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.04, 0.04, vaultH, 24);
    const pillarMat = new THREE.MeshPhysicalMaterial({
      color: 0xd1d5db,
      metalness: 0.92,
      roughness: 0.18,
      clearcoat: 0.8,
    });

    const pOffsetW = vaultW / 2;
    const pOffsetD = vaultD / 2;
    const pY = vaultH / 2 + 0.09;

    const corners = [
      [-pOffsetW, pY, -pOffsetD],
      [pOffsetW, pY, -pOffsetD],
      [-pOffsetW, pY, pOffsetD],
      [pOffsetW, pY, pOffsetD],
    ];

    corners.forEach(([cx, cy, cz]) => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(cx, cy, cz);
      terminalGroup.add(pillar);
    });

    // 3. Crystal Optical Glass Chamber Panels
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      opacity: 1.0,
      transparent: true,
      roughness: 0.05,
      ior: 1.5,
      reflectivity: 0.88,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      depthWrite: false,
    });

    const wallThick = 0.03;

    // Front Glass
    const frontGlass = new THREE.Mesh(
      new THREE.BoxGeometry(vaultW, vaultH, wallThick),
      glassMat
    );
    frontGlass.position.set(0, pY, pOffsetD);
    terminalGroup.add(frontGlass);

    // Back Glass
    const backGlass = new THREE.Mesh(
      new THREE.BoxGeometry(vaultW, vaultH, wallThick),
      glassMat
    );
    backGlass.position.set(0, pY, -pOffsetD);
    terminalGroup.add(backGlass);

    // Left Glass
    const leftGlass = new THREE.Mesh(
      new THREE.BoxGeometry(wallThick, vaultH, vaultD),
      glassMat
    );
    leftGlass.position.set(-pOffsetW, pY, 0);
    terminalGroup.add(leftGlass);

    // Right Glass
    const rightGlass = new THREE.Mesh(
      new THREE.BoxGeometry(wallThick, vaultH, vaultD),
      glassMat
    );
    rightGlass.position.set(pOffsetW, pY, 0);
    terminalGroup.add(rightGlass);

    // 4. Top Sculpted Aluminum Deck with Chamfered Edges
    const topCapY = vaultH + 0.14;
    const topCap = new THREE.Mesh(
      new THREE.BoxGeometry(vaultW + 0.12, 0.1, vaultD + 0.12),
      brushedMetalMat
    );
    topCap.position.y = topCapY;
    terminalGroup.add(topCap);

    // Precision Insertion Slot
    const slotBezelMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      metalness: 0.7,
      roughness: 0.25,
    });
    const slotBezel = new THREE.Mesh(
      new THREE.BoxGeometry(1.36, 0.03, 0.14),
      slotBezelMat
    );
    slotBezel.position.set(0, topCapY + 0.055, 0);
    terminalGroup.add(slotBezel);

    // Subtly Illuminated Slot Opening Cavity (Dark void inside slot)
    const slotHole = new THREE.Mesh(
      new THREE.BoxGeometry(1.24, 0.04, 0.05),
      new THREE.MeshBasicMaterial({ color: 0x0f172a })
    );
    slotHole.position.set(0, topCapY + 0.065, 0);
    terminalGroup.add(slotHole);

    // 5. Front Interactive OLED Display Panel
    const displayTex = createDisplayScreenTexture();
    const displayMat = new THREE.MeshPhysicalMaterial({
      map: displayTex,
      roughness: 0.15,
      clearcoat: 0.95,
      metalness: 0.1,
    });
    const displayPanel = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.44, 0.02),
      displayMat
    );
    displayPanel.position.set(0, 0.9, pOffsetD + 0.025);
    terminalGroup.add(displayPanel);

    // 6. Deposited Ballots resting inside the glass chamber
    const droppedBallotMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.35,
    });
    const droppedCardGeo = new THREE.BoxGeometry(0.85, 0.016, 0.58);

    const d1 = new THREE.Mesh(droppedCardGeo, droppedBallotMat);
    d1.position.set(-0.25, 0.12, 0.1);
    d1.rotation.set(0.04, 0.35, 0.02);
    terminalGroup.add(d1);

    const d2 = new THREE.Mesh(droppedCardGeo, droppedBallotMat);
    d2.position.set(0.3, 0.14, -0.15);
    d2.rotation.set(-0.03, -0.45, 0.05);
    terminalGroup.add(d2);

    const d3 = new THREE.Mesh(droppedCardGeo, droppedBallotMat);
    d3.position.set(-0.05, 0.16, 0.0);
    d3.rotation.set(0.02, 0.15, -0.04);
    terminalGroup.add(d3);

    // =========================================================================
    // C. THE HERO FLOATING "E-BALLOT" CARD (PRODUK DIGITAL UNVEILED)
    // =========================================================================
    const ballotTexture = createBallotTexture();

    const activeBallotMatFront = new THREE.MeshPhysicalMaterial({
      map: ballotTexture,
      roughness: 0.18,
      clearcoat: 0.95,
      clearcoatRoughness: 0.06,
      metalness: 0.05,
      reflectivity: 0.9,
    });

    const activeBallotMatBack = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.28,
    });

    const cardMaterials = [
      activeBallotMatBack, // right
      activeBallotMatBack, // left
      activeBallotMatBack, // top
      activeBallotMatBack, // bottom
      activeBallotMatFront, // front
      activeBallotMatBack, // back
    ];

    const activeBallot = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 1.48, 0.016),
      cardMaterials
    );
    // Initial poise directly above the slot
    activeBallot.position.set(0, 1.62, 0);
    activeBallot.rotation.x = -0.32;
    activeBallot.rotation.y = 0.12;
    terminalGroup.add(activeBallot);

    setIsLoaded(true);

    // 5. Interaction: Mouse Parallax & Dynamic Showcase Angles
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

    // 6. Animation Loop (Exhibition Turntable Rotation & Levitation)
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse interpolation (inertia)
      current.x += (target.x - current.x) * 0.05;
      current.y += (target.y - current.y) * 0.05;

      if (!prefersReducedMotion) {
        // Motorized Showroom Turntable Sway (360° product reveal feel)
        const turntableSway = Math.sin(elapsedTime * 0.45) * 0.22 - 0.25;
        showcaseTurntable.rotation.y = turntableSway + current.x * 0.4;
        showcaseTurntable.rotation.x = 0.06 - current.y * 0.2;

        // Floating Ballot Card: Aerodynamic Levitation Float & Tilt
        const hoverBob = Math.sin(elapsedTime * 1.8) * 0.07;
        const hoverRoll = Math.sin(elapsedTime * 1.3) * 0.025;

        // Dynamic dip when user points near center
        const dip = Math.abs(current.x) * 0.08;
        activeBallot.position.y = 1.62 + hoverBob - dip;
        activeBallot.position.x = current.x * 0.22;

        // Card tilts toward cursor like magnetic levitation
        activeBallot.rotation.x = -0.32 - current.y * 0.3;
        activeBallot.rotation.y = 0.12 + current.x * 0.42;
        activeBallot.rotation.z = hoverRoll + current.x * 0.1;
      }

      // Parallax scroll reaction
      const scrollFactor = Math.min(scrollY / 800, 1);
      showcaseTurntable.position.y = -scrollFactor * 0.25;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      // Clean up geometries & materials
      pedestalMat.dispose();
      accentRingMat.dispose();
      brushedMetalMat.dispose();
      pillarMat.dispose();
      glassMat.dispose();
      slotBezelMat.dispose();
      displayMat.dispose();
      displayTex.dispose();
      droppedBallotMat.dispose();
      activeBallotMatFront.dispose();
      activeBallotMatBack.dispose();
      ballotTexture.dispose();
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
      {/* Studio Floor Soft Backdrop Glow */}
      <div className="absolute -z-10 w-4/5 h-4/5 rounded-full bg-slate-200/40 blur-3xl pointer-events-none" />
      <div className="absolute -z-10 w-1/2 h-1/2 rounded-full bg-blue-500/[0.03] blur-2xl pointer-events-none" />
    </div>
  );
}
