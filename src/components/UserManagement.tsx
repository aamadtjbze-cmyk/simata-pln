/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserPlus, KeyRound, Trash2, ShieldCheck, User, X, Eye, EyeOff } from 'lucide-react';
import { AppUser, loadUsers, addUser, changePassword, deleteUser } from '../lib/userManager';

interface UserManagementProps {
  currentUsername: string;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'danger') => void;
}

type Mode = 'list' | 'add' | 'changePassword';

export default function UserManagement({ currentUsername, triggerToast }: UserManagementProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [mode, setMode] = useState<Mode>('list');

  // Add user form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'SEKRETARIAT' | 'SECURITY'>('SEKRETARIAT');
  const [newDisplayName, setNewDisplayName] = useState('');

  // Change password form
  const [targetUsername, setTargetUsername] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  const refresh = () => setUsers(loadUsers());

  useEffect(() => { refresh(); }, []);

  const resetForms = () => {
    setNewUsername(''); setNewPassword(''); setNewDisplayName('');
    setTargetUsername(''); setNewPw(''); setShowPw(false);
    setMode('list');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const err = addUser(newUsername, newPassword, newRole, newDisplayName);
    if (err) { triggerToast(err, 'danger'); return; }
    triggerToast(`User "${newUsername}" berhasil ditambahkan.`, 'success');
    refresh(); resetForms();
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const err = changePassword(targetUsername, newPw);
    if (err) { triggerToast(err, 'danger'); return; }
    triggerToast(`Password user "${targetUsername}" berhasil diubah.`, 'success');
    refresh(); resetForms();
  };

  const currentUser = users.find(u => u.username.toLowerCase() === currentUsername.toLowerCase());

  const handleDelete = (targetUser: AppUser) => {
    if (targetUser.username.toLowerCase() === currentUsername.toLowerCase()) {
      triggerToast('Tidak bisa menghapus akun yang sedang aktif.', 'danger');
      return;
    }
    if (targetUser.username.toLowerCase() === 'admin') {
      triggerToast('Akun Admin Utama (admin) terlindungi & tidak dapat dihapus!', 'danger');
      return;
    }
    if (currentUser?.role === 'SECURITY' && targetUser.role === 'SEKRETARIAT') {
      triggerToast('Role Security tidak diizinkan untuk menghapus akun Admin Sekretariat!', 'danger');
      return;
    }
    if (!confirm(`Hapus user "${targetUser.username}" (${targetUser.displayName})?`)) return;
    const err = deleteUser(targetUser.username, currentUsername);
    if (err) { triggerToast(err, 'danger'); return; }
    triggerToast(`User "${targetUser.username}" berhasil dihapus.`, 'danger');
    refresh();
  };

  const inputClass = 'w-full px-3 py-2 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#005DA6]';
  const labelClass = 'block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-wider text-[#005DA6] dark:text-[#FFD500] flex items-center gap-2">
          <User size={16} /> Manajemen User Admin
        </h2>
        <div className="flex gap-2">
          {mode !== 'list' && (
            <button onClick={resetForms} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
              <X size={11} /> Batal
            </button>
          )}
          {mode === 'list' && (
            <>
              <button
                onClick={() => setMode('add')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase bg-[#005DA6] hover:bg-[#004070] text-white border-b-2 border-[#FFD500] cursor-pointer"
              >
                <UserPlus size={12} /> Tambah User
              </button>
              <button
                onClick={() => setMode('changePassword')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase bg-amber-500 hover:bg-amber-600 text-slate-900 border-b-2 border-slate-700 cursor-pointer"
              >
                <KeyRound size={12} /> Ganti Password
              </button>
            </>
          )}
        </div>
      </div>

      {/* Daftar User */}
      {mode === 'list' && (
        <div className="border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-[#005DA6] text-white">
              <tr>
                <th className="px-3 py-2 text-left font-black uppercase tracking-wide">Username</th>
                <th className="px-3 py-2 text-left font-black uppercase tracking-wide">Nama</th>
                <th className="px-3 py-2 text-left font-black uppercase tracking-wide">Role</th>
                <th className="px-3 py-2 text-center font-black uppercase tracking-wide">Hapus</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const isSelf = u.username.toLowerCase() === currentUsername.toLowerCase();
                const isMainAdmin = u.username.toLowerCase() === 'admin';
                const isSecurityDeletingSekretariat = currentUser?.role === 'SECURITY' && u.role === 'SEKRETARIAT';
                const isDisabled = isSelf || isMainAdmin || isSecurityDeletingSekretariat;
                
                let tooltip = "Hapus user";
                if (isSelf) tooltip = "Tidak dapat menghapus akun Anda sendiri";
                else if (isMainAdmin) tooltip = "Akun Admin Utama (admin) terlindungi";
                else if (isSecurityDeletingSekretariat) tooltip = "Role Security tidak dapat menghapus akun Admin Sekretariat";

                return (
                  <tr key={u.username} className={i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50'}>
                    <td className="px-3 py-2.5 font-mono font-bold">
                      {u.username}
                      {isSelf && (
                        <span className="ml-2 text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 px-1.5 py-0.5 font-black uppercase">Aktif</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">{u.displayName}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase ${
                        u.role === 'SEKRETARIAT'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                      }`}>
                        <ShieldCheck size={9} />
                        {u.role === 'SEKRETARIAT' ? 'Sekretariat' : 'Security'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={isDisabled}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title={tooltip}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Tambah User */}
      {mode === 'add' && (
        <form onSubmit={handleAdd} className="border border-[#005DA6]/30 p-4 space-y-3 bg-sky-50/50 dark:bg-sky-950/20">
          <p className="text-xs font-black uppercase text-[#005DA6] dark:text-[#FFD500] flex items-center gap-1.5">
            <UserPlus size={13} /> Tambah User Baru
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Username</label>
              <input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="cth: budi.santoso" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nama Tampil</label>
              <input value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} placeholder="cth: Budi Santoso" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 4 karakter" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value as any)} className={inputClass}>
                <option value="SEKRETARIAT">Sekretariat PLN</option>
                <option value="SECURITY">Pos Security</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#005DA6] hover:bg-[#004070] text-white font-black text-xs uppercase tracking-wider border-b-2 border-[#FFD500] cursor-pointer flex items-center justify-center gap-2">
            <UserPlus size={14} /> Simpan User Baru
          </button>
        </form>
      )}

      {/* Form Ganti Password */}
      {mode === 'changePassword' && (
        <form onSubmit={handleChangePassword} className="border border-amber-400/40 p-4 space-y-3 bg-amber-50/50 dark:bg-amber-950/20">
          <p className="text-xs font-black uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <KeyRound size={13} /> Ganti Password User
          </p>
          <div>
            <label className={labelClass}>Pilih Username</label>
            <select value={targetUsername} onChange={e => setTargetUsername(e.target.value)} required className={inputClass}>
              <option value="">-- Pilih user --</option>
              {users.map(u => (
                <option key={u.username} value={u.username}>{u.username} ({u.displayName})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Password Baru</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Min. 4 karakter"
                required
                className={`${inputClass} pr-10`}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs uppercase tracking-wider border-b-2 border-slate-700 cursor-pointer flex items-center justify-center gap-2">
            <KeyRound size={14} /> Simpan Password Baru
          </button>
        </form>
      )}
    </div>
  );
}
