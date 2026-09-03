/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, User, Briefcase, FileText, Lock, Users2, Calendar, Phone, ShieldCheck, Camera, Loader2 } from 'lucide-react';
import { Visitor, VisitorStatus, Stakeholder } from '../types';
import { COMMON_PURPOSES, PLN_DIVISIONS, KPJB_DIVISIONS, TJBPS_DIVISIONS, AGP_DIVISIONS } from '../data/mockData';
import { generateDailyPassNumber } from '../utils/passGenerator';
import { compressImageToJpeg } from '../utils/imageCompression';
import { uploadKtpPhoto, getKtpPhotoSignedUrl } from '../lib/supabase';

interface CheckInModalProps {
  visitorToEdit?: Visitor | null;
  onSave: (visitor: Visitor) => void;
  onClose: () => void;
  visitorsCount: number;
  lastFormId: string;
  visitors?: Visitor[];
}

export default function CheckInModal({
  visitorToEdit,
  onSave,
  onClose,
  visitorsCount,
  lastFormId,
  visitors = [],
}: CheckInModalProps) {
  const [visitorName, setVisitorName] = useState('');
  const [stakeholder, setStakeholder] = useState<Stakeholder>('PLN');
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
  const [validUntilTs, setValidUntilTs] = useState('');
  const [email, setEmail] = useState('');

  const [ktpPhotoBlob, setKtpPhotoBlob] = useState<Blob | null>(null);
  const [ktpPhotoPreview, setKtpPhotoPreview] = useState('');
  const [ktpPhotoSizeKb, setKtpPhotoSizeKb] = useState(0);
  const [existingKtpPhotoPath, setExistingKtpPhotoPath] = useState('');
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleKtpPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsCompressingPhoto(true);
    try {
      const compressed = await compressImageToJpeg(file);
      if (ktpPhotoPreview) URL.revokeObjectURL(ktpPhotoPreview);
      setKtpPhotoBlob(compressed);
      setKtpPhotoPreview(URL.createObjectURL(compressed));
      setKtpPhotoSizeKb(Math.round(compressed.size / 1024));
      if (errors.identifyNo) setErrors({ ...errors, identifyNo: '' });
    } catch {
      setErrors({ ...errors, identifyNo: 'Gagal memproses foto KTP. Coba unggah ulang.' });
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const handleRemoveKtpPhoto = () => {
    if (ktpPhotoPreview) URL.revokeObjectURL(ktpPhotoPreview);
    setKtpPhotoBlob(null);
    setKtpPhotoPreview('');
    setKtpPhotoSizeKb(0);
  };

  useEffect(() => {
    if (visitorToEdit?.ktpPhotoPath) {
      setExistingKtpPhotoPath(visitorToEdit.ktpPhotoPath);
      getKtpPhotoSignedUrl(visitorToEdit.ktpPhotoPath).then((url) => {
        if (url) setKtpPhotoPreview(url);
      });
    } else {
      setExistingKtpPhotoPath('');
    }
  }, [visitorToEdit]);

  useEffect(() => {
    if (visitorToEdit) {
      setVisitorName(visitorToEdit.visitorName);
      setStakeholder(visitorToEdit.stakeholder || 'PLN');
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
      setValidUntilTs(visitorToEdit.validUntilTs || '');
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
      const sameDayExpiry = new Date(today);
      sameDayExpiry.setHours(23, 59, 0, 0);
      setValidUntilTs(sameDayExpiry.toISOString());
      setValidityOption('SAME_DAY');
      setStatus('IN-PROGRESS');
    }
  }, [visitorToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!visitorName.trim()) newErrors.visitorName = 'Nama tamu harus diisi';
    if (!company.trim()) newErrors.company = 'Nama instansi/perusahaan harus diisi';
    if (!purpose.trim()) newErrors.purpose = 'Tujuan kunjungan harus dipilih/diisi';
    if (!visited.trim()) newErrors.visited = 'Divisi/Pegawai yang dikunjungi harus dipilih/diisi';
    if (!identifyNo.trim() && !ktpPhotoBlob && !existingKtpPhotoPath) {
      newErrors.identifyNo = 'Isi salah satu: Nomor KTP/SIM/ID atau unggah Foto KTP';
    }

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

    let ktpPhotoPath = existingKtpPhotoPath || undefined;
    if (ktpPhotoBlob) {
      setIsSavingPhoto(true);
      const uploadedPath = await uploadKtpPhoto(ktpPhotoBlob, `${formId}.jpg`);
      setIsSavingPhoto(false);
      if (!uploadedPath && !identifyNo.trim()) {
        setErrors({ identifyNo: 'Gagal mengunggah foto KTP. Periksa koneksi internet dan coba lagi.' });
        return;
      }
      ktpPhotoPath = uploadedPath || ktpPhotoPath;
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

    // Auto-generate sequential daily pass if not filled manually
    let effectiveMainGatePass = mainGatePass.trim();
    if (!effectiveMainGatePass) {
      effectiveMainGatePass = generateDailyPassNumber(visitors || []);
    }

    const visitorData: Visitor = {
      id: formId,
      schedule,
      inTime: visitorToEdit ? visitorToEdit.inTime : (status === 'IN-PROGRESS' ? formattedInTime : null),
      secondGateTime: visitorToEdit ? visitorToEdit.secondGateTime : null,
      receptionistTime: visitorToEdit ? visitorToEdit.receptionistTime : null,
      receptionistBadge: visitorToEdit ? visitorToEdit.receptionistBadge : null,
      stakeholder: stakeholder,
      outTime: visitorToEdit ? visitorToEdit.outTime : null,
      visitorName: visitorName.toUpperCase(),
      mainGatePass: effectiveMainGatePass,
      secondGatePass: secondGatePass.trim(),
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
      validUntilTs: validUntilTs || undefined,
      validityOption,
      ktpPhotoPath,
    };

    onSave(visitorData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="premium-glass max-w-4xl w-full shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col border-2 border-[#005DA6] dark:border-[#FFD500] rounded-none">
        
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 max-h-[80vh]">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Identity Group */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                <User size={13} />
                1. Identitas Tamu Pemohon
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
                  placeholder="Contoh: BUDI SANTOSO"
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
                  onChange={(e) => {
                    setIdentifyNo(e.target.value);
                    if (errors.identifyNo) setErrors({ ...errors, identifyNo: '' });
                  }}
                  placeholder="Masukkan 16 digit NIK atau KTP"
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-[#152033] border ${errors.identifyNo ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-none text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#005DA6]`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Foto KTP
                </label>
                {ktpPhotoPreview ? (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800">
                    <img src={ktpPhotoPreview} alt="Preview Foto KTP" className="h-16 w-24 object-cover border border-slate-300 dark:border-slate-700 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        {ktpPhotoBlob ? `Foto siap disimpan (~${ktpPhotoSizeKb}KB)` : 'Foto KTP tersimpan'}
                      </p>
                      <p className="text-[10px] text-slate-400">{ktpPhotoBlob ? 'Foto sudah dikompres otomatis.' : 'Klik Ganti untuk mengunggah foto baru.'}</p>
                    </div>
                    <label className="p-1.5 text-slate-400 hover:text-[#005DA6] cursor-pointer shrink-0 text-[10px] font-bold uppercase">
                      Ganti
                      <input type="file" accept="image/*" capture="environment" onChange={handleKtpPhotoChange} disabled={isCompressingPhoto} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className={`flex items-center justify-center gap-2 w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#152033] border border-dashed ${errors.identifyNo ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'} rounded-none text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900`}>
                    {isCompressingPhoto ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                    <span>{isCompressingPhoto ? 'Memproses foto...' : 'Ambil / Unggah Foto KTP'}</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleKtpPhotoChange} disabled={isCompressingPhoto} className="hidden" />
                  </label>
                )}
                <p className="text-[10px] text-slate-400 mt-1">Isi salah satu: Nomor KTP di atas, atau unggah foto KTP.</p>
                {errors.identifyNo && <span className="text-rose-500 text-[10px] font-semibold mt-1 block">{errors.identifyNo}</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  placeholder="Contoh: PT SUCOFINDO / PT PLN (PERSERO)"
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-[#152033] border ${errors.company ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-none text-slate-800 dark:text-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#005DA6]`}
                />
                {errors.company && <span className="text-rose-500 text-[10px] font-semibold mt-1 block">{errors.company}</span>}
              </div>

            </div>

            {/* Visit Details Group */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                <Briefcase size={13} />
                2. Detail Kunjungan & Akses Masuk
              </h4>

              {/* Stakeholder Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instansi / Stakeholder Tujuan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={stakeholder}
                  onChange={(e) => setStakeholder(e.target.value as Stakeholder)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#152033] border border-[#005DA6] dark:border-[#FFD500] rounded-none text-slate-800 dark:text-slate-200 text-xs font-black focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                >
                  <option value="PLN">PT PLN (Persero) UIK Tanjung Jati B</option>
                  <option value="KPJB">PT Komipo Pembangkitan Jawa Bali (KPJB)</option>
                  <option value="TJBPS">PT TJB Power Services (TJBPS)</option>
                  <option value="AGP">PT Adhi Guna Putera (AGP)</option>
                </select>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                  {stakeholder === 'KPJB' && '➔ Rute: Maingate PLN ➔ Second Gate KPJB ➔ Receptionist KPJB (3 Checkpoint)'}
                  {stakeholder === 'TJBPS' && '➔ Rute: Maingate PLN ➔ Receptionist TJBPS (Langsung, 2 Checkpoint)'}
                  {stakeholder === 'PLN' && '➔ Rute: Maingate PLN ➔ Receptionist PLN (Langsung, 2 Checkpoint)'}
                  {stakeholder === 'AGP' && '➔ Rute: Maingate PLN ➔ Pos Total 8 ➔ Receptionist AGP (3 Checkpoint)'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Divisi / Pegawai yang Dikunjungi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  {(() => {
                    const currentDivisions = stakeholder === 'KPJB' 
                      ? KPJB_DIVISIONS 
                      : stakeholder === 'TJBPS' 
                      ? TJBPS_DIVISIONS 
                      : stakeholder === 'AGP' 
                      ? AGP_DIVISIONS 
                      : PLN_DIVISIONS;

                    return (
                      <>
                        <select
                          value={currentDivisions.includes(visited) ? visited : (visited ? 'Lainnya' : '')}
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
                          <option value="">-- Pilih Pegawai/Divisi Tujuan ({stakeholder}) --</option>
                          {currentDivisions.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                          <option value="Lainnya">Lainnya (Tulis Manual)</option>
                        </select>

                        {(!currentDivisions.includes(visited) && visited !== '') && (
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
                      </>
                    );
                  })()}
                </div>
                {errors.visited && <span className="text-rose-500 text-[10px] font-semibold mt-1 block">{errors.visited}</span>}
              </div>

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
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#152033] border ${errors.purpose ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-none text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#005DA6]} `}
                />
                {errors.purpose && <span className="text-rose-500 text-[10px] font-semibold mt-1 block">{errors.purpose}</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Main Gate Pass (Kartu Utama)</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Auto Harian ✨</span>
                  </label>
                  <input
                    type="text"
                    value={mainGatePass}
                    onChange={(e) => setMainGatePass(e.target.value)}
                    placeholder={`Otomatis: ${generateDailyPassNumber(visitors || [])}`}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                  />
                  <span className="text-[9.5px] text-slate-400 block mt-1">Kosongkan untuk penomoran urut otomatis harian.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {stakeholder === 'KPJB' && 'Second Gate Pass (Kartu Pos 2 KPJB)'}
                    {stakeholder === 'AGP' && 'Pos Total 8 Pass (Kartu Pos 2 AGP)'}
                    {(stakeholder === 'PLN' || stakeholder === 'TJBPS') && '2nd Gate Pass (Opsional / Tidak Ada Pos 2)'}
                  </label>
                  <input
                    type="text"
                    value={secondGatePass}
                    onChange={(e) => setSecondGatePass(e.target.value)}
                    placeholder={stakeholder === 'KPJB' ? 'Contoh: 024 k' : stakeholder === 'AGP' ? 'Contoh: T8-012' : 'Opsional'}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                  />
                  <span className="text-[9.5px] text-slate-400 block mt-1">
                    {stakeholder === 'KPJB' || stakeholder === 'AGP' ? 'Diisi oleh Petugas Pos 2 saat verifikasi masuk unit.' : 'Tidak perlu diisi untuk rute langsung tanpa Pos 2.'}
                  </span>
                </div>
              </div>

              {/* Jadwal Kedatangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Jadwal / Waktu Kedatangan</span>
                  <span className="text-[10px] text-slate-400 font-normal">Pilih via Kalender 📅</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
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
                    className="px-3 py-2 bg-slate-100 dark:bg-[#152033] border border-slate-300 dark:border-slate-700 rounded-none text-slate-800 dark:text-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#005DA6] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="Contoh: 24 July 2026 - 10.00"
                    className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                  />
                </div>
              </div>

              {/* Status Kunjungan Awal */}
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

              {/* Pass Expiration & Validity Selection */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Masa Berlaku Pas (Validity Expiration)</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Expired Otomatis ⏳</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <select
                    value={validityOption}
                    onChange={(e) => {
                      const opt = e.target.value as any;
                      setValidityOption(opt);
                      const today = new Date();
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
                      if (opt === 'CUSTOM') {
                        setValidUntilTs('');
                      } else {
                        targetDate.setHours(23, 59, 0, 0);
                        setValidUntilTs(targetDate.toISOString());
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                  >
                    <option value="SAME_DAY">Berlaku Hari Ini (s/d 23.59)</option>
                    <option value="1_DAY">1 Hari (24 Jam)</option>
                    <option value="3_DAYS">3 Hari Kerja</option>
                    <option value="1_WEEK">1 Minggu (7 Hari)</option>
                    <option value="CUSTOM">Custom Tanggal & Jam</option>
                  </select>

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
                disabled={isSavingPhoto}
                className="px-5 py-2.5 bg-[#005DA6] hover:bg-[#004070] active:bg-[#003056] text-white rounded-none border-b-2 border-r-2 border-[#FFD500] text-sm font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSavingPhoto ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSavingPhoto ? 'Menyimpan Foto...' : 'Simpan & Check-In'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
