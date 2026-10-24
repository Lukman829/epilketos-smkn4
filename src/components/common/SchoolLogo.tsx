'use client';

import React from 'react';
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
  const containerClasses =
    variant === 'circle'
      ? 'rounded-full overflow-hidden'
      : variant === 'square'
      ? 'rounded-xl overflow-hidden shadow-sm'
      : '';

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SCHOOL_LOGO_DATA_URI}
      alt={alt}
      width={size}
      height={size}
      className={`${className} ${containerClasses} object-contain select-none`}
      loading="eager"
      decoding="sync"
    />
  );
}
