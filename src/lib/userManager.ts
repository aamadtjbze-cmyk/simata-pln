/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * User management via Supabase Auth. Login is verified server-side by
 * Supabase's own auth server — no password ever lives in the client bundle
 * or source code. Session state is a real signed JWT persisted by
 * supabase-js, not a spoofable localStorage flag.
 *
 * Usernames map deterministically to Supabase Auth emails
 * (`<username>@simata.internal`) so the login form can stay username-based.
 * Role / stakeholder / display name are stored in Supabase Auth user_metadata.
 *
 * Creating, deleting, and resetting passwords for users requires the
 * service_role key, which must never reach the browser — those operations
 * are delegated to the `/api/admin-users` serverless function.
 */

import { Stakeholder, UserRole } from '../types';
import { getSupabaseClient } from './supabase';

export interface AppUser {
  id: string;
  username: string;
  role: UserRole;
  stakeholder: Stakeholder | 'ALL';
  displayName: string;
}

const AUTH_EMAIL_DOMAIN = 'simata.internal';

export const toAuthEmail = (username: string): string =>
  `${username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')}@${AUTH_EMAIL_DOMAIN}`;

const mapSupabaseUser = (user: any): AppUser => {
  const meta = user?.user_metadata || {};
  return {
    id: user.id,
    username: meta.username || (user.email || '').split('@')[0],
    role: (meta.role as UserRole) || 'RECEPTIONIST',
    stakeholder: meta.stakeholder || 'ALL',
    displayName: meta.displayName || meta.username || user.email,
  };
};

/** Verifikasi login — dijalankan oleh server Supabase, bukan di browser. */
export const verifyUser = async (username: string, password: string): Promise<AppUser | null> => {
  const supabase = getSupabaseClient();
  if (!supabase || !username.trim() || !password) return null;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: toAuthEmail(username),
    password,
  });
  if (error || !data.user) return null;
  return mapSupabaseUser(data.user);
};

/** Pulihkan sesi login yang masih valid (dipanggil sekali saat app dimuat). */
export const restoreSession = async (): Promise<AppUser | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  return mapSupabaseUser(user);
};

export const logoutUser = async (): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.auth.signOut();
};

// ---------------------------------------------------------------------------
// Admin-only user management — didelegasikan ke /api/admin-users
// (butuh service_role key yang hanya boleh ada di server, bukan di browser).
// ---------------------------------------------------------------------------

const callAdminUsersApi = async (method: string, body?: unknown): Promise<any> => {
  const supabase = getSupabaseClient();
  const { data } = (await supabase?.auth.getSession()) || {};
  const token = data?.session?.access_token;
  if (!token) throw new Error('Sesi tidak valid. Silakan login ulang.');

  const res = await fetch('/api/admin-users', {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Permintaan gagal.');
  return json;
};

export const loadUsers = async (): Promise<AppUser[]> => {
  const json = await callAdminUsersApi('GET');
  return json.users || [];
};

export const addUser = async (
  username: string,
  password: string,
  role: UserRole,
  displayName: string,
  stakeholder: Stakeholder | 'ALL' = 'ALL'
): Promise<string | null> => {
  try {
    await callAdminUsersApi('POST', { username, password, role, displayName, stakeholder });
    return null;
  } catch (err: any) {
    return err.message || 'Gagal menambah user.';
  }
};

export const changePassword = async (username: string, newPassword: string): Promise<string | null> => {
  try {
    await callAdminUsersApi('PATCH', { username, newPassword });
    return null;
  } catch (err: any) {
    return err.message || 'Gagal mengubah password.';
  }
};

export const deleteUser = async (targetUsername: string): Promise<string | null> => {
  try {
    await callAdminUsersApi('DELETE', { username: targetUsername });
    return null;
  } catch (err: any) {
    return err.message || 'Gagal menghapus user.';
  }
};
