/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { Visitor, VisitorStatus } from '../types';

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
}

type SortField = 'id' | 'schedule' | 'inTime' | 'outTime' | 'visitorName' | 'company' | 'purpose' | 'visited' | 'status';

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
}: VisitorTableProps) {
  // Filtering states
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<VisitorStatus | 'ALL'>('ALL');
  const [filterPurpose, setFilterPurpose] = useState('ALL');
  const [scheduleFilter, setScheduleFilter] = useState('');
  const [inFilter, setInFilter] = useState('');
  const [secondGateFilter, setSecondGateFilter] = useState('');
  const [outFilter, setOutFilter] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Quick Action Modal & Rejection state
  const [quickActionVisitor, setQuickActionVisitor] = useState<Visitor | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Sorting states
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Multi-select row state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
    setScheduleFilter('');
    setInFilter('');
    setSecondGateFilter('');
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
      (item.email && item.email.toLowerCase().includes(search.toLowerCase())) ||
      (item.phone && item.phone.toLowerCase().includes(search.toLowerCase())) ||
      (item.identifyNo && item.identifyNo.toLowerCase().includes(search.toLowerCase()));

    // Filter statuses
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;

    // Filter purposes
    const matchesPurpose = filterPurpose === 'ALL' || item.purpose === filterPurpose;

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

    // Filter OUT Date
    const matchesOutFilter =
      !outFilter ||
      (item.outTime && item.outTime.toLowerCase().includes(outFilter.toLowerCase()));

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPurpose &&
      matchesScheduleFilter &&
      matchesInFilter &&
      matchesSecondGateFilter &&
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

      {/* Table Canvas */}
      <div className="overflow-auto flex-1 min-h-0 w-full">
        <table className="min-w-[1250px] w-full text-left border-collapse">
          <thead>
            {/* Main Header Labels */}
            <tr className="bg-slate-100 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/50 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider select-none">
              
              <th className="p-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={isAllPageSelected}
                  onChange={handleSelectAll}
                  className="rounded-none accent-[#005DA6] w-4 h-4 cursor-pointer"
                />
              </th>

              <th
                onClick={() => handleSort('id')}
                className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all font-mono w-40"
              >
                <div className="flex items-center gap-1">
                  Form ID
                  {sortField === 'id' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>

              <th
                onClick={() => handleSort('schedule')}
                className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center gap-1">
                  Schedule
                  {sortField === 'schedule' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>

              <th
                onClick={() => handleSort('inTime')}
                className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center gap-1">
                  IN
                  {sortField === 'inTime' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>

              <th
                onClick={() => handleSort('secondGateTime' as any)}
                className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  SECOND GATE
                  {sortField === ('secondGateTime' as any) && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>

              <th
                onClick={() => handleSort('outTime')}
                className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center gap-1">
                  OUT
                  {sortField === 'outTime' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>

              <th
                onClick={() => handleSort('visitorName')}
                className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center gap-1">
                  Visitor
                  {sortField === 'visitorName' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>

              <th className="p-4">Gate Pass</th>

              <th
                onClick={() => handleSort('company')}
                className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center gap-1">
                  Company
                  {sortField === 'company' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>

              <th
                onClick={() => handleSort('purpose')}
                className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all text-xs"
              >
                <div className="flex items-center gap-1 text-slate-550">
                  Purpose
                  {sortField === 'purpose' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>

              <th
                onClick={() => handleSort('visited')}
                className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center gap-1">
                  Visited
                  {sortField === 'visited' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>

              <th
                onClick={() => handleSort('status')}
                className="p-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  Status
                  {sortField === 'status' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>

              <th className="p-4 text-center">Aksi</th>
            </tr>

            {/* Column Date Filter Inputs (Directly modeled after image) */}
            <tr className="bg-slate-50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800/80 font-mono text-[10px]">
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
              <td className="p-2"></td>
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

                    {/* Schedule */}
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                      {item.schedule}
                    </td>

                    {/* IN Timestamp & Action Button */}
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                      {item.inTime ? (
                        // Sudah ada jam masuk — tombol aktif hanya untuk IN-PROGRESS (koreksi jam)
                        item.status === 'IN-PROGRESS' ? (
                          <button
                            onClick={() => onCheckInAppointment && onCheckInAppointment(item.id)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold rounded-none text-[10px] border-b border-r border-emerald-300 shadow-sm transition-all flex items-center justify-center gap-1.5 inline-block cursor-pointer font-mono"
                            title="Klik untuk memperbarui / konfirmasi ulang jam Check-In Pos 1"
                          >
                            <UserCheck2 size={11} className="text-[#FFD500]" />
                            <span>{item.inTime}</span>
                          </button>
                        ) : (
                          // DONE / REJECTED / EXPIRED — hanya tampilkan teks, tidak bisa diklik
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{item.inTime}</span>
                        )
                      ) : (
                        // Belum ada jam:
                        item.status === 'SCHEDULED' ? (
                          <button
                            onClick={() => onCheckInAppointment && onCheckInAppointment(item.id)}
                            className="px-2.5 py-1 bg-[#005DA6] hover:bg-[#004070] active:bg-[#003056] text-white font-extrabold rounded-none text-[10px] border-b border-r border-[#FFD500] shadow-sm transition-all flex items-center justify-center gap-1.5 inline-block cursor-pointer"
                            title="Konfirmasi Tamu Tiba di Pos 1 Utama"
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

                    {/* SECOND GATE Timestamp & Pass Button */}
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                      {item.secondGateTime ? (
                        // Sudah ada jam Pos 2 — tombol aktif hanya untuk IN-PROGRESS
                        item.status === 'IN-PROGRESS' ? (
                          <button
                            onClick={() => onSecondGateCheckIn && onSecondGateCheckIn(item.id)}
                            className="px-2 py-1 bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white font-extrabold rounded-none text-[10px] border-b border-r border-sky-300 shadow-sm transition-all flex flex-col items-start gap-0.5 cursor-pointer font-mono"
                            title="Klik untuk memperbarui / konfirmasi ulang jam Pos 2"
                          >
                            <div className="flex items-center gap-1">
                              <Layers size={11} className="text-sky-200" />
                              <span>{item.secondGateTime}</span>
                            </div>
                            {item.secondGatePass && (
                              <span className="text-[8.5px] font-bold bg-sky-900/60 text-sky-200 px-1 py-0.2 rounded-none">
                                {item.secondGatePass}
                              </span>
                            )}
                          </button>
                        ) : (
                          // DONE/REJECTED — read-only
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{item.secondGateTime}</span>
                        )
                      ) : (item.status === 'IN-PROGRESS' || item.status === 'SCHEDULED') ? (
                        <button
                          onClick={() => onSecondGateCheckIn && onSecondGateCheckIn(item.id)}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold rounded-none text-[10px] border-b border-r border-sky-300 shadow-sm transition-all flex items-center justify-center gap-1.5 inline-block cursor-pointer"
                          title="Konfirmasi Akses Pos 2 (Stakeholder Dalam)"
                        >
                          <Layers size={11} />
                          + Pos 2
                        </button>
                      ) : (
                        <span className="text-slate-400 font-sans italic">-</span>
                      )}
                    </td>

                    {/* OUT Timestamp / Check-Out Action Button */}
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                      {item.outTime ? (
                        // DONE — hanya tampilkan teks jam, tidak bisa diklik (sudah selesai)
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
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-none text-[10px] border-b border-r border-emerald-300 shadow-sm transition-all flex items-center justify-center gap-1.5 inline-block cursor-pointer"
                          title="Setujui Janji Temu Sekretariat"
                        >
                          <CheckSquare size={11} />
                          Setujui Janji
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
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-[10px] text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/20 px-1 rounded-none border border-amber-200/50 dark:border-amber-900/30 block w-fit truncate max-w-[120px]">
                          {item.mainGatePass || '-'}
                        </span>
                        {item.secondGatePass && (
                          <span className="font-mono text-[10px] text-sky-600 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-950/20 px-1 rounded-none border border-sky-200/50 dark:border-sky-900/30 block w-fit truncate max-w-[120px] mt-0.5">
                            {item.secondGatePass}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Company */}
                    <td className="p-4 text-slate-600 dark:text-slate-300 font-extrabold uppercase truncate max-w-[150px]" title={item.company}>
                      {item.company}
                    </td>

                    {/* Purpose */}
                    <td className="p-4 text-slate-500 dark:text-slate-400 capitalize truncate max-w-[120px]" title={item.purpose}>
                      {item.purpose}
                    </td>

                    {/* Visited employee/department */}
                    <td className="p-4 text-slate-800 dark:text-slate-200 font-bold uppercase truncate max-w-[130px]" title={item.visited}>
                      {item.visited}
                    </td>

                    {/* Status badge */}
                    <td className="p-4 text-center">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Row action shortcuts */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        
                        {/* View Badge */}
                        <button
                          onClick={() => onViewBadge(item)}
                          title="Cetak Pass Masuk Tamu"
                          className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-[#005DA6] dark:text-[#FFD500] rounded-none hover:border border-[#005DA6] dark:border-[#FFD500] transition-all cursor-pointer"
                        >
                          <Printer size={15} />
                        </button>

                        {/* Edit details */}
                        <button
                          onClick={() => onEdit(item)}
                          title="Ubah Rincian"
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-none transition-all cursor-pointer"
                        >
                          <SlidersHorizontal size={14} />
                        </button>

                        {/* Delete record */}
                        <button
                          onClick={() => onDelete(item.id)}
                          title="Hapus Data"
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 dark:text-[#FF3B30] rounded-none transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={12} className="p-12 text-center bg-white dark:bg-slate-900">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <AlertTriangle className="text-amber-500" size={36} />
                    <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200 mt-2">
                      Data Tamu Tidak Ditemukan
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                      Saringan penapis terlalu ketat, coba bersihkan filter atau tambahkan contoh data simulasi yang telah disiapkan.
                    </p>
                    <button
                      onClick={onAddSampleData}
                      className="mt-3 px-4 py-2 bg-[#005DA6] hover:bg-[#004070] text-white font-bold text-xs rounded-none border-b-2 border-r-2 border-[#FFD500] shadow-xs cursor-pointer transition-colors"
                    >
                      Muat Data Contoh SIMATA
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

                {/* Action 4: Second Gate Pass (Pos 2) */}
                {(quickActionVisitor.status === 'IN-PROGRESS' || quickActionVisitor.status === 'SCHEDULED') && (
                  <button
                    onClick={() => {
                      if (onSecondGateCheckIn) onSecondGateCheckIn(quickActionVisitor.id);
                      setQuickActionVisitor(null);
                    }}
                    className="w-full p-3 bg-sky-600 hover:bg-sky-700 text-white rounded-none text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-sky-500/20 text-white">
                        <Layers size={15} />
                      </div>
                      <div className="text-left">
                        <span className="block font-black uppercase">Konfirmasi Akses Pos 2 (Second Gate Pass)</span>
                        <span className="text-[10px] text-sky-100 font-normal">
                          {quickActionVisitor.secondGateTime
                            ? `Masuk Pos 2: ${quickActionVisitor.secondGateTime}`
                            : `Verifikasi Pass Pos 2 (${quickActionVisitor.secondGatePass || 'Auto Pass'})`}
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
