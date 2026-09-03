/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * User management stored in localStorage.
 * ponytail: simple btoa hash — good enough for internal app, not for public auth.
 */

import { Stakeholder, UserRole } from '../types';

export interface AppUser {
  username: string;
  passwordHash: string;
  role: UserRole;
  stakeholder: Stakeholder | 'ALL';
  displayName: string;
}

const STORAGE_KEY = 'simata_users';

/** Simple non-crypto hash — enough to not store plaintext */
const hashPassword = (pw: string): string => btoa(unescape(encodeURIComponent(pw)));

export const DEFAULT_USERS: AppUser[] = [
  { username: 'admin', passwordHash: hashPassword('admintjb123'), role: 'SUPERADMIN', stakeholder: 'ALL', displayName: 'Sekretariat PLN (Superadmin)' },
  { username: 'security', passwordHash: hashPassword('securitytjb123'), role: 'MAINGATE_SECURITY', stakeholder: 'ALL', displayName: 'Petugas Security Main Gate' },
  { username: 'sec.maingate', passwordHash: hashPassword('maingate123'), role: 'MAINGATE_SECURITY', stakeholder: 'ALL', displayName: 'Petugas Main Gate PLN' },
  { username: 'sec.kpjb', passwordHash: hashPassword('kpjbgate123'), role: 'POS2_SECURITY', stakeholder: 'KPJB', displayName: 'Security Second Gate KPJB' },
  { username: 'sec.total8', passwordHash: hashPassword('total8gate123'), role: 'POS2_SECURITY', stakeholder: 'AGP', displayName: 'Security Pos Total 8 AGP' },
  { username: 'recep.pln', passwordHash: hashPassword('plnlobby123'), role: 'RECEPTIONIST', stakeholder: 'PLN', displayName: 'Receptionist PLN' },
  { username: 'recep.kpjb', passwordHash: hashPassword('kpjblobby123'), role: 'RECEPTIONIST', stakeholder: 'KPJB', displayName: 'Receptionist KPJB' },
  { username: 'recep.tjbps', passwordHash: hashPassword('tjbpslobby123'), role: 'RECEPTIONIST', stakeholder: 'TJBPS', displayName: 'Receptionist TJBPS' },
  { username: 'recep.agp', passwordHash: hashPassword('agplobby123'), role: 'RECEPTIONIST', stakeholder: 'AGP', displayName: 'Receptionist AGP' },
];

export const loadUsers = (): AppUser[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let mutated = false;

        // Migrasi data lama ke schema multi-stakeholder baru
        const updatedUsers = parsed.map((u: any) => {
          let updated = { ...u };
          if (!updated.stakeholder) {
            mutated = true;
            updated.stakeholder = 'ALL';
          }
          if (updated.role === 'SEKRETARIAT') {
            updated.role = 'SUPERADMIN';
            mutated = true;
          }
          if (updated.role === 'SECURITY' && updated.username.toLowerCase().includes('sec')) {
            updated.role = 'MAINGATE_SECURITY';
            mutated = true;
          }
          return updated as AppUser;
        });

        // Pastikan default multi-stakeholder accounts tersedia jika belum ada
        DEFAULT_USERS.forEach((defUser) => {
          if (!updatedUsers.some((u: AppUser) => u.username.toLowerCase() === defUser.username.toLowerCase())) {
            updatedUsers.push(defUser);
            mutated = true;
          }
        });

        if (mutated) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUsers));
        }
        return updatedUsers;
      }
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

export const addUser = (
  username: string, 
  password: string, 
  role: AppUser['role'], 
  displayName: string,
  stakeholder: AppUser['stakeholder'] = 'ALL'
): string | null => {
  const users = loadUsers();
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return 'Username sudah digunakan.';
  }
  if (username.trim().length < 3) return 'Username minimal 3 karakter.';
  if (password.length < 4) return 'Password minimal 4 karakter.';
  users.push({ 
    username: username.trim(), 
    passwordHash: hashPassword(password), 
    role, 
    stakeholder,
    displayName: displayName.trim() || username 
  });
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
    if (operator && operator.role !== 'SUPERADMIN' && target.role === 'SUPERADMIN') {
      return 'Hanya Superadmin yang memiliki izin untuk menghapus akun Administrator!';
    }
  }

  const filtered = users.filter(u => u.username.toLowerCase() !== targetUsername.toLowerCase());
  saveUsers(filtered);
  return null;
};
