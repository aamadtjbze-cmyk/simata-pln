/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SIMATA PLN - Admin User Management (Vercel Serverless Function)
 *
 * Creates/lists/updates/deletes Supabase Auth users on behalf of the app.
 * Requires SUPABASE_SERVICE_ROLE_KEY, which stays server-side only — never
 * sent to the browser. Every request must carry the caller's own Supabase
 * session token (Authorization: Bearer <access_token>); the caller's role
 * is read from THAT verified token, never trusted from the request body.
 */

import { createClient } from '@supabase/supabase-js';

const AUTH_EMAIL_DOMAIN = 'simata.internal';

const toAuthEmail = (username) =>
  `${String(username || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')}@${AUTH_EMAIL_DOMAIN}`;

function getAdminClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function requireSuperadmin(req, admin) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { error: 'Tidak ada token otentikasi.', status: 401 };

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return { error: 'Sesi tidak valid atau kedaluwarsa.', status: 401 };

  const role = data.user.user_metadata?.role;
  if (role !== 'SUPERADMIN') {
    return { error: 'Hanya Superadmin yang memiliki akses ke manajemen user.', status: 403 };
  }
  return { caller: data.user };
}

function mapUser(u) {
  const meta = u.user_metadata || {};
  return {
    id: u.id,
    username: meta.username || (u.email || '').split('@')[0],
    role: meta.role || 'RECEPTIONIST',
    stakeholder: meta.stakeholder || 'ALL',
    displayName: meta.displayName || meta.username || u.email,
  };
}

async function findUserByUsername(admin, username) {
  const email = toAuthEmail(username);
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => (u.email || '').toLowerCase() === email);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const admin = getAdminClient();
  if (!admin) {
    return res.status(500).json({ error: 'Server belum dikonfigurasi (SUPABASE_SERVICE_ROLE_KEY belum diset).' });
  }

  const auth = await requireSuperadmin(req, admin);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw error;
      const users = data.users
        .filter((u) => (u.email || '').endsWith(`@${AUTH_EMAIL_DOMAIN}`))
        .map(mapUser)
        .sort((a, b) => a.username.localeCompare(b.username));
      return res.status(200).json({ users });
    }

    if (req.method === 'POST') {
      const { username, password, role, displayName, stakeholder } = req.body || {};
      if (!username || String(username).trim().length < 3) {
        return res.status(400).json({ error: 'Username minimal 3 karakter.' });
      }
      if (!password || String(password).length < 6) {
        return res.status(400).json({ error: 'Password minimal 6 karakter.' });
      }
      const existing = await findUserByUsername(admin, username);
      if (existing) {
        return res.status(400).json({ error: 'Username sudah digunakan.' });
      }

      const { error } = await admin.auth.admin.createUser({
        email: toAuthEmail(username),
        password,
        email_confirm: true,
        user_metadata: {
          username: String(username).trim(),
          role: role || 'RECEPTIONIST',
          stakeholder: stakeholder || 'ALL',
          displayName: (displayName && String(displayName).trim()) || String(username).trim(),
        },
      });
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'PATCH') {
      const { username, newPassword } = req.body || {};
      if (!newPassword || String(newPassword).length < 6) {
        return res.status(400).json({ error: 'Password minimal 6 karakter.' });
      }
      const target = await findUserByUsername(admin, username);
      if (!target) return res.status(404).json({ error: 'User tidak ditemukan.' });

      const { error } = await admin.auth.admin.updateUserById(target.id, { password: newPassword });
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { username } = req.body || {};
      if (!username) return res.status(400).json({ error: 'Username wajib diisi.' });
      if (String(username).toLowerCase() === 'admin') {
        return res.status(400).json({ error: 'Akun Admin Utama (admin) tidak dapat dihapus.' });
      }
      const callerUsername = (auth.caller.user_metadata?.username || '').toLowerCase();
      if (String(username).toLowerCase() === callerUsername) {
        return res.status(400).json({ error: 'Tidak bisa menghapus akun yang sedang aktif.' });
      }

      const target = await findUserByUsername(admin, username);
      if (!target) return res.status(404).json({ error: 'User tidak ditemukan.' });

      const { error } = await admin.auth.admin.deleteUser(target.id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[admin-users] error:', err);
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan server.' });
  }
}
