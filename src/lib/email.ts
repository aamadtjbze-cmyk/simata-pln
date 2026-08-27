/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SIMATA PLN Email & WhatsApp Gateway:
 * 1. Google Apps Script Webhook (Direct Gmail, 500-2000 email/hari gratis tanpa syarat domain)
 * 2. EmailJS SDK (Gmail, Outlook PLN, Custom SMTP)
 * 3. WhatsApp Direct Pass Link (1-Click Open in WA)
 */

import emailjs from '@emailjs/browser';
import { Visitor } from '../types';

export interface EmailConfig {
  provider: 'google_script' | 'emailjs';
  googleScriptUrl: string;
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export const DEFAULT_GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwEcxTci7nMH5JuJ8WKurBo0JMAf4ymR5J5jHWIjA9yj-xSTXymBYvuKZAb6LHQ_oLSdQ/exec';

export const getEmailConfig = (): EmailConfig => {
  if (typeof window === 'undefined') {
    return {
      provider: 'google_script',
      googleScriptUrl: DEFAULT_GOOGLE_SCRIPT_URL,
      serviceId: '',
      templateId: '',
      publicKey: '',
    };
  }

  // Bersihkan resend key jika ada
  try {
    localStorage.removeItem('simata_resend_api_key');
    localStorage.removeItem('simata_resend_sender');
  } catch (e) {}

  const googleScriptUrl = localStorage.getItem('simata_google_script_url') || DEFAULT_GOOGLE_SCRIPT_URL;
  const serviceId = localStorage.getItem('simata_emailjs_service') || '';
  const templateId = localStorage.getItem('simata_emailjs_template') || '';
  const publicKey = localStorage.getItem('simata_emailjs_key') || '';
  const provider = (localStorage.getItem('simata_email_provider') as any) || 'google_script';

  return {
    provider: provider === 'emailjs' ? 'emailjs' : 'google_script',
    googleScriptUrl,
    serviceId,
    templateId,
    publicKey,
  };
};

export const saveEmailConfig = (cfg: EmailConfig): void => {
  localStorage.setItem('simata_email_provider', cfg.provider);
  localStorage.setItem('simata_google_script_url', cfg.googleScriptUrl.trim());
  localStorage.setItem('simata_emailjs_service', cfg.serviceId.trim());
  localStorage.setItem('simata_emailjs_template', cfg.templateId.trim());
  localStorage.setItem('simata_emailjs_key', cfg.publicKey.trim());
};

export const isEmailConfigured = (): boolean => {
  const cfg = getEmailConfig();
  if (cfg.googleScriptUrl && cfg.googleScriptUrl.startsWith('https://script.google.com/')) return true;
  if (cfg.serviceId && cfg.templateId && cfg.publicKey) return true;
  return false;
};

/**
 * Kirim via Google Apps Script (Direct Gmail)
 */
export const sendViaGoogleScript = async (visitor: Visitor, passUrl: string, scriptUrl: string): Promise<boolean> => {
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(passUrl)}`;
  const payload = {
    to_email: visitor.email || '',
    to_name: visitor.visitorName,
    visitor_id: visitor.id,
    company: visitor.company,
    visited: visitor.visited,
    schedule: visitor.schedule,
    purpose: visitor.purpose,
    pass_url: passUrl,
    qr_image_url: qrImageUrl,
    from_name: 'SIMATA PLN UIK TJB',
  };

  try {
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (err) {
    console.error('[Google Apps Script] Gagal kirim email:', err);
    return false;
  }
};

/**
 * Kirim via EmailJS
 */
export const sendViaEmailJs = async (visitor: Visitor, passUrl: string, cfg: EmailConfig): Promise<boolean> => {
  if (!cfg.serviceId || !cfg.templateId || !cfg.publicKey) return false;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(passUrl)}`;

  try {
    await emailjs.send(
      cfg.serviceId,
      cfg.templateId,
      {
        to_email: visitor.email || '',
        to_name: visitor.visitorName,
        visitor_id: visitor.id,
        company: visitor.company,
        visited: visitor.visited,
        schedule: visitor.schedule,
        purpose: visitor.purpose,
        pass_url: passUrl,
        qr_image_url: qrImageUrl,
        from_name: 'SIMATA PLN UIK TJB',
      },
      cfg.publicKey
    );
    return true;
  } catch (err: any) {
    console.error('[EmailJS] Gagal kirim email:', err?.text || err);
    return false;
  }
};

/**
 * Generate Direct WhatsApp Pass Link
 */
export const generateWhatsAppPassUrl = (visitor: Visitor, passUrl: string): string => {
  let phone = (visitor.phone || '').replace(/\D/g, '');
  if (phone.startsWith('0')) {
    phone = '62' + phone.substring(1);
  } else if (phone.startsWith('8')) {
    phone = '62' + phone;
  }

  const message = 
`⚡ *SIMATA PLN UIK TANJUNG JATI B*
_Sistem Informasi Manajemen Akses & Tamu_

Halo Bapak/Ibu *${visitor.visitorName}* (${visitor.company || '-'}),

Permohonan janji temu / kunjungan Anda telah *DISETUJUI* oleh Tim Sekretariat PLN.

📋 *Detail Kunjungan:*
• *No. Registrasi:* ${visitor.id}
• *Tujuan Bertemu:* ${visitor.visited}
• *Jadwal Rencana:* ${visitor.schedule}
• *Keperluan:* ${visitor.purpose}

🎫 *Kartu Barcode QR Pass Digital Anda:*
${passUrl}

_Harap tunjukkan link Barcode QR Pass di atas kepada petugas Pos Keamanan saat tiba di lokasi PLN UIK Tanjung Jati B._
Terima kasih.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

/**
 * Pre-warm Google Apps Script container in the background to prevent cold-start latency
 */
export const prewarmGoogleScript = (): void => {
  const cfg = getEmailConfig();
  if (cfg.googleScriptUrl && cfg.googleScriptUrl.startsWith('https://script.google.com/')) {
    try {
      fetch(cfg.googleScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ping: true }),
      }).catch(() => {});
    } catch (e) {}
  }
};

/**
 * Start periodic prewarm timer (every 4 minutes)
 */
export const startPeriodicPrewarm = (intervalMs = 4 * 60 * 1000): (() => void) => {
  prewarmGoogleScript();
  const timer = setInterval(() => {
    prewarmGoogleScript();
  }, intervalMs);
  return () => clearInterval(timer);
};

/**
 * Kirim email persetujuan janji temu beserta QR Pass link ke tamu.
 */
export const sendApprovalEmail = async (visitor: Visitor, passUrl: string): Promise<boolean> => {
  const cfg = getEmailConfig();

  // 1. Prioritas Utama: Google Apps Script Webhook (Direct Gmail)
  if (cfg.provider === 'google_script' || !cfg.serviceId) {
    const scriptUrl = cfg.googleScriptUrl || DEFAULT_GOOGLE_SCRIPT_URL;
    return sendViaGoogleScript(visitor, passUrl, scriptUrl);
  }

  // 2. EmailJS SDK jika dipilih
  if (cfg.provider === 'emailjs' && cfg.serviceId && cfg.templateId && cfg.publicKey) {
    return sendViaEmailJs(visitor, passUrl, cfg);
  }

  return sendViaGoogleScript(visitor, passUrl, DEFAULT_GOOGLE_SCRIPT_URL);
};
