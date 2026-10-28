'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * Antigravity-Style Smooth Custom Cursor Follower
 * Features:
 * - Fluid spring-interpolated trailing ring
 * - Precise inner core pointer
 * - Intelligent hover state expansion over buttons, links, inputs
 * - Strictly disabled on touch devices to preserve mobile performance
 * - 100% pointer-events-none (never blocks native clicks or interactions)
 */
export default function CursorFollower() {
  const [enabled, setEnabled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const dotPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Only enable on devices with fine pointer (mouse / trackpad)
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

      // Check if hovering over interactive elements
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest(
          'a, button, input, select, textarea, label, [role="button"], [data-cursor-hover], .cursor-pointer'
        );
        setIsHovered(Boolean(interactive));
      }
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    const onMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    let animId: number;

    const render = () => {
      // Smooth linear interpolation for outer ring (Antigravity float)
      const ringLerp = 0.18;
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * ringLerp;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * ringLerp;

      // Snappier interpolation for inner dot
      const dotLerp = 0.65;
      dotPos.current.x += (mousePos.current.x - dotPos.current.x) * dotLerp;
      dotPos.current.y += (mousePos.current.y - dotPos.current.y) * dotLerp;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
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
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [isVisible]);

  if (!enabled) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* Outer Floating Antigravity Ring */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full pointer-events-none will-change-transform transition-[width,height,border-color,background-color] duration-200 ease-out flex items-center justify-center ${
          isHovered
            ? 'w-12 h-12 border-2 border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20 backdrop-blur-[0.5px]'
            : 'w-8 h-8 border border-blue-500/50 bg-blue-500/[0.04]'
        }`}
      />

      {/* Inner Precision Core Dot */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 rounded-full pointer-events-none will-change-transform transition-[width,height,background-color] duration-150 ease-out ${
          isHovered
            ? 'w-1.5 h-1.5 bg-blue-600'
            : 'w-2 h-2 bg-blue-600 shadow-sm shadow-blue-500/50'
        }`}
      />
    </div>
  );
}
