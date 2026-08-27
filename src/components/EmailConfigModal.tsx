/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, X, Save, ExternalLink, CheckCircle, AlertTriangle, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { EmailConfig, sendApprovalEmail } from '../lib/email';

interface EmailConfigModalProps {
  initialConfig: EmailConfig;
  onSave: (cfg: EmailConfig) => void;
  onClose: () => void;
}

export default function EmailConfigModal({ initialConfig, onSave, onClose }: EmailConfigModalProps) {
  const [provider, setProvider] = useState<'google_script' | 'emailjs'>(initialConfig.provider || 'google_script');
  const [googleScriptUrl, setGoogleScriptUrl] = useState(initialConfig.googleScriptUrl || '');
  const [serviceId, setServiceId] = useState(initialConfig.serviceId || '');
  const [templateId, setTemplateId] = useState(initialConfig.templateId || '');
  const [publicKey, setPublicKey] = useState(initialConfig.publicKey || '');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [testEmail, setTestEmail] = useState('');

  const isGoogleComplete = googleScriptUrl.trim().startsWith('https://script.google.com/');
  const isEmailJsComplete = Boolean(serviceId.trim() && templateId.trim() && publicKey.trim());
  const isComplete = provider === 'google_script' ? isGoogleComplete : isEmailJsComplete;

  const handleTest = async () => {
    if (!isComplete || !testEmail.includes('@')) return;
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
      <div className="premium-glass max-w-lg w-full shadow-2xl overflow-hidden my-auto border-2 border-[#005DA6] rounded-none">

        {/* Header */}
        <div className="bg-[#005DA6] border-b-2 border-[#FFD500] px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Mail size={20} className="text-[#FFD500]" />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#FFD500] block">Pengaturan Email</span>
              <h3 className="text-base font-black tracking-tight uppercase">Integrasi Pengiriman Email</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white cursor-pointer p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-slate-800 dark:text-slate-200">

          {/* Provider Selection Tabs */}
          <div className="grid grid-cols-2 gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setProvider('google_script')}
              className={`p-2.5 text-left border rounded-none cursor-pointer transition-all ${
                provider === 'google_script'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-[#005DA6] dark:border-[#FFD500] text-[#005DA6] dark:text-[#FFD500] font-black'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs uppercase">
                <Sparkles size={13} className="text-emerald-500" />
                <span>Direct Gmail</span>
              </div>
              <span className="text-[9.5px] font-normal block text-slate-500 dark:text-slate-400 mt-0.5">
                500 email/hari (Gratis tanpa limitasi)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setProvider('emailjs')}
              className={`p-2.5 text-left border rounded-none cursor-pointer transition-all ${
                provider === 'emailjs'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-[#005DA6] dark:border-[#FFD500] text-[#005DA6] dark:text-[#FFD500] font-black'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs uppercase">
                <Mail size={13} />
                <span>EmailJS / SMTP</span>
              </div>
              <span className="text-[9.5px] font-normal block text-slate-500 dark:text-slate-400 mt-0.5">
                Outlook PLN / Custom SMTP
              </span>
            </button>
          </div>

          {/* Provider 1: Google Apps Script Webhook */}
          {provider === 'google_script' && (
            <div className="space-y-3 animate-fade-in">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-3 text-[11px] space-y-1">
                <p className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                  <CheckCircle size={13} className="text-emerald-600 dark:text-emerald-400" />
                  Langsung Terhubung ke Akun Gmail Anda
                </p>
                <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  Cukup tempelkan <strong>Web App URL</strong> dari Google Apps Script Anda. Email resmi PLN akan langsung terkirim dari inbox Gmail Anda (kuota 500-2.000 email/hari).
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Google Apps Script Web App URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={googleScriptUrl}
                  onChange={(e) => setGoogleScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-none text-xs font-mono focus:outline-none focus:border-[#005DA6]"
                />
                <span className="text-[9.5px] text-slate-400 mt-1 block">
                  Dapatkan URL ini di <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="underline text-[#005DA6] dark:text-[#FFD500]">script.google.com</a> (Deploy ➔ New Deployment ➔ Web app ➔ Anyone).
                </span>
              </div>
            </div>
          )}

          {/* Provider 2: EmailJS */}
          {provider === 'emailjs' && (
            <div className="space-y-3 animate-fade-in">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-3 rounded-none text-[11px]">
                <p className="font-bold text-blue-900 dark:text-blue-200 mb-1">Setup EmailJS (Outlook PLN / SMTP):</p>
                <ol className="text-blue-700 dark:text-blue-300 space-y-0.5 list-decimal list-inside">
                  <li>Daftar di <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer" className="underline font-bold inline-flex items-center gap-0.5">emailjs.com <ExternalLink size={10} /></a></li>
                  <li>Email Services ➔ Add Service (Outlook PLN / SMTP) ➔ Salin <strong>Service ID</strong></li>
                  <li>Email Templates ➔ Create Template ➔ Salin <strong>Template ID</strong></li>
                  <li>Account ➔ API Keys ➔ Salin <strong>Public Key</strong></li>
                </ol>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Service ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    placeholder="service_xxxxxxx"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-none text-xs font-mono focus:outline-none focus:border-[#005DA6]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Template ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    placeholder="template_xxxxxxx"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-none text-xs font-mono focus:outline-none focus:border-[#005DA6]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Public Key <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={publicKey}
                      onChange={(e) => setPublicKey(e.target.value)}
                      placeholder="xxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 pr-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-none text-xs font-mono focus:outline-none focus:border-[#005DA6]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Test Connection */}
          {isComplete && (
            <div className="border border-slate-200 dark:border-slate-700 p-3 rounded-none space-y-2">
              <p className="font-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Tes Kirim Email Langsung</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="masukkan.email.anda@gmail.com"
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-none text-xs font-mono focus:outline-none focus:border-[#005DA6]"
                />
                <button
                  onClick={handleTest}
                  disabled={testStatus === 'testing' || !testEmail.includes('@')}
                  className="px-3.5 py-1.5 bg-[#005DA6] hover:bg-[#004070] text-white text-xs font-bold uppercase cursor-pointer disabled:opacity-40 flex items-center gap-1 rounded-none"
                >
                  {testStatus === 'testing' ? <Loader2 size={12} className="animate-spin" /> : null}
                  Tes Kirim
                </button>
              </div>
              {testStatus === 'ok' && (
                <p className="text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-1">
                  <CheckCircle size={11} /> Email tes berhasil dikirim! Silakan periksa inbox/kotak masuk Anda.
                </p>
              )}
              {testStatus === 'fail' && (
                <p className="text-red-600 dark:text-red-400 text-[11px] flex items-center gap-1">
                  <AlertTriangle size={11} /> Gagal mengirim email tes. Periksa kembali URL atau konfigurasi Anda.
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={handleSave}
              disabled={!isComplete}
              className="flex-1 py-2.5 px-4 bg-[#005DA6] hover:bg-[#004070] disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider border-b-2 border-r-2 border-[#FFD500] cursor-pointer flex items-center justify-center gap-1.5 rounded-none shadow-sm"
            >
              <Save size={14} />
              Simpan Konfigurasi
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase cursor-pointer rounded-none"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
