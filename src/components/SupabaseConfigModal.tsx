/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, X, ExternalLink, Key, Link as LinkIcon, RefreshCw, Copy, Check } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, getSupabaseClient, fetchVisitorsFromSupabase } from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'danger') => void;
}

export default function SupabaseConfigModal({ isOpen, onClose, onConfigSaved, triggerToast }: SupabaseConfigModalProps) {
  const current = getSupabaseConfig();
  const [url, setUrl] = useState(current.url);
  const [anonKey, setAnonKey] = useState(current.anonKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setTestResult({ success: false, message: 'URL Proyek dan Anon Key tidak boleh kosong.' });
      setIsTesting(false);
      return;
    }

    if (!cleanUrl.startsWith('https://')) {
      setTestResult({ success: false, message: 'URL Supabase harus diawali dengan https:// (contoh: https://xyz.supabase.co)' });
      setIsTesting(false);
      return;
    }

    saveSupabaseConfig(cleanUrl, cleanKey);
    const data = await fetchVisitorsFromSupabase();

    if (data !== null) {
      setTestResult({ success: true, message: `Koneksi Supabase Berhasil! Ditemukan ${data.length} data pengunjung dari database cloud.` });
      triggerToast('Koneksi Supabase Cloud Berhasil Aktif!', 'success');
      onConfigSaved();
    } else {
      setTestResult({
        success: false,
        message: 'Gagal terhubung ke tabel "visitors" di Supabase. Pastikan tabel telah dibuat di Supabase SQL Editor menggunakan skrip schema.',
      });
    }

    setIsTesting(false);
  };

  const handleCopySql = () => {
    const sql = `-- Salin & Jalankan di Supabase Dashboard > SQL Editor
CREATE TABLE IF NOT EXISTS public.visitors (
    id TEXT PRIMARY KEY,
    visitor_name TEXT NOT NULL,
    company TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    identify_no TEXT,
    gender TEXT DEFAULT 'Laki-laki',
    visited TEXT NOT NULL,
    purpose TEXT NOT NULL,
    schedule TEXT NOT NULL,
    in_time TEXT,
    out_time TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    main_gate_pass TEXT DEFAULT 'TJB-PASS-01',
    second_gate_pass TEXT DEFAULT 'TJB-PASS-02',
    valid_until TEXT,
    validity_option TEXT DEFAULT 'SAME_DAY',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all" ON public.visitors FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitors;`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    triggerToast('Skrip SQL Schema Supabase berhasil disalin!', 'success');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111c30] border-2 border-[#005DA6] w-full max-w-lg shadow-[8px_8px_0px_#005DA6] overflow-hidden animate-fade-in font-sans">
        
        {/* Header */}
        <div className="bg-[#005DA6] text-white p-4 flex items-center justify-between border-b-2 border-[#FFD500]">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-[#FFD500]" />
            <span className="font-bold text-sm uppercase tracking-wider font-display">
              Konfigurasi Supabase Cloud Database
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 text-white cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleTestAndSave} className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-slate-700 dark:text-slate-300">
            <p className="font-bold text-[#005DA6] dark:text-[#FFD500] mb-1">
              Sinkronisasi Cloud Realtime
            </p>
            <p className="text-[11px] leading-relaxed">
              Hubungkan SIMATA PLN ke Supabase agar data pengajuan tamu dari HP tamu langsung masuk secara realtime ke monitor Pos Security & Admin PLN.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <LinkIcon size={12} className="text-[#005DA6]" />
              Project URL Supabase:
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#152033] border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Key size={12} className="text-[#005DA6]" />
              Anon / Public API Key:
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#152033] border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
            />
          </div>

          {testResult && (
            <div
              className={`p-3 border flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300'
              }`}
            >
              {testResult.success ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
              <span className="text-[11px] leading-tight">{testResult.message}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleCopySql}
              className="w-full sm:w-auto px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-700 text-[11px]"
            >
              {copiedSql ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copiedSql ? 'SQL Tersalin!' : 'Salin SQL Schema'}</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isTesting}
                className="flex-1 sm:flex-initial px-5 py-2 bg-[#005DA6] hover:bg-[#004070] text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer border-b-2 border-r-2 border-[#FFD500]"
              >
                {isTesting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Menghubungkan...</span>
                  </>
                ) : (
                  <span>Simpan & Hubungkan</span>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
