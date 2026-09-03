/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VisitorStatus = 'DONE' | 'IN-PROGRESS' | 'SCHEDULED' | 'PENDING' | 'EXPIRED' | 'REJECTED';

export type Stakeholder = 'PLN' | 'KPJB' | 'TJBPS' | 'AGP';

export type UserRole = 
  | 'SUPERADMIN' 
  | 'SEKRETARIAT' 
  | 'MAINGATE_SECURITY' 
  | 'POS2_SECURITY' 
  | 'RECEPTIONIST' 
  | 'SECURITY';

export interface Visitor {
  id: string; // Form ID e.g. TJB-VST-002934
  schedule: string; // date string
  inTime: string | null; // date string or null (Check-in Main Gate)
  outTime: string | null; // date string or null (Check-out)
  secondGateTime?: string | null; // date string for Pos 2 (KPJB / AGP Total 8)
  receptionistTime?: string | null; // date string for Receptionist / Lobby
  receptionistBadge?: string | null; // badge nomor meja resepsionis / lobby
  stakeholder?: Stakeholder; // Entitas tujuan: PLN, KPJB, TJBPS, AGP
  visitorName: string;
  mainGatePass: string;
  secondGatePass: string;
  company: string;
  purpose: string;
  visited: string;
  status: VisitorStatus;
  phone?: string;
  email?: string;
  identifyNo?: string;
  gender?: 'Laki-laki' | 'Perempuan';
  notes?: string;
  validUntil?: string; // Expiration date string e.g. "24 July 2026 - 23.59"
  validUntilTs?: string; // ISO timestamp mirror of validUntil, used for automated retention cleanup
  validityOption?: 'SAME_DAY' | '1_DAY' | '3_DAYS' | '1_WEEK' | 'CUSTOM';
  ktpPhotoPath?: string; // Path tersimpan di Supabase Storage bucket 'ktp-photos'
}

export interface VisitorFilter {
  searchQuery: string;
  status: VisitorStatus | 'ALL';
  stakeholder?: Stakeholder | 'ALL';
  dateFrom: string;
  dateTo: string;
  purpose: string;
}

export interface StatsBreakdown {
  total: number;
  inProgress: number;
  done: number;
  scheduled: number;
  pending: number;
}

export interface SystemNotification {
  id: string;
  timestamp: string;
  guestId: string;
  guestName: string;
  company: string;
  employeeName: string;
  type: 'CHECK_IN' | 'STATUS_UPDATE';
  title: string;
  message: string;
  status: 'SENT_WA' | 'SENT_EMAIL' | 'DELIVERED';
  oldStatus?: VisitorStatus;
  newStatus: VisitorStatus;
  channel: 'WhatsApp' | 'Email';
}

