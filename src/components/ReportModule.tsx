/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  TrendingUp,
  Users,
  Briefcase,
  Layers,
  Printer,
  Calendar,
  Download,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart2 as BarIcon,
  ChevronRight,
  ShieldAlert,
  ClipboardList,
  MapPin,
  CalendarDays
} from 'lucide-react';
import { Visitor, VisitorStatus } from '../types';
import PLNLogo from './PLNLogo';

interface ReportModuleProps {
  visitors: Visitor[];
}

export default function ReportModule({ visitors }: ReportModuleProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [isPrintSimulationOpen, setIsPrintSimulationOpen] = useState(false);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const yearsList = [2024, 2025, 2026, 2027];

  // Helper to parse dates from format "19 June 2026 - 14.50" or "19 Juni 2026 - 14.50"
  const parsedVisitors = useMemo(() => {
    const monthMap: { [key: string]: number } = {
      january: 0, januari: 0,
      february: 1, februari: 1,
      march: 2, maret: 2,
      april: 3,
      may: 4, mei: 4,
      june: 5, juni: 5,
      july: 6, juli: 6,
      august: 7, agustus: 7,
      september: 8,
      october: 9, oktober: 9,
      november: 10,
      december: 11, desember: 11
    };

    return visitors.map(v => {
      let dateObj = new Date();
      let day = 1;
      let month = new Date().getMonth();
      let year = new Date().getFullYear();
      let hour = 12;
      let minute = 0;

      // Extract details from e.g. "19 June 2026 - 14.50" or similar
      try {
        const parts = v.schedule ? v.schedule.split(' ') : [];
        if (parts.length >= 3) {
          day = parseInt(parts[0]) || 1;
          const monthKey = parts[1].toLowerCase();
          month = monthMap[monthKey] !== undefined ? monthMap[monthKey] : new Date().getMonth();
          year = parseInt(parts[2]) || new Date().getFullYear();
          
          if (parts[4]) {
            const timeParts = parts[4].split('.');
            hour = parseInt(timeParts[0]) || 12;
            minute = parseInt(timeParts[1]) || 0;
          }
        }
        dateObj = new Date(year, month, day, hour, minute);
      } catch (e) {
        // Fallback
      }

      return {
        ...v,
        parsedDay: day,
        parsedMonth: month,
        parsedYear: year,
        parsedDate: dateObj
      };
    });
  }, [visitors]);

  // Compute selected month's visitors
  const monthlyVisitors = useMemo(() => {
    return parsedVisitors.filter(v => v.parsedMonth === selectedMonth && v.parsedYear === selectedYear);
  }, [parsedVisitors, selectedMonth, selectedYear]);

  // Daily statistics
  const dailyVisitorsCount = useMemo(() => {
    // Let's find the current day (matching today, or pick June 19th as default of the system)
    const targetDay = 19; 
    const matches = monthlyVisitors.filter(v => v.parsedDay === targetDay);
    return matches.length;
  }, [monthlyVisitors]);

  // Weekly statistics (grouped by 4 weeks of the month)
  const weeklyVisitors = useMemo(() => {
    const weeks = [0, 0, 0, 0, 0]; // 5 slots for weeks
    monthlyVisitors.forEach(v => {
      const d = v.parsedDay;
      if (d <= 7) weeks[0]++;
      else if (d <= 14) weeks[1]++;
      else if (d <= 21) weeks[2]++;
      else if (d <= 28) weeks[3]++;
      else weeks[4]++;
    });
    return weeks;
  }, [monthlyVisitors]);

  // Total status counts
  const statusCounts = useMemo(() => {
    const counts = { DONE: 0, 'IN-PROGRESS': 0, SCHEDULED: 0, PENDING: 0 };
    monthlyVisitors.forEach(v => {
      if (counts[v.status] !== undefined) {
        counts[v.status]++;
      }
    });
    return counts;
  }, [monthlyVisitors]);

  // Demographic stats: Gender Breakdown
  const genderStats = useMemo(() => {
    let male = 0;
    let female = 0;
    monthlyVisitors.forEach(v => {
      if (v.gender === 'Perempuan') {
        female++;
      } else {
        male++; // Default male
      }
    });
    const total = male + female;
    const malePercent = total > 0 ? Math.round((male / total) * 100) : 0;
    const femalePercent = total > 0 ? Math.round((female / total) * 100) : 0;
    return { male, female, total, malePercent, femalePercent };
  }, [monthlyVisitors]);

  // Top visiting companies
  const companyStats = useMemo(() => {
    const counts: { [key: string]: number } = {};
    monthlyVisitors.forEach(v => {
      const company = v.company ? v.company.toUpperCase().trim() : 'UMUM / INDIVIDU';
      counts[company] = (counts[company] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
  }, [monthlyVisitors]);

  // Purposes breakdown
  const purposeStats = useMemo(() => {
    const counts: { [key: string]: number } = {};
    monthlyVisitors.forEach(v => {
      const p = v.purpose ? v.purpose.toLowerCase().trim() : 'lainnya';
      let cleanP = 'Lain-lain';
      if (p.includes('meet') || p.includes('diskusi')) cleanP = 'Rapat / Meeting';
      else if (p.includes('antar') || p.includes('dok') || p.includes('kirim') || p.includes('invoi')) cleanP = 'Antar Dokumen/Invoice';
      else if (p.includes('interv') || p.includes('wawanc')) cleanP = 'Wawancara';
      else if (p.includes('koordin')) cleanP = 'Koordinasi Teknis';
      else if (p.includes('stok') || p.includes('audit')) cleanP = 'Stok Opname / Audit';
      else if (p.includes('serv') || p.includes('instala') || p.includes('maint')) cleanP = 'Instalasi, IT & Pemeliharaan';
      else cleanP = v.purpose; // fallback

      counts[cleanP] = (counts[cleanP] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [monthlyVisitors]);

  // Trend for daily line chart (1 to 31 days of month)
  const dailyTrendData = useMemo(() => {
    const trend = Array.from({ length: 31 }, (_, i) => ({ day: i + 1, count: 0 }));
    monthlyVisitors.forEach(v => {
      const dayIndex = v.parsedDay - 1;
      if (dayIndex >= 0 && dayIndex < 31) {
        trend[dayIndex].count++;
      }
    });
    return trend;
  }, [monthlyVisitors]);

  const maxDailyCount = useMemo(() => {
    const counts = dailyTrendData.map(d => d.count);
    return Math.max(...counts, 4); // default minimum ceiling
  }, [dailyTrendData]);

  // Handle local print simulation trigger
  const handlePrintReport = () => {
    setIsPrintSimulationOpen(true);
  };

  const handleNativePrint = () => {
    window.print();
  };

  // Export to Excel / CSV format
  const handleExportCSV = () => {
    const listToExport = monthlyVisitors.length > 0 ? monthlyVisitors : visitors;
    const headers = ['ID Form', 'Nama Tamu', 'Instansi / Perusahaan', 'Tujuan', 'Bertemu Pegawai / Divisi', 'Jadwal', 'Waktu Masuk', 'Waktu Keluar', 'Status', 'Masa Berlaku', 'No Telepon', 'Email', 'Main Gate Pass'];
    
    const rows = listToExport.map(v => [
      `"${v.id}"`,
      `"${(v.visitorName || '').replace(/"/g, '""')}"`,
      `"${(v.company || '').replace(/"/g, '""')}"`,
      `"${(v.purpose || '').replace(/"/g, '""')}"`,
      `"${(v.visited || '').replace(/"/g, '""')}"`,
      `"${v.schedule || ''}"`,
      `"${v.inTime || '-'}"`,
      `"${v.outTime || '-'}"`,
      `"${v.status || ''}"`,
      `"${v.validUntil || '-'}"`,
      `"${v.phone || '-'}"`,
      `"${v.email || '-'}"`,
      `"${v.mainGatePass || '-'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIMATA_Laporan_Tamu_${monthNames[selectedMonth]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Search Header Banner */}
      <div className="bg-white dark:bg-[#111c30] border-2 border-slate-200 dark:border-slate-800 p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm select-none">
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#005DA6] text-white border-b-2 border-r-2 border-[#FFD500]">
            <ClipboardList size={22} />
          </div>
          <div>
            <h4 className="font-black text-slate-900 dark:text-white tracking-tight uppercase font-display text-sm">
              SIMATA Modul Pelaporan Tamu Komprehensif
            </h4>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              Periode Laporan: {monthNames[selectedMonth]} {selectedYear}
            </p>
          </div>
        </div>

        {/* Filter Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans flex items-center gap-1">
              <Calendar size={13} className="text-[#005DA6]" /> Bulan:
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-700 dark:text-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
            >
              {monthNames.map((name, index) => (
                <option key={index} value={index}>{name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-700 dark:text-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
            >
              {yearsList.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none border-b-2 border-r-2 border-emerald-900 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Download Berkas CSV / Excel"
          >
            <Download size={13} />
            Unduh Excel / CSV
          </button>

          <button
            onClick={handlePrintReport}
            className="px-4 py-2 bg-[#005DA6] hover:bg-[#004070] text-white rounded-none border-b-2 border-r-2 border-[#FFD500] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Printer size={13} />
            Cetak Laporan Resmi
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Block (Harian, Mingguan, Bulanan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Tamu Hari Ini (Simulated constant June 19th system state) */}
        <div className="bg-white dark:bg-[#111c30] border-2 border-slate-200 dark:border-slate-800 p-5 rounded-none shadow-xs hover:border-[#005DA6] transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 bg-[#005DA6]/10 text-[#005DA6] dark:text-sky-400">
            <CalendarDays size={18} />
          </div>
          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-sans">Kunjungan Harian</span>
          <h5 className="text-3xl font-black text-slate-900 dark:text-white mt-1 border-b pb-2 border-slate-100 dark:border-slate-800/80 leading-none">
            {dailyVisitorsCount} <span className="text-xs font-semibold text-slate-400">tamu hari ini</span>
          </h5>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">
            Merujuk pada parameter buku tamu aktif di tanggal utama laporan (19 {monthNames[selectedMonth]} {selectedYear}).
          </p>
        </div>

        {/* Metric 2: Tamu Minggu Ini */}
        <div className="bg-white dark:bg-[#111c30] border-2 border-slate-200 dark:border-slate-800 p-5 rounded-none shadow-xs hover:border-[#005DA6] transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 bg-amber-500/10 text-amber-500">
            <TrendingUp size={18} />
          </div>
          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-sans">Tamu Minggu Ini</span>
          <h5 className="text-3xl font-black text-slate-900 dark:text-white mt-1 border-b pb-2 border-slate-100 dark:border-slate-800/80 leading-none">
            {weeklyVisitors[2]} <span className="text-xs font-semibold text-slate-400">pada minggu ini</span>
          </h5>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">
            Jumlah kedatangan tamu di blok minggu berjalan utama (Minggu ke-3, tanggal 15 s.d 21).
          </p>
        </div>

        {/* Metric 3: Total Bulanan */}
        <div className="bg-white dark:bg-[#111c30] border-2 border-slate-200 dark:border-slate-800 p-5 rounded-none shadow-xs hover:border-[#005DA6] transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 bg-emerald-500/10 text-emerald-500">
            <Users size={18} />
          </div>
          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-sans">Total Bulanan</span>
          <h5 className="text-3xl font-black text-slate-900 dark:text-white mt-1 border-b pb-2 border-slate-100 dark:border-slate-800/80 leading-none">
            {monthlyVisitors.length} <span className="text-xs font-semibold text-slate-400">total tamu</span>
          </h5>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">
            Akumulasi keseluruhan pendaftaran kunjungan tamu di periode bulan {monthNames[selectedMonth]}.
          </p>
        </div>

        {/* Metric 4: Rasio Checkout */}
        <div className="bg-white dark:bg-[#111c30] border-2 border-slate-200 dark:border-slate-800 p-5 rounded-none shadow-xs hover:border-[#005DA6] transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 bg-sky-500/10 text-sky-500">
            <CheckCircle2 size={18} />
          </div>
          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-sans">Status Terlayani (DONE)</span>
          <h5 className="text-3xl font-black text-slate-900 dark:text-white mt-1 border-b pb-2 border-slate-100 dark:border-slate-800/80 leading-none">
            {statusCounts.DONE} <span className="text-xs font-semibold text-slate-400">tamu checkout</span>
          </h5>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">
            Rasio kelengkapan: {monthlyVisitors.length > 0 ? Math.round((statusCounts.DONE / monthlyVisitors.length) * 100) : 0}% tamu terdaftar tuntas menyelesaikan kunjungan.
          </p>
        </div>

      </div>

      {/* Visual Analytics / Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Line Trend of visitors month */}
        <div className="bg-white dark:bg-[#111c30] border-2 border-slate-200 dark:border-slate-800 p-5 rounded-none col-span-2 select-none shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-850 dark:text-white flex items-center gap-2 font-display">
              <BarIcon size={14} className="text-[#005DA6]" />
              Tren Volume Tamu Harian (Periode Bulanan)
            </h5>
            <span className="text-[9px] font-mono font-bold bg-slate-150 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-none border border-slate-200 dark:border-slate-700">
              {monthlyVisitors.length} Tamu / {monthNames[selectedMonth].toUpperCase()}
            </span>
          </div>

          {/* SVG Trend Graph (Line / Area) */}
          <div className="h-64 w-full relative">
            <svg viewBox="0 0 700 240" className="w-full h-full font-mono text-[9px] text-slate-400 overflow-visible">
              {/* Vertical Grid Lines & Horizontal Day Labels */}
              {[0, 5, 10, 15, 20, 25, 30].map((dayOffset) => {
                const x = 40 + (dayOffset / 30) * 620;
                return (
                  <g key={dayOffset}>
                    <line x1={x} y1="10" x2={x} y2="210" stroke="currentColor" strokeWidth="1" strokeDasharray="2,3" className="text-slate-150 dark:text-slate-800" />
                    <text x={x} y="222" textAnchor="middle" className="text-slate-500 fill-slate-500 dark:fill-slate-400 font-bold">
                      Tgl {dayOffset === 0 ? 1 : dayOffset}
                    </text>
                  </g>
                );
              })}

              {/* Horizontal Grid lines (Counts) */}
              {[0, 1, 2, 3, 4, 5].map((level) => {
                const countVal = Math.round((level / 5) * maxDailyCount);
                const y = 210 - (level / 5) * 190;
                return (
                  <g key={level}>
                    <line x1="40" y1={y} x2="660" y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="1,4" className="text-slate-150 dark:text-slate-800" />
                    <text x="32" y={y + 3} textAnchor="end" className="text-slate-500 fill-slate-500 dark:fill-slate-400 font-bold">
                      {countVal}
                    </text>
                  </g>
                );
              })}

              {/* Gradient Setup */}
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#005DA6" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#005DA6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area path */}
              <path
                d={(() => {
                  let d = 'M 40 210 ';
                  dailyTrendData.forEach((pt, idx) => {
                    const x = 40 + (idx / 30) * 620;
                    const valFactor = pt.count / maxDailyCount;
                    const y = 210 - valFactor * 190;
                    d += `L ${x} ${y} `;
                  });
                  d += 'L 660 210 Z';
                  return d;
                })()}
                fill="url(#chartGrad)"
              />

              {/* Main Line path */}
              <path
                d={(() => {
                  let d = '';
                  dailyTrendData.forEach((pt, idx) => {
                    const x = 40 + (idx / 30) * 620;
                    const valFactor = pt.count / maxDailyCount;
                    const y = 210 - valFactor * 190;
                    if (idx === 0) d += `M ${x} ${y} `;
                    else d += `L ${x} ${y} `;
                  });
                  return d;
                })()}
                fill="none"
                stroke="#005DA6"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Small circles for key points */}
              {dailyTrendData.map((pt, idx) => {
                if (pt.count === 0) return null;
                const x = 40 + (idx / 30) * 620;
                const valFactor = pt.count / maxDailyCount;
                const y = 210 - valFactor * 190;

                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="4"
                    className="fill-[#FFD500] stroke-[#005DA6]"
                    strokeWidth="2"
                  >
                    <title>{`Tanggal ${idx + 1}: ${pt.count} Tamu`}</title>
                  </circle>
                );
              })}
            </svg>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">
            Sumbu-X: Hari dalam bulan &bull; Sumbu-Y: Jumlah Kedatangan Tamu (Orang)
          </div>
        </div>

        {/* Right Column: Demographics - Gender and Top Companies */}
        <div className="bg-white dark:bg-[#111c30] border-2 border-slate-200 dark:border-slate-800 p-5 rounded-none flex flex-col justify-between shadow-sm select-none">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2 font-display">
                <PieIcon size={14} className="text-[#005DA6]" />
                Demografis Gender Tamu
              </h5>
            </div>

            {/* Gender visualizer split */}
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#005DA6] font-bold">Laki-laki ({genderStats.male} Tamu)</span>
                <span className="text-rose-500 font-bold">Perempuan ({genderStats.female} Tamu)</span>
              </div>

              {/* Progress split bar */}
              <div className="h-6 w-full flex bg-[#FF3B30]/10 rounded-none overflow-hidden border border-slate-200 dark:border-slate-850">
                <div 
                  className="bg-[#005DA6] h-full flex items-center justify-center text-[10px] text-[#FFD500] font-black"
                  style={{ width: `${genderStats.malePercent || 50}%` }}
                >
                  {genderStats.malePercent}%
                </div>
                <div 
                  className="bg-rose-500 h-full flex items-center justify-center text-[10px] text-white font-black"
                  style={{ width: `${genderStats.femalePercent || 50}%` }}
                >
                  {genderStats.femalePercent}%
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-normal mb-3">
                Pembagian gender didominasi oleh perwakilan instansi teknik luar atau manufaktur kelistrikan berjenis kelamin laki-laki.
              </p>
            </div>
          </div>

          {/* Top Companies */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4">
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2 font-display mb-3">
              <Layers size={14} className="text-[#005DA6]" />
              Distribusi Instansi Terbanyak
            </h5>
            <div className="space-y-2">
              {companyStats.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] font-sans">
                  <span className="font-bold text-slate-600 dark:text-slate-350 truncate max-w-[190px]">{item.name}</span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[#005DA6] dark:text-[#FFD500] font-mono font-bold border border-slate-200 dark:border-slate-700">
                    {item.count} Tamu
                  </span>
                </div>
              ))}
              {companyStats.length === 0 && (
                <p className="text-[10px] text-slate-400 italic text-center py-2">Belum ada data instansi.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Purpose distribution row */}
      <div className="bg-white dark:bg-[#111c30] border-2 border-slate-200 dark:border-slate-800 p-5 rounded-none shadow-sm">
        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2 font-display mb-4 border-b pb-2 border-slate-100 dark:border-slate-800">
          <Briefcase size={14} className="text-[#005DA6]" />
          Analisis Tujuan Kunjungan Tamu (Keperluan Terbanyak)
        </h5>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {purposeStats.map((item, idx) => {
            const maxVal = purposeStats.length > 0 ? purposeStats[0].count : 1;
            const barWidth = Math.min((item.count / maxVal) * 100, 100);
            return (
              <div key={idx} className="space-y-1 bg-slate-50 dark:bg-slate-950/20 p-2.5 border border-slate-200/60 dark:border-slate-850">
                <div className="flex items-center justify-between text-xs font-bold font-sans">
                  <span className="text-slate-700 dark:text-slate-300 truncate max-w-[80%]">{item.name}</span>
                  <span className="text-slate-500 font-mono">{item.count}</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-none overflow-hidden">
                  <div className="bg-[#005DA6] h-full" style={{ width: `${barWidth}%` }}></div>
                </div>
              </div>
            );
          })}
          {purposeStats.length === 0 && (
            <p className="text-xs text-slate-400 italic py-2 col-span-3 text-center">Tidak ada rincian tujuan.</p>
          )}
        </div>
      </div>

      {/* Corporate PDF Paper Print simulation Modal */}
      {isPrintSimulationOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in print:bg-white print:p-0">
          <div className="bg-white max-w-4xl w-full text-slate-900 shadow-2xl p-10 border-4 border-[#005DA6] rounded-none my-8 relative overflow-hidden print:shadow-none print:border-none print:p-0 print:my-0">
            
            {/* Watermark security for official corporate docs */}
            <div className="absolute inset-0 bg-[radial-gradient(#005da6_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none"></div>

            {/* Print Header Controls Area */}
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-5 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-[#005DA6]" size={18} />
                <span className="text-xs font-bold uppercase text-[#005DA6] tracking-wider font-sans">Pratinjau Cetak Laporan Resmi PLN</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleNativePrint}
                  className="px-4 py-2 bg-[#005DA6] hover:bg-[#004070] text-white rounded-none border-b-2 border-r-2 border-[#FFD500] text-xs font-bold flex items-center gap-1 mt-0.5 pointer-events-auto cursor-pointer"
                >
                  <Printer size={13} />
                  Kirim ke Printer / Simpan PDF
                </button>
                <button
                  onClick={() => setIsPrintSimulationOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 border border-slate-200 text-xs font-bold font-sans rounded-none cursor-pointer"
                >
                  Tutup Pratinjau
                </button>
              </div>
            </div>

            {/* START DOCUMENT CONTAINER (This mirrors exactly what gets printed) */}
            <div className="font-sans antialiased">
              
              {/* Formal PLN Header */}
              <div className="flex items-center justify-between border-b-4 border-[#005DA6] pb-6">
                <div className="flex items-center gap-4">
                  {/* Embedded high-contrast PLN logo with accurate dimensions */}
                  <div className="scale-110">
                    <PLNLogo showText={false} size="lg" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-[#005DA6] uppercase leading-tight font-display">
                      PT PLN (PERSERO)
                    </h2>
                    <h1 className="text-2xl font-black tracking-tight mt-0.5 text-slate-900 font-display">
                      SIMATA &bull; LAPORAN MANAJEMEN TAMU
                    </h1>
                    <p className="text-[10px] text-slate-500 font-mono tracking-wide mt-1 uppercase">
                      UNIT INDUK TRANSMISI JAWA BAGIAN TENGAH (UIT JBT) &bull; SURAKARTA
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="inline-block px-3 py-1 text-[10px] font-black text-rose-700 bg-rose-50 border-2 border-rose-200 font-sans tracking-widest leading-none mb-1">
                    BERKAS RESMI
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">NO: PLN/UIT-JBT/SMT/2026</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase">TANGGAL: 19 JUNI 2026</p>
                </div>
              </div>

              {/* Sub-header info section */}
              <div className="grid grid-cols-3 gap-6 py-5 border-b border-dashed border-slate-200 text-xs mb-6 bg-slate-50 p-4 rounded-none">
                <div>
                  <span className="text-slate-400 font-black uppercase text-[9px] block">PERIODE LAPORAN</span>
                  <p className="font-bold text-slate-800 text-[11px] mt-0.5 truncate uppercase">
                    {monthNames[selectedMonth]} {selectedYear}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-black uppercase text-[9px] block">UNIT ORGANISASI</span>
                  <p className="font-bold text-slate-800 text-[11px] mt-0.5 truncate uppercase">
                    UIT JBT AREA SURAKARTA
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-black uppercase text-[9px] block">OPERATOR PENANGGUNG JAWAB</span>
                  <p className="font-bold text-slate-800 text-[11px] mt-0.5 truncate uppercase">
                    RECEPTIONIST POS UTAMA (ACTIVE)
                  </p>
                </div>
              </div>

              {/* Document Overview text */}
              <div className="text-xs text-slate-700/90 leading-relaxed mb-6">
                Dihasilkan secara otomatis oleh <strong>Sistem Informasi Manajemen Tamu (SIMATA)</strong>, laporan berkala ini mendokumentasikan lalu lintas kunjungan tamu, personil kontraktor, auditor, dan personil eksternal di area vital operasional ketenagalistrikan PT PLN (Persero). Laporan evaluasi ini mencakup indikator frekuensi harian, mingguan, bulanan, serta demografi tujuan tamu guna mendukung asessment kepatuhan standardisasi keselamatan kerja ketenagalistrikan K3.
              </div>

              {/* Key KPI Metrics grid */}
              <h3 className="text-xs font-black tracking-wider uppercase text-[#005DA6] border-b border-slate-200 pb-1 mb-4 flex items-center gap-1 font-display">
                <span>&bull;</span> I. METRIK KUNCI KEDATANGAN TAMU (SUMMARY)
              </h3>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="border border-slate-200 p-3 bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">REGISTRASI HARIAN</span>
                  <span className="text-xl font-black text-slate-900 block mt-1">{dailyVisitorsCount} Orang</span>
                  <span className="text-[9px] text-slate-500">Kunjungan per 19 Juni 2026</span>
                </div>
                <div className="border border-slate-200 p-3 bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">REGISTRASI MINGGUAN</span>
                  <span className="text-xl font-black text-slate-900 block mt-1">{weeklyVisitors[2]} Orang</span>
                  <span className="text-[9px] text-slate-500">Kunjungan di Minggu ke-3</span>
                </div>
                <div className="border border-slate-200 p-3 bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">TOTAL BULANAN ({monthNames[selectedMonth].toUpperCase()})</span>
                  <span className="text-xl font-black text-slate-900 block mt-1">{monthlyVisitors.length} Registrasi</span>
                  <span className="text-[9px] text-slate-500">Akumulasi sebulan penuh</span>
                </div>
                <div className="border border-slate-200 p-3 bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">TERCHECK-OUT (DONE)</span>
                  <span className="text-xl font-black text-slate-900 block mt-1">{statusCounts.DONE} Tamu</span>
                  <span className="text-[9px] text-slate-500">Rasio selesai: {monthlyVisitors.length > 0 ? Math.round((statusCounts.DONE / monthlyVisitors.length) * 100) : 0}%</span>
                </div>
              </div>

              {/* Demographics and distribution details */}
              <h3 className="text-xs font-black tracking-wider uppercase text-[#005DA6] border-b border-slate-200 pb-1 mb-4 flex items-center gap-1 font-display">
                <span>&bull;</span> II. STATISTIK DEMOGRAFIS & TUJUAN KUNJUNGAN
              </h3>

              <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
                {/* Purpose table */}
                <div className="border border-slate-200 p-4">
                  <h4 className="font-bold text-[10px] text-[#005DA6] uppercase tracking-wider mb-2">A. TUJUAN KUNJUNGAN UTAMA</h4>
                  <table className="w-full text-left font-sans text-[11px]">
                    <thead>
                      <tr className="border-b text-slate-400 uppercase text-[9px]">
                        <th className="pb-1.5 font-bold">Kategori Tujuan</th>
                        <th className="pb-1.5 font-mono text-center font-bold">Frekuensi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700 font-medium">
                      {purposeStats.slice(0, 5).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2">{item.name}</td>
                          <td className="py-2 font-mono text-center text-slate-900 font-bold">{item.count} Kali</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Gender and company distributions */}
                <div className="border border-slate-200 p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-[10px] text-[#005DA6] uppercase tracking-wider mb-2">B. DEMOGRAFI GENDER & AGENT PENYUMBANG</h4>
                    <div className="space-y-2 mt-1">
                      <div className="flex justify-between font-medium">
                        <span>Pria: <strong>{genderStats.malePercent}%</strong> ({genderStats.male} Tamu)</span>
                        <span>Wanita: <strong>{genderStats.femalePercent}%</strong> ({genderStats.female} Tamu)</span>
                      </div>
                      <div className="h-2 w-full flex bg-[#FF3B30]/15 overflow-hidden">
                        <div className="bg-[#005DA6] h-full" style={{ width: `${genderStats.malePercent}%` }}></div>
                        <div className="bg-rose-500 h-full" style={{ width: `${genderStats.femalePercent}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <h4 className="font-bold text-[10px] text-[#005DA6] uppercase tracking-wider mb-2">C. PERWAKILAN INSTANSI TERBANYAK</h4>
                    <div className="space-y-1.5 font-sans">
                      {companyStats.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] text-slate-750 font-medium">
                          <span className="truncate max-w-[210px]">{item.name}</span>
                          <span className="font-mono font-bold text-slate-905">{item.count} Orang</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Signatures / Approval area typical of formal Indonesian reports */}
              <div className="grid grid-cols-2 gap-10 text-xs pt-12 text-center select-none font-sans mt-20 border-t border-dashed border-slate-200">
                <div className="space-y-16">
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Dilaporkan Oleh</p>
                    <p className="font-bold text-[#005DA6] uppercase text-[11px] mt-0.5">RECEPTIONIST PLN</p>
                  </div>
                  <div>
                    <p className="font-bold underline text-slate-900 uppercase font-display">MAYDONA DHEVY</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Disetujui Oleh</p>
                    <p className="font-bold text-[#005DA6] uppercase text-[11px] mt-0.5">ASMAN KEAMANAN</p>
                  </div>
                  <div>
                    <p className="font-bold underline text-slate-900 uppercase font-display">AHMAD PRAMUTADI</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">NIP: 8611852Z</p>
                  </div>
                </div>
              </div>

              {/* Hard Copy Disclaimer */}
              <div className="mt-12 text-[9px] text-slate-400 italic text-center border-t pt-3 font-mono uppercase tracking-wider">
                Dokumen ini sah, dicetak secara elektronik oleh SIMATA PLN pada {new Date().toLocaleDateString('id-ID')} {selectedYear} WIB.
              </div>

            </div>
            {/* END DOCUMENT CONTAINER */}

          </div>
        </div>
      )}

    </div>
  );
}
