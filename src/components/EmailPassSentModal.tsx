/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, CheckCircle, ExternalLink, QrCode, Send, Smartphone, ShieldCheck, Copy, Check, X } from 'lucide-react';
import { Visitor } from '../types';
import { encodePassToken } from '../utils/security';

interface EmailPassSentModalProps {
  visitor: Visitor | null;
  onClose: () => void;
  onOpenPass: (visitor: Visitor) => void;
}

export default function EmailPassSentModal({ visitor, onClose, onOpenPass }: EmailPassSentModalProps) {
  const [copied, setCopied] = useState(false);
  if (!visitor) return null;

  const secureToken = encodePassToken(visitor.id);
  const passUrl = typeof window !== 'undefined' ? `${window.location.origin}/?token=${secureToken}` : `http://localhost:3000/?token=${secureToken}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(passUrl)}`;
  const targetEmail = visitor.email || `${visitor.visitorName.toLowerCase().replace(/\s+/g, '')}@gmail.com`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="premium-glass max-w-lg w-full shadow-2xl overflow-hidden my-8 border-2 border-[#005DA6] rounded-none">
        
        {/* Header */}
        <div className="bg-[#005DA6] border-b-2 border-[#FFD500] px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-none">
              <CheckCircle size={20} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#FFD500] block">
                Janji Temu Disetujui!
              </span>
              <h3 className="text-base font-black tracking-tight uppercase">
                Notifikasi Link & QR Code Terkirim
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

        {/* Modal Body */}
        <div className="p-5 space-y-4 font-sans text-slate-800 dark:text-slate-200 text-xs">
          
          {/* Status Alert Banner */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-3 rounded-none flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">
                Email & WhatsApp Otomatis Berhasil Terkirim ke Tamu!
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                Sistem telah mengirimkan barcode QR Pass dan link verifikasi terenkripsi ke alamat email <strong>{targetEmail}</strong>.
              </p>
            </div>
          </div>

          {/* Email Preview Card */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 space-y-3 rounded-none">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                <Mail size={14} className="text-[#005DA6] dark:text-[#FFD500]" />
                <span>Simulasi Email Notifikasi (SMTP PLN Gateway)</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[9px] font-mono font-bold uppercase">
                DELIVERED
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="grid grid-cols-4 gap-1">
                <span className="text-slate-400 font-semibold">Kepada:</span>
                <span className="col-span-3 font-bold font-mono text-slate-800 dark:text-slate-200">{targetEmail}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <span className="text-slate-400 font-semibold">Subjek:</span>
                <span className="col-span-3 font-bold text-[#005DA6] dark:text-[#FFD500]">
                  [SIMATA PLN UIK TJB] Persetujuan Janji Temu & Pass Digital - {visitor.visitorName}
                </span>
              </div>
            </div>

            {/* Simulated Email Body Container */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 text-center space-y-2 mt-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Lampiran QR Barcode Pass Digital
              </span>
              
              <div className="flex justify-center my-1">
                <div className="p-1 bg-white border-2 border-[#005DA6]">
                  <img src={qrApiUrl} alt="QR Barcode" className="w-20 h-20 object-contain" />
                </div>
              </div>

              <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                Halo <strong>{visitor.visitorName}</strong> ({visitor.company}), janji temu Anda bertemu <strong>{visitor.visited}</strong> pada <strong>{visitor.schedule}</strong> telah DISETUJUI.
              </div>

              <div className="pt-2 flex flex-col items-center gap-1.5">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(passUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-[#005DA6] hover:text-white text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-none transition-all flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>{copied ? 'Link Terenkripsi Tersalin!' : 'Salin Link Pass QR'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              onClick={() => {
                onClose();
                onOpenPass(visitor);
              }}
              className="flex-1 py-2.5 px-4 bg-[#005DA6] hover:bg-[#004070] text-white font-bold text-xs uppercase tracking-wider border-b-2 border-r-2 border-[#FFD500] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <QrCode size={16} />
              Buka Pass Tamu Digital
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Selesai
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
