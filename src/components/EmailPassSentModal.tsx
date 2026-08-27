/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, ExternalLink, QrCode, Send, ShieldCheck, Copy, Check, X, AlertTriangle, Loader2, MessageSquare, Zap } from 'lucide-react';
import { Visitor } from '../types';
import { getProductionPassUrl } from '../utils/security';
import { sendApprovalEmail, isEmailConfigured, generateWhatsAppPassUrl, getEmailConfig } from '../lib/email';

interface EmailPassSentModalProps {
  visitor: Visitor | null;
  onClose: () => void;
  onOpenPass: (visitor: Visitor) => void;
}

type SendStatus = 'idle' | 'sending' | 'sent' | 'failed' | 'unconfigured';

export default function EmailPassSentModal({ visitor, onClose, onOpenPass }: EmailPassSentModalProps) {
  const [copied, setCopied] = useState(false);
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');

  if (!visitor) return null;

  const passUrl = getProductionPassUrl(visitor.id);
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(passUrl)}`;
  const targetEmail = visitor.email || '';
  const cfg = getEmailConfig();

  // Kirim email otomatis saat modal terbuka
  useEffect(() => {
    if (!visitor || !targetEmail) {
      setSendStatus('unconfigured');
      return;
    }
    if (!isEmailConfigured()) {
      setSendStatus('unconfigured');
      return;
    }

    setSendStatus('sending');
    sendApprovalEmail(visitor, passUrl).then((ok) => {
      setSendStatus(ok ? 'sent' : 'failed');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitor?.id]);

  const statusBanner = () => {
    if (sendStatus === 'sending') return (
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-3 rounded-none flex items-center gap-2.5">
        <Loader2 size={18} className="text-blue-600 dark:text-blue-400 shrink-0 animate-spin" />
        <div>
          <p className="font-bold text-blue-900 dark:text-blue-200 text-xs">Mengirim Barcode Pass ke <span className="font-mono">{targetEmail}</span>…</p>
          <p className="text-[10px] text-blue-700 dark:text-blue-300">Menembak via Multi-Channel Gateway SIMATA ({cfg.dispatchMode === 'parallel' ? 'Mode Simultan' : 'Mode Fallback'})</p>
        </div>
      </div>
    );
    if (sendStatus === 'sent') return (
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-3 rounded-none flex items-start gap-2.5">
        <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">Email & Barcode Berhasil Diterbitkan!</p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
            Pass QR dikirim ke <strong>{targetEmail}</strong>. Tamu dapat langsung menunjukkan link pass untuk check-in.
          </p>
        </div>
      </div>
    );
    if (sendStatus === 'failed') return (
      <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 rounded-none flex items-start gap-2.5">
        <AlertTriangle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-red-900 dark:text-red-200 text-xs">Pengiriman Email Tertunda</p>
          <p className="text-[11px] text-red-700 dark:text-red-400 mt-0.5">
            Gunakan tombol <strong>Kirim via WhatsApp</strong> atau <strong>Salin Link Pass</strong> di bawah untuk membagikan barcode ke tamu seketika.
          </p>
        </div>
      </div>
    );
    // unconfigured
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-3 rounded-none flex items-start gap-2.5">
        <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-900 dark:text-amber-200 text-xs">Email Tamu Tidak Ditemukan</p>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
            Tamu tidak menyertakan email. Silakan kirimkan link Barcode Pass melalui tombol WhatsApp di bawah.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in font-sans">
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
                Penerbitan QR Pass Tamu
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
        <div className="p-5 space-y-4 text-slate-800 dark:text-slate-200 text-xs">

          {statusBanner()}

          {/* Quick WhatsApp Share Action (High Priority) */}
          {visitor.phone && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 p-3 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                <MessageSquare size={16} className="text-emerald-600" />
                <span>Kirim Pass Barcode via WhatsApp (Paling Cepat &amp; Pasti Sampai)</span>
              </div>
              <a
                href={generateWhatsAppPassUrl(visitor, passUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 border-r-2 border-emerald-900 cursor-pointer shadow-md transition-all inline-flex"
              >
                <MessageSquare size={16} />
                <span>Kirim ke WhatsApp Tamu ({visitor.phone})</span>
              </a>
            </div>
          )}

          {/* Email Preview Card */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 space-y-3 rounded-none">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                <Mail size={14} className="text-[#005DA6] dark:text-[#FFD500]" />
                <span>Notifikasi Email Tamu</span>
              </div>
              <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase ${
                sendStatus === 'sent' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300' :
                sendStatus === 'sending' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' :
                sendStatus === 'failed' ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300' :
                'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
              }`}>
                {sendStatus === 'sent' ? 'DELIVERED' : sendStatus === 'sending' ? 'SENDING...' : sendStatus === 'failed' ? 'RETRY' : 'NOT SENT'}
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="grid grid-cols-4 gap-1">
                <span className="text-slate-400 font-semibold">Kepada:</span>
                <span className="col-span-3 font-bold font-mono text-slate-800 dark:text-slate-200">{targetEmail || '(tidak ada email)'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <span className="text-slate-400 font-semibold">Subjek:</span>
                <span className="col-span-3 font-bold text-[#005DA6] dark:text-[#FFD500]">
                  [SIMATA PLN UIK TJB] Persetujuan Janji Temu &amp; Pass Digital - {visitor.visitorName}
                </span>
              </div>
            </div>

            {/* Email Body Preview */}
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
