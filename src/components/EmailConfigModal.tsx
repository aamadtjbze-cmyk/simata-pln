/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, X, Save, CheckCircle, AlertTriangle, Loader2, Send, ShieldCheck } from 'lucide-react';
import { EmailConfig, sendApprovalEmail, DEFAULT_GOOGLE_SCRIPT_URL } from '../lib/email';

interface EmailConfigModalProps {
  initialConfig: EmailConfig;
  onSave: (cfg: EmailConfig) => void;
  onClose: () => void;
}

export default function EmailConfigModal({ initialConfig, onSave, onClose }: EmailConfigModalProps) {
  const [provider, setProvider] = useState<'google_script' | 'emailjs'>(initialConfig.provider || 'google_script');
  const [googleScriptUrl, setGoogleScriptUrl] = useState(initialConfig.googleScriptUrl || DEFAULT_GOOGLE_SCRIPT_URL);
  
  const [serviceId, setServiceId] = useState(initialConfig.serviceId || '');
  const [templateId, setTemplateId] = useState(initialConfig.templateId || '');
  const [publicKey, setPublicKey] = useState(initialConfig.publicKey || '');
  
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [testEmail, setTestEmail] = useState('');

  const handleTest = async () => {
    if (!testEmail.includes('@')) return;
    setTestStatus('testing');

    const dummyVisitor = {
      id: 'TJB-TEST-000001',
      visitorName: 'Test Tamu PLN',
      company: 'PT PLN (PERSERO)',
      visited: 'SEKRETARIAT PLN',
      schedule: 'Hari Ini - 09.00',
      purpose: 'Uji Coba Kirim Email Notifikasi',
      email: testEmail,
      status: 'SCHEDULED' as const,
      inTime: null,
      outTime: null,
      mainGatePass: 'TJB-PASS-01',
      secondGatePass: 'TJB-PASS-02',
    };

    // Simpan sementara untuk pengujian
    localStorage.setItem('simata_email_provider', provider);
    localStorage.setItem('simata_google_script_url', googleScriptUrl.trim());
    localStorage.setItem('simata_emailjs_service', serviceId.trim());
    localStorage.setItem('simata_emailjs_template', templateId.trim());
    localStorage.setItem('simata_emailjs_key', publicKey.trim());

    const ok = await sendApprovalEmail(dummyVisitor as any, `${window.location.origin}/?token=TEST`);
    setTestStatus(ok ? 'ok' : 'fail');
  };

  const handleSave = () => {
    onSave({
      provider,
      googleScriptUrl: googleScriptUrl.trim(),
      serviceId: serviceId.trim(),
      templateId: templateId.trim(),
      publicKey: publicKey.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto font-sans">
      <div className="premium-glass max-w-lg w-full shadow-2xl overflow-hidden my-auto border-2 border-[#005DA6] rounded-none max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="bg-[#005DA6] border-b-2 border-[#FFD500] px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Mail size={20} className="text-[#FFD500]" />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#FFD500] block">Integrasi Gateway</span>
              <h3 className="text-base font-black tracking-tight uppercase">Pengaturan Email Janji Temu</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white cursor-pointer p-1">
            <X size={20} />
          </button>
        </div>

        {/* Provider Selection Tabs */}
        <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-xs font-bold select-none shrink-0">
          <button
            type="button"
            onClick={() => setProvider('google_script')}
            className={`p-3 text-center border-b-2 transition-all cursor-pointer ${
              provider === 'google_script'
                ? 'border-[#005DA6] text-[#005DA6] dark:text-[#FFD500] bg-white dark:bg-slate-850 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Direct Gmail (Google Script) ✅
          </button>

          <button
            type="button"
            onClick={() => setProvider('emailjs')}
            className={`p-3 text-center border-b-2 transition-all cursor-pointer ${
              provider === 'emailjs'
                ? 'border-[#005DA6] text-[#005DA6] dark:text-[#FFD500] bg-white dark:bg-slate-850 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            EmailJS SDK / SMTP
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-4 text-xs text-slate-800 dark:text-slate-200 overflow-y-auto flex-1">

          {/* TAB 1: GOOGLE APPS SCRIPT */}
          {provider === 'google_script' && (
            <div className="space-y-3.5">
              <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 p-3 rounded-none flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-[#005DA6] dark:text-[#FFD500] shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                  <strong>Direct Gmail (Google Apps Script)</strong> mengirimkan email barcode pass langsung dari server resmi Google. <strong>100% Gratis</strong> (500–2.000 email/hari) tanpa syarat membeli domain kustom!
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Google Apps Script Web App URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  value={googleScriptUrl}
                  onChange={(e) => setGoogleScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#005DA6]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  URL Web App Google Apps Script yang terhubung ke akun Gmail Anda.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setGoogleScriptUrl(DEFAULT_GOOGLE_SCRIPT_URL)}
                className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Gunakan URL Google Apps Script Default Sistem
              </button>
            </div>
          )}

          {/* TAB 2: EMAILJS */}
          {provider === 'emailjs' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Service ID EmailJS</label>
                <input
                  type="text"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  placeholder="service_xxxxxxx"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#005DA6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Template ID EmailJS</label>
                <input
                  type="text"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  placeholder="template_xxxxxxx"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#005DA6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Public Key / User ID</label>
                <input
                  type="text"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  placeholder="Public Key EmailJS..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#005DA6]"
                />
              </div>
            </div>
          )}

          {/* Live Test Section */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-3.5 space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Uji Coba Pengiriman Langsung:
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => {
                  setTestEmail(e.target.value);
                  setTestStatus('idle');
                }}
                placeholder="Masukkan email Anda untuk tes..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#005DA6]"
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={testStatus === 'testing' || !testEmail.includes('@')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {testStatus === 'testing' ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                <span>{testStatus === 'testing' ? 'Mengirim...' : 'Tes Kirim'}</span>
              </button>
            </div>

            {testStatus === 'ok' && (
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
                <CheckCircle size={14} />
                <span>Uji coba berhasil! Email telah dikirimkan ke {testEmail}.</span>
              </div>
            )}
            {testStatus === 'fail' && (
              <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1.5">
                <AlertTriangle size={14} />
                <span>Pengiriman gagal. Periksa kembali konfigurasi URL script Anda.</span>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-white dark:bg-[#111c30] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
          >
            Batal
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-[#005DA6] hover:bg-[#004070] text-white font-black text-xs uppercase tracking-wider border-b-2 border-r-2 border-[#FFD500] cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>Simpan Konfigurasi</span>
          </button>
        </div>

      </div>
    </div>
  );
}
