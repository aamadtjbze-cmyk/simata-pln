/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Users, Clock, LogIn, LogOut, CalendarCheck, HelpCircle } from 'lucide-react';
import { Visitor } from '../types';

interface StatsDashboardProps {
  visitors: Visitor[];
}

export default function StatsDashboard({ visitors }: StatsDashboardProps) {
  const [time, setTime] = useState(new Date('2026-06-19T22:25:12-07:00'));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prevTime) => new Date(prevTime.getTime() + 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const total = visitors.length;
  const inProgress = visitors.filter((v) => v.status === 'IN-PROGRESS').length;
  const done = visitors.filter((v) => v.status === 'DONE').length;
  const scheduled = visitors.filter((v) => v.status === 'SCHEDULED').length;
  const pending = visitors.filter((v) => v.status === 'PENDING').length;

  // Calculate purposes breakdown
  const purposeCounts: { [key: string]: number } = {};
  visitors.forEach((v) => {
    const p = v.purpose.toLowerCase().trim();
    purposeCounts[p] = (purposeCounts[p] || 0) + 1;
  });

  const topPurposes = Object.entries(purposeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const formatClock = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }) + ' WIB';
  };

  const formatDayDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-3.5">
      {/* Realtime PLN Dispatch Clock */}
      <div className="bg-gradient-to-br from-[#005DA6] via-[#004070] to-[#002540] text-white p-4 rounded-none flex flex-col justify-between border-2 border-[#FFD500] shadow-[4px_4px_0px_#FFD500] sm:col-span-2 lg:col-span-1 transform transition-all duration-200 hover:-translate-y-0.5">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#FFD500] font-sans">
              Waktu Distribusi
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <p className="text-2xl font-mono font-black text-[#FFD500] tracking-wider mt-1">
            {formatClock(time)}
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-xs font-semibold text-sky-200">{formatDayDate(time)}</p>
          <p className="text-[10px] text-slate-350">Sistem Terintegrasi SIMATA v2 PLN</p>
        </div>
      </div>

      {/* KPI Cards (Premium Glassmorphism & Sharp Accents) */}
      <div className="premium-glass p-4 rounded-none shadow-[3px_3px_0px_rgba(0,93,166,0.12)] flex items-center gap-4 transform transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(0,93,166,0.2)] dark:hover:shadow-[4px_4px_0px_rgba(255,213,0,0.1)]">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-[#005DA6] dark:text-sky-400 rounded-none border border-[#005DA6]/20">
          <Users size={22} />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Tamu</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{total}</p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Kumulatif terdaftar</span>
        </div>
      </div>

      <div className="premium-glass p-4 rounded-none shadow-[3px_3px_0px_rgba(217,119,6,0.12)] flex items-center gap-4 glow-active-amber transform transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(217,119,6,0.25)]">
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-none border border-amber-600/20">
          <LogIn size={22} className="animate-pulse" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Di Dalam Gedung</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{inProgress}</p>
          <span className="text-[10px] text-amber-500 font-medium">Sedang berkunjung</span>
        </div>
      </div>

      <div className="premium-glass p-4 rounded-none shadow-[3px_3px_0px_rgba(16,185,129,0.12)] flex items-center gap-4 transform transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(16,185,129,0.2)]">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-none border border-emerald-600/20">
          <LogOut size={22} />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Selesai Berkeluar</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{done}</p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Sudah check-out</span>
        </div>
      </div>

      <div className="premium-glass p-4 rounded-none shadow-[3px_3px_0px_rgba(14,165,233,0.12)] flex items-center gap-4 transform transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(14,165,233,0.2)]">
        <div className="p-3 bg-sky-50 dark:bg-sky-950/40 text-sky-500 dark:text-sky-400 rounded-none border border-sky-500/20">
          <CalendarCheck size={22} />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Terjadwal & Antrian</span>
          <p className="text-2xl font-black text-sky-500 dark:text-sky-400 font-mono">{scheduled + pending}</p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{scheduled} Rencana, {pending} Tunggu</span>
        </div>
      </div>
    </div>
  );
}
