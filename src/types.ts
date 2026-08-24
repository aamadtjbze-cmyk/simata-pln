/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VisitorStatus = 'DONE' | 'IN-PROGRESS' | 'SCHEDULED' | 'PENDING' | 'EXPIRED' | 'REJECTED';

export interface Visitor {
  id: string; // Form ID e.g. TJB-VST-002934
  schedule: string; // date string
  inTime: string | null; // date string or null
  outTime: string | null; // date string or null
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
  validityOption?: 'SAME_DAY' | '1_DAY' | '3_DAYS' | '1_WEEK' | 'CUSTOM';
}

export interface VisitorFilter {
  searchQuery: string;
  status: VisitorStatus | 'ALL';
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

