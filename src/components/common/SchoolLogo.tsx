'use client';

import React, { useState } from 'react';

interface SchoolLogoProps {
  className?: string;
  size?: number;
  alt?: string;
  variant?: 'circle' | 'square' | 'raw';
}

export default function SchoolLogo({
  className = 'w-10 h-10',
  size = 40,
  alt = 'Logo Resmi SMK Negeri 4 Kota Serang',
  variant = 'raw',
}: SchoolLogoProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`${className} rounded-xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-slate-700/60 shadow flex items-center justify-center font-mono font-black text-xs text-white select-none`}
        title={alt}
      >
        <span className="text-blue-400">4</span>SK
      </div>
    );
  }

  const containerClasses =
    variant === 'circle'
      ? 'rounded-full overflow-hidden'
      : variant === 'square'
      ? 'rounded-xl overflow-hidden shadow-sm'
      : '';

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-smkn4.png"
      alt={alt}
      width={size}
      height={size}
      onError={() => setHasError(true)}
      className={`${className} ${containerClasses} object-contain transition-transform`}
      loading="eager"
    />
  );
}
