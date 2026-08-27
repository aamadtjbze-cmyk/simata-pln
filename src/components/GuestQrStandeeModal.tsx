/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QrCode, Printer, Copy, Check, Download, X, Smartphone, ShieldCheck } from 'lucide-react';
import PLNLogo from './PLNLogo';

interface GuestQrStandeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerToast?: (msg: string, type?: 'success' | 'info' | 'danger') => void;
}

export const GUEST_PORTAL_URL = 'https://simata-pln.vercel.app/?portal=tamu';

export default function GuestQrStandeeModal({ isOpen, onClose, triggerToast }: GuestQrStandeeModalProps) {
  const [copied, setCopied] = useState(false);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(GUEST_PORTAL_URL)}&margin=15`;

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(GUEST_PORTAL_URL);
    setCopied(true);
    if (triggerToast) triggerToast('Link Portal Tamu Mandiri berhasil disalin!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto animate-fade-in font-sans">
      
      {/* Print-specific style */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-standee, #printable-standee * {
            visibility: visible;
          }
          #printable-standee {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            max-width: 600px;
            margin: 0;
            padding: 24px;
            border: 4px solid #005DA6 !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="premium-glass max-w-lg w-full shadow-2xl overflow-hidden border-2 border-[#005DA6] rounded-none my-auto max-h-[95vh] flex flex-col">
        
        {/* Header (No Print) */}
        <div className="bg-[#005DA6] border-b-2 border-[#FFD500] p-4 text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/10 border border-white/20">
              <QrCode size={18} className="text-[#FFD500]" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#FFD500] uppercase tracking-widest block">
                SIMATA PLN UIK TANJUNG JATI B
              </span>
              <h3 className="text-sm font-black uppercase tracking-tight font-display text-white">
                QR Code Standee Registrasi Tamu
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Printable Standee Card Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-[#0c1527]">
          
          <div id="printable-standee" className="bg-white text-slate-900 border-4 border-[#005DA6] p-6 text-center shadow-md relative">
            
            {/* Top Brand Accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#005DA6] via-[#FFD500] to-[#005DA6] mb-4"></div>
            
            <div className="flex justify-center mb-3">
              <PLNLogo showText={true} size="md" />
            </div>

            <div className="border-t-2 border-b-2 border-[#005DA6]/20 py-2.5 my-3 bg-sky-50/50">
              <span className="text-[11px] font-mono font-black text-[#005DA6] tracking-widest uppercase block">
                BUKU TAMU DIGITAL MANDIRI
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight mt-0.5">
                SCAN UNTUK MENDAFTAR
              </h2>
            </div>

            {/* High-Resolution QR Code Frame */}
            <div className="my-4 flex justify-center">
              <div className="p-3 bg-white border-3 border-[#005DA6] shadow-sm inline-block">
                <img
                  src={qrImageUrl}
                  alt="QR Code Registrasi Tamu SIMATA"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
                />
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="bg-slate-50 border border-slate-200 p-3 text-left space-y-1.5 text-[11px] font-medium text-slate-700">
              <div className="flex items-center gap-2 font-bold text-[#005DA6] text-xs pb-1 border-b border-slate-200">
                <Smartphone size={14} />
                <span>CARA PENDAFTARAN KUNJUNGAN:</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-[#005DA6]">1.</span>
                <span>Buka kamera smartphone & arahkan ke QR Code di atas.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-[#005DA6]">2.</span>
                <span>Isi formulir nama, instansi, dan keperluan kunjungan.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-[#005DA6]">3.</span>
                <span>Barcode QR Pass resmi akan langsung terbit & dikirim ke email.</span>
              </div>
            </div>

            {/* Security Footer Note */}
            <div className="mt-4 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-600" />
                POS KEAMANAN & SEKRETARIAT
              </span>
              <span className="font-bold text-[#005DA6]">PLN UIK TANJUNG JATI B</span>
            </div>

          </div>

        </div>

        {/* Action Controls (No Print) */}
        <div className="p-4 bg-white dark:bg-[#111c30] border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 no-print shrink-0">
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer rounded-none transition-all"
              title="Salin URL Portal Tamu"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'Tersalin!' : 'Salin Link'}</span>
            </button>

            <a
              href={qrImageUrl}
              download="QR-Standee-SIMATA-PLN.png"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer rounded-none transition-all"
              title="Unduh file gambar QR Code"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Unduh Gambar</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-[#005DA6] hover:bg-[#004070] text-white font-black text-xs uppercase tracking-wider border-b-2 border-r-2 border-[#FFD500] cursor-pointer shadow-md flex items-center gap-2"
            >
              <Printer size={15} />
              <span>Cetak Standee / Poster</span>
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer rounded-none"
            >
              Tutup
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
