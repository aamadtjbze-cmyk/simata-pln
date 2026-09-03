/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Check,
  Trash2,
  Lock,
  ExternalLink,
  Printer,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  SlidersHorizontal,
  Calendar,
  Layers,
  CheckSquare,
  UserCheck2,
  Eye,
  AlertTriangle,
  Users2,
  X,
  ChevronRight,
  MessageSquare,
  LayoutList,
  LayoutGrid,
  Building,
  Clock,
  Shield,
  Mail,
  Loader2,
  QrCode
} from 'lucide-react';
import { Visitor, VisitorStatus, Stakeholder, UserRole } from '../types';
import { generateWhatsAppPassUrl } from '../lib/email';
import { getProductionPassUrl } from '../utils/security';

interface VisitorTableProps {
  visitors: Visitor[];
  onCheckOut: (visitorId: string) => void;
  onCheckOutBatch: (visitorIds: string[]) => void;
  onEdit: (visitor: Visitor) => void;
  onDelete: (visitorId: string) => void;
  onViewBadge: (visitor: Visitor) => void;
  onAddSampleData: () => void;
  onApproveBooking?: (visitorId: string) => void;
  onRejectBooking?: (visitorId: string, reason: string) => void;
  onCheckInAppointment?: (visitorId: string) => void;
  onSecondGateCheckIn?: (visitorId: string, customPass?: string) => void;
  onReceptionistCheckIn?: (visitorId: string, badgeNumber?: string) => void;
  onResendEmail?: (visitor: Visitor) => Promise<boolean>;
  currentUserRole?: UserRole;
  activeStakeholder?: Stakeholder | 'ALL';
}

type SortField = 'id' | 'schedule' | 'inTime' | 'outTime' | 'visitorName' | 'company' | 'purpose' | 'visited' | 'status' | 'stakeholder';

export default function VisitorTable({
  visitors,
  onCheckOut,
  onCheckOutBatch,
  onEdit,
  onDelete,
  onViewBadge,
  onAddSampleData,
  onApproveBooking,
  onRejectBooking,
  onCheckInAppointment,
  onSecondGateCheckIn,
  onReceptionistCheckIn,
  onResendEmail,
  currentUserRole = 'SUPERADMIN',
  activeStakeholder = 'ALL',
}: VisitorTableProps) {
  // Filtering states
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<VisitorStatus | 'ALL'>('ALL');
  const [filterPurpose, setFilterPurpose] = useState('ALL');
  const [filterStakeholder, setFilterStakeholder] = useState<Stakeholder | 'ALL'>(activeStakeholder || 'ALL');
  const [scheduleFilter, setScheduleFilter] = useState('');
  const [inFilter, setInFilter] = useState('');
  const [secondGateFilter, setSecondGateFilter] = useState('');
  const [receptionistFilter, setReceptionistFilter] = useState('');
  const [outFilter, setOutFilter] = useState('');

  useEffect(() => {
    if (activeStakeholder) {
      setFilterStakeholder(activeStakeholder);
    }
  }, [activeStakeholder]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Quick Action Modal & Rejection state
  const [quickActionVisitor, setQuickActionVisitor] = useState<Visitor | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isResendingEmail, setIsResendingEmail] = useState<string | null>(null);

  // Sorting states
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Multi-select row state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Responsive View Mode (Table for Desktop/Laptop, Cards for Mobile/Tablet)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'cards' : 'table';
    }
    return 'table';
  });

  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  React.useEffect(() => {
    const handleResize = () => {
      const small = window.innerWidth < 1024;
      setIsSmallScreen(small);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Unique companies / purposes for dropdown filters
  const uniquePurposes = Array.from(new Set(visitors.map((v) => v.purpose))).filter(Boolean);

  // Sorting logic helper
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Reset all table search and column filters
  const handleResetFilters = () => {
    setSearch('');
    setFilterStatus('ALL');
    setFilterPurpose('ALL');
    setScheduleFilter('');
    setInFilter('');
    setSecondGateFilter('');
    setOutFilter('');
    setCurrentPage(1);
  };

  // Select all rows logic
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(currentPagedItems.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Select individual row logic
  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    }
  };

  // Batch check-out handler
  const handleBatchCheckOut = () => {
    const inProgressSelected = visitors
      .filter((v) => selectedIds.includes(v.id) && v.status === 'IN-PROGRESS')
      .map((v) => v.id);

    if (inProgressSelected.length === 0) {
      alert('Tidak ada tamu berstatus IN-PROGRESS pilihan Anda yang perlu diCheck-Out.');
      return;
    }

    if (confirm(`Check-Out ${inProgressSelected.length} tamu terpilih sekaligus?`)) {
      onCheckOutBatch(inProgressSelected);
      setSelectedIds([]);
    }
  };

  // Reset filters
  const handleClearFilters = () => {
    setSearch('');
    setFilterStatus('ALL');
    setFilterPurpose('ALL');
    setFilterStakeholder(activeStakeholder || 'ALL');
    setScheduleFilter('');
    setInFilter('');
    setSecondGateFilter('');
    setReceptionistFilter('');
    setOutFilter('');
    setCurrentPage(1);
  };

  // Filter & Search Logic
  const filteredItems = visitors.filter((item) => {
    // General text search (Nama, Form ID, Perusahaan, Tujuan, Pegawai, Email, No HP)
    const matchesSearch =
      item.visitorName.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.company.toLowerCase().includes(search.toLowerCase()) ||
      item.visited.toLowerCase().includes(search.toLowerCase()) ||
      item.purpose.toLowerCase().includes(search.toLowerCase()) ||
      (item.stakeholder && item.stakeholder.toLowerCase().includes(search.toLowerCase())) ||
      (item.email && item.email.toLowerCase().includes(search.toLowerCase())) ||
      (item.phone && item.phone.toLowerCase().includes(search.toLowerCase())) ||
      (item.identifyNo && item.identifyNo.toLowerCase().includes(search.toLowerCase()));

    // Filter statuses
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;

    // Filter purposes
    const matchesPurpose = filterPurpose === 'ALL' || item.purpose === filterPurpose;

    // Filter Stakeholders (locked to activeStakeholder if logged in user is scoped to one entity)
    const effectiveStakeholder = (activeStakeholder && activeStakeholder !== 'ALL') ? activeStakeholder : filterStakeholder;
    const matchesStakeholder = effectiveStakeholder === 'ALL' || (item.stakeholder || 'PLN') === effectiveStakeholder;

    // Filter Schedule Date
    const matchesScheduleFilter =
      !scheduleFilter ||
      item.schedule.toLowerCase().includes(scheduleFilter.toLowerCase());

    // Filter IN Date
    const matchesInFilter =
      !inFilter ||
      (item.inTime && item.inTime.toLowerCase().includes(inFilter.toLowerCase()));

    // Filter SECOND GATE Date
    const matchesSecondGateFilter =
      !secondGateFilter ||
      (item.secondGateTime && item.secondGateTime.toLowerCase().includes(secondGateFilter.toLowerCase()));

    // Filter RECEPTIONIST Date
    const matchesReceptionistFilter =
      !receptionistFilter ||
      (item.receptionistTime && item.receptionistTime.toLowerCase().includes(receptionistFilter.toLowerCase()));

    // Filter OUT Date
    const matchesOutFilter =
      !outFilter ||
      (item.outTime && item.outTime.toLowerCase().includes(outFilter.toLowerCase()));

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPurpose &&
      matchesStakeholder &&
      matchesScheduleFilter &&
      matchesInFilter &&
      matchesSecondGateFilter &&
      matchesReceptionistFilter &&
      matchesOutFilter
    );
  });

  // Intelligent Sorting Process
  const sortedItems = [...filteredItems].sort((a, b) => {
    // If sorted by specific custom column (name, company, schedule, inTime, etc.)
    if (sortField !== 'id') {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return 0;
    }

    // Default Sorting (Urutan Cerdas SIMATA):
    // 1. Prioritaskan status PENDING di baris teratas (agar approval admin tidak terlewat)
    // 2. Kemudian status SCHEDULED (tamu terjadwal)
    // 3. Kemudian status IN-PROGRESS (sedang di gedung)
    // 4. Kemudian status DONE / REJECTED / EXPIRED
    const statusWeight: Record<string, number> = {
      'PENDING': 1,
      'SCHEDULED': 2,
      'IN-PROGRESS': 3,
      'DONE': 4,
      'REJECTED': 5,
      'EXPIRED': 6,
    };

    const weightA = statusWeight[a.status] || 99;
    const weightB = statusWeight[b.status] || 99;

    if (weightA !== weightB) {
      return weightA - weightB; // PENDING & SCHEDULED selalu diprioritaskan di atas
    }

    // Dalam kelompok status yang sama, urutkan berdasarkan Nomor Form ID numerik terbaru di atas
    const numA = parseInt(a.id.replace(/\D/g, '') || '0', 10);
    const numB = parseInt(b.id.replace(/\D/g, '') || '0', 10);
    return sortDirection === 'asc' ? numA - numB : numB - numA;
  });

  // Pagination bounds
  const totalEntries = sortedItems.length;
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const currentPagedItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;

  // Change page helper
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getStatusBadge = (status: VisitorStatus) => {
    switch (status) {
      case 'DONE':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-none text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900 font-sans">
            DONE
          </span>
        );
      case 'IN-PROGRESS':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-none text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900 animate-pulse font-sans">
            IN-PROGRESS
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-none text-xs font-bold bg-sky-50 text-sky-600 border border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900 font-sans">
            SCHEDULED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-none text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-850 dark:text-slate-400 dark:border-slate-800 font-sans">
            PENDING
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-none text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900 font-sans">
            EXPIRED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-none text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 font-sans">
            DITOLAK / REJECTED
          </span>
        );
    }
  };

  const getStakeholderBadge = (stk?: Stakeholder) => {
    switch (stk) {
      case 'KPJB':
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase font-mono bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800 rounded-none">
            KPJB
          </span>
        );
      case 'TJBPS':
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase font-mono bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-none">
            TJBPS
          </span>
        );
      case 'AGP':
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase font-mono bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 rounded-none">
            AGP
          </span>
        );
      case 'PLN':
      default:
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase font-mono bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded-none">
            PLN
          </span>
        );
    }
  };

  const isAllPageSelected =
    currentPagedItems.length > 0 &&
    currentPagedItems.every((item) => selectedIds.includes(item.id));

  return (
    <div className="bg-white dark:bg-[#111c30] border-2 border-slate-200 dark:border-[#005DA6] rounded-none overflow-hidden shadow-md w-full flex flex-col">
      
      {/* Top Filter Toolbar */}
      <div className="p-5 border-b-2 border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-50 dark:bg-slate-950">
        
        {/* Search query input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama, instansi, form ID, atau pegawai..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-850 rounded-none text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#005DA6] focus:border-[#005DA6] font-semibold"
          />
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Stakeholder / Entitas filter dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 hidden xl:inline">Entitas:</span>
            {activeStakeholder && activeStakeholder !== 'ALL' ? (
              <span className="py-2 px-3 bg-blue-50 dark:bg-blue-950/60 text-[#005DA6] dark:text-[#FFD500] border-2 border-[#005DA6] text-xs font-black uppercase tracking-wider font-mono">
                {activeStakeholder}
              </span>
            ) : (
              <select
                value={filterStakeholder}
                onChange={(e) => {
                  setFilterStakeholder(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="py-2.5 pl-3 pr-8 bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-[#005DA6] dark:text-[#FFD500] text-xs font-black focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
              >
                <option value="ALL">Semua Entitas (Kawasan)</option>
                <option value="PLN">PLN UIK TJB</option>
                <option value="KPJB">KPJB</option>
                <option value="TJBPS">TJB Power Services</option>
                <option value="AGP">Adhi Guna Putera (AGP)</option>
              </select>
            )}
          </div>

          {/* Status filter dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 hidden xl:inline">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as any);
                setCurrentPage(1);
              }}
              className="py-2.5 pl-3 pr-8 bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-700 dark:text-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
            >
              <option value="ALL">Semua Status</option>
              <option value="IN-PROGRESS">IN-PROGRESS</option>
              <option value="DONE">DONE / Keluar</option>
              <option value="SCHEDULED">SCHEDULED / Janji</option>
              <option value="PENDING">PENDING</option>
            </select>
          </div>

          {/* Purpose dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 hidden xl:inline">Tujuan:</span>
            <select
              value={filterPurpose}
              onChange={(e) => {
                setFilterPurpose(e.target.value);
                setCurrentPage(1);
              }}
              className="py-2.5 pl-3 pr-8 bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-700 dark:text-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#005DA6]"
            >
              <option value="ALL">Semua Tujuan</option>
              {uniquePurposes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleClearFilters}
            title="Reset Filters"
            className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-none transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152033]"
          >
            <RefreshCw size={16} />
          </button>

          {/* View Mode Toggle: Table (Laptop) vs Cards (Mobile / HP) */}
          <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#005DA6] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              title="Tampilan Tabel Lengkap (Laptop / Layar Lebar)"
            >
              <LayoutList size={14} />
              <span className="text-[10.5px] uppercase font-black">Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#005DA6] text-[#FFD500] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              title="Tampilan Kartu Responsif (Optimal di HP & Layar Sentuh)"
            >
              <LayoutGrid size={14} />
              <span className="text-[10.5px] uppercase font-black">Kartu (HP)</span>
            </button>
          </div>

          {/* Confirm by Group */}
          <button
            onClick={handleBatchCheckOut}
            disabled={selectedIds.length === 0}
            className={`py-2.5 px-4 rounded-none text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 border-r-2 ${
              selectedIds.length > 0
                ? 'bg-[#005DA6] text-[#FFD500] border-[#FFD500] hover:bg-[#004070] cursor-pointer'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed'
            }`}
          >
            <CheckSquare size={15} />
            Confirm By Group ({selectedIds.length})
          </button>

        </div>
      </div>

      {/* Sorting Indicators Info Bar (Mobile helper) */}
      <div className="px-5 py-2.5 bg-slate-100/50 dark:bg-slate-900/50 flex flex-wrap justify-between items-center text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
        <div className="flex gap-4">
          <span>Menampilkan hasil pencarian: <strong>{totalEntries}</strong> entries</span>
          {selectedIds.length > 0 && (
            <span className="text-amber-600 font-bold">Terpilih {selectedIds.length} baris untuk tindakan kelompok</span>
          )}
        </div>
        <div className="hidden sm:block">
          Klik nama kolom tabel untuk mengurutkan data tamu
        </div>
      </div>

      {/* Table Canvas or Mobile Cards View */}
      {viewMode === 'cards' ? (
        /* Mobile & Tablet Card View */
        <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 bg-slate-50 dark:bg-[#0c1322] overflow-y-auto flex-1 min-h-[360px]">
          {currentPagedItems.length > 0 ? (
            currentPagedItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-[#152033] border-2 ${
                    isSelected
                      ? 'border-amber-400 dark:border-amber-500 bg-amber-50/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-[#005DA6] dark:hover:border-[#005DA6]'
                  } p-4 shadow-xs transition-all flex flex-col justify-between gap-3 relative rounded-none`}
                >
                  {/* Card Header: Checkbox, Form ID, Status, Gate Pass */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                        className="rounded-none accent-[#005DA6] w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <button
                          onClick={() => onViewBadge(item)}
                          className="font-mono text-xs font-black text-[#005DA6] dark:text-[#FFD500] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {item.id} <ExternalLink size={11} />
                        </button>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                          {item.schedule || '-'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(item.status)}
                      <div className="flex gap-1">
                        {item.mainGatePass && (
                          <span className="font-mono text-[9px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 border border-amber-300 dark:border-amber-800">
                            {item.mainGatePass}
                          </span>
                        )}
                        {item.secondGatePass && (
                          <span className="font-mono text-[9px] text-sky-700 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.5 border border-sky-300 dark:border-sky-800">
                            {item.secondGatePass}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body: Visitor Name, Stakeholder, Company, Purpose, Visited */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {getStakeholderBadge(item.stakeholder)}
                        <button
                          onClick={() => setQuickActionVisitor(item)}
                          className="font-black text-sm text-slate-900 dark:text-slate-100 uppercase tracking-tight text-left hover:text-[#005DA6] dark:hover:text-[#FFD500] flex items-center gap-1"
                        >
                          {item.visitorName}
                          <ExternalLink size={12} className="opacity-50" />
                        </button>
                      </div>
                      <p className="font-bold text-slate-600 dark:text-slate-300 uppercase text-[11px] flex items-center gap-1 mt-0.5">
                        <Building size={12} className="text-[#005DA6] shrink-0" />
                        {item.company}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 border border-slate-100 dark:border-slate-800 space-y-1.5 rounded-none">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Bertemu:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-right uppercase text-[11px] text-[#005DA6] dark:text-[#FFD500]">
                          {item.visited}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Keperluan:</span>
                        <span className="text-slate-700 dark:text-slate-300 text-right text-[11px] font-medium">
                          {item.purpose}
                        </span>
                      </div>
                    </div>

                    {/* Timestamps Grid (4 Columns: IN, POS 2, LOBBY, OUT) */}
                    <div className="grid grid-cols-4 gap-1 text-[10px] font-mono bg-slate-100 dark:bg-slate-950/40 p-2 border border-slate-200/60 dark:border-slate-800 text-center">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">IN</span>
                        <span className="text-[8px] text-slate-400 block -mt-0.5 mb-0.5 font-sans font-normal truncate">Maingate</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {item.inTime ? item.inTime.split(' - ')[1] || item.inTime : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold truncate">POS 2</span>
                        <span className="text-[8px] text-slate-400 block -mt-0.5 mb-0.5 font-sans font-normal truncate">
                          {item.stakeholder === 'AGP' ? 'Total 8' : item.stakeholder === 'KPJB' ? 'KPJB' : 'N/A'}
                        </span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {item.secondGateTime ? item.secondGateTime.split(' - ')[1] || item.secondGateTime : (item.stakeholder === 'PLN' || item.stakeholder === 'TJBPS' ? '-' : '-')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold truncate">LOBBY</span>
                        <span className="text-[8px] text-slate-400 block -mt-0.5 mb-0.5 font-sans font-normal truncate">Recep</span>
                        <span className="font-bold text-sky-600 dark:text-sky-400">
                          {item.receptionistTime ? item.receptionistTime.split(' - ')[1] || item.receptionistTime : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">OUT</span>
                        <span className="text-[8px] text-slate-400 block -mt-0.5 mb-0.5 font-sans font-normal truncate">Keluar</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {item.outTime ? item.outTime.split(' - ')[1] || item.outTime : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onViewBadge(item)}
                        title="Cetak Pass Masuk Tamu"
                        className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-[#005DA6] hover:text-white text-[#005DA6] dark:text-[#FFD500] border border-[#005DA6] text-[10px] font-bold uppercase transition-all cursor-pointer"
                      >
                        <Printer size={12} /> Cetak
                      </button>
                      {item.phone && (
                        <a
                          href={generateWhatsAppPassUrl(item, getProductionPassUrl(item.id))}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Kirim Pass via WhatsApp"
                          className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-600 dark:text-emerald-400 border border-emerald-500 text-[10px] font-bold uppercase transition-all cursor-pointer"
                        >
                          <MessageSquare size={12} /> WA
                        </a>
                      )}
                      {item.email && onResendEmail && (
                        <button
                          onClick={() => {
                            setIsResendingEmail(item.id);
                            onResendEmail(item).finally(() => setIsResendingEmail(null));
                          }}
                          disabled={isResendingEmail === item.id}
                          title={`Kirim Ulang Tiket Email (${item.email})`}
                          className="flex items-center gap-1 px-2 py-1 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-600 hover:text-white text-sky-600 dark:text-sky-400 border border-sky-500 text-[10px] font-bold uppercase transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isResendingEmail === item.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Mail size={12} />
                          )}
                          Email
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {item.status === 'SCHEDULED' && (
                        <>
                          <button
                            onClick={() => onViewBadge(item)}
                            className="px-2 py-1 bg-[#005DA6] hover:bg-[#004070] text-[#FFD500] border border-[#FFD500] text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1"
                            title="Buka Barcode QR Pass Tamu"
                          >
                            <QrCode size={11} /> Barcode
                          </button>
                          {onCheckInAppointment && (
                            <button
                              onClick={() => onCheckInAppointment(item.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1"
                            >
                              <UserCheck2 size={11} /> Check-In 1
                            </button>
                          )}
                        </>
                      )}
                      {item.status === 'IN-PROGRESS' && (
                        <button
                          onClick={() => onCheckOut(item.id)}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase cursor-pointer"
                        >
                          Check-Out
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(item)}
                        title="Ubah Rincian"
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
                      >
                        <SlidersHorizontal size={13} />
                      </button>
                      {currentUserRole === 'SUPERADMIN' && (
                        <button
                          onClick={() => onDelete(item.id)}
                          title="Hapus Data"
                          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 border border-rose-200 dark:border-rose-900 transition-all cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="col-span-full p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <AlertTriangle className="text-amber-500 mx-auto" size={32} />
              <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200 mt-2">
                Data Tamu Tidak Ditemukan
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Laptop / Desktop Full Width Table Canvas */
        <div className="overflow-auto flex-1 min-h-0 w-full">
          <table className="min-w-[1350px] w-full text-left border-collapse">
            <thead>
              {/* Main Header Labels */}
              <tr className="bg-slate-100 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/50 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider select-none">
                
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded-none accent-[#005DA6] w-4 h-4 cursor-pointer"
                  />
                </th>

                <th
                  onClick={() => handleSort('id')}
                  className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all font-mono w-32"
                >
                  <div className="flex items-center gap-1">
                    Form ID
                    {sortField === 'id' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('stakeholder' as any)}
                  className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all min-w-[190px]"
                >
                  <div className="flex flex-col items-start leading-tight">
                    <div className="flex items-center gap-1">
                      <span>ENTITAS & AREA</span>
                      {sortField === ('stakeholder' as any) && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </div>
                    <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-normal tracking-tight">
                      (Unit / Bidang Tujuan)
                    </span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('schedule')}
                  className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all min-w-[125px]"
                >
                  <div className="flex items-center gap-1">
                    Schedule
                    {sortField === 'schedule' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('inTime')}
                  className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all min-w-[120px]"
                >
                  <div className="flex flex-col items-start leading-tight">
                    <div className="flex items-center gap-1">
                      <span>IN</span>
                      {sortField === 'inTime' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal tracking-tight">
                      (Maingate)
                    </span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('secondGateTime' as any)}
                  className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all whitespace-nowrap min-w-[140px]"
                >
                  <div className="flex flex-col items-start leading-tight">
                    <div className="flex items-center gap-1">
                      <span>POS 2</span>
                      {sortField === ('secondGateTime' as any) && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </div>
                    <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-normal tracking-tight">
                      (KPJB / Total 8)
                    </span>
                  </div>
                </th>

                <th
                  className="p-4 whitespace-nowrap min-w-[135px]"
                >
                  <div className="flex flex-col items-start leading-tight">
                    <span>RECEPTIONIST</span>
                    <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-normal tracking-tight">
                      (Lobby Kantor)
                    </span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('outTime')}
                  className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all min-w-[110px]"
                >
                  <div className="flex items-center gap-1">
                    OUT
                    {sortField === 'outTime' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('visitorName')}
                  className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all min-w-[140px]"
                >
                  <div className="flex items-center gap-1">
                    Visitor
                    {sortField === 'visitorName' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>

                <th className="p-4 min-w-[110px]">Gate Pass</th>

                <th
                  onClick={() => handleSort('company')}
                  className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all min-w-[150px]"
                >
                  <div className="flex items-center gap-1">
                    Company
                    {sortField === 'company' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('purpose')}
                  className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all text-xs min-w-[130px]"
                >
                  <div className="flex items-center gap-1 text-slate-550">
                    Purpose
                    {sortField === 'purpose' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('visited')}
                  className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all min-w-[170px]"
                >
                  <div className="flex items-center gap-1">
                    Visited
                    {sortField === 'visited' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('status')}
                  className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all text-center min-w-[130px]"
                >
                  <div className="flex items-center justify-center gap-1">
                    Status
                    {sortField === 'status' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>

                <th className="p-4 text-center min-w-[220px] sticky right-0 bg-slate-100 dark:bg-slate-950 z-10 shadow-[-4px_0_8px_rgba(0,0,0,0.06)]">
                  Aksi
                </th>
              </tr>

              {/* Column Date Filter Inputs */}
              <tr className="bg-slate-50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800/80 font-mono text-[10px]">
                <td className="p-2 border-r border-slate-100 dark:border-slate-800"></td>
                <td className="p-2 border-r border-slate-100 dark:border-slate-800"></td>
                <td className="p-2 border-r border-slate-100 dark:border-slate-800"></td>
                
                {/* Schedule date search input */}
                <td className="p-1 px-2 border-r border-slate-100 dark:border-slate-800">
                  <div className="relative">
                    <input
                      type="text"
                      value={scheduleFilter}
                      onChange={(e) => setScheduleFilter(e.target.value)}
                      placeholder="dd/mm/yyyy"
                      className="w-full text-[10px] px-2 py-1 bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#005DA6] placeholder-slate-400"
                    />
                  </div>
                </td>

                {/* IN date search input */}
                <td className="p-1 px-2 border-r border-slate-100 dark:border-slate-800">
                  <div className="relative">
                    <input
                      type="text"
                      value={inFilter}
                      onChange={(e) => setInFilter(e.target.value)}
                      placeholder="dd/mm/yyyy"
                      className="w-full text-[10px] px-2 py-1 bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#005DA6] placeholder-slate-400"
                    />
                  </div>
                </td>

                {/* SECOND GATE date search input */}
                <td className="p-1 px-2 border-r border-slate-100 dark:border-slate-800">
                  <div className="relative">
                    <input
                      type="text"
                      value={secondGateFilter}
                      onChange={(e) => setSecondGateFilter(e.target.value)}
                      placeholder="dd/mm/yyyy"
                      className="w-full text-[10px] px-2 py-1 bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#005DA6] placeholder-slate-400"
                    />
                  </div>
                </td>

                {/* RECEPTIONIST date search input */}
                <td className="p-1 px-2 border-r border-slate-100 dark:border-slate-800">
                  <div className="relative">
                    <input
                      type="text"
                      value={receptionistFilter}
                      onChange={(e) => setReceptionistFilter(e.target.value)}
                      placeholder="dd/mm/yyyy"
                      className="w-full text-[10px] px-2 py-1 bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#005DA6] placeholder-slate-400"
                    />
                  </div>
                </td>

                {/* OUT date search input */}
                <td className="p-1 px-2 border-r border-slate-100 dark:border-slate-800">
                  <div className="relative">
                    <input
                      type="text"
                      value={outFilter}
                      onChange={(e) => setOutFilter(e.target.value)}
                      placeholder="dd/mm/yyyy"
                      className="w-full text-[10px] px-2 py-1 bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#005DA6] placeholder-slate-400"
                    />
                  </div>
                </td>

                <td className="p-2 border-r border-slate-100 dark:border-slate-800"></td>
                <td className="p-2 border-r border-slate-100 dark:border-slate-800"></td>
                <td className="p-2 border-r border-slate-100 dark:border-slate-800"></td>
                <td className="p-2 border-r border-slate-100 dark:border-slate-800"></td>
                <td className="p-2 border-r border-slate-100 dark:border-slate-800"></td>
                <td className="p-2 border-r border-slate-100 dark:border-slate-800"></td>
                <td className="p-2 sticky right-0 bg-slate-50 dark:bg-slate-950 z-10 shadow-[-4px_0_8px_rgba(0,0,0,0.06)]"></td>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {currentPagedItems.length > 0 ? (
                currentPagedItems.map((item, index) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#f6faff]/80 dark:hover:bg-slate-800/30 transition-all duration-150 text-xs font-semibold ${
                        isSelected
                          ? 'bg-amber-50/40 dark:bg-amber-950/10'
                          : index % 2 === 0
                          ? 'bg-white dark:bg-slate-900'
                          : 'bg-slate-50/50 dark:bg-slate-950/20'
                      }`}
                    >
                      {/* Checkbox select */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                          className="rounded-none accent-[#005DA6] w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Form ID Link */}
                      <td className="p-4 font-bold text-[#005DA6] dark:text-[#FFD500] hover:underline cursor-pointer font-mono" onClick={() => onViewBadge(item)}>
                        {item.id}
                      </td>

                      {/* Stakeholder / Entitas & Tempat Area - Full text, no truncate clipping */}
                      <td className="p-4 min-w-[190px]">
                        <div className="flex flex-col items-start gap-1">
                          {getStakeholderBadge(item.stakeholder)}
                          <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase leading-tight whitespace-normal break-words" title={item.visited}>
                            {item.visited}
                          </span>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                        {item.schedule}
                      </td>

                      {/* IN Timestamp & Action Button */}
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                        {item.inTime ? (
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-700 rounded-none text-[10px] font-black flex items-center gap-1 font-mono shadow-2xs">
                              <Check size={11} className="text-emerald-600 dark:text-emerald-400" />
                              <span>{item.inTime.split(' - ')[1] ? `⏰ ${item.inTime.split(' - ')[1]} WIB` : item.inTime}</span>
                            </span>
                            <span className="text-[8.5px] text-slate-400 dark:text-slate-500 font-sans truncate">
                              {item.inTime.split(' - ')[0] || ''}
                            </span>
                          </div>
                        ) : (
                          item.status === 'SCHEDULED' ? (
                            <button
                              onClick={() => onCheckInAppointment && onCheckInAppointment(item.id)}
                              className="px-2.5 py-1 bg-[#005DA6] hover:bg-[#004070] active:bg-[#003056] text-white font-extrabold rounded-none text-[10px] border-b border-r border-[#FFD500] shadow-sm transition-all flex items-center justify-center gap-1.5 inline-block cursor-pointer"
                              title="Konfirmasi Tamu Tiba di Pos 1 Utama (Maingate)"
                            >
                              <UserCheck2 size={11} className="text-[#FFD500]" />
                              + Check-In 1
                            </button>
                          ) : item.status === 'PENDING' ? (
                            <div
                              className="flex items-center justify-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 rounded-none text-[9.5px] font-bold select-none cursor-not-allowed shadow-2xs"
                              title="Check-In Terkunci: Menunggu persetujuan Janji Temu oleh Admin terlebih dahulu."
                            >
                              <Lock size={10} className="shrink-0 text-amber-600 dark:text-amber-400" />
                              <span>Perlu Approval</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-sans italic">-</span>
                          )
                        )}
                      </td>

                      {/* POS 2 (Gate Unit: KPJB / Pos Total 8 AGP) */}
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                        {item.stakeholder === 'KPJB' || item.stakeholder === 'AGP' ? (
                          item.secondGateTime ? (
                            item.status === 'IN-PROGRESS' ? (
                              <button
                                onClick={() => onSecondGateCheckIn && onSecondGateCheckIn(item.id)}
                                className="px-2 py-1 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-extrabold rounded-none text-[10px] border-b border-r border-purple-300 shadow-sm transition-all flex flex-col items-start gap-0.5 cursor-pointer font-mono"
                                title={`Klik untuk konfirmasi ulang jam Pos 2 (${item.stakeholder === 'AGP' ? 'Pos Total 8' : 'Gate KPJB'})`}
                              >
                                <div className="flex items-center gap-1">
                                  <Layers size={11} className="text-purple-200" />
                                  <span>{item.secondGateTime}</span>
                                </div>
                                {item.secondGatePass && (
                                  <span className="text-[8.5px] font-bold bg-purple-900/60 text-purple-200 px-1 py-0.2 rounded-none">
                                    {item.secondGatePass}
                                  </span>
                                )}
                              </button>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{item.secondGateTime}</span>
                            )
                          ) : (item.status === 'IN-PROGRESS' || item.status === 'SCHEDULED') ? (
                            <button
                              onClick={() => onSecondGateCheckIn && onSecondGateCheckIn(item.id)}
                              className="px-2 py-1 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold rounded-none text-[10px] border-b border-r border-purple-300 shadow-sm transition-all flex items-center justify-center gap-1.5 inline-block cursor-pointer"
                              title={`Konfirmasi Akses ${item.stakeholder === 'AGP' ? 'Pos Total 8' : 'Second Gate KPJB'}`}
                            >
                              <Layers size={11} />
                              {item.stakeholder === 'AGP' ? '+ Pos Total 8' : '+ Gate KPJB'}
                            </button>
                          ) : (
                            <span className="text-slate-400 font-sans italic">-</span>
                          )
                        ) : (
                          <div className="flex flex-col items-start leading-tight">
                            <span className="text-[9.5px] font-sans font-semibold text-slate-500 dark:text-slate-400">
                              Langsung / Direct
                            </span>
                            <span className="text-[8px] font-sans text-slate-400 dark:text-slate-500 italic">
                              (Lobby Kantor {item.stakeholder || 'PLN'})
                            </span>
                          </div>
                        )}
                      </td>

                      {/* RECEPTIONIST (Lobby Kantor Unit) */}
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                        {item.receptionistTime ? (
                          <button
                            onClick={() => onReceptionistCheckIn && onReceptionistCheckIn(item.id)}
                            className="px-2 py-1 bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white font-extrabold rounded-none text-[10px] border-b border-r border-sky-300 shadow-sm transition-all flex flex-col items-start gap-0.5 cursor-pointer font-mono"
                            title={`Tamu sudah diterima di Meja Resepsionis ${item.stakeholder || 'PLN'}`}
                          >
                            <div className="flex items-center gap-1">
                              <Building size={11} className="text-sky-200" />
                              <span>{item.receptionistTime}</span>
                            </div>
                            {item.receptionistBadge && (
                              <span className="text-[8.5px] font-bold bg-sky-900/60 text-sky-200 px-1 py-0.2 rounded-none">
                                {item.receptionistBadge}
                              </span>
                            )}
                          </button>
                        ) : (item.status === 'IN-PROGRESS' || item.inTime) ? (
                          <button
                            onClick={() => onReceptionistCheckIn && onReceptionistCheckIn(item.id)}
                            className="px-2 py-1 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold rounded-none text-[10px] border-b border-r border-sky-300 shadow-sm transition-all flex items-center justify-center gap-1.5 inline-block cursor-pointer"
                            title={`Konfirmasi Tamu Tiba di Meja Receptionist ${item.stakeholder || 'PLN'}`}
                          >
                            <Building size={11} />
                            + Terima Lobby
                          </button>
                        ) : (
                          <span className="text-slate-400 font-sans italic">-</span>
                        )}
                      </td>

                      {/* OUT Timestamp / Check-Out Action Button */}
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                        {item.outTime ? (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Check size={10} className="text-emerald-500" />
                            {item.outTime}
                          </span>
                        ) : item.status === 'IN-PROGRESS' ? (
                          <button
                            onClick={() => onCheckOut(item.id)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-extrabold rounded-none text-[10px] border-b border-r border-amber-300 shadow-sm transition-all flex items-center justify-center gap-1.5 inline-block cursor-pointer"
                          >
                            <Check size={11} />
                            Check-Out
                          </button>
                        ) : item.status === 'PENDING' ? (
                          <button
                            onClick={() => onApproveBooking && onApproveBooking(item.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-none text-[10px] border-b border-r border-emerald-300 shadow-sm transition-all flex items-center justify-center gap-1.5 inline-block cursor-pointer whitespace-nowrap"
                            title="Setujui Janji Temu Sekretariat"
                          >
                            <CheckSquare size={11} />
                            Setujui Janji
                          </button>
                        ) : item.status === 'SCHEDULED' ? (
                          <button
                            onClick={() => onViewBadge(item)}
                            className="px-2.5 py-1 bg-[#005DA6] hover:bg-[#004070] text-white font-bold rounded-none text-[10px] border-b border-r border-[#FFD500] shadow-sm transition-all flex items-center justify-center gap-1.5 inline-block cursor-pointer whitespace-nowrap"
                            title="Buka Barcode QR Pass Tamu"
                          >
                            <QrCode size={11} className="text-[#FFD500]" />
                            Buka Barcode
                          </button>
                        ) : (
                          <span className="text-slate-400 font-sans italic">-</span>
                        )}
                      </td>

                      {/* Visitor Name with Quick Action Menu Trigger */}
                      <td className="p-4 text-slate-800 dark:text-slate-100 font-extrabold uppercase">
                        <button
                          onClick={() => setQuickActionVisitor(item)}
                          className="group flex items-center gap-1.5 text-[#005DA6] dark:text-[#FFD500] hover:underline font-black cursor-pointer text-left uppercase"
                          title="Klik untuk Menu Aksi, Edit & Alokasi Jadwal"
                        >
                          <span>{item.visitorName}</span>
                          <ExternalLink size={12} className="opacity-60 group-hover:opacity-100 shrink-0" />
                        </button>
                      </td>

                      {/* Gate Passes */}
                      <td className="p-4 min-w-[110px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-[10px] text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/20 px-1 rounded-none border border-amber-200/50 dark:border-amber-900/30 block w-fit whitespace-nowrap">
                            {item.mainGatePass || '-'}
                          </span>
                          {item.secondGatePass && (
                            <span className="font-mono text-[10px] text-sky-600 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-950/20 px-1 rounded-none border border-sky-200/50 dark:border-sky-900/30 block w-fit whitespace-nowrap mt-0.5">
                              {item.secondGatePass}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Company - Full text, no truncate clipping */}
                      <td className="p-4 text-slate-600 dark:text-slate-300 font-extrabold uppercase min-w-[150px] whitespace-normal break-words" title={item.company}>
                        {item.company}
                      </td>

                      {/* Purpose - Full text, no truncate clipping */}
                      <td className="p-4 text-slate-500 dark:text-slate-400 capitalize min-w-[130px] whitespace-normal break-words" title={item.purpose}>
                        {item.purpose}
                      </td>

                      {/* Visited employee/department - Full text, highlighted */}
                      <td className="p-4 text-slate-800 dark:text-slate-200 font-bold uppercase min-w-[170px] whitespace-normal break-words" title={item.visited}>
                        <span className="text-[#005DA6] dark:text-[#FFD500] font-black">{item.visited}</span>
                      </td>

                      {/* Status badge - Full visibility */}
                      <td className="p-4 text-center min-w-[130px] whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Row action shortcuts - Sticky on the right */}
                      <td className="p-3 text-center min-w-[220px] sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors shadow-[-4px_0_8px_rgba(0,0,0,0.06)] z-10">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">

                          {/* View Barcode Pass */}
                          <button
                            onClick={() => onViewBadge(item)}
                            title="Buka Barcode QR Pass Tamu Digital"
                            className="p-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-[#005DA6] hover:text-white text-[#005DA6] dark:text-[#FFD500] rounded-none border border-[#005DA6]/40 dark:border-[#FFD500]/40 transition-all cursor-pointer shadow-2xs"
                          >
                            <QrCode size={18} />
                          </button>

                          {/* Print Pass */}
                          <button
                            onClick={() => onViewBadge(item)}
                            title="Cetak Pass Masuk Tamu"
                            className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-600 hover:text-white text-slate-600 dark:text-slate-300 rounded-none border border-slate-300 dark:border-slate-600 transition-all cursor-pointer shadow-2xs"
                          >
                            <Printer size={18} />
                          </button>

                          {/* Quick WhatsApp Pass Send (if phone available) */}
                          {item.phone && (
                            <a
                              href={generateWhatsAppPassUrl(item, getProductionPassUrl(item.id))}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Kirim Barcode Pass ke WhatsApp (${item.phone})`}
                              className="p-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-600 dark:text-emerald-400 rounded-none border border-emerald-400 dark:border-emerald-700 transition-all cursor-pointer inline-flex items-center shadow-2xs"
                            >
                              <MessageSquare size={18} />
                            </a>
                          )}

                          {/* Quick Resend Email Pass (if email available) */}
                          {item.email && onResendEmail && (
                            <button
                              onClick={() => {
                                setIsResendingEmail(item.id);
                                onResendEmail(item).finally(() => setIsResendingEmail(null));
                              }}
                              disabled={isResendingEmail === item.id}
                              title={`Kirim Ulang Tiket Email (${item.email})`}
                              className="p-2 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-600 hover:text-white text-sky-600 dark:text-sky-400 rounded-none border border-sky-400 dark:border-sky-700 transition-all cursor-pointer inline-flex items-center disabled:opacity-50 shadow-2xs"
                            >
                              {isResendingEmail === item.id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Mail size={18} />
                              )}
                            </button>
                          )}

                          {/* Edit details */}
                          <button
                            onClick={() => onEdit(item)}
                            title="Ubah Rincian"
                            className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-500 hover:text-white text-slate-500 dark:text-slate-400 rounded-none border border-slate-300 dark:border-slate-600 transition-all cursor-pointer shadow-2xs"
                          >
                            <SlidersHorizontal size={18} />
                          </button>

                          {/* Delete record - Superadmin only */}
                          {currentUserRole === 'SUPERADMIN' && (
                            <button
                              onClick={() => onDelete(item.id)}
                              title="Hapus Data"
                              className="p-2 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-600 hover:text-white text-rose-500 dark:text-[#FF3B30] rounded-none border border-rose-400 dark:border-rose-800 transition-all cursor-pointer shadow-2xs"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={13} className="p-12 text-center bg-white dark:bg-slate-900">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <AlertTriangle className="text-amber-500" size={36} />
                      <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200 mt-2">
                        Data Tamu Tidak Ditemukan
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                        Tidak ada permohonan atau log kunjungan tamu yang sesuai dengan filter saat ini.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 px-4 py-2 bg-[#005DA6] text-[#FFD500] font-bold text-xs rounded-none uppercase hover:bg-[#004070] cursor-pointer"
                      >
                        Reset Pencarian & Filter
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination & Show Entries Footer */}
      <div className="p-5 border-t border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-950 select-none">
        
        {/* Entries select dropdown */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(parseInt(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1.5 bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-800 rounded-none text-slate-700 dark:text-slate-300 font-bold focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>entries</span>
        </div>

        {/* Info stats */}
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans">
          Showing {totalEntries > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, totalEntries)} of {totalEntries} entries
          {filteredItems.length !== visitors.length && ` (filtered from ${visitors.length} total entries)`}
        </div>

        {/* Buttons Pagination */}
        <div className="flex items-center gap-1 font-semibold text-xs">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 rounded-none border text-xs font-bold transition-all ${
              currentPage === 1
                ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border-slate-150 dark:border-slate-800/80 cursor-not-allowed'
                : 'bg-white dark:bg-[#152033] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-pointer shadow-2xs'
            }`}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              // Only display around the current page
              return p === 1 || p === totalPages || Math.abs(currentPage - p) <= 1;
            })
            .map((p, index, arr) => {
              // Add dots representation
              const showDotsBefore = index > 0 && p - arr[index - 1] > 1;
              return (
                <React.Fragment key={p}>
                  {showDotsBefore && (
                    <span className="px-2 text-slate-400 select-none font-bold">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(p)}
                    className={`min-w-[32px] h-8 rounded-none text-xs font-black transition-all ${
                      currentPage === p
                        ? 'bg-[#005DA6] text-[#FFD500] border border-[#005DA6]'
                        : 'bg-white dark:bg-[#152033] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 rounded-none border text-xs font-bold transition-all ${
              currentPage === totalPages
                ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border-slate-155 dark:border-slate-800/80 cursor-not-allowed'
                : 'bg-white dark:bg-[#152033] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 cursor-pointer shadow-2xs'
            }`}
          >
            Next
          </button>
        </div>

      </div>

      {/* Interactive Visitor Quick Action / Reschedule Menu Modal */}
      {quickActionVisitor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in font-sans overflow-y-auto">
          <div className="premium-glass max-w-lg w-full rounded-none shadow-2xl border border-[#005DA6]/25 dark:border-[#FFD500]/25 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-[#005DA6] text-white px-4 sm:px-5 py-3.5 flex items-center justify-between border-b-2 border-[#FFD500] shrink-0">
              <div className="min-w-0 flex-1 pr-2">
                <span className="text-[9px] uppercase font-bold tracking-widest text-[#FFD500] block">Menu Aksi & Alokasi Jadwal Tamu</span>
                <h3 className="text-sm sm:text-base font-black uppercase tracking-tight font-display text-white truncate" title={quickActionVisitor.visitorName}>
                  {quickActionVisitor.visitorName}
                </h3>
              </div>
              <button
                onClick={() => {
                  setQuickActionVisitor(null);
                  setIsRejecting(false);
                  setRejectReason('');
                }}
                className="p-1 hover:bg-white/20 rounded-none text-white transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Visitor Detail Content */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950/40 p-3.5 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Form ID</span>
                  <span className="font-mono font-bold text-[#005DA6] dark:text-[#FFD500] text-sm">{quickActionVisitor.id}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Status Saat Ini</span>
                  <span className="mt-0.5 inline-block">{getStatusBadge(quickActionVisitor.status)}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Instansi / Perusahaan</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{quickActionVisitor.company}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Pegawai / Divisi Dituju</span>
                  <span className="font-bold text-[#005DA6] dark:text-[#FFD500] uppercase">{quickActionVisitor.visited}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Jadwal / Waktu Pertemuan</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{quickActionVisitor.schedule}</span>
                </div>
                {quickActionVisitor.purpose && (
                  <div className="col-span-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Tujuan Kunjungan</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300 capitalize">{quickActionVisitor.purpose}</span>
                  </div>
                )}
              </div>

              {/* Quick Actions List */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Pilih Tindakan / Alokasi</span>

                {/* Action 1: Edit & Reschedule */}
                <button
                  onClick={() => {
                    onEdit(quickActionVisitor);
                    setQuickActionVisitor(null);
                  }}
                  className="w-full p-3 bg-white dark:bg-[#152033] hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-sky-100 dark:bg-sky-950/50 text-[#005DA6] dark:text-sky-400">
                      <SlidersHorizontal size={15} />
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-[#005DA6] dark:text-[#FFD500] uppercase">Ubah Data & Alokasikan Tanggal Baru</span>
                      <span className="text-[10px] text-slate-400 font-normal">Edit tanggal/jam pertemuan, gate pass, atau divisi</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Action 2: Approve Appointment (if PENDING) */}
                {quickActionVisitor.status === 'PENDING' && (
                  <button
                    onClick={() => {
                      if (onApproveBooking) onApproveBooking(quickActionVisitor.id);
                      setQuickActionVisitor(null);
                      setIsRejecting(false);
                    }}
                    className="w-full p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-500/20 text-white">
                        <CheckSquare size={15} />
                      </div>
                      <div className="text-left">
                        <span className="block font-black uppercase">Setujui Janji Temu (Approval Sekretariat)</span>
                        <span className="text-[10px] text-emerald-100 font-normal">Ubah status menjadi SCHEDULED & terbitkan QR Pass ke email</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* WhatsApp Instant Pass Dispatch Button (if phone available) */}
                {quickActionVisitor.phone && (
                  <a
                    href={generateWhatsAppPassUrl(quickActionVisitor, getProductionPassUrl(quickActionVisitor.id))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-500/20 text-white">
                        <MessageSquare size={15} />
                      </div>
                      <div className="text-left">
                        <span className="block font-black uppercase">Kirim Barcode Pass via WhatsApp ({quickActionVisitor.phone})</span>
                        <span className="text-[10px] text-emerald-100 font-normal">Buka chat WhatsApp dan kirim pesan resmi link pass ke tamu</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                )}

                {/* Resend Email Pass Button */}
                {quickActionVisitor.email ? (
                  <button
                    onClick={async () => {
                      if (onResendEmail) {
                        setIsResendingEmail(quickActionVisitor.id);
                        await onResendEmail(quickActionVisitor);
                        setIsResendingEmail(null);
                      }
                    }}
                    disabled={isResendingEmail === quickActionVisitor.id}
                    className="w-full p-3 bg-[#005DA6] hover:bg-[#004070] disabled:bg-slate-400 text-white rounded-none text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-500/20 text-white">
                        {isResendingEmail === quickActionVisitor.id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Mail size={15} />
                        )}
                      </div>
                      <div className="text-left">
                        <span className="block font-black uppercase">
                          {isResendingEmail === quickActionVisitor.id
                            ? 'Sedang Mengirim Ulang Email...'
                            : `Kirim Ulang Tiket Email (${quickActionVisitor.email})`}
                        </span>
                        <span className="text-[10px] text-blue-100 font-normal">
                          Kirim ulang barcode pass digital & surat konfirmasi ke email tamu
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-blue-200 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail size={15} className="text-slate-400 shrink-0" />
                      <span>Email tamu belum terisi</span>
                    </div>
                    <button
                      onClick={() => {
                        onEdit(quickActionVisitor);
                        setQuickActionVisitor(null);
                      }}
                      className="text-[#005DA6] dark:text-[#FFD500] font-bold text-[10px] hover:underline uppercase cursor-pointer"
                    >
                      + Tambah Email
                    </button>
                  </div>
                )}

                {/* Action 3: Reject / Decline Appointment */}
                {(quickActionVisitor.status === 'PENDING' || quickActionVisitor.status === 'SCHEDULED') && (
                  <div className="space-y-2">
                    {!isRejecting ? (
                      <button
                        onClick={() => setIsRejecting(true)}
                        className="w-full p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-none text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-rose-500/20 text-white">
                            <X size={15} />
                          </div>
                          <div className="text-left">
                            <span className="block font-black uppercase">Tolak / Rejek Pengajuan Kunjungan</span>
                            <span className="text-[10px] text-rose-100 font-normal">Tolak permohonan kunjungan & sertakan alasan penolakan</span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-rose-200 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ) : (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 rounded-none space-y-2.5 text-xs animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-rose-700 dark:text-rose-300 uppercase tracking-wide flex items-center gap-1.5">
                            <AlertTriangle size={14} /> Form Alasan Penolakan Kunjungan
                          </span>
                          <button
                            onClick={() => setIsRejecting(false)}
                            className="text-xs text-slate-400 hover:text-slate-600 underline font-semibold cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            'Pegawai Tujuan sedang Dinas Luar / Cuti',
                            'Jadwal Pertemuan Bertabrakan',
                            'Dokumen / Persyaratan Belum Lengkap',
                            'Perubahan Agenda Internal PLN'
                          ].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setRejectReason(preset)}
                              className="text-[9.5px] font-bold px-2 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-rose-400 cursor-pointer"
                            >
                              + {preset}
                            </button>
                          ))}
                        </div>

                        <textarea
                          rows={2}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Tuliskan catatan alasan penolakan secara spesifik..."
                          className="w-full px-3 py-2 bg-white dark:bg-[#152033] border border-rose-300 dark:border-rose-800 rounded-none text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />

                        <button
                          onClick={() => {
                            if (onRejectBooking) {
                              onRejectBooking(quickActionVisitor.id, rejectReason);
                            }
                            setQuickActionVisitor(null);
                            setIsRejecting(false);
                            setRejectReason('');
                          }}
                          className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-none cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <X size={14} /> Konfirmasi Tolak Pengajuan
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Action 3: Confirm Arrival (Only if SCHEDULED) */}
                {quickActionVisitor.status === 'SCHEDULED' && (
                  <button
                    onClick={() => {
                      if (onCheckInAppointment) onCheckInAppointment(quickActionVisitor.id);
                      setQuickActionVisitor(null);
                    }}
                    className="w-full p-3 bg-[#005DA6] hover:bg-[#004070] text-white border-b-2 border-r-2 border-[#FFD500] rounded-none text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white/10 text-[#FFD500]">
                        <UserCheck2 size={15} />
                      </div>
                      <div className="text-left">
                        <span className="block font-black uppercase">Konfirmasi Kedatangan Tiba (Check-In Pos 1)</span>
                        <span className="text-[10px] text-sky-200 font-normal">Aktifkan kunjungan & catat jam masuk Pos 1</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#FFD500] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* Notice for PENDING in Quick Action */}
                {quickActionVisitor.status === 'PENDING' && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-none flex items-start gap-2.5">
                    <Lock size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                      Check-In Pos 1 saat ini <strong>terkunci</strong>. Silakan klik tombol hijau <strong>Setujui Janji Temu</strong> di atas untuk mengaktifkan barcode pass dan membuka akses check-in.
                    </p>
                  </div>
                )}

                {/* Action 4: Second Gate Pass (Pos 2 - KPJB & AGP Only) */}
                {(quickActionVisitor.stakeholder === 'KPJB' || quickActionVisitor.stakeholder === 'AGP') &&
                  (quickActionVisitor.status === 'IN-PROGRESS' || quickActionVisitor.status === 'SCHEDULED' || Boolean(quickActionVisitor.inTime)) && (
                    <button
                      onClick={() => {
                        if (onSecondGateCheckIn) onSecondGateCheckIn(quickActionVisitor.id);
                        setQuickActionVisitor(null);
                      }}
                      className="w-full p-3 bg-purple-700 hover:bg-purple-800 text-white rounded-none text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-purple-500/20 text-white">
                          <Layers size={15} />
                        </div>
                        <div className="text-left">
                          <span className="block font-black uppercase">
                            {quickActionVisitor.stakeholder === 'AGP' ? 'Konfirmasi Pos Total 8 (AGP)' : 'Konfirmasi Second Gate KPJB'}
                          </span>
                          <span className="text-[10px] text-purple-200 font-normal">
                            {quickActionVisitor.secondGateTime
                              ? `Tercatat: ${quickActionVisitor.secondGateTime}`
                              : `Verifikasi & Beri Gate Pass ${quickActionVisitor.stakeholder}`}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-purple-200 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                {/* Action 5: Receptionist / Lobby Reception Check-In (All Stakeholders) */}
                {(quickActionVisitor.status === 'IN-PROGRESS' || Boolean(quickActionVisitor.inTime)) && (
                  <button
                    onClick={() => {
                      if (onReceptionistCheckIn) onReceptionistCheckIn(quickActionVisitor.id);
                      setQuickActionVisitor(null);
                    }}
                    className="w-full p-3 bg-sky-600 hover:bg-sky-700 text-white rounded-none text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-sky-500/20 text-white">
                        <Building size={15} />
                      </div>
                      <div className="text-left">
                        <span className="block font-black uppercase">
                          Konfirmasi Tiba di Receptionist {quickActionVisitor.stakeholder || 'PLN'}
                        </span>
                        <span className="text-[10px] text-sky-100 font-normal">
                          {quickActionVisitor.receptionistTime
                            ? `Tercatat di Lobby: ${quickActionVisitor.receptionistTime}`
                            : `Terima Tamu di Meja Resepsionis ${quickActionVisitor.stakeholder || 'PLN'}`}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-sky-200 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* Action 4: Check Out (if IN-PROGRESS) */}
                {quickActionVisitor.status === 'IN-PROGRESS' && (
                  <button
                    onClick={() => {
                      onCheckOut(quickActionVisitor.id);
                      setQuickActionVisitor(null);
                    }}
                    className="w-full p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-none text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-600/30 text-white">
                        <Check size={15} />
                      </div>
                      <div className="text-left">
                        <span className="block font-black uppercase">Proses Check-Out Tamu</span>
                        <span className="text-[10px] text-amber-100 font-normal">Catat jam kepulangan & selesaikan kunjungan</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-amber-200 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* Action 5: Print Badge */}
                <button
                  onClick={() => {
                    onViewBadge(quickActionVisitor);
                    setQuickActionVisitor(null);
                  }}
                  className="w-full p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-none text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                      <Printer size={15} />
                    </div>
                    <div className="text-left">
                      <span className="block font-black uppercase">Lihat / Cetak Kartu Akses (Pass Tamu)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Tampilkan barcode & kartu id pengenal digital</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
