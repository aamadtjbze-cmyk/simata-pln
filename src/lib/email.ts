/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SIMATA PLN Email & WhatsApp Gateway:
 * 1. Google Apps Script Webhook (Direct Gmail, 500-2000 email/hari)
 * 2. Brevo API (Sendinblue, 300 email/hari gratis, tanpa wajib custom domain)
 * 3. EmailJS SDK (Gmail, Outlook PLN, Custom SMTP)
 * 4. WhatsApp Direct Pass Link (1-Click Open in WA)
 */

import emailjs from '@emailjs/browser';
import { Visitor } from '../types';

export interface EmailConfig {
  provider: 'google_script' | 'brevo' | 'emailjs' | 'hybrid';
  googleScriptUrl: string;
  brevoApiKey: string;
  brevoSender: string;
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export const DEFAULT_GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwEcxTci7nMH5JuJ8WKurBo0JMAf4ymR5J5jHWIjA9yj-xSTXymBYvuKZAb6LHQ_oLSdQ/exec';
export const DEFAULT_BREVO_SENDER = 'aamadtjbze@gmail.com';
export const DEFAULT_BREVO_API_KEY = '';

export const getEmailConfig = (): EmailConfig => {
  if (typeof window === 'undefined') {
    return {
      provider: 'brevo',
      googleScriptUrl: DEFAULT_GOOGLE_SCRIPT_URL,
      brevoApiKey: '',
      brevoSender: DEFAULT_BREVO_SENDER,
      serviceId: '',
      templateId: '',
      publicKey: '',
    };
  }

  const googleScriptUrl = localStorage.getItem('simata_google_script_url') || DEFAULT_GOOGLE_SCRIPT_URL;
  const brevoApiKey = localStorage.getItem('simata_brevo_api_key') || '';
  const brevoSender = localStorage.getItem('simata_brevo_sender') || DEFAULT_BREVO_SENDER;
  const serviceId = localStorage.getItem('simata_emailjs_service') || '';
  const templateId = localStorage.getItem('simata_emailjs_template') || '';
  const publicKey = localStorage.getItem('simata_emailjs_key') || '';
  const provider = (localStorage.getItem('simata_email_provider') as any) || 'brevo';

  return {
    provider,
    googleScriptUrl,
    brevoApiKey,
    brevoSender,
    serviceId,
    templateId,
    publicKey,
  };
};

export const saveEmailConfig = (cfg: EmailConfig): void => {
  localStorage.setItem('simata_email_provider', cfg.provider);
  localStorage.setItem('simata_google_script_url', cfg.googleScriptUrl.trim());
  localStorage.setItem('simata_brevo_api_key', cfg.brevoApiKey.trim());
  localStorage.setItem('simata_brevo_sender', cfg.brevoSender.trim());
  localStorage.setItem('simata_emailjs_service', cfg.serviceId.trim());
  localStorage.setItem('simata_emailjs_template', cfg.templateId.trim());
  localStorage.setItem('simata_emailjs_key', cfg.publicKey.trim());
};

export const isEmailConfigured = (): boolean => {
  return true;
};

/**
 * HTML Email Template
 */
export const buildPassEmailHtml = (visitor: Visitor, passUrl: string, qrImageUrl: string): string => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Persetujuan Janji Temu SIMATA PLN</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 2px solid #005DA6;">
      <div style="background-color: #005DA6; border-bottom: 3px solid #FFD500; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; text-transform: uppercase;">SIMATA PLN UIK TANJUNG JATI B</h1>
        <p style="color: #FFD500; margin: 5px 0 0 0; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">Surat Izin Masuk & Kartu Digital Tamu</p>
      </div>
      <div style="padding: 24px;">
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 16px; margin-bottom: 20px;">
          <p style="color: #166534; font-weight: bold; margin: 0; font-size: 14px;">✅ PERMOHONAN KUNJUNGAN TELAH DISETUJUI</p>
        </div>
        <p style="font-size: 14px; line-height: 1.5;">Halo <strong>${visitor.visitorName}</strong>,</p>
        <p style="font-size: 13px; line-height: 1.5; color: #475569;">Permohonan janji temu / kunjungan Anda ke PT PLN (Persero) UIK Tanjung Jati B telah <strong>DISETUJUI</strong> oleh Tim Sekretariat.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b; width: 40%;">No. Registrasi:</td><td style="padding: 8px 0; font-weight: bold; font-family: monospace; color: #005DA6;">${visitor.id}</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Instansi / Perusahaan:</td><td style="padding: 8px 0; font-weight: bold;">${visitor.company || '-'}</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Bertemu Bagian:</td><td style="padding: 8px 0; font-weight: bold; color: #005DA6;">${visitor.visited}</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Rencana Kunjungan:</td><td style="padding: 8px 0; font-weight: bold;">${visitor.schedule}</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Keperluan:</td><td style="padding: 8px 0;">${visitor.purpose}</td></tr>
        </table>

        <div style="text-align: center; margin: 24px 0; padding: 20px; background-color: #f8fafc; border: 2px dashed #005DA6;">
          <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #005DA6;">Barcode QR Pass Digital Anda</p>
          <img src="${qrImageUrl}" alt="Barcode QR Pass" style="width: 200px; height: 200px; border: 3px solid #005DA6; display: inline-block;" />
          <div style="margin-top: 16px;">
            <a href="${passUrl}" style="background-color: #005DA6; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; font-size: 13px; text-transform: uppercase; border-bottom: 3px solid #FFD500; display: inline-block;">
              LIHAT & SIMPAN BARCODE QR PASS
            </a>
          </div>
        </div>

        <p style="font-size: 11px; color: #64748b; line-height: 1.4;">
          * Harap tunjukkan tautan Barcode QR Pass ini kepada petugas Pos Keamanan saat tiba di lokasi PT PLN UIK Tanjung Jati B.
        </p>
      </div>
      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 12px 20px; text-align: center; font-size: 10px; color: #94a3b8;">
        © 2026 PT PLN (Persero) UIK Tanjung Jati B. Sistem Informasi Manajemen Akses & Tamu (SIMATA).
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * 1. Kirim via Google Apps Script (Direct Gmail)
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
 * 2. Kirim via Brevo REST API (Serverless Relay & Secure Client Fallback)
 */
export const sendViaBrevo = async (visitor: Visitor, passUrl: string, apiKey?: string, senderEmail?: string): Promise<boolean> => {
  if (!visitor.email) return false;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(passUrl)}`;
  const htmlContent = buildPassEmailHtml(visitor, passUrl, qrImageUrl);

  // 1. Coba Serverless Relay (/api/send-email) terlebih dahulu agar API key tetap aman di server Vercel
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor,
        passUrl,
        htmlContent,
        apiKey: apiKey || undefined,
        senderEmail: senderEmail || undefined,
      }),
    });
    if (res.ok) {
      return true;
    }
  } catch (err) {
    // Relay offline / local static
  }

  // 2. Direct client fallback (jika admin memasukkan custom key di Admin Settings)
  if (apiKey) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'SIMATA PLN UIK TJB', email: senderEmail || 'aamadtjbze@gmail.com' },
          to: [{ email: visitor.email, name: visitor.visitorName }],
          subject: `[SIMATA PLN] Persetujuan Janji Temu & QR Pass - ${visitor.visitorName}`,
          htmlContent: htmlContent,
        }),
      });
      return res.ok;
    } catch (err) {
      console.error('[Brevo API Fallback Error]:', err);
    }
  }

  return false;
};

/**
 * 3. Kirim via EmailJS
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
 * Kirim email persetujuan janji temu
 *
 * Prioritas:
 *   1. Brevo (jika API key tersedia) — 300 email/hari, template HTML penuh
 *   2. Google Apps Script (fallback jika Brevo tidak dikonfigurasi)
 *   3. EmailJS (paralel jika dikonfigurasi, sebagai cadangan tambahan)
 *
 * Brevo dan Google Script TIDAK dijalankan bersamaan untuk menghindari email ganda.
 */
export const sendApprovalEmail = async (visitor: Visitor, passUrl: string): Promise<boolean> => {
  const cfg = getEmailConfig();

  // 1. Coba Brevo Relay via Serverless Vercel (atau custom key jika disetel)
  const brevoOk = await sendViaBrevo(visitor, passUrl, cfg.brevoApiKey || undefined, cfg.brevoSender);
  if (brevoOk) {
    if (cfg.serviceId && cfg.templateId && cfg.publicKey) {
      sendViaEmailJs(visitor, passUrl, cfg).catch(() => {});
    }
    return true;
  }

  // 2. Fallback ke Google Apps Script jika Brevo offline / unconfigured
  const scriptUrl = (cfg.googleScriptUrl && cfg.googleScriptUrl.startsWith('https://script.google.com/'))
    ? cfg.googleScriptUrl
    : DEFAULT_GOOGLE_SCRIPT_URL;

  const gsOk = await sendViaGoogleScript(visitor, passUrl, scriptUrl);

  // EmailJS paralel jika tersedia
  if (cfg.serviceId && cfg.templateId && cfg.publicKey) {
    sendViaEmailJs(visitor, passUrl, cfg).catch(() => {});
  }

  return gsOk;
};
