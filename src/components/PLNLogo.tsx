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
    sm: { svg: 'h-8 w-6', mainText: 'text-base', subText: 'text-[9px]' },
    md: { svg: 'h-11 w-8.5', mainText: 'text-2xl', subText: 'text-[11px]' },
    lg: { svg: 'h-14 w-10.5', mainText: 'text-3xl', subText: 'text-[13px]' },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official High-Fidelity PLN Emblem Badge */}
      <div className={`relative ${dimensions.svg} bg-[#005DA6] rounded-none p-0.5 flex items-center justify-center border-[2.5px] border-[#FFD500] shadow-sm overflow-hidden shrink-0`}>
        <svg
          viewBox="0 0 90 115"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* 3 Tiga Gelombang Merah PLN (Corporate Red Waves) */}
          <path
            d="M 8 52 C 20 44, 38 60, 52 52 C 62 45, 74 55, 82 50"
            stroke="#E52320"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 8 67 C 20 59, 38 75, 52 67 C 62 60, 74 70, 82 65"
            stroke="#E52320"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 8 82 C 20 74, 38 90, 52 82 C 62 75, 74 85, 82 80"
            stroke="#E52320"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />

          {/* Petir Kuning Keemasan PLN (Yellow Lightning Bolt) */}
          <path
            d="M 64 8 L 26 62 H 46 L 20 106 L 76 50 H 54 Z"
            fill="#FFD500"
            stroke="#005DA6"
            strokeWidth="2"
            strokeLinejoin="miter"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-sans font-black tracking-tight text-[#005DA6] dark:text-sky-400 ${dimensions.mainText}`}>
              PLN
            </span>
            <div className="h-4 sm:h-5 w-[2.5px] bg-[#FFD500] shrink-0"></div>
            <span className="font-sans font-extrabold text-[#005DA6] dark:text-sky-300 uppercase tracking-widest text-xs sm:text-sm">
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
