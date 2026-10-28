'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';

/**
 * Google Antigravity-Authentic Radial Particle Cursor Follower
 * 
 * Recreates the iconic Google Antigravity radial burst constellation ring:
 * - Concentric staggered layers of radiating colored dashes (Google rainbow palette: Blue, Indigo, Purple, Magenta, Coral, Orange, Amber, Cyan)
 * - Hollow center with high-precision core dot tracking exact pointer coordinates
 * - Organic trailing spring physics (lerp) with gentle cosmic revolution
 * - Interactive hover expansion & tactile mousedown impulse
 * - Disabled on touch/mobile devices ((pointer: coarse))
 * - 100% pointer-events: none (zero interaction interference)
 */

interface Dash {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
  opacity: number;
}

const COLOR_STOPS = [
  { deg: 0, r: 59, g: 130, b: 246 },    // #3b82f6 Blue
  { deg: 45, r: 79, g: 70, b: 229 },    // #4f46e5 Indigo
  { deg: 90, r: 124, g: 58, b: 237 },   // #7c3aed Purple
  { deg: 135, r: 219, g: 39, b: 119 },  // #db2777 Magenta
  { deg: 180, r: 239, g: 68, b: 68 },   // #ef4444 Coral Red
  { deg: 225, r: 249, g: 115, b: 22 },  // #f97316 Orange
  { deg: 270, r: 245, g: 158, b: 11 },  // #f59e0b Amber
  { deg: 315, r: 6, g: 182, b: 212 },   // #06b6d4 Cyan
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

// Pre-compute 92 radial particle dashes once outside component
function generateAntigravityRingDashes(): Dash[] {
  const cx = 40;
  const cy = 40;
  const layers = [
    { count: 16, r: 13.5, len: 3.0, w: 1.6, opacity: 0.95 },
    { count: 24, r: 19.5, len: 4.2, w: 1.7, opacity: 0.85 },
    { count: 32, r: 26.0, len: 5.4, w: 1.5, opacity: 0.72 },
    { count: 20, r: 32.0, len: 2.4, w: 1.2, opacity: 0.55 },
  ];

  const dashes: Dash[] = [];
  let id = 0;

  layers.forEach((layer, lIdx) => {
    const step = 360 / layer.count;
    const offset = lIdx * (step / 2.3);
    for (let i = 0; i < layer.count; i++) {
      const deg = (i * step + offset) % 360;
      const rad = (deg * Math.PI) / 180;
      const r1 = layer.r - layer.len / 2;
      const r2 = layer.r + layer.len / 2;

      dashes.push({
        id: id++,
        x1: +(cx + r1 * Math.cos(rad)).toFixed(2),
        y1: +(cy + r1 * Math.sin(rad)).toFixed(2),
        x2: +(cx + r2 * Math.cos(rad)).toFixed(2),
        y2: +(cy + r2 * Math.sin(rad)).toFixed(2),
        color: getInterpolatedColor(deg),
        width: layer.w,
        opacity: layer.opacity,
      });
    }
  });

  return dashes;
}

const ANTIGRAVITY_DASHES = generateAntigravityRingDashes();

export default function CursorFollower() {
  const [enabled, setEnabled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const ringContainerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  const mousePos = useRef({ x: -200, y: -200 });
  const ringPos = useRef({ x: -200, y: -200 });
  const dotPos = useRef({ x: -200, y: -200 });

  useEffect(() => {
    // Only enable on non-touch devices with fine pointers
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

      // Detect hover over interactive UI elements
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest(
          'a, button, input, select, textarea, label, [role="button"], [data-cursor-hover], .cursor-pointer'
        );
        setIsHovered(Boolean(interactive));
      }
    };

    const onMouseDown = () => setIsMouseDown(true);
    const onMouseUp = () => setIsMouseDown(false);
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    let animId: number;

    const render = () => {
      // Elastic trailing lerp for Antigravity constellation ring
      const ringLerp = 0.16;
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * ringLerp;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * ringLerp;

      // Snappy lerp for precision core dot
      const dotLerp = 0.82;
      dotPos.current.x += (mousePos.current.x - dotPos.current.x) * dotLerp;
      dotPos.current.y += (mousePos.current.y - dotPos.current.y) * dotLerp;

      if (ringContainerRef.current) {
        ringContainerRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0) translate(-50%, -50%)`;
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
      {/* Antigravity Radial Particle Constellation Ring Container */}
      <div
        ref={ringContainerRef}
        className="fixed top-0 left-0 pointer-events-none will-change-transform flex items-center justify-center"
      >
        <div
          className={`transition-all duration-300 ease-out flex items-center justify-center ${
            isMouseDown
              ? 'scale-75 opacity-90'
              : isHovered
              ? 'scale-[1.38] drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]'
              : 'scale-100 drop-shadow-[0_0_4px_rgba(59,130,246,0.2)]'
          }`}
        >
          {/* Rotating SVG Halo */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 80 80"
            className="animate-[spin_24s_linear_infinite] overflow-visible"
          >
            {ANTIGRAVITY_DASHES.map((d) => (
              <line
                key={d.id}
                x1={d.x1}
                y1={d.y1}
                x2={d.x2}
                y2={d.y2}
                stroke={d.color}
                strokeWidth={d.width}
                strokeLinecap="round"
                opacity={d.opacity}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Precise Center Core Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none will-change-transform flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
      >
        <div
          className={`rounded-full transition-all duration-150 ease-out ${
            isHovered
              ? 'w-2 h-2 bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/60 ring-2 ring-white/80'
              : 'w-1.5 h-1.5 bg-blue-600 shadow-sm shadow-blue-500/50'
          }`}
        />
      </div>
    </div>
  );
}
