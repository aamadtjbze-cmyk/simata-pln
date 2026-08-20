/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface PLNLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function PLNLogo({ className = '', size = 'md', showText = true }: PLNLogoProps) {
  const dimensions = {
    sm: { svg: 'h-7 w-7', mainText: 'text-base', subText: 'text-[9px]' },
    md: { svg: 'h-10 w-10', mainText: 'text-2xl', subText: 'text-[11px]' },
    lg: { svg: 'h-13 w-13', mainText: 'text-3xl', subText: 'text-[13px]' },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Yellow Square PLN Emblem (Kotak Kuning, Gelombang Cyan, Petir Merah) */}
      <div className={`relative ${dimensions.svg} bg-[#FFE500] rounded-none p-1 flex items-center justify-center shadow-sm overflow-hidden shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* 3 Tiga Gelombang Biru Cyan / Air PLN */}
          <path
            d="M 12 42 C 26 35, 44 49, 58 42 C 72 35, 84 46, 88 42"
            stroke="#00A0E9"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 12 57 C 26 50, 44 64, 58 57 C 72 50, 84 61, 88 57"
            stroke="#00A0E9"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 12 72 C 26 65, 44 79, 58 72 C 72 65, 84 76, 88 72"
            stroke="#00A0E9"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />

          {/* Petir Merah PLN (Red Lightning Bolt) */}
          <path
            d="M 62 10 L 28 55 H 48 L 22 92 L 72 45 H 52 Z"
            fill="#E52320"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-sans font-black tracking-tight text-[#00A0E9] ${dimensions.mainText}`}>
              PLN
            </span>
            <div className="h-4 sm:h-5 w-[2.5px] bg-[#FFE500] shrink-0"></div>
            <span className="font-sans font-extrabold text-[#00A0E9] uppercase tracking-widest text-xs sm:text-sm">
              PERSERO
            </span>
          </div>
          <span className={`font-sans font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 ${dimensions.subText}`}>
            Sistem Manajemen Tamu
          </span>
        </div>
      )}
    </div>
  );
}
