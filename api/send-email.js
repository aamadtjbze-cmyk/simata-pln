/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SIMATA PLN - Secure Serverless Email Relay (Brevo Transactional API)
 * Runs safely on Vercel Serverless Functions to keep API keys hidden from public client.
 */

// Module-scope counter — persists across warm invocations in the same serverless
// instance, cukup untuk meratakan beban antar akun Brevo (bergantian / round-robin).
let brevoRotation = 0;

function getBrevoAccounts() {
  const accounts = [];
  if (process.env.BREVO_API_KEY) {
    accounts.push({ apiKey: process.env.BREVO_API_KEY, sender: process.env.BREVO_SENDER || 'aamadtjbze@gmail.com' });
  }
  if (process.env.BREVO_API_KEY_2) {
    accounts.push({
      apiKey: process.env.BREVO_API_KEY_2,
      sender: process.env.BREVO_SENDER_2 || process.env.BREVO_SENDER || 'aamadtjbze@gmail.com',
    });
  }
  return accounts;
}

async function sendViaBrevoAccount(account, payloadBase) {
  const payload = { ...payloadBase, sender: { name: 'SIMATA PLN UIK TJB', email: account.sender } };
  const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': account.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const result = await brevoResponse.json().catch(() => ({}));
  return { ok: brevoResponse.ok, status: brevoResponse.status, result };
}

export default async function handler(req, res) {
  // CORS & method guard
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { visitor, passUrl, htmlContent, apiKey: customKey, senderEmail: customSender } = req.body || {};

    if (!visitor || !visitor.email) {
      return res.status(400).json({ error: 'Visitor email is required' });
    }

    // Resolve akun Brevo yang dipakai. Jika client mengirim custom key (override dari
    // Admin Settings), pakai itu saja tanpa rotasi. Kalau tidak, pakai daftar akun dari
    // Environment Variables Vercel dan bergantian antar akun (round-robin + auto-failover
    // ke akun berikutnya kalau satu akun gagal/kena limit harian).
    const accounts = customKey
      ? [{ apiKey: customKey, sender: customSender || process.env.BREVO_SENDER || 'aamadtjbze@gmail.com' }]
      : getBrevoAccounts();

    if (accounts.length === 0) {
      return res.status(500).json({
        error: 'Brevo API Key is not configured on server. Please set BREVO_API_KEY in Vercel Environment Variables.',
      });
    }

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(passUrl || '')}`;

    const defaultHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 2px solid #005DA6; padding: 20px;">
        <h2 style="color: #005DA6; text-transform: uppercase;">SIMATA PLN - Persetujuan Janji Temu</h2>
        <p>Halo <strong>${visitor.visitorName || 'Tamu'}</strong>,</p>
        <p>Permohonan janji temu Anda ke PT PLN (Persero) UIK Tanjung Jati B telah <strong>DISETUJUI</strong>.</p>
        <p><strong>Rencana Kunjungan:</strong> ${visitor.schedule || '-'}</p>
        <p><strong>Bagian / Divisi:</strong> ${visitor.visited || '-'}</p>
        <div style="text-align: center; margin: 20px 0;">
          <img src="${qrImageUrl}" alt="QR Pass" style="width: 180px; height: 180px; border: 1px solid #ddd;" />
          <br/>
          <a href="${passUrl}" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background: #005DA6; color: #ffffff; text-decoration: none; font-weight: bold;">Buka Kartu Akses Tamu Digital</a>
        </div>
      </div>
    `;

    const payloadBase = {
      to: [{ email: visitor.email, name: visitor.visitorName || 'Tamu PLN' }],
      subject: `[SIMATA PLN] Persetujuan Janji Temu & QR Pass - ${visitor.visitorName || ''}`,
      htmlContent: htmlContent || defaultHtml,
    };

    // Mulai dari akun berikutnya sesuai giliran (round-robin), lalu coba akun sisanya
    // secara berurutan jika gagal (mis. kuota harian akun tersebut habis / error lain).
    const startIdx = accounts.length > 1 ? brevoRotation++ % accounts.length : 0;
    let lastError = null;
    let lastStatus = 500;
    const skipped = [];

    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[(startIdx + i) % accounts.length];
      const { ok, status, result } = await sendViaBrevoAccount(account, payloadBase);

      if (ok) {
        return res.status(200).json({
          success: true,
          messageId: result.messageId,
          senderUsed: account.sender,
          skippedAccounts: skipped.length ? skipped : undefined,
        });
      }

      console.warn(`[Brevo Serverless] Gagal kirim via ${account.sender} (status ${status}):`, result);
      skipped.push({ sender: account.sender, status, message: result?.message || result?.code || 'unknown' });
      lastError = result;
      lastStatus = status;
    }

    return res.status(lastStatus).json({
      error: lastError?.message || 'Semua akun Brevo gagal mengirim email',
      details: lastError,
    });
  } catch (error) {
    console.error('[Serverless Handler Error]:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
