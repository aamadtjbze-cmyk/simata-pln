/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * EmailJS integration — kirim email notifikasi langsung dari browser
 * menggunakan akun Gmail/Outlook PLN sebagai pengirim.
 *
 * Konfigurasi disimpan di localStorage agar bisa diset via UI tanpa rebuild.
 * Keys: simata_emailjs_service, simata_emailjs_template, simata_emailjs_key
 */

import emailjs from '@emailjs/browser';
import { Visitor } from '../types';

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export const getEmailConfig = (): EmailConfig => {
  if (typeof window === 'undefined') return { serviceId: '', templateId: '', publicKey: '' };
  return {
    serviceId: localStorage.getItem('simata_emailjs_service') || '',
    templateId: localStorage.getItem('simata_emailjs_template') || '',
    publicKey: localStorage.getItem('simata_emailjs_key') || '',
  };
};

export const saveEmailConfig = (cfg: EmailConfig): void => {
  localStorage.setItem('simata_emailjs_service', cfg.serviceId.trim());
  localStorage.setItem('simata_emailjs_template', cfg.templateId.trim());
  localStorage.setItem('simata_emailjs_key', cfg.publicKey.trim());
};

export const isEmailConfigured = (): boolean => {
  const cfg = getEmailConfig();
  return Boolean(cfg.serviceId && cfg.templateId && cfg.publicKey);
};

/**
 * Kirim email persetujuan janji temu beserta QR Pass link ke tamu.
 * Template EmailJS harus memiliki variabel:
 *   {{to_email}}, {{to_name}}, {{visitor_id}}, {{company}},
 *   {{visited}}, {{schedule}}, {{pass_url}}, {{qr_image_url}}
 */
export const sendApprovalEmail = async (visitor: Visitor, passUrl: string): Promise<boolean> => {
  if (!isEmailConfigured()) return false;

  const cfg = getEmailConfig();
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
