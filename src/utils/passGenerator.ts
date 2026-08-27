/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Daily Sequential Pass Number Generator for SIMATA PLN
 * Automatically computes the next available sequence for the current day.
 */

import { Visitor } from '../types';

/**
 * Extracts sequence number from a pass string (e.g., "TJB-PASS-05" -> 5, "Vgp 012" -> 12, "038 b" -> 38)
 */
export function extractPassSequence(passStr?: string): number {
  if (!passStr) return 0;
  const match = passStr.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Generates the next sequential Main Gate Pass for today (e.g. TJB-PASS-01, TJB-PASS-02, ...)
 * Resets sequentially based on daily registered visitors.
 */
export function generateDailyPassNumber(
  existingVisitors: Partial<Visitor>[] = [],
  customDate?: Date
): string {
  const targetDate = customDate || new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = targetDate.getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[targetDate.getMonth()];
  const year = targetDate.getFullYear();
  const dateSubstr = `${day} ${monthName} ${year}`;

  // Filter visitors registered for target date
  const todayVisitors = existingVisitors.filter((v) => {
    return (
      (v.schedule && v.schedule.includes(dateSubstr)) ||
      (v.inTime && v.inTime.includes(dateSubstr))
    );
  });

  // Find the highest sequence number used today in mainGatePass
  let maxSeq = 0;
  todayVisitors.forEach((v) => {
    if (v.mainGatePass) {
      const seq = extractPassSequence(v.mainGatePass);
      if (seq > maxSeq && seq < 9999) {
        maxSeq = seq;
      }
    }
  });

  const nextNumber = Math.max(todayVisitors.length + 1, maxSeq + 1);
  return `TJB-PASS-${pad(nextNumber)}`;
}

/**
 * Generates the next sequential Second Gate Pass for Pos 2
 */
export function generateSecondGatePassNumber(
  existingVisitors: Partial<Visitor>[] = [],
  customDate?: Date
): string {
  const targetDate = customDate || new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = targetDate.getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[targetDate.getMonth()];
  const year = targetDate.getFullYear();
  const dateSubstr = `${day} ${monthName} ${year}`;

  const todayVisitors = existingVisitors.filter((v) => {
    return (
      (v.schedule && v.schedule.includes(dateSubstr)) ||
      (v.secondGateTime && v.secondGateTime.includes(dateSubstr))
    );
  });

  let maxSeq = 0;
  todayVisitors.forEach((v) => {
    if (v.secondGatePass) {
      const seq = extractPassSequence(v.secondGatePass);
      if (seq > maxSeq && seq < 9999) {
        maxSeq = seq;
      }
    }
  });

  const nextNumber = Math.max(todayVisitors.length + 1, maxSeq + 1);
  return `TJB-PASS-${pad(nextNumber)}`;
}
