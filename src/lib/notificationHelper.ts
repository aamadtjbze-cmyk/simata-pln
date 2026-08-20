/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Visitor, VisitorStatus, SystemNotification } from '../types';

/**
 * Returns a readable text for states
 */
export const getStatusLabel = (status: VisitorStatus): string => {
  switch (status) {
    case 'DONE':
      return 'Selesai Kunjungan (Check-Out)';
    case 'IN-PROGRESS':
      return 'Tiba di Lokasi (Check-In)';
    case 'SCHEDULED':
      return 'Terjadwal (Akan Datang)';
    case 'PENDING':
      return 'Menunggu Persetujuan';
    default:
      return status;
  }
};

/**
 * Automatically creates a SystemNotification record from a visitor state or state change.
 */
export function createNotification(
  visitor: Visitor,
  oldStatus?: VisitorStatus
): SystemNotification {
  const now = new Date();
  const pad = (num: number) => String(num).padStart(2, '0');
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const dateStr = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()} - ${pad(now.getHours())}.${pad(now.getMinutes())}`;
  
  const idNum = Math.floor(100000 + Math.random() * 900000);
  const id = `NTF-${idNum}`;

  const isCheckIn = visitor.status === 'IN-PROGRESS' && (!oldStatus || oldStatus !== 'IN-PROGRESS');
  const type = isCheckIn ? 'CHECK_IN' : 'STATUS_UPDATE';
  
  // Decide the delivery channel based on visitor metadata or randomly, or assign both
  const channel = Math.random() > 0.5 ? 'WhatsApp' : 'Email';
  const status = channel === 'WhatsApp' ? 'SENT_WA' : 'SENT_EMAIL';

  let title = '';
  let message = '';

  if (isCheckIn) {
    title = `Kedatangan Tamu: ${visitor.visitorName}`;
    message = `Yth. Rekan PLN (${visitor.visited}),

Diberitahukan bahwa tamu Anda telah tiba di lokasi:
• Nama Tamu: ${visitor.visitorName}
• Instansi/Perusahaan: ${visitor.company}
• Jam Masuk: ${visitor.inTime || dateStr}
• Nomor Pas Gerbang (Main Gate Pass): ${visitor.mainGatePass || '-'}
${visitor.secondGatePass ? `• Nomor Pas Gerbang 2: ${visitor.secondGatePass}\n` : ''}
Tujuan Pertemuan: ${visitor.purpose}

Mohon segera menyambut tamu di lobi resepsionis utama atau mempersiapkan ruang pertemuan yang bersangkutan.

Salam hangat,
SIMATA PT PLN (Persero)`;
  } else {
    const oldLabel = oldStatus ? getStatusLabel(oldStatus) : 'Prapendaftaran';
    const newLabel = getStatusLabel(visitor.status);
    
    title = `Pembaruan Janji Temu: ${visitor.visitorName}`;
    message = `Yth. Rekan PLN (${visitor.visited}),

Informasi kunjungan atas janji temu Anda telah diperbarui:
• Nama Tamu: ${visitor.visitorName}
• Instansi/Perusahaan: ${visitor.company}
• Status Sebelumnya: [${oldLabel}]
• Status Baru: [${newLabel}]
• Waktu Perubahan: ${dateStr}

Rincian Catatan: ${visitor.notes || 'Tidak ada catatan tambahan.'}

Salam hangat,
SIMATA PT PLN (Persero)`;
  }

  return {
    id,
    timestamp: dateStr,
    guestId: visitor.id,
    guestName: visitor.visitorName,
    company: visitor.company,
    employeeName: visitor.visited,
    type,
    title,
    message,
    status,
    oldStatus,
    newStatus: visitor.status,
    channel
  };
}
