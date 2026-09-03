/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, User, Building, Phone, Mail, UserCheck, Clock, FileText, Send, CheckCircle, ShieldCheck, Info, Share2, Copy, Check, ExternalLink, Lock, Loader2 } from 'lucide-react';
import PLNLogo from './PLNLogo';
import { Visitor, VisitorStatus, Stakeholder } from '../types';

interface GuestBookingPortalProps {
  onSaveVisitor: (visitor: Visitor) => void;
  lastFormId: string;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'danger') => void;
}

const PLN_DIVISIONS = [
  'BIDANG KEUANGAN, KOMUNIKASI, DAN UMUM',
  'BIDANG PRODUKSI',
  'BIDANG ENJINEERING',
  'BIDANG PENGADAAN',
  'BIDANG ENERGI PRIMER',
  'BIDANG K3L & KEAMANAN',
  'TEKNOLOGI INFORMASI (IT)',
];

const KPJB_DIVISIONS = [
  'Operation Division',
  'Engineering Division',
  'Maintenance Division',
  'Jetty & Material Division',
  'HSSE Division',
  'Finance & GA Division',
];

const TJBPS_DIVISIONS = [
  'Operation Dept',
  'Maintenance Dept',
  'Development Dept',
  'HSSE Dept',
  'FA Dept',
  'HRD Dept',
];

const AGP_DIVISIONS = [
  'Operation Dept',
  'Maintenance Dept',
  'QHSSE Dept',
  'SDM Keuangan & Umum Dept',
  'Pemanduan Dept',
];

const COMMON_PURPOSES = [
  'Rapat Koordinasi / Bulanan',
  'Auditing & Inspeksi K3L',
  'Pengiriman Barang / Material Unit',
  'Vendor / Kontraktor Proyek',
  'Kunjungan Dinas PLN Group',
  'Magang / Riset / Penelitian',
];

const RANDOM_NAME_PLACEHOLDERS = [
  'Contoh: BUDI SANTOSO',
  'Contoh: HENDRA WIJAYA',
  'Contoh: BAMBANG SURYANTO',
  'Contoh: AGUS SETIAWAN',
  'Contoh: DIKY TRI JUNIARTO',
  'Contoh: EKO PRASETYO',
  'Contoh: ANINDITA PUTRI',
  'Contoh: RIZKY PERMANA',
  'Contoh: WAHYU HIDAYAT',
  'Contoh: TRI NUGROHO',
];

const RANDOM_COMPANY_PLACEHOLDERS = [
  'Contoh: PT INDONESIA POWER',
  'Contoh: PT ADHI KARYA (PERSERO)',
  'Contoh: PT SUCOFINDO',
  'Contoh: PT TELKOM INDONESIA',
  'Contoh: CV MITRA TEKNIK UTAMA',
  'Contoh: PT KREASI ELEKTRIKA',
  'Contoh: PT WIJAYA KARYA',
  'Contoh: KEMENTERIAN ESDM',
  'Contoh: PT REKAYASA INDUSTRI',
];

export default function GuestBookingPortal({ onSaveVisitor, lastFormId, triggerToast }: GuestBookingPortalProps) {
  const [namePlaceholder] = useState(() => RANDOM_NAME_PLACEHOLDERS[Math.floor(Math.random() * RANDOM_NAME_PLACEHOLDERS.length)]);
  const [companyPlaceholder] = useState(() => RANDOM_COMPANY_PLACEHOLDERS[Math.floor(Math.random() * RANDOM_COMPANY_PLACEHOLDERS.length)]);
  const [stakeholder, setStakeholder] = useState<Stakeholder>('PLN');
  const [visitorName, setVisitorName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [visitedOption, setVisitedOption] = useState('');
  const [visitedCustomText, setVisitedCustomText] = useState('');
  const [purpose, setPurpose] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09.00');
  const [validityOption, setValidityOption] = useState<'SAME_DAY' | '1_DAY' | '3_DAYS' | '1_WEEK'>('SAME_DAY');
  const [notes, setNotes] = useState('');
  const [submittedVisitor, setSubmittedVisitor] = useState<Visitor | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate unique Form ID e.g. TJB-VST-005010
  const generateNewFormId = () => {
    const numericPart = parseInt(lastFormId.replace('TJB-VST-', ''), 10);
    const nextNum = isNaN(numericPart) ? 5009 : numericPart + 1;
    return `TJB-VST-${String(nextNum).padStart(6, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: { [key: string]: string } = {};

    const finalVisited = visitedOption === 'Lainnya' ? visitedCustomText : visitedOption;

    if (!visitorName.trim()) newErrors.visitorName = 'Nama lengkap tamu wajib diisi';
    if (!company.trim()) newErrors.company = 'Instansi/Perusahaan wajib diisi';
    if (!phone.trim()) newErrors.phone = 'Nomor Telepon/WA wajib diisi';
    if (!finalVisited.trim()) newErrors.visited = 'Pegawai/Divisi tujuan wajib dipilih';
    if (!purpose.trim()) newErrors.purpose = 'Tujuan / Keperluan kunjungan wajib diisi';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      triggerToast('Mohon lengkapi seluruh kolom wajib pengajuan janji temu.', 'danger');
      return;
    }

    setIsSubmitting(true);

    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    let formattedSchedule = `${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()} - ${scheduleTime}`;
    if (scheduleDate) {
      const dateParts = scheduleDate.split('-');
      if (dateParts.length === 3) {
        const parsedDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        if (!isNaN(parsedDate.getTime())) {
          formattedSchedule = `${parsedDate.getDate()} ${monthNames[parsedDate.getMonth()]} ${parsedDate.getFullYear()} - ${scheduleTime}`;
        }
      }
    }

    // Calculate validity expiration string
    let expiryDate = new Date(today);
    if (scheduleDate) {
      const dateParts = scheduleDate.split('-');
      if (dateParts.length === 3) {
        expiryDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      }
    }
    if (validityOption === 'SAME_DAY') {
      // same day 23.59
    } else if (validityOption === '1_DAY') {
      expiryDate.setDate(expiryDate.getDate() + 1);
    } else if (validityOption === '3_DAYS') {
      expiryDate.setDate(expiryDate.getDate() + 3);
    } else if (validityOption === '1_WEEK') {
      expiryDate.setDate(expiryDate.getDate() + 7);
    }
    const formattedExpiry = `${expiryDate.getDate()} ${monthNames[expiryDate.getMonth()]} ${expiryDate.getFullYear()} - 23.59`;

    const newFormId = generateNewFormId();
    const newVisitor: Visitor = {
      id: newFormId,
      schedule: formattedSchedule,
      inTime: null,
      outTime: null,
      secondGateTime: null,
      receptionistTime: null,
      stakeholder: stakeholder,
      visitorName: visitorName.toUpperCase(),
      mainGatePass: '',
      secondGatePass: '',
      company: company.toUpperCase(),
      purpose: purpose.trim(),
      visited: finalVisited.toUpperCase(),
      status: 'PENDING',
      phone,
      email: email ? email.toLowerCase() : `${visitorName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      gender: 'Laki-laki',
      notes,
      validUntil: formattedExpiry,
      validityOption,
    };

    onSaveVisitor(newVisitor);
    setSubmittedVisitor(newVisitor);
    setIsSubmitting(false);
    triggerToast(`Pengajuan Janji Temu atas nama ${newVisitor.visitorName} (${stakeholder}) berhasil dikirim!`, 'success');
  };

  const handleResetForm = () => {
    setIsSubmitting(false);
    setSubmittedVisitor(null);
    setVisitorName('');
    setCompany('');
    setPhone('');
    setEmail('');
    setVisitedOption('');
    setVisitedCustomText('');
    setPurpose('');
    setNotes('');
    setErrors({});
  };

  if (submittedVisitor) {
    return (
      <div className="max-w-3xl flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in mx-auto">
        <div className="premium-glass w-full p-6 sm:p-8 border-2 border-emerald-500 shadow-2xl space-y-6 text-center">
          
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500 rounded-none flex items-center justify-center mx-auto animate-pulse">
            <CheckCircle size={36} />
          </div>

          <div>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold uppercase tracking-widest border border-emerald-300 dark:border-emerald-800 inline-block mb-2">
              FORM PERMOHONAN: {submittedVisitor.id}
            </span>
            <h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white tracking-tight">
              Pengajuan Kunjungan Berhasil Dikirim!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Permohonan janji temu Anda telah masuk ke dalam antrean sistem Sekretariat & Pos Security UIK Tanjung Jati B.
            </p>
          </div>

          {/* Submission Stepper Tracker */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-800 text-left space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#005DA6] dark:text-[#FFD500] flex items-center gap-1.5">
              <ShieldCheck size={14} />
              Status Alur Persetujuan Janji Temu:
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
                <span className="text-[9px] font-bold text-emerald-600 uppercase block">Langkah 1</span>
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">✅ 1. Diajukan Tamu</span>
              </div>
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 animate-pulse">
                <span className="text-[9px] font-bold text-amber-600 uppercase block">Langkah 2 (Proses)</span>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">⏳ 2. Verifikasi Sekretariat</span>
              </div>
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 opacity-60">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Langkah 3</span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">📩 3. QR Pass ke Email</span>
              </div>
            </div>
          </div>

          {/* Summary Details */}
          <div className="bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400">Nama Pemohon:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 uppercase">{submittedVisitor.visitorName}</p>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400">Instansi / Perusahaan:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 uppercase">{submittedVisitor.company}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400">Tujuan Bertemu:</span>
                <p className="font-bold text-[#005DA6] dark:text-[#FFD500] uppercase">{submittedVisitor.visited}</p>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400">Rencana Kunjungan:</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{submittedVisitor.schedule}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400">Email Notifikasi:</span>
                <p className="font-mono font-bold text-slate-700 dark:text-slate-300">{submittedVisitor.email}</p>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400">Status Permohonan:</span>
                <p className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-500 rounded-none animate-pulse"></span>
                  MENUNGGU APPROVAL
                </p>
              </div>
            </div>

            {/* Notice Barcode Belum Berlaku */}
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-3 rounded-none mt-2 space-y-1">
              <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
                Penting: Barcode QR Pass Belum Berlaku
              </span>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                Sesuai prosedur keamanan PLN, barcode QR Pass Anda saat ini masih berstatus <strong>TERKUNCI</strong>. Admin Sekretariat atau Security PLN akan memverifikasi data janji temu Anda. Setelah disetujui, barcode QR Pass aktif akan diterbitkan dan otomatis dikirimkan ke email <strong>{submittedVisitor.email}</strong>.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={handleResetForm}
              className="py-2.5 px-6 bg-[#005DA6] hover:bg-[#004070] text-white font-bold text-xs uppercase tracking-wider border-b-2 border-r-2 border-[#FFD500] cursor-pointer"
            >
              Buat Pengajuan Baru
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 animate-fade-in font-sans">
      <div className="premium-glass border-2 border-[#005DA6] shadow-2xl overflow-hidden">
        
        {/* Banner Header Portal */}
        <div className="bg-[#005DA6] border-b-2 border-[#FFD500] p-5 sm:p-6 text-white">
          <div className="flex items-start sm:items-center gap-3.5">
            <PLNLogo showText={false} size="sm" className="shrink-0 mt-0.5 sm:mt-0" />
            <div className="space-y-0.5">
              <span className="text-[10.5px] font-mono font-bold text-[#FFD500] uppercase tracking-widest block">
                PORTAL MANDIRI TAMU UIK TANJUNG JATI B
              </span>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight font-display text-white">
                Formulir Pengajuan Kunjungan & Janji Temu
              </h2>
              <p className="text-xs text-sky-100 max-w-xl pt-0.5">
                Isi data diri dan rencana kunjungan Anda. Kode QR Pass Masuk Digital akan dikirimkan otomatis setelah disetujui Sekretariat.
              </p>
            </div>
          </div>
        </div>

        {/* Dedicated Direct Link Action Bar for Guests */}
        <div className="bg-sky-50 dark:bg-sky-950/40 border-b border-sky-200 dark:border-sky-900 px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300">
            <Share2 size={14} className="text-[#005DA6] dark:text-[#FFD500] shrink-0" />
            <span className="font-semibold">Tautan Khusus Tamu:</span>
            <code className="px-2.5 py-0.5 bg-white dark:bg-[#152033] border border-sky-300 dark:border-sky-800 text-[10.5px] font-mono font-bold text-[#005DA6] dark:text-[#FFD500]">
              {typeof window !== 'undefined' ? `${window.location.origin}/?portal=tamu` : '/?portal=tamu'}
            </code>
          </div>
          <button
            type="button"
            onClick={() => {
              const url = typeof window !== 'undefined' ? `${window.location.origin}/?portal=tamu` : '/?portal=tamu';
              navigator.clipboard.writeText(url);
              setCopiedLink(true);
              triggerToast('Tautan Form Pengajuan Tamu berhasil disalin ke clipboard!', 'success');
              setTimeout(() => setCopiedLink(false), 2500);
            }}
            className="px-3.5 py-1.5 bg-[#005DA6] hover:bg-[#004070] text-white text-[11px] font-bold rounded-none flex items-center gap-1.5 cursor-pointer transition-all border-b border-r border-[#FFD500] shrink-0 shadow-2xs"
            title="Salin Tautan Khusus Form Tamu"
          >
            {copiedLink ? <Check size={12} className="text-[#FFD500]" /> : <Copy size={12} />}
            <span>{copiedLink ? 'Link Form Tersalin!' : 'Salin Tautan Form Tamu'}</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-slate-800 dark:text-slate-200 text-xs">
          
          {/* Identity Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#005DA6] dark:text-[#FFD500] flex items-center gap-1.5 pb-1 border-b border-slate-200 dark:border-slate-800">
              <User size={14} />
              1. Data Identitas Tamu Pemohon
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Nama Lengkap Tamu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => {
                    setVisitorName(e.target.value);
                    if (errors.visitorName) setErrors({ ...errors, visitorName: '' });
                  }}
                  placeholder={namePlaceholder}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#152033] border ${errors.visitorName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-none text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#005DA6]`}
                />
                {errors.visitorName && <span className="text-rose-500 text-[10px] font-semibold mt-1 block">{errors.visitorName}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Instansi / Perusahaan Tamu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    if (errors.company) setErrors({ ...errors, company: '' });
                  }}
                  placeholder={companyPlaceholder}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#152033] border ${errors.company ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-none text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#005DA6]`}
                />
                {errors.company && <span className="text-rose-500 text-[10px] font-semibold mt-1 block">{errors.company}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Nomor HP / WhatsApp Active <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  placeholder="Contoh: 08123456789"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#152033] border ${errors.phone ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-none text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#005DA6]`}
                />
                {errors.phone && <span className="text-rose-500 text-[10px] font-semibold mt-1 block">{errors.phone}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Email Tamu (Untuk Penerimaan Pass Digital)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tamu@perusahaan.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                />
              </div>
            </div>
          </div>

          {/* Visit Details Section */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#005DA6] dark:text-[#FFD500] flex items-center gap-1.5 pb-1 border-b border-slate-200 dark:border-slate-800">
              <Building size={14} />
              2. Instansi & Divisi yang Dikunjungi
            </h3>

            {/* Pilihan Instansi / Stakeholder Tujuan */}
            <div>
              <label className="block text-xs font-semibold mb-1">
                Instansi / Stakeholder Tujuan <span className="text-rose-500">*</span>
              </label>
              <select
                value={stakeholder}
                onChange={(e) => {
                  setStakeholder(e.target.value as Stakeholder);
                  setVisitedOption('');
                  setVisitedCustomText('');
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#152033] border border-[#005DA6] dark:border-[#FFD500] rounded-none text-xs font-black text-[#005DA6] dark:text-[#FFD500] focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
              >
                <option value="PLN">PT PLN (Persero) UIK Tanjung Jati B</option>
                <option value="KPJB">PT Komipo Pembangkitan Jawa Bali (KPJB)</option>
                <option value="TJBPS">PT TJB Power Services (TJBPS)</option>
                <option value="AGP">PT Adhi Guna Putera (AGP)</option>
              </select>
            </div>

            {/* Banner Informasi Rute Masuk Checkpoint */}
            <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 border-l-4 border-[#005DA6] dark:border-[#FFD500] text-[11px]">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                <ShieldCheck size={14} className="text-[#005DA6] dark:text-[#FFD500]" />
                <span>Rute Verifikasi Checkpoint ({stakeholder}):</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-mono text-[10.5px]">
                {stakeholder === 'KPJB' && '1. Main Gate PLN ➔ 2. Second Gate KPJB ➔ 3. Receptionist KPJB (3 Checkpoint)'}
                {stakeholder === 'TJBPS' && '1. Main Gate PLN ➔ 2. Receptionist TJBPS (Langsung Tanpa Pos 2, 2 Checkpoint)'}
                {stakeholder === 'PLN' && '1. Main Gate PLN ➔ 2. Receptionist PLN (Langsung Tanpa Pos 2, 2 Checkpoint)'}
                {stakeholder === 'AGP' && '1. Main Gate PLN ➔ 2. Pos Total 8 ➔ 3. Receptionist AGP (3 Checkpoint)'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Pegawai / Divisi Tujuan di {stakeholder} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={visitedOption}
                  onChange={(e) => {
                    setVisitedOption(e.target.value);
                    if (errors.visited) setErrors({ ...errors, visited: '' });
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#152033] border ${errors.visited ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-none text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#005DA6]`}
                >
                  <option value="">-- Pilih Divisi / Kontak Tujuan --</option>
                  {stakeholder === 'PLN' && PLN_DIVISIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  {stakeholder === 'KPJB' && KPJB_DIVISIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  {stakeholder === 'TJBPS' && TJBPS_DIVISIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  {stakeholder === 'AGP' && AGP_DIVISIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="Lainnya">Lainnya (Ketik Nama Kontak / Divisi Manual)</option>
                </select>

                {visitedOption === 'Lainnya' && (
                  <input
                    type="text"
                    value={visitedCustomText}
                    onChange={(e) => {
                      setVisitedCustomText(e.target.value);
                      if (errors.visited) setErrors({ ...errors, visited: '' });
                    }}
                    placeholder="Ketik nama pegawai atau divisi tujuan spesifik..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-xs font-semibold mt-1.5 focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                  />
                )}
                {errors.visited && <span className="text-rose-500 text-[10px] font-semibold mt-1 block">{errors.visited}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Tujuan / Keperluan Kunjungan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => {
                    setPurpose(e.target.value);
                    if (errors.purpose) setErrors({ ...errors, purpose: '' });
                  }}
                  placeholder="Contoh: Rapat Koordinasi Proyek / Auditing K3L / Pengiriman Barang"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#152033] border ${errors.purpose ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-none text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#005DA6]`}
                />
                {errors.purpose && <span className="text-rose-500 text-[10px] font-semibold mt-1 block">{errors.purpose}</span>}
              </div>
            </div>
          </div>

          {/* Schedule & Validity Section */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#005DA6] dark:text-[#FFD500] flex items-center gap-1.5 pb-1 border-b border-slate-200 dark:border-slate-800">
              <Calendar size={14} />
              3. Jadwal & Masa Berlaku Kunjungan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Rencana Tanggal Kunjungan
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#005DA6] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Jam Estimasi Kedatangan
                </label>
                <input
                  type="text"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  placeholder="09.00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Masa Berlaku Pas Kunjungan
                </label>
                <select
                  value={validityOption}
                  onChange={(e) => setValidityOption(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
                >
                  <option value="SAME_DAY">Berlaku 1 Hari (s/d 23.59)</option>
                  <option value="1_DAY">24 Jam</option>
                  <option value="3_DAYS">3 Hari Kerja</option>
                  <option value="1_WEEK">1 Minggu (7 Hari)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Catatan Tambahan (Nomor Plat Kendaraan / Barang Bawaan Proyek)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Membawa mobil Mobil K 1930 AB, membawa peralatan kamera inspeksi..."
                rows={2}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-xs focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
              />
            </div>
          </div>

          {/* Submit Action Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              <Info size={12} className="text-[#005DA6]" />
              Data akan diverifikasi oleh Petugas Sekretariat PLN
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3 px-6 bg-[#005DA6] hover:bg-[#004070] text-white font-black text-xs uppercase tracking-wider border-b-2 border-r-2 border-[#FFD500] cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              <span>{isSubmitting ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Janji Temu'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
