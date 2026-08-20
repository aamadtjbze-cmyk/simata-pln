/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, User, KeyRound, ShieldAlert, LogIn, X } from 'lucide-react';
import PLNLogo from './PLNLogo';
import { verifyUser } from '../lib/userManager';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (roleName: string, username: string) => void;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'danger') => void;
}

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess, triggerToast }: AdminLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const user = verifyUser(username, password);
    if (user) {
      triggerToast(`Login Berhasil! Selamat datang, ${user.displayName}.`, 'success');
      onLoginSuccess(user.displayName, user.username);
      onClose();
    } else {
      setErrorMsg('Username atau kata sandi tidak valid.');
      triggerToast('Login gagal! Periksa username & kata sandi Anda.', 'danger');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in font-sans">
      <div className="premium-glass max-w-md w-full shadow-2xl overflow-hidden border-2 border-[#005DA6] rounded-none">
        
        {/* Modal Header */}
        <div className="bg-[#005DA6] border-b-2 border-[#FFD500] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PLNLogo className="w-8 h-8" />
            <div>
              <span className="text-[10px] font-mono font-bold text-[#FFD500] uppercase tracking-widest block">
                SIMATA v2 PLN UIK TANJUNG JATI B
              </span>
              <h3 className="text-base font-black uppercase tracking-tight font-display">
                Portal Otentikasi Admin & Security
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleLogin} className="p-6 space-y-4 text-xs text-slate-800 dark:text-slate-200">
          
          <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 p-3 rounded-none flex items-start gap-2.5">
            <Lock size={18} className="text-[#005DA6] dark:text-[#FFD500] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                Hak Akses Khusus Petugas Internal
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Silahkan login untuk membuka dashboard Buku Tamu Aktif, Pengelolaan Janji Temu, dan Laporan.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-2">
              <ShieldAlert size={16} />
              <span>{errorMsg}</span>
            </div>
          )}


          <div>
            <label className="block text-xs font-semibold mb-1">
              Username Admin
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Kata Sandi / Password
            </label>
            <div className="relative">
              <KeyRound size={15} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
              />
            </div>
          </div>


          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="submit"
              className="w-full py-3 bg-[#005DA6] hover:bg-[#004070] text-white font-black text-xs uppercase tracking-wider border-b-2 border-r-2 border-[#FFD500] cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              Masuk Sistem Admin SIMATA
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
