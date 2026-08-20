/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * User management stored in localStorage.
 * ponytail: simple btoa hash — good enough for internal app, not for public auth.
 */

export interface AppUser {
  username: string;
  passwordHash: string;
  role: 'SEKRETARIAT' | 'SECURITY';
  displayName: string;
}

const STORAGE_KEY = 'simata_users';

/** Simple non-crypto hash — enough to not store plaintext */
const hashPassword = (pw: string): string => btoa(unescape(encodeURIComponent(pw)));

const DEFAULT_USERS: AppUser[] = [
  { username: 'admin', passwordHash: hashPassword('admin'), role: 'SEKRETARIAT', displayName: 'Sekretariat PLN' },
  { username: 'security', passwordHash: hashPassword('security'), role: 'SECURITY', displayName: 'Petugas Security' },
];

export const loadUsers = (): AppUser[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  // First run — seed defaults
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
};

export const saveUsers = (users: AppUser[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

export const verifyUser = (username: string, password: string): AppUser | null => {
  const users = loadUsers();
  const hash = hashPassword(password);
  return users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === hash) ?? null;
};

export const addUser = (username: string, password: string, role: AppUser['role'], displayName: string): string | null => {
  const users = loadUsers();
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return 'Username sudah digunakan.';
  }
  if (username.trim().length < 3) return 'Username minimal 3 karakter.';
  if (password.length < 4) return 'Password minimal 4 karakter.';
  users.push({ username: username.trim(), passwordHash: hashPassword(password), role, displayName: displayName.trim() || username });
  saveUsers(users);
  return null; // null = success
};

export const changePassword = (username: string, newPassword: string): string | null => {
  const users = loadUsers();
  const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (idx === -1) return 'User tidak ditemukan.';
  if (newPassword.length < 4) return 'Password minimal 4 karakter.';
  users[idx].passwordHash = hashPassword(newPassword);
  saveUsers(users);
  return null;
};

export const deleteUser = (targetUsername: string, operatorUsername?: string): string | null => {
  const users = loadUsers();
  if (users.length <= 1) return 'Tidak boleh menghapus user terakhir.';

  const target = users.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
  if (!target) return 'User tidak ditemukan.';

  if (target.username.toLowerCase() === 'admin') {
    return 'Akun Admin Utama (admin) tidak dapat dihapus.';
  }

  if (operatorUsername) {
    const operator = users.find(u => u.username.toLowerCase() === operatorUsername.toLowerCase());
    if (operator && operator.role === 'SECURITY' && target.role === 'SEKRETARIAT') {
      return 'Role Security tidak memiliki izin untuk menghapus akun Admin Sekretariat!';
    }
  }

  const filtered = users.filter(u => u.username.toLowerCase() !== targetUsername.toLowerCase());
  saveUsers(filtered);
  return null;
};
