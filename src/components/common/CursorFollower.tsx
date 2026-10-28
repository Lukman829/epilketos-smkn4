'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * Google Antigravity Liquid Wave Particle Cursor Follower
 * 
 * Recreates the authentic Antigravity constellation ring with:
 * - Fluid harmonic undulating wave motion ("muter kayak gelombang")
 * - Peristaltic radial wave ripples propagating across concentric layers
 * - Torsional wave twist along the wave crests
 * - Kinetic wave excitation when moving the mouse
 * - NO center blue dot ("titik biru gausah") - completely hollow & clean center
 * - Hardware-accelerated Canvas 2D at 60/120 FPS
 * - Disabled on touch/mobile devices ((pointer: coarse))
 * - 100% pointer-events: none
 */

interface ParticleConfig {
  baseAngle: number;
  baseRadius: number;
  baseLen: number;
  width: number;
  layer: number;
  opacity: number;
  color: string;
}

const COLOR_STOPS = [
  { deg: 0, r: 59, g: 130, b: 246 },    // #3b82f6 Google Blue
  { deg: 45, r: 79, g: 70, b: 229 },    // #4f46e5 Indigo
  { deg: 90, r: 124, g: 58, b: 237 },   // #7c3aed Purple
  { deg: 135, r: 219, g: 39, b: 119 },  // #db2777 Magenta
  { deg: 180, r: 239, g: 68, b: 68 },   // #ef4444 Coral Red
  { deg: 225, r: 249, g: 115, b: 22 },  // #f97316 Orange
  { deg: 270, r: 245, g: 158, b: 11 },  // #f59e0b Amber Gold
  { deg: 315, r: 6, g: 182, b: 212 },   // #06b6d4 Arctic Cyan
  { deg: 360, r: 59, g: 130, b: 246 }   // Blue
];

function getInterpolatedColor(deg: number): string {
  const d = ((deg % 360) + 360) % 360;
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    if (d >= COLOR_STOPS[i].deg && d <= COLOR_STOPS[i + 1].deg) {
      const t = (d - COLOR_STOPS[i].deg) / (COLOR_STOPS[i + 1].deg - COLOR_STOPS[i].deg);
      const r = Math.round(COLOR_STOPS[i].r + t * (COLOR_STOPS[i + 1].r - COLOR_STOPS[i].r));
      const g = Math.round(COLOR_STOPS[i].g + t * (COLOR_STOPS[i + 1].g - COLOR_STOPS[i].g));
      const b = Math.round(COLOR_STOPS[i].b + t * (COLOR_STOPS[i + 1].b - COLOR_STOPS[i].b));
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return 'rgb(59, 130, 246)';
}

function initializeParticles(): ParticleConfig[] {
  const layers = [
    { count: 16, r: 14.0, len: 3.2, w: 1.6, opacity: 0.95 },
    { count: 24, r: 20.5, len: 4.4, w: 1.7, opacity: 0.85 },
    { count: 32, r: 27.5, len: 5.6, w: 1.5, opacity: 0.72 },
    { count: 20, r: 34.0, len: 2.6, w: 1.2, opacity: 0.55 },
  ];

  const particles: ParticleConfig[] = [];
  layers.forEach((layer, lIdx) => {
    const step = 360 / layer.count;
    const offset = lIdx * (step / 2.3);
    for (let i = 0; i < layer.count; i++) {
      const deg = (i * step + offset) % 360;
      particles.push({
        baseAngle: (deg * Math.PI) / 180,
        baseRadius: layer.r,
        baseLen: layer.len,
        width: layer.w,
        layer: lIdx,
        opacity: layer.opacity,
        color: getInterpolatedColor(deg),
      });
    }
  });

  return particles;
}

const PARTICLES = initializeParticles();
const CANVAS_SIZE = 112; // 112x112 box gives plenty of margin for wave peaks & hover expansion
const CX = CANVAS_SIZE / 2;
const CY = CANVAS_SIZE / 2;

export default function CursorFollower() {
  const [enabled, setEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const mousePos = useRef({ x: -200, y: -200 });
  const prevMousePos = useRef({ x: -200, y: -200 });
  const ringPos = useRef({ x: -200, y: -200 });

  const isHoveredRef = useRef(false);
  const isMouseDownRef = useRef(false);
  const currentScaleRef = useRef(1.0);
  const speedExcitementRef = useRef(0.0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

    if (isTouch || !hasFinePointer) {
      setEnabled(false);
      return;
    }

    setEnabled(true);

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;

      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest(
          'a, button, input, select, textarea, label, [role="button"], [data-cursor-hover], .cursor-pointer'
        );
        isHoveredRef.current = Boolean(interactive);
      }
    };

    const onMouseDown = () => {
      isMouseDownRef.current = true;
    };

    const onMouseUp = () => {
      isMouseDownRef.current = false;
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Setup high-DPI Canvas
    const canvas = canvasRef.current;
    let ctx: CanvasRenderingContext2D | null = null;
    if (canvas) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = CANVAS_SIZE * dpr;
      canvas.height = CANVAS_SIZE * dpr;
      ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    }

    let animId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 1. Spring-interpolated cursor position
      const ringLerp = 0.16;
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * ringLerp;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * ringLerp;

      // Calculate mouse velocity for kinetic wave surge
      const vx = mousePos.current.x - prevMousePos.current.x;
      const vy = mousePos.current.y - prevMousePos.current.y;
      prevMousePos.current.x = mousePos.current.x;
      prevMousePos.current.y = mousePos.current.y;
      const speed = Math.sqrt(vx * vx + vy * vy);

      const targetExcitement = Math.min(speed / 35, 1.4);
      speedExcitementRef.current += (targetExcitement - speedExcitementRef.current) * 0.12;

      // 2. Scale target based on hover & click
      const targetScale = isMouseDownRef.current
        ? 0.78
        : isHoveredRef.current
        ? 1.35
        : 1.0;
      currentScaleRef.current += (targetScale - currentScaleRef.current) * 0.14;
      const scale = currentScaleRef.current;

      // Update container position
      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      // 3. Render undulating wave particles on Canvas
      if (ctx) {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        const t = now * 0.0024;
        const waveSpeed = t * 2.8;
        const slowSpin = t * 0.35;
        const excitement = speedExcitementRef.current;

        for (let i = 0; i < PARTICLES.length; i++) {
          const p = PARTICLES[i];

          // Harmonic wave equation propagating circumferentially & radially
          const theta = p.baseAngle + slowSpin;
          
          // Primary wave: 3 crests rippling around the ring with layer phase lag
          const wave1 = Math.sin(3 * theta - waveSpeed - p.layer * 0.75) * (2.6 + p.layer * 0.7 + excitement * 1.8);
          // Secondary subtle wave harmonic: 5 crests for organic fluid texture
          const wave2 = Math.cos(5 * theta + t * 1.5) * (1.1 + excitement * 0.9);

          // Torsional wave: particles gently twist along the wave crests
          const torsion = Math.cos(3 * theta - waveSpeed) * 0.09;
          const effAngle = theta + torsion;

          // Undulating radial position
          const r = (p.baseRadius + wave1 + wave2) * scale;
          // Length pulses slightly with wave peaks
          const len = p.baseLen * (1 + wave1 / 16) * scale;

          const r1 = Math.max(r - len / 2, 4);
          const r2 = r + len / 2;

          const x1 = CX + r1 * Math.cos(effAngle);
          const y1 = CY + r1 * Math.sin(effAngle);
          const x2 = CX + r2 * Math.cos(effAngle);
          const y2 = CY + r2 * Math.sin(effAngle);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.width * (0.9 + scale * 0.1);
          ctx.lineCap = 'round';
          ctx.globalAlpha = isHoveredRef.current
            ? Math.min(p.opacity * 1.25, 1.0)
            : p.opacity;
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [isVisible]);

  if (!enabled) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[99999] transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* Antigravity Fluid Wave Constellation Container (NO center dot) */}
      <div
        ref={containerRef}
        className="fixed top-0 left-0 pointer-events-none will-change-transform flex items-center justify-center"
      >
        <canvas
          ref={canvasRef}
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
          className="pointer-events-none"
        />
      </div>
    </div>
  );
}
