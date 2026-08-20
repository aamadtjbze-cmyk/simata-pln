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
    sm: { svg: 'h-8 w-6', text: 'text-sm' },
    md: { svg: 'h-12 w-9', text: 'text-xl' },
    lg: { svg: 'h-16 w-12', text: 'text-2xl' },
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* High fidelity vector PLN Logo badge */}
      <div className={`relative ${dimensions.svg} bg-[#005DA6] rounded-none p-1 flex items-center justify-center border-2 border-[#FFD500] shadow-sm overflow-hidden`}>
        <svg
          viewBox="0 0 100 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Red corporate accent lines at the back */}
          <path
            d="M 12 65 C 12 55, 30 50, 45 60 C 60 70, 85 55, 88 45"
            stroke="#DA251C"
            strokeWidth="8"
            strokeLinecap="square"
            fill="none"
            opacity="0.9"
          />
          <path
            d="M 12 85 C 12 75, 30 70, 45 80 C 60 90, 85 75, 88 65"
            stroke="#DA251C"
            strokeWidth="8"
            strokeLinecap="square"
            fill="none"
            opacity="0.9"
          />

          {/* Yellow Lightning Strike (Petir PLN) */}
          <path
            d="M75 10 L25 72 L45 72 L15 120 L85 52 L58 52 Z"
            fill="#FFD500"
            stroke="#005DA6"
            strokeWidth="3.5"
            strokeLinejoin="miter"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col select-none">
          <div className="flex items-center gap-1.5">
            <span className="font-sans font-extrabold tracking-tighter text-[#005DA6] text-2xl dark:text-sky-350">
              PLN
            </span>
            <div className="h-5 w-[2px] bg-[#FFD500]"></div>
            <span className="font-sans font-black text-xs tracking-widest text-[#005DA6]/90 uppercase dark:text-sky-300">
              Persero
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest -mt-1 dark:text-slate-400">
            Sistem Manajemen Tamu
          </span>
        </div>
      )}
    </div>
  );
}
