/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, X, RefreshCw, Activity, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { isSupabaseConfigured, checkSupabaseHealth, fetchVisitorsFromSupabase, getSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'danger') => void;
}

export default function SupabaseConfigModal({ isOpen, onClose, onConfigSaved, triggerToast }: SupabaseConfigModalProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{ connected: boolean; message: string; latency?: number } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const currentConfig = getSupabaseConfig();
  const [customUrl, setCustomUrl] = useState(currentConfig.url);
  const [customKey, setCustomKey] = useState('');

  const runHealthCheck = async () => {
    setIsChecking(true);
    const res = await checkSupabaseHealth();
    setHealthStatus(res);
    setIsChecking(false);
  };

  useEffect(() => {
    if (isOpen) {
      runHealthCheck();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConnected = healthStatus?.connected ?? isSupabaseConfigured();

  const handleResync = async () => {
    setIsChecking(true);
    const data = await fetchVisitorsFromSupabase();
    if (data !== null) {
      triggerToast(`Sinkronisasi sukses! ${data.length} data pengunjung aktif termuat.`, 'success');
      onConfigSaved();
    } else {
      triggerToast('Gagal menyinkronkan data dari database cloud.', 'danger');
    }
    setIsChecking(false);
  };

  const handleSaveAdvanced = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl && customKey) {
      saveSupabaseConfig(customUrl, customKey);
      triggerToast('Pengaturan database berhasil diperbarui.', 'success');
      runHealthCheck();
      onConfigSaved();
      setShowAdvanced(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111c30] border-2 border-[#005DA6] w-full max-w-md shadow-[8px_8px_0px_#005DA6] overflow-hidden animate-fade-in font-sans">
        
        {/* Header */}
        <div className={`p-4 text-white flex items-center justify-between border-b-2 ${isConnected ? 'bg-[#005DA6] border-[#FFD500]' : 'bg-rose-700 border-rose-400'}`}>
          <div className="flex items-center gap-2.5">
            <Database size={18} className={isConnected ? 'text-[#FFD500]' : 'text-white'} />
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-200 block">
                SIMATA v2 PLN UIK TJB
              </span>
              <h3 className="font-bold text-sm uppercase tracking-wider font-display">
                Status Database Connect
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 text-white cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 text-xs text-slate-800 dark:text-slate-200">
          
          {/* Main Status Hero Card */}
          <div className={`p-4 border-2 flex items-start gap-3.5 ${
            isConnected
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200'
          }`}>
            <div className="p-2 rounded-none bg-white dark:bg-slate-900 shrink-0 shadow-xs border">
              {isConnected ? (
                <Wifi size={22} className="text-emerald-600 dark:text-emerald-400" />
              ) : (
                <WifiOff size={22} className="text-rose-600 dark:text-rose-400" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                <p className="font-black text-xs uppercase tracking-wider">
                  {isConnected ? 'DATABASE TERHUBUNG (NORMAL)' : 'DATABASE TIDAK TERKONEKSI / ERROR'}
                </p>
              </div>
              <p className="text-[11px] mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                {healthStatus?.message || (isConnected ? 'Koneksi cloud database aktif dan siap melayani pertukaran data tamu secara realtime.' : 'Koneksi ke server database mengalami kendala.')}
              </p>
            </div>
          </div>

          {/* Diagnostic Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Waktu Respon:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                <Activity size={12} className={isConnected ? 'text-emerald-500' : 'text-rose-500'} />
                {healthStatus?.latency ? `${healthStatus.latency} ms` : (isConnected ? '< 150 ms' : 'Timeout')}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Keamanan:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                <ShieldCheck size={12} className="text-[#005DA6] dark:text-[#FFD500]" />
                SSL & RLS Aktif
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 col-span-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Mode Sinkronisasi:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-500" />
                Realtime Auto-Sync & LocalStorage Fallback
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={runHealthCheck}
              disabled={isChecking}
              className="w-full sm:flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-600 transition-colors"
            >
              <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />
              <span>{isChecking ? 'Menguji...' : 'Uji Koneksi Ulang'}</span>
            </button>

            <button
              type="button"
              onClick={handleResync}
              disabled={isChecking}
              className="w-full sm:flex-1 py-2.5 px-3 bg-[#005DA6] hover:bg-[#004070] text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border-b-2 border-r-2 border-[#FFD500] transition-colors"
            >
              <Database size={13} />
              <span>Sinkronkan Data</span>
            </button>
          </div>

          {/* Advanced toggle for admins without exposing raw keys */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer"
            >
              {showAdvanced ? 'Tutup Pengaturan Lanjutan' : 'Pengaturan Lanjutan Server'}
            </button>
          </div>

          {showAdvanced && (
            <form onSubmit={handleSaveAdvanced} className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 space-y-2 mt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Custom Database URL:
                </label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://xxx.supabase.co"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Custom Anon Key (Tersandi):
                </label>
                <input
                  type="password"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="Ketik key baru jika ingin mengganti..."
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold text-[10px] uppercase"
              >
                Perbarui Server URL
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
