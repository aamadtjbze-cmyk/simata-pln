/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, User, Briefcase, FileText, Lock, Users2, Calendar, Phone, ShieldCheck } from 'lucide-react';
import { Visitor, VisitorStatus } from '../types';
import { COMMON_PURPOSES, PLN_DIVISIONS } from '../data/mockData';

interface CheckInModalProps {
  visitorToEdit?: Visitor | null;
  onSave: (visitor: Visitor) => void;
  onClose: () => void;
  visitorsCount: number;
  lastFormId: string;
}

export default function CheckInModal({
  visitorToEdit,
  onSave,
  onClose,
  visitorsCount,
  lastFormId,
}: CheckInModalProps) {
  const [visitorName, setVisitorName] = useState('');
  const [company, setCompany] = useState('');
  const [purpose, setPurpose] = useState('');
  const [visited, setVisited] = useState('');
  const [mainGatePass, setMainGatePass] = useState('');
  const [secondGatePass, setSecondGatePass] = useState('');
  const [phone, setPhone] = useState('');
  const [identifyNo, setIdentifyNo] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [notes, setNotes] = useState('');
  const [schedule, setSchedule] = useState('');
  const [status, setStatus] = useState<VisitorStatus>('IN-PROGRESS');
  const [registrationMode, setRegistrationMode] = useState<'WALK_IN' | 'PRE_BOOKING'>('WALK_IN');
  const [validityOption, setValidityOption] = useState<'SAME_DAY' | '1_DAY' | '3_DAYS' | '1_WEEK' | 'CUSTOM'>('SAME_DAY');
  const [validUntil, setValidUntil] = useState('');
  const [email, setEmail] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (visitorToEdit) {
      setVisitorName(visitorToEdit.visitorName);
      setCompany(visitorToEdit.company);
      setPurpose(visitorToEdit.purpose);
      setVisited(visitorToEdit.visited);
      setMainGatePass(visitorToEdit.mainGatePass);
      setSecondGatePass(visitorToEdit.secondGatePass);
      setPhone(visitorToEdit.phone || '');
      setEmail(visitorToEdit.email || '');
      setIdentifyNo(visitorToEdit.identifyNo || '');
      setGender(visitorToEdit.gender || 'Laki-laki');
      setNotes(visitorToEdit.notes || '');
      setSchedule(visitorToEdit.schedule);
      setStatus(visitorToEdit.status);
      setValidUntil(visitorToEdit.validUntil || '');
      setValidityOption(visitorToEdit.validityOption || 'SAME_DAY');
      if (visitorToEdit.status === 'SCHEDULED' || visitorToEdit.status === 'PENDING') {
        setRegistrationMode('PRE_BOOKING');
      } else {
        setRegistrationMode('WALK_IN');
      }
    } else {
      // Default dates to current time
      const today = new Date();
      const pad = (num: number) => String(num).padStart(2, '0');
      const day = today.getDate();
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthName = monthNames[today.getMonth()];
      const year = today.getFullYear();
      const hours = pad(today.getHours());
      const mins = pad(today.getMinutes());
      
      setSchedule(`${day} ${monthName} ${year} - ${hours}.${mins}`);
      setValidUntil(`${day} ${monthName} ${year} - 23.59`);
      setValidityOption('SAME_DAY');
      setStatus('IN-PROGRESS');
    }
  }, [visitorToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!visitorName.trim()) newErrors.visitorName = 'Nama tamu harus diisi';
    if (!company.trim()) newErrors.company = 'Nama instansi/perusahaan harus diisi';
    if (!purpose.trim()) newErrors.purpose = 'Tujuan kunjungan harus dipilih/diisi';
    if (!visited.trim()) newErrors.visited = 'Divisi/Pegawai yang dikunjungi harus dipilih/diisi';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Auto generate ID if not editing
    let formId = visitorToEdit?.id;
    if (!formId) {
      const match = lastFormId.match(/(\d+)$/);
      const nextNum = match ? parseInt(match[1]) + 1 : 5009;
      formId = `TJB-VST-${String(nextNum).padStart(6, '0')}`;
    }

    const todayDate = new Date();
    const padDigit = (n: number) => String(n).padStart(2, '0');
    const day = todayDate.getDate();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = monthNames[todayDate.getMonth()];
    const year = todayDate.getFullYear();
    const hours = padDigit(todayDate.getHours());
    const mins = padDigit(todayDate.getMinutes());
    const formattedInTime = `${day} ${month} ${year} - ${hours}.${padDigit(todayDate.getMinutes())}`;

    const visitorData: Visitor = {
      id: formId,
      schedule,
      inTime: visitorToEdit ? visitorToEdit.inTime : (status === 'IN-PROGRESS' ? formattedInTime : null),
      secondGateTime: visitorToEdit ? visitorToEdit.secondGateTime : null,
      outTime: visitorToEdit ? visitorToEdit.outTime : null,
      visitorName: visitorName.toUpperCase(),
      mainGatePass,
      secondGatePass,
      company: company.toUpperCase(),
      purpose,
      visited: visited.toUpperCase(),
      status,
      phone,
      email: email ? email.toLowerCase() : `${visitorName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      identifyNo,
      gender,
      notes,
      validUntil: validUntil || `${day} ${month} ${year} - 23.59`,
      validityOption,
    };

    onSave(visitorData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="premium-glass max-w-2xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-[#005DA6]/25 dark:border-[#FFD500]/25 rounded-none">
        
        {/* Header banner */}
        <div className="bg-[#005DA6] border-b-2 border-[#FFD500] px-4 sm:px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#FFD500] font-sans">
              {visitorToEdit ? 'Ubah Informasi' : 'Registrasi Masuk'}
            </span>
            <h3 className="text-base sm:text-xl font-black tracking-tight mt-0.5 uppercase font-display text-white">
              {visitorToEdit ? 'Ubah Data Kunjungan' : 'Registrasi Tamu Baru (Check-In)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-none text-white transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 max-h-[78vh]">
          {/* Mode Registration Switcher */}
          {!visitorToEdit && (
            <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-none flex items-center gap-2 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setRegistrationMode('WALK_IN');
                  setStatus('IN-PROGRESS');
                }}
                className={`flex-1 py-2 px-3 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded-none cursor-pointer ${
                  registrationMode === 'WALK_IN'
                    ? 'bg-[#005DA6] text-white shadow-xs border-b-2 border-r-2 border-[#FFD500]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                <User size={14} />
                Tamu Langsung (Walk-In / Pos)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegistrationMode('PRE_BOOKING');
                  setStatus('PENDING');
                }}
                className={`flex-1 py-2 px-3 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded-none cursor-pointer ${
                  registrationMode === 'PRE_BOOKING'
                    ? 'bg-[#005DA6] text-[#FFD500] shadow-xs border-b-2 border-r-2 border-[#FFD500]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                <Calendar size={14} />
                Janji Temu / Pre-Booking Sekretariat
              </button>
            </div>
          )}

          {registrationMode === 'PRE_BOOKING' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
              <Calendar className="text-amber-600 shrink-0" size={16} />
              <span>
                <strong>Mode Janji Temu / Pre-Booking:</strong> Data akan didaftarkan dengan status <strong>PENDING / SCHEDULED</strong>. Sekretariat/Admin divisi dapat menyetujui jadwal sebelum tamu tiba.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Identity Group */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                <User size={13} />
                Identitas Tamu
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Tamu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => {
                    setVisitorName(e.target.value);
                    if (errors.visitorName) setErrors({ ...errors, visitorName: '' });
                  }}
                  placeholder="Contoh: DIKY TRI JUNIANTO"
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-[#152033] border ${errors.visitorName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-none text-slate-800 dark:text-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#005DA6]`}
                />
                {errors.visitorName && <span className="text-rose-500 text-[10px] font-semibold mt-1 block">{errors.visitorName}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor KTP / SIM / ID Card
                </label>
                <input
                  type="text"
                  value={identifyNo}
                  onChange={(e) => setIdentifyNo(e.target.value)}
                  placeholder="Masukkan 16 digit NIK atau KTP"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Telepon/WA
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Tamu (Kirim Barcode QR)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tamu@perusahaan.com"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instansi / Perusahaan Tamu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    if (errors.company) setErrors({ ...errors, company: '' });
                  }}
                  placeholder="Contoh: PT PT SUCOFINDO / PLN BANGSRI"
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-[#152033] border ${errors.company ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-none text-slate-800 dark:text-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#005DA6]`}
                />
                {errors.company && <span className="text-rose-500 text-[10px] font-semibold mt-1 block">{errors.company}</span>}
              </div>

            </div>

            {/* Visit Details Group */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                <Briefcase size={13} />
                Detail Kunjungan Pelayanan
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tujuan / Keperluan Kunjungan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => {
                    setPurpose(e.target.value);
                    if (errors.purpose) setErrors({ ...errors, purpose: '' });
                  }}
                  placeholder="Contoh: Rapat Koordinasi Proyek / Auditing K3L / Maintenance Alat"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#152033] border ${errors.purpose ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-none text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#005DA6]`}
                />
                {errors.purpose && <span className="text-rose-500 text-[10px] font-semibold mt-1 block">{errors.purpose}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Divisi / Pegawai yang Dikunjungi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={PLN_DIVISIONS.includes(visited) ? visited : (visited ? 'Lainnya' : '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Lainnya') {
                        setVisited(' ');
                      } else {
                        setVisited(val);
                      }
                      if (errors.visited) setErrors({ ...errors, visited: '' });
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-200 text-sm font-semibold focus:outline-none mb-2 focus:ring-2 focus:ring-[#005DA6]"
                  >
                    <option value="">-- Pilih Pegawai/Divisi Tujuan --</option>
                    {PLN_DIVISIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                    <option value="Lainnya">Lainnya (Tulis Manual)</option>
                  </select>

                  {(!PLN_DIVISIONS.includes(visited) && visited !== '') && (
                    <input
                      type="text"
                      value={visited.trim()}
                      onChange={(e) => {
                        setVisited(e.target.value);
                        if (errors.visited) setErrors({ ...errors, visited: '' });
                      }}
                      placeholder="Nama Pegawai / Divisi khusus..."
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                    />
                  )}
                </div>
                {errors.visited && <span className="text-rose-500 text-[10px] font-semibold mt-1 block">{errors.visited}</span>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Main Gate Pass (Kartu Utama)
                  </label>
                  <input
                    type="text"
                    value={mainGatePass}
                    onChange={(e) => setMainGatePass(e.target.value)}
                    placeholder="Contoh: Vgp 021"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    2nd Gate Pass (Kartu Tambahan)
                  </label>
                  <input
                    type="text"
                    value={secondGatePass}
                    onChange={(e) => setSecondGatePass(e.target.value)}
                    placeholder="Contoh: 014 k"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Jadwal / Waktu Kedatangan</span>
                    <span className="text-[10px] text-slate-400 font-normal">Pilih via Kalender 📅</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="datetime-local"
                      title="Pilih Tanggal & Jam dari Kalender"
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const dateObj = new Date(e.target.value);
                        const pad = (n: number) => String(n).padStart(2, '0');
                        const day = dateObj.getDate();
                        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                        const monthName = monthNames[dateObj.getMonth()];
                        const year = dateObj.getFullYear();
                        const hours = pad(dateObj.getHours());
                        const mins = pad(dateObj.getMinutes());
                        setSchedule(`${day} ${monthName} ${year} - ${hours}.${mins}`);
                      }}
                      className="px-2 py-2 bg-slate-100 dark:bg-[#152033] border border-slate-300 dark:border-slate-700 rounded-none text-slate-800 dark:text-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#005DA6] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={schedule}
                      onChange={(e) => setSchedule(e.target.value)}
                      placeholder="Contoh: 24 July 2026 - 10.00"
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Kunjungan Awal
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as VisitorStatus)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                  >
                    <option value="IN-PROGRESS">IN-PROGRESS (Sedang Berkunjung)</option>
                    <option value="SCHEDULED">SCHEDULED (Rencana Pertemuan)</option>
                    <option value="PENDING">PENDING (Menunggu Persetujuan)</option>
                    <option value="DONE">DONE (Selesai Berkunjung/Out)</option>
                  </select>
                </div>
              </div>

              {/* Pass Expiration & Validity Selection */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Masa Berlaku Pas (Validity Expiration)</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Expired Otomatis ⏳</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <select
                      value={validityOption}
                      onChange={(e) => {
                        const opt = e.target.value as any;
                        setValidityOption(opt);
                        const today = new Date();
                        const pad = (n: number) => String(n).padStart(2, '0');
                        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                        
                        let targetDate = new Date();
                        if (opt === 'SAME_DAY') {
                          setValidUntil(`${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()} - 23.59`);
                        } else if (opt === '1_DAY') {
                          targetDate.setDate(today.getDate() + 1);
                          setValidUntil(`${targetDate.getDate()} ${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()} - 23.59`);
                        } else if (opt === '3_DAYS') {
                          targetDate.setDate(today.getDate() + 3);
                          setValidUntil(`${targetDate.getDate()} ${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()} - 23.59`);
                        } else if (opt === '1_WEEK') {
                          targetDate.setDate(today.getDate() + 7);
                          setValidUntil(`${targetDate.getDate()} ${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()} - 23.59`);
                        }
                      }}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                    >
                      <option value="SAME_DAY">Berlaku Hari Ini (s/d 23.59)</option>
                      <option value="1_DAY">1 Hari (24 Jam)</option>
                      <option value="3_DAYS">3 Hari</option>
                      <option value="1_WEEK">1 Minggu (7 Hari)</option>
                      <option value="CUSTOM">Custom Tanggal & Jam</option>
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      placeholder="Waktu Expired (24 July 2026 - 23.59)"
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Keamanan / Barang Bawaan
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Membawa laptop dinas ASUS, memarkir kendaraan Mobil AD 1930 PL di Gate 1..."
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
            />
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-500" />
              Verifikasi Pos Keamanan Utama PLN
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-355 rounded-none text-sm font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#005DA6] hover:bg-[#004070] active:bg-[#003056] text-white rounded-none border-b-2 border-r-2 border-[#FFD500] text-sm font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Save size={16} />
                Simpan & Check-In
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
