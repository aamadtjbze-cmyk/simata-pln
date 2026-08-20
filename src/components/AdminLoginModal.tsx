/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, User, KeyRound, ShieldAlert, LogIn, CheckCircle, X, ShieldCheck } from 'lucide-react';
import PLNLogo from './PLNLogo';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (roleName: string) => void;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'danger') => void;
}

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess, triggerToast }: AdminLoginModalProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [roleSelection, setRoleSelection] = useState<'SEKRETARIAT' | 'SECURITY'>('SEKRETARIAT');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Demo Authentication verification (admin/admin or pln/admin123)
    if (
      (username.toLowerCase() === 'admin' && password === 'admin') ||
      (username.toLowerCase() === 'pln' && password === 'admin123') ||
      (username.toLowerCase() === 'security' && password === 'security')
    ) {
      triggerToast(`Login Berhasil! Selamat datang, Admin (${roleSelection === 'SEKRETARIAT' ? 'Sekretariat PLN' : 'Petugas Security Unit'}).`, 'success');
      onLoginSuccess(roleSelection === 'SEKRETARIAT' ? 'Sekretariat PLN' : 'Petugas Security');
      onClose();
    } else {
      setErrorMsg('Username atau kata sandi tidak valid. (Gunakan admin / admin)');
      triggerToast('Login gagal! Periksa username & kata sandi Anda.', 'danger');
    }
  };

  const handleQuickLogin = (role: 'SEKRETARIAT' | 'SECURITY') => {
    setRoleSelection(role);
    triggerToast(`Login Berhasil! Selamat datang, Admin (${role === 'SEKRETARIAT' ? 'Sekretariat PLN' : 'Petugas Security Unit'}).`, 'success');
    onLoginSuccess(role === 'SEKRETARIAT' ? 'Sekretariat PLN' : 'Petugas Security');
    onClose();
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
              Pilih Role Petugas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRoleSelection('SEKRETARIAT')}
                className={`py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-none transition-all cursor-pointer border ${
                  roleSelection === 'SEKRETARIAT'
                    ? 'bg-[#005DA6] text-white border-[#005DA6]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Sekretariat PLN
              </button>
              <button
                type="button"
                onClick={() => setRoleSelection('SECURITY')}
                className={`py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-none transition-all cursor-pointer border ${
                  roleSelection === 'SECURITY'
                    ? 'bg-[#005DA6] text-white border-[#005DA6]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Pos Security
              </button>
            </div>
          </div>

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

          {/* Preset Kredensial Uji Coba */}
          <div className="p-2.5 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-[10.5px]">
            <span className="font-bold text-slate-500 uppercase block mb-1">
              💡 Kredensial Login Default:
            </span>
            <div className="flex items-center justify-between font-mono text-slate-700 dark:text-slate-300">
              <span>Username: <strong>admin</strong></span>
              <span>Password: <strong>admin</strong></span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full py-3 bg-[#005DA6] hover:bg-[#004070] text-white font-black text-xs uppercase tracking-wider border-b-2 border-r-2 border-[#FFD500] cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              Masuk Sistem Admin SIMATA
            </button>

            <div className="flex items-center gap-2 my-1">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Atau Akses Cepat</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('SEKRETARIAT')}
                className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10.5px] uppercase tracking-wider rounded-none cursor-pointer flex items-center justify-center gap-1 border-b border-r border-slate-900"
              >
                <ShieldCheck size={13} />
                Demo Sekretariat
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('SECURITY')}
                className="py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white font-black text-[10.5px] uppercase tracking-wider rounded-none cursor-pointer flex items-center justify-center gap-1 border-b border-r border-sky-950"
              >
                <ShieldCheck size={13} />
                Demo Security
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
