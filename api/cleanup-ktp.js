/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SAMBUT PLN - Pembersihan Foto KTP (Vercel Cron)
 *
 * Dijalankan sekali sehari. Dua tahap:
 *   1. Retensi  — hapus foto 45 hari setelah masa berlaku pass tamu habis.
 *   2. Pengaman — bila storage melewati 800 MB, hapus yang terlama sampai
 *                 turun sekitar 100 MB.
 *
 * Penghapusan WAJIB lewat Storage API. Pendekatan sebelumnya memakai
 * `DELETE FROM storage.objects` langsung dari cron database dan gagal tiap
 * hari — Supabase memasang pemicu `storage.protect_delete()` yang menolaknya.
 */

import { createClient } from '@supabase/supabase-js';

const BUCKET = 'ktp-photos';
const RETENSI_HARI = 45;
const AMBANG_BYTE = 800 * 1024 * 1024;   // mulai bersih-bersih di atas ini
const TARGET_BEBAS_BYTE = 100 * 1024 * 1024;
const HALAMAN = 1000;                    // batas satu kali list Storage API
const HAPUS_PER_BATCH = 100;             // pecah remove() agar tiap panggilan ringan
const MAKS_HAPUS_PER_JALAN = 1000;       // batasi kerja sekali jalan; sisanya besok

// ponytail: menelusuri seluruh isi bucket tiap hari itu O(n) — pada ~4.500 file
// (ambang 800 MB) masih ~5 panggilan list dan aman di bawah batas waktu Vercel.
// Bila kelak pindah ke paket berbayar dengan kuota jauh lebih besar, ganti
// penelusuran penuh ini dengan kolom ukuran yang diakumulasi di database.

function getAdminClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Kosongkan referensi path agar tidak menunjuk file yang sudah tiada. */
async function kosongkanPath(sb, namaFile) {
  if (!namaFile.length) return;
  await sb.from('visitors').update({ ktp_photo_path: null }).in('ktp_photo_path', namaFile);
}

async function hapusFile(sb, namaFile) {
  if (!namaFile.length) return { terhapus: 0, error: null };

  const daftar = namaFile.slice(0, MAKS_HAPUS_PER_JALAN);
  const tertunda = namaFile.length - daftar.length;
  let terhapus = 0;

  for (let i = 0; i < daftar.length; i += HAPUS_PER_BATCH) {
    const batch = daftar.slice(i, i + HAPUS_PER_BATCH);
    const { error } = await sb.storage.from(BUCKET).remove(batch);
    if (error) return { terhapus, tertunda, error: error.message };
    await kosongkanPath(sb, batch);
    terhapus += batch.length;
  }
  return { terhapus, tertunda, error: null };
}

/** Tahap 1 — retensi berdasarkan waktu. */
async function bersihkanKadaluarsa(sb) {
  const batas = new Date(Date.now() - RETENSI_HARI * 86400000).toISOString();
  const { data, error } = await sb
    .from('visitors')
    .select('ktp_photo_path')
    .not('ktp_photo_path', 'is', null)
    .not('valid_until_ts', 'is', null)
    .lt('valid_until_ts', batas);
  if (error) throw new Error(`Gagal membaca data tamu: ${error.message}`);

  const nama = [...new Set(data.map((v) => v.ktp_photo_path).filter(Boolean))];
  const hasil = await hapusFile(sb, nama);
  return { kandidat: nama.length, ...hasil };
}

/** Ambil seluruh isi bucket, terlama lebih dulu. */
async function daftarFoto(sb) {
  const semua = [];
  for (let halaman = 0; ; halaman++) {
    const { data, error } = await sb.storage.from(BUCKET).list('', {
      limit: HALAMAN,
      offset: halaman * HALAMAN,
      sortBy: { column: 'created_at', order: 'asc' },
    });
    if (error) throw new Error(`Gagal membaca isi storage: ${error.message}`);
    semua.push(...data);
    if (data.length < HALAMAN) break;
  }
  return semua;
}

/** Tahap 2 — pengaman kapasitas. */
async function bersihkanKapasitas(sb) {
  const semua = await daftarFoto(sb);
  const ukuran = (f) => Number(f?.metadata?.size) || 0;
  const totalAwal = semua.reduce((jml, f) => jml + ukuran(f), 0);

  if (totalAwal <= AMBANG_BYTE) {
    return { dipicu: false, totalByte: totalAwal, terhapus: 0 };
  }

  const nama = [];
  let dibebaskan = 0;
  for (const f of semua) {                       // sudah urut terlama dulu
    if (dibebaskan >= TARGET_BEBAS_BYTE) break;
    nama.push(f.name);
    dibebaskan += ukuran(f);
  }
  const hasil = await hapusFile(sb, nama);
  return { dipicu: true, totalByte: totalAwal, dibebaskanByte: dibebaskan, ...hasil };
}

export default async function handler(req, res) {
  // Vercel Cron mengirim CRON_SECRET sebagai Bearer token bila env var itu diset.
  const rahasia = process.env.CRON_SECRET;
  if (rahasia && req.headers.authorization !== `Bearer ${rahasia}`) {
    return res.status(401).json({ error: 'Tidak berwenang.' });
  }

  const sb = getAdminClient();
  if (!sb) {
    return res.status(500).json({ error: 'Server belum dikonfigurasi (SUPABASE_SERVICE_ROLE_KEY).' });
  }

  try {
    const retensi = await bersihkanKadaluarsa(sb);
    const kapasitas = await bersihkanKapasitas(sb);
    const ringkas = {
      waktu: new Date().toISOString(),
      retensi: { aturan: `${RETENSI_HARI} hari setelah pass kedaluwarsa`, ...retensi },
      kapasitas: { ambangMB: AMBANG_BYTE / 1048576, ...kapasitas },
    };
    console.log('[cleanup-ktp]', JSON.stringify(ringkas));
    return res.status(200).json(ringkas);
  } catch (err) {
    console.error('[cleanup-ktp] gagal:', err);
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan server.' });
  }
}
