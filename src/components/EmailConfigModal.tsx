/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, X, Save, ExternalLink, CheckCircle, AlertTriangle, Loader2, Eye, EyeOff, Sparkles, Zap, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { EmailConfig, sendApprovalEmail, DEFAULT_GOOGLE_SCRIPT_URL } from '../lib/email';

interface EmailConfigModalProps {
  initialConfig: EmailConfig;
  onSave: (cfg: EmailConfig) => void;
  onClose: () => void;
}

export default function EmailConfigModal({ initialConfig, onSave, onClose }: EmailConfigModalProps) {
  const [provider, setProvider] = useState<'google_script' | 'resend' | 'brevo' | 'emailjs' | 'hybrid'>(initialConfig.provider || 'hybrid');
  const [dispatchMode, setDispatchMode] = useState<'parallel' | 'fallback'>(initialConfig.dispatchMode || 'parallel');
  
  const [googleScriptUrl, setGoogleScriptUrl] = useState(initialConfig.googleScriptUrl || DEFAULT_GOOGLE_SCRIPT_URL);
  const [resendApiKey, setResendApiKey] = useState(initialConfig.resendApiKey || '');
  const [resendSender, setResendSender] = useState(initialConfig.resendSender || 'SIMATA PLN <onboarding@resend.dev>');
  const [brevoApiKey, setBrevoApiKey] = useState(initialConfig.brevoApiKey || '');
  const [brevoSender, setBrevoSender] = useState(initialConfig.brevoSender || '');
  
  const [serviceId, setServiceId] = useState(initialConfig.serviceId || '');
  const [templateId, setTemplateId] = useState(initialConfig.templateId || '');
  const [publicKey, setPublicKey] = useState(initialConfig.publicKey || '');
  
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'google' | 'resend' | 'brevo' | 'emailjs' | 'strategy'>('strategy');
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
      purpose: 'Uji Coba Kirim Multi-Channel Email',
      email: testEmail,
      status: 'SCHEDULED' as const,
      inTime: null,
      outTime: null,
      mainGatePass: 'TJB-PASS-01',
      secondGatePass: 'TJB-PASS-02',
    };

    // Simpan sementara untuk pengujian
    localStorage.setItem('simata_email_provider', provider);
    localStorage.setItem('simata_dispatch_mode', dispatchMode);
    localStorage.setItem('simata_google_script_url', googleScriptUrl.trim());
    localStorage.setItem('simata_resend_api_key', resendApiKey.trim());
    localStorage.setItem('simata_resend_sender', resendSender.trim());
    localStorage.setItem('simata_brevo_api_key', brevoApiKey.trim());
    localStorage.setItem('simata_brevo_sender', brevoSender.trim());
    localStorage.setItem('simata_emailjs_service', serviceId.trim());
    localStorage.setItem('simata_emailjs_template', templateId.trim());
    localStorage.setItem('simata_emailjs_key', publicKey.trim());

    const ok = await sendApprovalEmail(dummyVisitor as any, `${window.location.origin}/?token=TEST`);
    setTestStatus(ok ? 'ok' : 'fail');
  };

  const handleSave = () => {
    onSave({
      provider,
      dispatchMode,
      googleScriptUrl: googleScriptUrl.trim(),
      resendApiKey: resendApiKey.trim(),
      resendSender: resendSender.trim(),
      brevoApiKey: brevoApiKey.trim(),
      brevoSender: brevoSender.trim(),
      serviceId: serviceId.trim(),
      templateId: templateId.trim(),
      publicKey: publicKey.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto font-sans">
      <div className="premium-glass max-w-xl w-full shadow-2xl overflow-hidden my-auto border-2 border-[#005DA6] rounded-none max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="bg-[#005DA6] border-b-2 border-[#FFD500] px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Mail size={20} className="text-[#FFD500]" />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#FFD500] block">Integrasi Multi-Channel</span>
              <h3 className="text-base font-black tracking-tight uppercase">Pusat Gateway Email & WhatsApp</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white cursor-pointer p-1">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 overflow-x-auto text-[11px] font-bold select-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('strategy')}
            className={`px-4 py-3 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'strategy'
                ? 'border-[#005DA6] text-[#005DA6] dark:text-[#FFD500] bg-white dark:bg-slate-850 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Zap size={13} />
            <span>Mode Kombinasi ⚡</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resend')}
            className={`px-4 py-3 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'resend'
                ? 'border-[#005DA6] text-[#005DA6] dark:text-[#FFD500] bg-white dark:bg-slate-850 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Resend API (Kilat &lt;0.5s)</span>
            {resendApiKey && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`px-4 py-3 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'google'
                ? 'border-[#005DA6] text-[#005DA6] dark:text-[#FFD500] bg-white dark:bg-slate-850 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Google Apps Script</span>
            {googleScriptUrl && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('emailjs')}
            className={`px-4 py-3 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'emailjs'
                ? 'border-[#005DA6] text-[#005DA6] dark:text-[#FFD500] bg-white dark:bg-slate-850 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>EmailJS / SMTP</span>
            {serviceId && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 space-y-4 text-xs text-slate-800 dark:text-slate-200 overflow-y-auto flex-1">

          {/* TAB: STRATEGY & COMBINE */}
          {activeTab === 'strategy' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-3.5 space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#005DA6] dark:text-[#FFD500] text-xs">
                  <Zap size={15} />
                  <span>Strategi Pengiriman Multi-Engine (Anti-Delay & Anti-Spam)</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  SIMATA dapat mengombinasikan beberapa penyedia email sekaligus. Jika satu penyedia mengalami delay antrian atau masuk folder Spam, email dari penyedia lainnya akan langsung tiba di Inbox tamu.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold mb-2 uppercase text-slate-700 dark:text-slate-300">
                  Pilih Mode Eksekusi Email:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label
                    onClick={() => setDispatchMode('parallel')}
                    className={`p-3 border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      dispatchMode === 'parallel'
                        ? 'border-[#005DA6] bg-sky-50/70 dark:bg-sky-950/50 text-[#005DA6] dark:text-[#FFD500] font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs">⚡ Mode Paralel (Simultan)</span>
                      <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[8.5px] font-black uppercase">Rekomendasi</span>
                    </div>
                    <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400 leading-normal">
                      Menembak ke semua provider yang aktif secara bersamaan. Tamu dijamin menerima email dalam hitungan detik.
                    </p>
                  </label>

                  <label
                    onClick={() => setDispatchMode('fallback')}
                    className={`p-3 border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      dispatchMode === 'fallback'
                        ? 'border-[#005DA6] bg-sky-50/70 dark:bg-sky-950/50 text-[#005DA6] dark:text-[#FFD500] font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs">🔄 Mode Auto-Fallback</span>
                    </div>
                    <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400 leading-normal">
                      Mencoba provider utama (Resend/Google Script), jika gagal atau timeout otomatis alihkan ke provider cadangan.
                    </p>
                  </label>
                </div>
              </div>

              {/* WhatsApp Feature Highlight */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-1.5">
                    <ShieldCheck size={15} />
                    <span>Fitur Tambahan: Kirim Pass via WhatsApp (1-Klik)</span>
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white font-mono text-[8.5px] font-black uppercase">AKTIF</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                  Setiap janji temu yang disetujui otomatis dilengkapi tombol hijau <strong>[ Kirim WhatsApp ]</strong> di layar Admin, sehingga barcode pass dapat langsung dikirim ke nomor WhatsApp tamu.
                </p>
              </div>
            </div>
          )}

          {/* TAB: RESEND API (Super Fast) */}
          {activeTab === 'resend' && (
            <div className="space-y-3.5">
              <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 p-3 rounded-none flex items-start gap-2.5">
                <Sparkles size={16} className="text-[#005DA6] dark:text-[#FFD500] shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                  <strong>Resend.com</strong> adalah layanan transactional email tercepat di dunia (&lt; 0.5 detik langsung sampai ke Inbox). Gratis 3.000 email/bulan (100 email/hari).
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Resend API Key <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    placeholder="re_123456789abcdef..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#005DA6]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Sender / Pengirim (Opsional)
                </label>
                <input
                  type="text"
                  value={resendSender}
                  onChange={(e) => setResendSender(e.target.value)}
                  placeholder="SIMATA PLN <onboarding@resend.dev>"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#005DA6]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Bisa gunakan default <code>onboarding@resend.dev</code> atau domain kustom kantor yang telah diverifikasi di Resend.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                >
                  <ExternalLink size={12} />
                  Dapatkan Resend API Key Gratis di resend.com/api-keys
                </a>
              </div>
            </div>
          )}

          {/* TAB: GOOGLE APPS SCRIPT */}
          {activeTab === 'google' && (
            <div className="space-y-3.5">
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
                  Kirim langsung dari akun Gmail (500–2.000 email/hari). Salin URL Web App yang berakhiran <code>/exec</code>.
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

          {/* TAB: EMAILJS / SMTP */}
          {activeTab === 'emailjs' && (
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
                <span>Pengiriman gagal. Periksa kembali konfigurasi API Key / URL script Anda.</span>
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
