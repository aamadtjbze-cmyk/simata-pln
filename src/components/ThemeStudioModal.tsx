/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Sun, 
  Moon, 
  Check, 
  Palette, 
  Sparkles, 
  Layers, 
  Eye,
  CheckCircle2,
  Info,
  ShieldCheck,
  Building2,
  Zap
} from 'lucide-react';

interface ThemeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: 'klasik' | 'ebt' | 'cyber' | 'geothermal';
  onChangeTheme: (theme: 'klasik' | 'ebt' | 'cyber' | 'geothermal') => void;
  darkMode: boolean;
  onChangeDarkMode: (darkMode: boolean) => void;
  bgStyle: string;
  onChangeBgStyle: (bgStyle: string) => void;
  triggerToast: (msg: string, type: 'success' | 'info' | 'danger') => void;
}

export default function ThemeStudioModal({
  isOpen,
  onClose,
  currentTheme,
  onChangeTheme,
  darkMode,
  onChangeDarkMode,
  bgStyle,
  onChangeBgStyle,
  triggerToast
}: ThemeStudioModalProps) {
  // We stage the theme, defaulting to light mode (stagedDarkMode: false) to meet the user's focus on dominantly bright layouts
  const [stagedTheme, setStagedTheme] = useState<'klasik' | 'ebt' | 'cyber' | 'geothermal'>(currentTheme);
  const [stagedDarkMode, setStagedDarkMode] = useState<boolean>(darkMode);
  const [stagedBgStyle, setStagedBgStyle] = useState<string>(bgStyle || 'slate-50');

  const handleSetDarkMode = (isDark: boolean) => {
    setStagedDarkMode(isDark);
    if (isDark) {
      if (!['midnight-deep', 'carbon-obsidian', 'circuit-black', 'magma-dark'].includes(stagedBgStyle)) {
        setStagedBgStyle('midnight-deep');
      }
    } else {
      if (!['white', 'slate-50', 'cream', 'sky-blue'].includes(stagedBgStyle)) {
        setStagedBgStyle('slate-50');
      }
    }
  };

  if (!isOpen) return null;

  const themesData = [
    {
      id: 'klasik' as const,
      name: 'PLN KLASIK',
      sub: 'LEGASI ANGGUN BIRU & KUNING',
      primaryColor: '#005DA6',
      accentColor: '#FFD500',
      tag: 'Standar Korporat',
      desc: 'Warna resmi PT PLN (Persero). Biru samudera yang elegan berpadu dengan aksen petir kuning keemasan di atas latar putih bersih yang profesional.',
      themeColorHex: '#005DA6',
      lightPreviewCardBg: 'bg-sky-50/40',
      lightBorder: 'border-sky-100',
      badgeStyle: 'bg-[#005DA6]/10 text-[#005DA6] border-[#005DA6]/20'
    },
    {
      id: 'ebt' as const,
      name: 'PLN ENERGI BERSIH',
      sub: 'TRANSISI HIJAU & TIMAH EMAS',
      primaryColor: '#0d9488',
      accentColor: '#f59e0b',
      tag: 'Ramah Lingkungan',
      desc: 'Gaya hijau toska segar berpadu jingga keemasan. Mewakili komitmen dekarbonisasi, inovasi EBT, dan kelestarian ekosistem bumi.',
      themeColorHex: '#0d9488',
      lightPreviewCardBg: 'bg-teal-50/40',
      lightBorder: 'border-teal-100',
      badgeStyle: 'bg-teal-600/10 text-teal-600 border-teal-600/20'
    },
    {
      id: 'cyber' as const,
      name: 'PLN CYBER VOLT',
      sub: 'DIGITALISASI INDIGO & SIAN',
      primaryColor: '#6366f1',
      accentColor: '#06b6d4',
      tag: 'Gaya Futuristik / Digital',
      desc: 'Sirkuit indigo berpadu dengan pendaran cyan digital. Melambangkan otomasi gardu pintar, proteksi siber, dan monitoring mutakhir.',
      themeColorHex: '#6366f1',
      lightPreviewCardBg: 'bg-indigo-50/40',
      lightBorder: 'border-indigo-100',
      badgeStyle: 'bg-indigo-650/10 text-indigo-650 border-indigo-650/20'
    },
    {
      id: 'geothermal' as const,
      name: 'PLN GEOTHERMAL',
      sub: 'CRIMSON MAGMA & AMBER',
      primaryColor: '#e11d48',
      accentColor: '#f59e0b',
      tag: 'Eksplorasi Kebanggaan',
      desc: 'Merah crimson membara bersanding dengan pancaran fajar amber. Representasi pemanfaatan energi panas bumi nusantara yang penuh daya hidup.',
      themeColorHex: '#e11d48',
      lightPreviewCardBg: 'bg-rose-50/40',
      lightBorder: 'border-rose-100',
      badgeStyle: 'bg-rose-600/10 text-rose-600 border-rose-600/20'
    }
  ];

  const handleApply = () => {
    onChangeTheme(stagedTheme);
    onChangeDarkMode(stagedDarkMode);
    onChangeBgStyle(stagedBgStyle);
    localStorage.setItem('simata_theme', stagedTheme);
    localStorage.setItem('simata_dark_mode', JSON.stringify(stagedDarkMode));
    localStorage.setItem('simata_bg_style', stagedBgStyle);
    triggerToast(`Tema Berhasil Diterapkan: PLN ${stagedTheme.toUpperCase()} (${stagedDarkMode ? 'Mode Gelap' : 'Mode Terang'}) dengan latar ${stagedBgStyle}`, 'success');
    onClose();
  };

  const activeThemeObj = themesData.find(t => t.id === stagedTheme) || themesData[0];

  return (
    <div 
      id="theme-studio-backdrop" 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in font-sans"
    >
      <div 
        id="theme-studio-container"
        className="premium-glass w-full max-w-4xl p-4 sm:p-6 md:p-8 rounded-none shadow-2xl relative text-slate-800 dark:text-slate-150 transition-colors my-auto max-h-[92vh] overflow-y-auto border border-[#005DA6]/15 dark:border-white/10"
      >
        {/* Symmetrical Corporate Corner Marks */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#005DA6]"></div>
        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#005DA6]"></div>
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#005DA6]"></div>
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#005DA6]"></div>

        {/* Close Button X */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer border border-transparent hover:border-slate-300 rounded-none"
          title="Tutup Studio Harmoni"
        >
          <X size={18} />
        </button>

        {/* Modal Top Header Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b-2 border-slate-100 pb-5 mb-5">
          <div className="p-3 bg-[#005DA6] text-white border border-[#005DA6]/20 self-start">
            <Palette size={28} className="animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 border border-emerald-200">
                Studio Desain Harmoni
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider text-[#005DA6] bg-slate-100 px-2 py-1">
                DOMINAN TERANG (LIGHT OPTIMIZED)
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mt-1.5 font-display">
              Pilihan Tema & Kontras Visual SIMATA
            </h2>
            <p className="text-[11px] text-slate-500 mt-1 font-bold">
              Konfigurasi skema warna resmi korporasi PT PLN (Persero) untuk buku tamu terpadu yang cerah, bersahaja, dan nyaman dibaca siang hari.
            </p>
          </div>
        </div>

        {/* Light Contrast Highlight Banner */}
        <div className="mb-6 p-4 bg-[#F2F8FD] border-l-4 border-[#005DA6] text-slate-700 text-xs rounded-none">
          <div className="flex gap-3">
            <div className="p-1.5 bg-white text-[#005DA6] border border-[#005DA6]/15 h-fit">
              <Sun size={16} className="text-[#005DA6]" />
            </div>
            <div>
              <p className="font-extrabold uppercase tracking-wider text-[#005DA6] text-[11px]">
                REKOMENDASI: AKTIFKAN MODE TERANG (CLEAR & CONTRAST WHITE)
              </p>
              <p className="mt-0.5 leading-relaxed text-slate-600 text-[11px]">
                Untuk kenyamanan penglihatan di area lobi atau ruang kontrol resepsionis, kami merancang tema <strong>Dominan Terang</strong> dengan kontras warna mutiara dan garis pembatas yang jelas. Sangat ramah mata di bawah cahaya matahari langsung!
              </p>
            </div>
          </div>
        </div>

        {/* STEP 1: Dark Mode Or Light Mode Switch */}
        <div className="mb-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
            <span className="w-5 h-5 bg-slate-100 text-[#005DA6] flex items-center justify-center font-black text-[10px] rounded-none">1</span>
            <h3 className="text-xs font-black tracking-wider uppercase text-[#005DA6] flex items-center gap-1.5">
              <Layers size={13} />
              Langkah 1: Pilih Tingkat Kecerahan Latar Belakang
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* Bright / Light Mode Selection */}
            <button
              type="button"
              onClick={() => handleSetDarkMode(false)}
              className={`p-4 border-2 text-left transition-all relative flex gap-3.5 cursor-pointer ${
                !stagedDarkMode 
                  ? 'border-[#005DA6] bg-[#F7FAFC] text-slate-900 shadow-xs' 
                  : 'border-slate-200 bg-white text-slate-400 hover:border-slate-350'
              }`}
            >
              <div className="p-2.5 bg-amber-50 border border-amber-100 text-amber-500 rounded-none self-center">
                <Sun size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Mode Terang (Utama & Bersinar)
                  </span>
                  {!stagedDarkMode && <CheckCircle2 size={16} className="text-[#005DA6] shrink-0" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Dominan putih murni dan abu-abu mutiara segar. Menghilangkan nuansa gelap yang kusam di layar lobi.
                </p>
              </div>
            </button>

            {/* Dark Mode Selection */}
            <button
              type="button"
              onClick={() => handleSetDarkMode(true)}
              className={`p-4 border-2 text-left transition-all relative flex gap-3.5 cursor-pointer ${
                stagedDarkMode 
                  ? 'border-[#005DA6] bg-slate-950 text-white shadow-xs' 
                  : 'border-slate-200 bg-white text-slate-400 hover:border-slate-350'
              }`}
            >
              <div className="p-2.5 bg-slate-50 border border-slate-200 text-slate-400 rounded-none self-center">
                <Moon size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Mode Gelap (Hemat Energi)
                  </span>
                  {stagedDarkMode && <CheckCircle2 size={16} className="text-[#005DA6] shrink-0" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  Aura redup hemat daya untuk lobi beroperasi malam hari guna meminimalkan pendaran pancaran lampu LED.
                </p>
              </div>
            </button>

          </div>
        </div>

        {/* STEP 1B: Choose background variant */}
        <div className="mb-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
            <span className="w-5 h-5 bg-slate-100 text-[#005DA6] flex items-center justify-center font-black text-[10px] rounded-none">1B</span>
            <h3 className="text-xs font-black tracking-wider uppercase text-[#005DA6] flex items-center gap-1.5">
              <Building2 size={13} />
              Langkah 1B: Pilih Variasi Warna Latar Belakang (Light/Dark Sub-Themes)
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(stagedDarkMode ? [
              { id: 'midnight-deep', name: 'Biru Tua PLN', desc: 'Latar biru navy tua', previewBg: 'bg-[#0a1120] border-slate-700 text-white' },
              { id: 'carbon-obsidian', name: 'Hitam Pekat', desc: 'Kontras maksimal AMOLED', previewBg: 'bg-slate-950 border-slate-800 text-white' },
              { id: 'circuit-black', name: 'Sirkuit Cyber Indigo', desc: 'Aura futuristik digital', previewBg: 'bg-[#0b0c15] border-indigo-950 text-slate-200' },
              { id: 'magma-dark', name: 'Magma Pekat Maroon', desc: 'Nuansa energi panas bumi', previewBg: 'bg-[#1a0a0d] border-rose-950 text-rose-100' }
            ] : [
              { id: 'white', name: 'Putih Murni', desc: 'Sangat jernih & terang bersih', previewBg: 'bg-white border-slate-200 text-slate-900' },
              { id: 'slate-50', name: 'Abu-Abu Mutiara', desc: 'Kontras seimbang & nyaman', previewBg: 'bg-slate-50 border-slate-300 text-slate-800' },
              { id: 'cream', name: 'Kuning Gading Cream', desc: 'Nuansa hangat bersahabat', previewBg: 'bg-[#FAF6EE] border-amber-200 text-amber-950' },
              { id: 'sky-blue', name: 'Biru Es Segar', desc: 'Nuansa energi modern', previewBg: 'bg-[#EDF5FA] border-sky-200 text-sky-950' }
            ]).map((opt) => {
              const isBgSelected = stagedBgStyle === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStagedBgStyle(opt.id)}
                  className={`p-3 border-2 text-left cursor-pointer transition-all flex flex-col justify-between h-28 rounded-none ${
                    isBgSelected 
                      ? 'border-[#005DA6] ring-1 ring-[#005DA6] shadow-[2px_2px_0px_rgba(0,93,166,0.1)] bg-slate-50' 
                      : 'border-slate-200 hover:border-slate-350 bg-white'
                  }`}
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[80%] text-slate-800">
                        {opt.name}
                      </span>
                      {isBgSelected && <CheckCircle2 size={12} className="text-[#005DA6]" />}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 leading-tight">{opt.desc}</p>
                  </div>
                  
                  {/* Miniature swatch preview */}
                  <div className={`w-full h-6 border ${opt.previewBg} flex items-center justify-center text-[8px] font-mono font-bold mt-2 select-none truncate px-1`}>
                    Aa 3.0
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 2: Choose Theme Swatch Palette */}
        <div className="mb-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
            <span className="w-5 h-5 bg-slate-100 text-[#005DA6] flex items-center justify-center font-black text-[10px] rounded-none">2</span>
            <h3 className="text-xs font-black tracking-wider uppercase text-[#005DA6] flex items-center gap-1.5">
              <Palette size={13} />
              Langkah 2: Pilih Aksen Warna Harmoni Unit PLN
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {themesData.map((theme) => {
              const isSelected = stagedTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setStagedTheme(theme.id)}
                  type="button"
                  className={`p-4 border-2 text-left transition-all flex flex-col justify-between h-56 group relative cursor-pointer bg-white ${
                    isSelected 
                      ? 'border-[#005DA6] bg-sky-50/20' 
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600">
                        {theme.tag}
                      </span>
                      {isSelected && (
                        <div className="h-4.5 w-4.5 bg-[#005DA6] flex items-center justify-center text-white rounded-none shadow-xs shrink-0">
                          <Check size={11} className="stroke-[3.5px]" />
                        </div>
                      )}
                    </div>

                    <h4 className="text-xs font-black tracking-tight text-slate-900 uppercase">
                      {theme.name}
                    </h4>
                    <span 
                      className="text-[8.5px] font-bold tracking-wider block mt-1 font-mono uppercase"
                      style={{ color: theme.primaryColor }}
                    >
                      {theme.sub}
                    </span>

                    <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                      {theme.desc}
                    </p>
                  </div>

                  {/* Symmetrical Swatches at the card bottom */}
                  <div className="border-t border-slate-100 pt-2.5 mt-2 w-full flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <span 
                        className="w-4 h-4 border border-white inline-block shadow-[1px_1px_2px_rgba(0,0,0,0.15)] ring-1 ring-slate-200" 
                        style={{ backgroundColor: theme.primaryColor }}
                        title={`Utama: ${theme.primaryColor}`}
                      />
                      <span 
                        className="w-4 h-4 border border-white inline-block shadow-[1px_1px_2px_rgba(0,0,0,0.15)] ring-1 ring-slate-200" 
                        style={{ backgroundColor: theme.accentColor }}
                        title={`Akselerasi: ${theme.accentColor}`}
                      />
                    </div>

                    <div className="text-[9px] text-slate-400 font-bold font-mono uppercase">
                      {theme.themeColorHex}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 3: Live Preview Simulator */}
        <div>
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
            <span className="w-5 h-5 bg-slate-100 text-[#005DA6] flex items-center justify-center font-black text-[10px] rounded-none">3</span>
            <span className="text-xs font-black tracking-wider uppercase text-[#005DA6] flex items-center gap-1.5">
              <Eye size={13} />
              Pratinjau Instan SIMATA (Sesuai Konfigurasi Pilihan)
            </span>
          </div>

          <div className="bg-[#FAFBFD] border border-slate-200 p-4 rounded-none grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* The actual preview box that simulates Mode Terang or Mode Gelap */}
            <div className="col-span-8 bg-white border border-slate-350 p-4 shadow-sm flex flex-col gap-3">
              
              {/* Simulator Header */}
              <div 
                className="p-3 border-b-2 flex items-center justify-between transition-colors shadow-xs"
                style={{ 
                  backgroundColor: stagedDarkMode ? '#0f172a' : '#ffffff', 
                  borderColor: activeThemeObj.primaryColor 
                }}
              >
                {/* Mock Company Logo */}
                <span 
                  className="text-[10px] font-black tracking-widest flex items-center gap-1.5" 
                  style={{ color: stagedDarkMode ? '#92c5fd' : activeThemeObj.primaryColor }}
                >
                  <Zap size={11} fill={activeThemeObj.accentColor} stroke="none" />
                  PLN PERSERO
                </span>
                
                {/* Custom badges */}
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5" style={{ backgroundColor: activeThemeObj.primaryColor }} />
                  <div className="w-1.5 h-1.5" style={{ backgroundColor: activeThemeObj.accentColor }} />
                </div>
              </div>

              {/* Dynamic Sample Guest Log Column */}
              <div 
                className="p-3 border transition-colors flex flex-col gap-2"
                style={{ 
                  backgroundColor: stagedDarkMode ? '#131e35' : '#f8fafc', 
                  borderColor: stagedDarkMode ? '#1e293b' : '#e2e8f0'
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className={`text-[10px] font-black uppercase ${stagedDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      KUNJUNGAN TAMU KOMISARIS
                    </h5>
                    <p className={`text-[9px] ${stagedDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                      Tujuan: Rapat Direksi Transisi EBT, Gedung Utama Lt. 3.
                    </p>
                  </div>

                  {/* Pass Badge */}
                  <span 
                    className="text-[8px] font-bold px-2 py-0.5 border"
                    style={{ 
                      color: activeThemeObj.primaryColor,
                      borderColor: activeThemeObj.primaryColor,
                      backgroundColor: stagedDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                    }}
                  >
                    PASS 02-UTAMA
                  </span>
                </div>

                {/* Simulated action Buttons with active dynamic colors */}
                <div className="mt-2 flex gap-1.5">
                  <button 
                    type="button" 
                    className="px-3 py-1.5 text-[9px] font-black text-white cursor-not-allowed uppercase"
                    style={{ 
                      backgroundColor: activeThemeObj.primaryColor,
                      borderBottom: `2.5px solid ${activeThemeObj.accentColor}`
                    }}
                  >
                    Isi Register
                  </button>
                  <button 
                    type="button" 
                    className="px-3 py-1.5 text-[9px] font-black border cursor-not-allowed uppercase"
                    style={{ 
                      borderColor: activeThemeObj.primaryColor,
                      color: activeThemeObj.primaryColor
                    }}
                  >
                    Cetak Kartu
                  </button>
                </div>
              </div>

            </div>

            {/* Config metadata details */}
            <div className="col-span-4 h-full flex flex-col justify-center bg-white border border-slate-200 p-3 text-[11px] leading-relaxed">
              <span className="font-extrabold uppercase tracking-wide text-slate-800 block border-b pb-1 mb-2">
                Ringkasan Visual
              </span>
              <ul className="space-y-1.5 text-slate-600">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500"></span>
                  Latar Belakang: <strong>{stagedDarkMode ? 'DOMINAN GELAP' : 'DOMINAN TERANG'}</strong>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-sky-500"></span>
                  Warna Primer: <strong className="font-mono">{activeThemeObj.primaryColor}</strong>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-amber-500"></span>
                  Aksen Badge: <strong className="font-mono">{activeThemeObj.accentColor}</strong>
                </li>
              </ul>
              <div className="mt-3 text-[9px] text-[#005DA6] font-bold uppercase tracking-wider">
                ⚡ Sesuai SOP Estetika PLN 2026
              </div>
            </div>

          </div>
        </div>

        {/* Modal Primary Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t-2 border-slate-100 pt-5 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 hover:bg-slate-100 text-slate-600 rounded-none border border-slate-200 text-xs font-bold uppercase transition-all cursor-pointer"
          >
            Batal
          </button>
          
          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-2.5 bg-[#005DA6] hover:bg-[#004070] text-white rounded-none border-b-2 border-r-2 border-[#FFD500] text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-xs uppercase tracking-wide"
          >
            <Sparkles size={13} className="animate-pulse" />
            Terapkan Harmoni Terang
          </button>
        </div>

      </div>
    </div>
  );
}
