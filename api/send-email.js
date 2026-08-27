/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SIMATA PLN - Secure Serverless Email Relay (Brevo Transactional API)
 * Runs safely on Vercel Serverless Functions to keep API keys hidden from public client.
 */

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

    // Resolve API key from Vercel Environment Variables or custom request
    const apiKey = customKey || process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY;
    const senderEmail = customSender || process.env.BREVO_SENDER || 'aamadtjbze@gmail.com';

    if (!apiKey) {
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

    const payload = {
      sender: { name: 'SIMATA PLN UIK TJB', email: senderEmail },
      to: [{ email: visitor.email, name: visitor.visitorName || 'Tamu PLN' }],
      subject: `[SIMATA PLN] Persetujuan Janji Temu & QR Pass - ${visitor.visitorName || ''}`,
      htmlContent: htmlContent || defaultHtml,
    };

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await brevoResponse.json();

    if (!brevoResponse.ok) {
      console.error('[Brevo Serverless Error]:', result);
      return res.status(brevoResponse.status).json({ error: result.message || 'Failed to send email via Brevo', details: result });
    }

    return res.status(200).json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('[Serverless Handler Error]:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
