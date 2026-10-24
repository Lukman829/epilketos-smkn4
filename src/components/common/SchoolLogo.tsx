'use client';

import React, { useState } from 'react';
import { SCHOOL_LOGO_DATA_URI } from '@/lib/schoolLogoData';

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
  // Primary attempt loads static /logo-smkn4.png. If not present (e.g. deployed without public asset),
  // seamlessly fall back to encoded data URI, and finally to clean badge if both fail.
  const [src, setSrc] = useState<string>('/logo-smkn4.png');
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (src !== SCHOOL_LOGO_DATA_URI) {
      setSrc(SCHOOL_LOGO_DATA_URI);
    } else {
      setHasError(true);
    }
  };

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
      src={src}
      alt={alt}
      width={size}
      height={size}
      onError={handleError}
      className={`${className} ${containerClasses} object-contain transition-transform`}
      loading="eager"
    />
  );
}
