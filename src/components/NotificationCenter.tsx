/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bell,
  MessageSquare,
  Mail,
  Smartphone,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  Eye,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { SystemNotification, Visitor } from '../types';
import PLNLogo from './PLNLogo';

interface NotificationCenterProps {
  notifications: SystemNotification[];
  onClearAll: () => void;
  onResend: (notificationId: string) => void;
}

export default function NotificationCenter({
  notifications,
  onClearAll,
  onResend
}: NotificationCenterProps) {
  const [selectedNotif, setSelectedNotif] = useState<SystemNotification | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left 2 Columns: Sent Alerts Ledger / List */}
      <div className="lg:col-span-2 bg-white dark:bg-[#111c30] border-2 border-slate-200 dark:border-slate-800 p-5 rounded-none shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD500] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD500]"></span>
              </span>
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-850 dark:text-white flex items-center gap-2 font-display">
                Catatan Pengiriman Notifikasi Otomatis
              </h5>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 font-mono text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-[#005DA6] dark:text-[#FFD500] border border-slate-250 dark:border-slate-700">
                {notifications.length} Terkirim
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-[10px] text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 bg-none border-none cursor-pointer uppercase transition-all"
                  title="Bersihkan Semua Log"
                >
                  <Trash2 size={11} />
                  Hapus Log
                </button>
              )}
            </div>
          </div>

          {/* List ledger */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[500px] overflow-y-auto pr-1 space-y-1">
            {notifications.map((notif) => {
              const isCheckIn = notif.type === 'CHECK_IN';
              return (
                <div
                  key={notif.id}
                  onClick={() => setSelectedNotif(notif)}
                  className={`p-3.5 flex items-start justify-between gap-4 transition-all hover:bg-slate-50 dark:hover:bg-[#152033] border border-transparent hover:border-slate-150 dark:hover:border-slate-800 cursor-pointer ${
                    selectedNotif?.id === notif.id ? 'bg-sky-50/70 dark:bg-[#152033]/60 border-l-4 border-l-[#005DA6]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-2 rounded-none ${
                      isCheckIn
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30'
                        : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30'
                    }`}>
                      {notif.channel === 'WhatsApp' ? <MessageSquare size={15} /> : <Mail size={15} />}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-slate-850 dark:text-white text-xs tracking-tight">
                          {notif.title}
                        </span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-none font-sans uppercase ${
                          isCheckIn
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20'
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20'
                        }`}>
                          {isCheckIn ? 'TAMU TIBA' : 'JANJI TEMU'}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500 font-medium">
                        Kepada Karyawan: <strong className="text-slate-700 dark:text-slate-300 font-bold uppercase">{notif.employeeName}</strong> &bull; Perusahaan Tamu: {notif.company}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono text-slate-400">
                        <span>{notif.timestamp}</span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-0.5 text-slate-500 font-bold">
                          STATUS: <span className="text-emerald-500 font-black uppercase tracking-wider">{notif.status.replace('SENT_', 'TERKIRIM ')}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onResend(notif.id);
                      }}
                      title="Kirim Ulang Notifikasi"
                      className="p-1.5 text-slate-400 hover:text-[#005DA6] dark:hover:text-[#FFD500] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer rounded-none border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    >
                      <RefreshCw size={11} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNotif(notif);
                      }}
                      className="p-1.5 text-slate-400 hover:text-[#005DA6] dark:hover:text-[#FFD500] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer rounded-none"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {notifications.length === 0 && (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-150 dark:border-slate-800 rounded-none bg-slate-50/50">
                <Bell className="mx-auto text-slate-350 dark:text-slate-700 mb-2 animate-bounce" size={28} />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Belum Ada Log Kiriman Notifikasi
                </p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto leading-relaxedNormal">
                  Sistem SIMATA akan mengirimkan notifikasi otomatis ke nomor WhatsApp/Email karyawan ketika status tamu diubah ke "IN-PROGRESS" (Check-In) atau saat informasi janji temu diperbarui.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-semibold select-none">
          <span className="flex items-center gap-1 text-emerald-500 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-none"></span>
            SIMATA PLN Auto-Push Active
          </span>
          <span>Security Token: SMT-MESSENGER-3.0</span>
        </div>
      </div>

      {/* Right Column: Simulated Mobile / Email Channel screen & Channels Status */}
      <div className="space-y-6">

        {/* Channels Monitor Dashboard */}
        <div className="bg-white dark:bg-[#111c30] border-2 border-slate-200 dark:border-slate-800 p-5 rounded-none shadow-sm">
          <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2 font-display mb-3 border-b pb-2 border-slate-100 dark:border-slate-800">
            <Smartphone size={14} className="text-[#005DA6]" />
            Status Logistik Jalur Komunikasi
          </h5>

          <div className="space-y-3">
            {/* WA */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-none">
                  <MessageSquare size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold">PLN WhatsApp API Gateway</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Simulasi API Push Node-WA</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[8px] font-black uppercase tracking-wider border border-emerald-300 dark:border-emerald-900">
                CONNECTED
              </span>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-sky-500/10 text-sky-500 rounded-none">
                  <Mail size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold">PLN Mail Server Exchange</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">SMTP Server Internal (Active)</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-[#005DA6]/10 text-[#005DA6] dark:text-sky-350 text-[8px] font-black uppercase tracking-wider border border-[#005DA6]/30 dark:border-sky-900">
                ACTIVE
              </span>
            </div>

            {/* SMS */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-none">
                  <Smartphone size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold">PLN SMS Center Gateway</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Short Message Fallback</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                STANDBY
              </span>
            </div>
          </div>
        </div>

        {/* Live Simulator View */}
        <div className="bg-white dark:bg-[#111c30] border-2 border-slate-200 dark:border-slate-800 p-5 rounded-none shadow-sm h-[320px] flex flex-col justify-between">
          <div className="border-b pb-2 mb-3 border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2 font-display">
              <Eye size={13} className="text-[#005DA6]" />
              Pratinjau Pesan Terkirim
            </h5>
            <span className="text-[8px] font-black bg-amber-500 text-white px-2 py-0.5 uppercase tracking-wider">
              REAL LAYOUT
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {selectedNotif ? (
              selectedNotif.channel === 'WhatsApp' ? (
                /* WhatsApp Template preview styling with genuine balloon and green elements */
                <div className="space-y-3 bg-[#e5ddd5] dark:bg-[#0b141a] p-3 border border-slate-200 dark:border-slate-800 h-full overflow-y-auto font-sans relative">
                  
                  {/* WhatsApp contact bubble */}
                  <div className="flex items-center gap-2 bg-[#075e54] text-white p-2 text-[10px] w-full absolute top-0 left-0 z-10">
                    {/* Tiny PLN Crest inside user icon as requested */}
                    <div className="w-6 h-6 bg-white flex items-center justify-center p-0.5">
                      <PLNLogo showText={false} size="sm" />
                    </div>
                    <div>
                      <p className="font-black">PLN NOTIFY CENTER</p>
                      <p className="text-[8px] opacity-80">Official Business Account</p>
                    </div>
                  </div>

                  {/* Bubble spacer */}
                  <div className="h-6"></div>

                  <div className="bg-white dark:bg-[#1f2c34] text-slate-800 dark:text-slate-100 p-3 rounded-none shadow-xs text-[11px] max-w-[90%] float-left ml-1 mt-4 relative">
                    {/* Clean formatted markup display */}
                    <div className="border-b pb-1.5 mb-1.5 border-slate-150 dark:border-slate-800 flex items-center gap-1.5 text-[8.5px] font-black text-slate-400">
                      <PLNLogo showText={false} size="sm" />
                      <span>OFFICIAL PLN NOTIFICATION</span>
                    </div>

                    <p className="whitespace-pre-line leading-relaxed font-sans font-medium text-slate-700 dark:text-slate-300">
                      {selectedNotif.message}
                    </p>

                    <div className="text-right text-[8px] text-slate-400 mt-1 font-mono flex items-center justify-end gap-1 font-bold">
                      <span>{selectedNotif.timestamp.split(' - ')[1]}</span>
                      <span className="text-emerald-500"><CheckCheck size={12} /></span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Corporate E-mail rendering template with corporate frame header containing the PLN emblem logo */
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 h-full overflow-y-auto flex flex-col font-sans">
                  
                  {/* Corporate mail header */}
                  <div className="bg-[#005DA6] border-b border-[#FFD500] text-white p-2.5 flex items-center justify-between text-[10px] font-mono select-none">
                    <div className="flex items-center gap-2">
                      <PLNLogo showText={false} size="sm" />
                      <span className="font-sans font-black tracking-wider text-[11px]">PT PLN (Persero) Mail Hub</span>
                    </div>
                    <span>INTERNAL SECURITY</span>
                  </div>

                  <div className="bg-white dark:bg-[#111c30] p-4 border-l border-r border-b border-slate-250 dark:border-slate-800/80 text-[11px] text-slate-800 dark:text-slate-250 flex-1 space-y-3 font-sans leading-relaxed text-slate-700 dark:text-slate-350">
                    <div className="flex justify-between items-center text-[10px] border-b pb-2 text-slate-400 font-bold border-slate-100 dark:border-slate-800">
                      <span>FROM: simata-notify@pln.co.id</span>
                      <span>TO: {selectedNotif.employeeName.trim().toLowerCase() || 'divisi'}@pln.co.id</span>
                    </div>

                    <h6 className="font-extrabold text-slate-900 dark:text-white border-b pb-1 border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 uppercase font-display text-[11px]">
                      {selectedNotif.title}
                    </h6>

                    <p className="whitespace-pre-line font-medium leading-relaxed font-sans mt-2">
                      {selectedNotif.message}
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800 font-mono text-[9px] text-slate-400 mt-4">
                      Sender IP: 10.22.41.97 (GI-PLN-MAIN-SERVER)
                    </div>
                  </div>

                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-600 select-none p-4">
                <Info size={28} className="text-slate-300 dark:text-slate-750 mb-2 animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-wide">Pilih Log Notifikasi</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-normal max-w-[200px] mx-auto">
                  Ketuk salah satu rekaman log di daftar sebelah kiri untuk mempratinjau visual surat/pesan cerdas yang dikirim ke karyawan.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
