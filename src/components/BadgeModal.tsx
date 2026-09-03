/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { X, Printer, Shield, Eye, Flame, CheckCircle, Smartphone, Copy, ExternalLink, QrCode, Check, AlertTriangle, XCircle, Calendar, Lock, Clock, CheckSquare, Mail, Loader2 } from 'lucide-react';
import { Visitor } from '../types';
import PLNLogo from './PLNLogo';
import { encodePassToken, checkPassExpiration, getProductionPassUrl } from '../utils/security';

interface BadgeModalProps {
  visitor: Visitor | null;
  onClose: () => void;
  onBookAppointment?: () => void;
  onCheckInAppointment?: (visitorId: string) => void;
  onSecondGateCheckIn?: (visitorId: string, customPass?: string) => void;
  onCheckOut?: (visitorId: string) => void;
  onApproveBooking?: (visitorId: string) => void;
  onResendEmail?: (visitor: Visitor) => Promise<boolean>;
}

export default function BadgeModal({
  visitor,
  onClose,
  onBookAppointment,
  onCheckInAppointment,
  onSecondGateCheckIn,
  onCheckOut,
  onApproveBooking,
  onResendEmail,
}: BadgeModalProps) {
  const [copied, setCopied] = useState(false);
  const [isResending, setIsResending] = useState(false);
  if (!visitor) return null;

  const passExpiration = checkPassExpiration(visitor);
  const badgeRef = useRef<HTMLDivElement>(null);
  const passUrl = getProductionPassUrl(visitor.id);
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(passUrl)}`;

  const formatDateTimeDisplay = (str: string | null | undefined, fallback: string) => {
    if (!str) return <span className="text-slate-400 font-sans italic text-[8.5px] block mt-1">{fallback}</span>;

    const parts = str.split(' - ');
    if (parts.length === 2) {
      const datePart = parts[0];
      const timePart = parts[1];
      const compactDate = datePart
        .replace(/August/i, 'Aug')
        .replace(/September/i, 'Sep')
        .replace(/October/i, 'Okt')
        .replace(/November/i, 'Nov')
        .replace(/December/i, 'Des')
        .replace(/January/i, 'Jan')
        .replace(/February/i, 'Feb')
        .replace(/March/i, 'Mar')
        .replace(/April/i, 'Apr')
        .replace(/June/i, 'Jun')
        .replace(/July/i, 'Jul');

      return (
        <div className="flex flex-col items-center justify-center leading-tight mt-0.5">
          <span className="text-[8px] font-mono font-extrabold text-slate-700 dark:text-slate-300 tracking-tight whitespace-nowrap">
            {compactDate}
          </span>
          <span className="text-[9px] font-mono font-black text-[#005DA6] dark:text-[#FFD500] tracking-wider whitespace-nowrap mt-0.5">
            ⏰ {timePart} WIB
          </span>
        </div>
      );
    }

    return <span className="text-[8.5px] font-mono font-bold block mt-0.5">{str}</span>;
  };

  const handlePrint = () => {
    const printContent = badgeRef.current?.innerHTML;

    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Cetak Pass Tamu - ${visitor.visitorName}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @page {
                  size: A4 portrait;
                  margin: 10mm;
                }
                @media print {
                  body {
                    padding: 0;
                    margin: 0;
                    background: white !important;
                    color: black !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                  .print-card-box {
                    width: 360px !important;
                    max-width: 100% !important;
                    margin: 0 auto !important;
                    padding: 16px !important;
                    border: 2px solid #005DA6 !important;
                    background: #ffffff !important;
                    box-shadow: none !important;
                  }
                }
              </style>
            </head>
            <body class="bg-slate-100 flex items-center justify-center min-h-screen p-4">
              <div class="print-card-box bg-white border-2 border-[#005DA6] p-5 w-[360px] shadow-md relative overflow-hidden">
                ${printContent}
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(() => window.close(), 800);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-1.5 sm:p-4 z-50 animate-fade-in font-sans overflow-y-auto">
      <div className="premium-glass max-w-[400px] w-full max-h-[98vh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#005DA6]/25 dark:border-[#FFD500]/25 rounded-none my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 sm:py-3.5 border-b border-slate-100 dark:border-slate-800 bg-[#005DA6] text-white shrink-0 border-b-2 border-[#FFD500]">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#FFD500]" />
            <h3 className="font-bold font-display uppercase text-xs tracking-wider text-white">Kartu Masuk Tamu Digital</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-none text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Badge Render Area */}
        <div className="p-2 sm:p-4 bg-slate-50 dark:bg-slate-950 flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center w-full min-h-0">
          
          <div
            ref={badgeRef}
            className="w-full max-w-[340px] sm:max-w-[360px] bg-white dark:bg-slate-900 border-2 border-dashed border-[#005DA6] rounded-none p-2.5 sm:p-4 shadow-sm relative overflow-hidden shrink-0 my-auto"
          >
            {/* Background watermarks for safety */}
            <div className="absolute inset-0 bg-[radial-gradient(#005da6_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none"></div>
            
            {/* PLN Header */}
            <div className="flex items-center justify-between border-b pb-2 mb-2 sm:pb-2.5 sm:mb-2.5 border-slate-100 dark:border-slate-800">
              <PLNLogo size="sm" showText={false} />
              <div className="text-right">
                <span className="inline-block px-1.5 py-0.5 text-[7.5px] sm:text-[8px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-none dark:bg-rose-950/20 dark:border-rose-900 font-sans uppercase">
                  SECURE PASS
                </span>
                <p className="font-mono text-[8.5px] sm:text-[9px] font-medium text-slate-400 mt-0.5 uppercase">
                  {visitor.id}
                </p>
              </div>
            </div>

            {/* Main Pass Type visual belt */}
            {visitor.status === 'REJECTED' ? (
              <div className="bg-rose-600 text-white text-center py-1 px-2.5 rounded-none font-black text-xs tracking-widest uppercase mb-2 border-b border-rose-900 flex items-center justify-center gap-1.5">
                <XCircle size={14} className="text-white" />
                <span>PENGAJUAN DITOLAK / REJECTED</span>
              </div>
            ) : visitor.status === 'PENDING' ? (
              <div className="bg-amber-500 text-slate-950 text-center py-1 px-2.5 rounded-none font-black text-xs tracking-widest uppercase mb-2 border-b border-amber-600 flex items-center justify-center gap-1.5 animate-pulse">
                <Clock size={14} className="text-slate-950" />
                <span>MENUNGGU PERSETUJUAN ADMIN</span>
              </div>
            ) : passExpiration.isExpired ? (
              <div className="bg-rose-600 text-white text-center py-1 px-2.5 rounded-none font-black text-xs tracking-widest uppercase mb-2 border-b border-rose-900 flex items-center justify-center gap-1.5 animate-pulse">
                <AlertTriangle size={13} className="text-[#FFD500]" />
                <span>PASS EXPIRED / KADALUARSA</span>
              </div>
            ) : (
              <div className="bg-[#005DA6] text-[#FFD500] text-center py-1 px-3 rounded-none font-black text-xs tracking-widest uppercase mb-2 border-b border-[#FFD500]">
                VISITOR / TAMU
              </div>
            )}

            {/* Visitor Identity Details */}
            <div className="space-y-2 text-center my-1.5 font-sans">
              <div>
                <span className="text-[8.5px] uppercase font-bold text-slate-400 tracking-wider">Nama Lengkap</span>
                <p className="font-sans font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight leading-tight uppercase mt-0.5">
                  {visitor.visitorName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <div>
                  <span className="text-[7.5px] uppercase font-bold text-slate-400 tracking-wider">Instansi/Perusahaan</span>
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-0.5 truncate uppercase">
                    {visitor.company}
                  </p>
                </div>
                <div>
                  <span className="text-[7.5px] uppercase font-bold text-slate-400 tracking-wider">Tujuan Kunjungan</span>
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-0.5 truncate capitalize">
                    {visitor.purpose}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <div>
                  <span className="text-[7.5px] uppercase font-bold text-slate-400 tracking-wider">Bertemu</span>
                  <p className="text-[10px] sm:text-[11px] font-bold text-[#005DA6] dark:text-[#FFD500] mt-0.5 truncate uppercase">
                    {visitor.visited}
                  </p>
                </div>
                <div>
                  <span className="text-[7.5px] uppercase font-bold text-slate-400 tracking-wider">Main Gate Pass</span>
                  <p className="text-[10px] sm:text-[11px] font-mono font-bold text-amber-600 dark:text-amber-500 mt-0.5 truncate">
                    {visitor.mainGatePass || '-'}
                  </p>
                </div>
              </div>

              <div className="pt-1.5 pb-1 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-1 text-center font-sans">
                <div className="bg-slate-50 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-[6.5px] uppercase font-bold text-slate-400 block tracking-tighter">Check-In 1 (Pos 1)</span>
                  {formatDateTimeDisplay(visitor.inTime, 'Belum In')}
                </div>
                <div className="bg-sky-50/50 dark:bg-sky-950/30 p-1 border border-sky-200/60 dark:border-sky-800 flex flex-col justify-between">
                  <span className="text-[6.5px] uppercase font-bold text-sky-600 dark:text-sky-400 block tracking-tighter">Check-In 2 (Pos 2)</span>
                  {formatDateTimeDisplay(visitor.secondGateTime, 'Belum In')}
                </div>
                <div className="bg-amber-500/10 dark:bg-amber-950/30 p-1 border border-amber-500/20 dark:border-amber-800 flex flex-col justify-between">
                  <span className="text-[6.5px] uppercase font-bold text-amber-600 dark:text-amber-400 block tracking-tighter">Check-Out (Keluar)</span>
                  {formatDateTimeDisplay(visitor.outTime, 'Belum Out')}
                </div>
              </div>
            </div>

            {/* Rejection / Pending / Expiration Warning banner */}
            {visitor.status === 'REJECTED' ? (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-2 text-center my-1.5 rounded-none">
                <span className="text-[8.5px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                  🚫 PENGAJUAN DITOLAK
                </span>
                <span className="text-[7.5px] text-rose-500 font-semibold block mt-0.5">
                  Barcode QR Pass tidak diterbitkan untuk permohonan yang ditolak.
                </span>
              </div>
            ) : visitor.status === 'PENDING' ? (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-2 text-center my-1.5 rounded-none">
                <span className="text-[8.5px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider block flex items-center justify-center gap-1">
                  <Lock size={11} /> BARCODE BELUM BERLAKU
                </span>
                <span className="text-[7.5px] text-amber-700 dark:text-amber-400 font-semibold block mt-0.5">
                  Menunggu persetujuan Admin/Sekretariat PLN agar barcode aktif dan dapat digunakan untuk check-in.
                </span>
              </div>
            ) : passExpiration.isExpired ? (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-1.5 text-center my-1.5 rounded-none">
                <span className="text-[8.5px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                  ⚠️ PAS TIDAK BERLAKU UNTUK AKSES MASUK
                </span>
                <span className="text-[7.5px] text-rose-500 font-semibold block mt-0.5">
                  {passExpiration.reason}
                </span>
              </div>
            ) : null}

            {/* Real Scannable Digital QR Code vs Rejection Card vs Locked Pending Card */}
            {visitor.status === 'REJECTED' ? (
              <div className="flex flex-col items-center justify-center bg-rose-50 dark:bg-rose-950/40 p-3 rounded-none border-2 border-rose-500 mt-2 text-center space-y-1.5">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-full text-rose-600 dark:text-rose-300">
                  <XCircle size={32} />
                </div>
                <div>
                  <span className="font-black text-xs uppercase tracking-wider text-rose-700 dark:text-rose-300 block">
                    BARCODE / QR CODE TIDAK DITERBITKAN
                  </span>
                  <p className="text-[9.5px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5 leading-tight">
                    Permohonan kunjungan ditolak oleh Admin Sekretariat.
                  </p>
                  {visitor.notes && (
                    <div className="mt-2 text-[9px] font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 border border-rose-200 dark:border-rose-800 text-left">
                      <span className="font-bold text-rose-600 block uppercase text-[8px]">Alasan Penolakan:</span>
                      {visitor.notes}
                    </div>
                  )}
                </div>
              </div>
            ) : visitor.status === 'PENDING' ? (
              <div className="flex flex-col items-center justify-center bg-amber-50/60 dark:bg-amber-950/40 p-3.5 rounded-none border-2 border-dashed border-amber-400 dark:border-amber-600 mt-2 text-center space-y-2 relative overflow-hidden">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-900/60 rounded-full text-amber-700 dark:text-amber-300 shadow-inner">
                  <Lock size={32} />
                </div>
                <div>
                  <span className="font-black text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200 block">
                    BARCODE TERKUNCI (PENDING APPROVAL)
                  </span>
                  <p className="text-[9.5px] text-amber-800 dark:text-amber-300 font-semibold mt-1 max-w-[240px] leading-tight">
                    Barcode QR Pass resmi baru akan diterbitkan dan dikirim ke email setelah permohonan disetujui Admin.
                  </p>
                </div>
                <div className="no-print w-full pt-1">
                  <span className="text-[8px] text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/40 px-2 py-0.5 font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-800 inline-block">
                    Status: Menunggu Persetujuan
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-2 sm:p-2.5 rounded-none border border-slate-200 dark:border-slate-800 mt-2 gap-1 text-center relative overflow-hidden">
                <div className={`p-1 bg-white rounded-none border-2 ${passExpiration.isExpired ? 'border-rose-500 opacity-30 grayscale' : 'border-[#005DA6]'} shadow-xs relative group`}>
                  <img
                    src={qrApiUrl}
                    alt={`QR Code Pass ${visitor.id}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                    loading="eager"
                  />
                </div>

                {passExpiration.isExpired && (
                  <div className="absolute inset-0 bg-rose-950/85 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-white text-center">
                    <XCircle size={24} className="text-rose-400 mb-0.5 animate-bounce" />
                    <span className="font-black text-[11px] uppercase tracking-widest text-rose-300">PASS EXPIRED</span>
                    <span className="text-[7.5px] font-semibold text-rose-200 mt-0.5 max-w-[180px] leading-tight">
                      {passExpiration.reason}
                    </span>
                  </div>
                )}

                {!passExpiration.isExpired && (
                  <div className="no-print w-full flex flex-col items-center gap-0.5 mt-0.5">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(passUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-2.5 py-0.5 bg-white dark:bg-slate-900 hover:bg-[#005DA6] hover:text-white dark:hover:bg-[#FFD500] dark:hover:text-slate-900 text-slate-700 dark:text-slate-300 text-[9.5px] font-bold rounded-none transition-all flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                      title="Salin Link QR Terenkripsi ke Clipboard"
                    >
                      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      <span>{copied ? 'Link Pass Terenkripsi Tersalin!' : 'Salin Link Pass'}</span>
                    </button>

                    <span className="text-[7.5px] text-slate-400 font-bold flex items-center justify-center gap-1 uppercase tracking-wider">
                      <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-none animate-pulse"></span>
                      Sistem QR Terenkripsi Aktif
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Interactive 3-Stage Gate Check-In Buttons for Digital Pass */}
            {visitor.status === 'PENDING' ? (
              <div className="no-print w-full mt-2.5 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-none text-center space-y-1">
                <span className="text-[9px] uppercase font-black tracking-wider text-amber-700 dark:text-amber-400 flex items-center justify-center gap-1">
                  <Lock size={11} /> Presensi Gate Belum Aktif
                </span>
                <p className="text-[8px] text-amber-600 dark:text-amber-400">
                  Tombol Check-In Pos 1 & Pos 2 akan aktif otomatis setelah janji temu disetujui Admin.
                </p>
              </div>
            ) : visitor.status !== 'REJECTED' ? (
              <div className="no-print w-full mt-2.5 p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none text-center space-y-1.5">
                <span className="text-[9px] uppercase font-black tracking-wider text-[#005DA6] dark:text-[#FFD500] block">
                  Presensi Gate Masuk / Keluar Tamu
                </span>

                <div className="grid grid-cols-3 gap-1.5">
                  {/* Button Check-In 1 */}
                  <button
                    type="button"
                    onClick={() => onCheckInAppointment && onCheckInAppointment(visitor.id)}
                    className={`py-2 px-1 rounded-none text-[9.5px] font-black uppercase tracking-wider flex flex-col items-center justify-center transition-all ${
                      visitor.inTime
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 cursor-default'
                        : 'bg-[#005DA6] hover:bg-[#004070] text-white border-b-2 border-r-2 border-[#FFD500] cursor-pointer active:scale-95'
                    }`}
                  >
                    <span className="text-[7.5px] font-normal opacity-80">Pos 1 Utama</span>
                    <span className="flex items-center gap-1 mt-0.5">
                      {visitor.inTime ? <Check size={11} /> : null}
                      {visitor.inTime ? 'IN 1 OK' : 'Check-In 1'}
                    </span>
                  </button>

                  {/* Button Check-In 2 (Pos 2 / Stakeholder) */}
                  <button
                    type="button"
                    onClick={() => onSecondGateCheckIn && onSecondGateCheckIn(visitor.id)}
                    className={`py-2 px-1 rounded-none text-[9.5px] font-black uppercase tracking-wider flex flex-col items-center justify-center transition-all ${
                      visitor.secondGateTime
                        ? 'bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 cursor-default'
                        : 'bg-sky-600 hover:bg-sky-700 text-white border-b-2 border-r-2 border-sky-300 cursor-pointer active:scale-95'
                    }`}
                  >
                    <span className="text-[7.5px] font-normal opacity-80">Pos 2 Dalam</span>
                    <span className="flex items-center gap-1 mt-0.5">
                      {visitor.secondGateTime ? <Check size={11} /> : null}
                      {visitor.secondGateTime ? 'IN 2 OK' : 'Check-In 2'}
                    </span>
                  </button>

                  {/* Button Check-Out */}
                  <button
                    type="button"
                    onClick={() => onCheckOut && onCheckOut(visitor.id)}
                    className={`py-2 px-1 rounded-none text-[9.5px] font-black uppercase tracking-wider flex flex-col items-center justify-center transition-all ${
                      visitor.outTime
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 cursor-default'
                        : 'bg-amber-500 hover:bg-amber-600 text-white border-b-2 border-r-2 border-amber-300 cursor-pointer active:scale-95'
                    }`}
                  >
                    <span className="text-[7.5px] font-normal opacity-80">Kepulangan</span>
                    <span className="flex items-center gap-1 mt-0.5">
                      {visitor.outTime ? <Check size={11} /> : null}
                      {visitor.outTime ? 'OUT OK' : 'Check-Out'}
                    </span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* Guard Warning notice */}
            <div className="mt-1.5 text-[7.5px] sm:text-[8px] text-slate-400 text-center uppercase tracking-wide leading-normal">
              * Harap dikalungkan selama berada di lingkungan PT PLN (Persero).
              Kembalikan ke Sekretariat / Pos Penjagaan saat Check-Out.
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-2.5 sm:p-4 bg-slate-100 dark:bg-slate-800/40 border-t-2 border-slate-100 dark:border-slate-850 flex flex-col gap-2 shrink-0">
          {visitor.status === 'PENDING' && onApproveBooking && (
            <button
              onClick={() => {
                onApproveBooking(visitor.id);
              }}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider rounded-none border-b-2 border-r-2 border-emerald-900 cursor-pointer shadow-sm"
              title="Setujui Janji Temu & Terbitkan Barcode Pass ke Email Tamu"
            >
              <CheckSquare size={15} />
              Setujui Janji Temu & Terbitkan Pass
            </button>
          )}

          {onBookAppointment && visitor.status !== 'PENDING' && (
            <button
              onClick={() => {
                onClose();
                onBookAppointment();
              }}
              className="w-full py-2.5 px-3 bg-[#FFD500] hover:bg-[#e6c000] active:bg-[#cca800] text-slate-950 font-black flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider rounded-none border-b-2 border-r-2 border-slate-900 cursor-pointer shadow-2xs"
              title="Formulir Pengajuan Janji Temu Tamu Baru"
            >
              <Calendar size={15} />
              Ajukan Janji Temu
            </button>
          )}

          <div className="flex items-center gap-2 w-full">
            {visitor.status === 'REJECTED' ? (
              <button
                disabled
                className="flex-1 py-2.5 px-3 bg-rose-200 dark:bg-rose-950 text-rose-500 rounded-none font-bold flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider border border-rose-300 dark:border-rose-900 cursor-not-allowed opacity-75"
              >
                <XCircle size={15} />
                Pengajuan Ditolak
              </button>
            ) : visitor.status === 'PENDING' ? (
              <button
                disabled
                className="flex-1 py-2.5 px-3 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-none font-bold flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider border border-amber-300 dark:border-amber-800 cursor-not-allowed opacity-75"
                title="Barcode belum dapat dicetak karena menunggu persetujuan admin"
              >
                <Lock size={15} />
                Menunggu Persetujuan
              </button>
            ) : (
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 px-3 bg-[#005DA6] hover:bg-[#004070] active:bg-[#003056] text-white rounded-none font-bold flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider border-b-2 border-r-2 border-[#FFD500] cursor-pointer"
              >
                <Printer size={15} />
                Cetak Pas Masuk
              </button>
            )}
            {visitor.email && onResendEmail && (
              <button
                onClick={async () => {
                  setIsResending(true);
                  await onResendEmail(visitor);
                  setIsResending(false);
                }}
                disabled={isResending}
                className="py-2.5 px-3 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-none font-bold flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider border-b-2 border-r-2 border-sky-900 cursor-pointer disabled:opacity-50 transition-all"
                title={`Kirim Ulang Tiket Email (${visitor.email})`}
              >
                {isResending ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
                <span>Email</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="py-2.5 px-4 bg-white dark:bg-[#111c30] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-none font-bold text-xs uppercase tracking-wider border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
