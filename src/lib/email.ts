/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SIMATA PLN Email Gateway:
 * 1. Google Apps Script Webhook (Direct Gmail, 500-2000 email/hari gratis tanpa limitasi)
 * 2. EmailJS SDK (Gmail, Outlook PLN, Custom SMTP)
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
    return { provider: 'google_script', googleScriptUrl: DEFAULT_GOOGLE_SCRIPT_URL, serviceId: '', templateId: '', publicKey: '' };
  }
  const googleScriptUrl = localStorage.getItem('simata_google_script_url') || DEFAULT_GOOGLE_SCRIPT_URL;
  const serviceId = localStorage.getItem('simata_emailjs_service') || '';
  const templateId = localStorage.getItem('simata_emailjs_template') || '';
  const publicKey = localStorage.getItem('simata_emailjs_key') || '';
  const provider = (localStorage.getItem('simata_email_provider') as any) || 'google_script';

  return {
    provider,
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
  if (cfg.provider === 'google_script' && cfg.googleScriptUrl.startsWith('https://script.google.com/')) {
    return true;
  }
  if (cfg.provider === 'emailjs' && cfg.serviceId && cfg.templateId && cfg.publicKey) {
    return true;
  }
  return Boolean(cfg.googleScriptUrl || (cfg.serviceId && cfg.templateId && cfg.publicKey));
};

/**
 * Kirim via Google Apps Script (Direct Gmail)
 */
const sendViaGoogleScript = async (visitor: Visitor, passUrl: string, scriptUrl: string): Promise<boolean> => {
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
 * Kirim email persetujuan janji temu beserta QR Pass link ke tamu.
 */
export const sendApprovalEmail = async (visitor: Visitor, passUrl: string): Promise<boolean> => {
  const cfg = getEmailConfig();

  // 1. Coba Google Apps Script jika tersedia (Direct Gmail)
  if (cfg.googleScriptUrl && cfg.googleScriptUrl.startsWith('https://script.google.com/')) {
    return sendViaGoogleScript(visitor, passUrl, cfg.googleScriptUrl);
  }

  // 2. Fallback ke EmailJS jika dikonfigurasi
  if (cfg.serviceId && cfg.templateId && cfg.publicKey) {
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
  }

  return false;
};
