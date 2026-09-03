/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Visitor } from '../types';

// Environment variables or localStorage fallback for dynamic runtime configuration
export const getSupabaseConfig = () => {
  const env = (import.meta as any).env || {};
  const envUrl = env.VITE_SUPABASE_URL || '';
  const envKey = env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('simata_supabase_url') || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('simata_supabase_key') || '' : '';

  return {
    url: localUrl || envUrl,
    anonKey: localKey || envKey,
  };
};

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('simata_supabase_url', url.trim());
    localStorage.setItem('simata_supabase_key', anonKey.trim());
  }
};

let clientInstance: SupabaseClient | null = null;
let currentConfigKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  const key = `${config.url}_${config.anonKey}`;
  if (clientInstance && currentConfigKey === key) {
    return clientInstance;
  }

  try {
    clientInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentConfigKey = key;
    return clientInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

export const isSupabaseConfigured = (): boolean => {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey && config.url.startsWith('https://'));
};

/**
 * Format Visitor object to DB row format
 */
export const visitorToRow = (v: Visitor) => {
  // Pastikan fallback data pos 2 dan receptionist tersimpan di notes jika schema DB Supabase belum dimigrasi
  let mergedNotes = v.notes || '';
  if (v.secondGateTime && !mergedNotes.includes(`[Pos 2: ${v.secondGateTime}]`)) {
    mergedNotes = mergedNotes ? `${mergedNotes} | [Pos 2: ${v.secondGateTime}]` : `[Pos 2: ${v.secondGateTime}]`;
  }
  if (v.receptionistTime && !mergedNotes.includes(`[Lobby: ${v.receptionistTime}]`)) {
    mergedNotes = mergedNotes ? `${mergedNotes} | [Lobby: ${v.receptionistTime}]` : `[Lobby: ${v.receptionistTime}]`;
  }
  if (v.stakeholder && !mergedNotes.includes(`[Entitas: ${v.stakeholder}]`)) {
    mergedNotes = mergedNotes ? `${mergedNotes} | [Entitas: ${v.stakeholder}]` : `[Entitas: ${v.stakeholder}]`;
  }

  return {
    id: v.id,
    visitor_name: v.visitorName,
    company: v.company,
    phone: v.phone || '',
    email: v.email || '',
    identify_no: v.identifyNo || '',
    gender: v.gender || 'Laki-laki',
    visited: v.visited,
    purpose: v.purpose,
    schedule: v.schedule,
    in_time: v.inTime,
    out_time: v.outTime,
    second_gate_time: v.secondGateTime || null,
    receptionist_time: v.receptionistTime || null,
    receptionist_badge: v.receptionistBadge || null,
    stakeholder: v.stakeholder || 'PLN',
    status: v.status,
    main_gate_pass: v.mainGatePass || '',
    second_gate_pass: v.secondGatePass || '',
    valid_until: v.validUntil || '',
    valid_until_ts: v.validUntilTs || null,
    validity_option: v.validityOption || 'SAME_DAY',
    ktp_photo_path: v.ktpPhotoPath || null,
    notes: mergedNotes,
    updated_at: new Date().toISOString(),
  };
};

/**
 * Format DB row to Visitor object
 */
export const rowToVisitor = (row: any): Visitor => {
  let extractedSecondGateTime = row.second_gate_time || row.secondGateTime || null;
  let extractedReceptionistTime = row.receptionist_time || row.receptionistTime || null;
  let extractedReceptionistBadge = row.receptionist_badge || row.receptionistBadge || null;
  let extractedStakeholder = row.stakeholder || null;

  if (row.notes && typeof row.notes === 'string') {
    if (!extractedSecondGateTime) {
      const match = row.notes.match(/\[(?:Pos 2|Second Gate KPJB|Pos Total 8 \(AGP\)|Gate Unit): (.*?)\]/);
      if (match && match[1]) {
        extractedSecondGateTime = match[1];
      }
    }
    if (!extractedReceptionistTime) {
      const match = row.notes.match(/\[(?:Lobby|Receptionist): (.*?)\]/);
      if (match && match[1]) {
        extractedReceptionistTime = match[1];
      }
    }
    if (!extractedReceptionistBadge) {
      const match = row.notes.match(/\[Badge Lobby: (.*?)\]/);
      if (match && match[1]) {
        extractedReceptionistBadge = match[1];
      }
    }
    if (!extractedStakeholder) {
      const match = row.notes.match(/\[Entitas: (.*?)\]/);
      if (match && match[1]) {
        extractedStakeholder = match[1];
      }
    }
  }

  return {
    id: row.id,
    visitorName: row.visitor_name,
    company: row.company,
    phone: row.phone || undefined,
    email: row.email || undefined,
    identifyNo: row.identify_no || undefined,
    gender: row.gender || undefined,
    visited: row.visited,
    purpose: row.purpose,
    schedule: row.schedule,
    inTime: row.in_time || null,
    outTime: row.out_time || null,
    secondGateTime: extractedSecondGateTime,
    receptionistTime: extractedReceptionistTime,
    receptionistBadge: extractedReceptionistBadge,
    stakeholder: (extractedStakeholder as any) || 'PLN',
    status: row.status,
    mainGatePass: row.main_gate_pass,
    secondGatePass: row.second_gate_pass,
    validUntil: row.valid_until || undefined,
    validUntilTs: row.valid_until_ts || undefined,
    validityOption: row.validity_option || undefined,
    ktpPhotoPath: row.ktp_photo_path || undefined,
    notes: row.notes || undefined,
  };
};

/**
 * Fetch all visitors from Supabase
 */
export const fetchVisitorsFromSupabase = async (): Promise<Visitor[] | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return null;
    }

    if (Array.isArray(data)) {
      return data.map(rowToVisitor);
    }
    return [];
  } catch (err) {
    console.error('Supabase network error:', err);
    return null;
  }
};

/**
 * Insert or Upsert a visitor record
 */
export const saveVisitorToSupabase = async (visitor: Visitor): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const row = visitorToRow(visitor);
    const { error } = await supabase.from('visitors').upsert(row);

    if (error) {
      console.warn('Supabase upsert with extended columns failed, retrying with core columns:', error.message);
      const { second_gate_time, receptionist_time, receptionist_badge, stakeholder, valid_until_ts, ktp_photo_path, ...fallbackRow } = row;
      const fallbackResult = await supabase.from('visitors').upsert(fallbackRow);
      if (fallbackResult.error) {
        console.error('Supabase fallback upsert error:', fallbackResult.error.message);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error('Supabase save error:', err);
    return false;
  }
};

/**
 * Delete a visitor record
 */
export const deleteVisitorFromSupabase = async (id: string): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('visitors').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase delete error:', err);
    return false;
  }
};

/**
 * Check Database Health & Connectivity
 */
export const checkSupabaseHealth = async (): Promise<{ connected: boolean; message: string; latency?: number }> => {
  if (!isSupabaseConfigured()) {
    return { connected: false, message: 'Kredensial database belum dikonfigurasi.' };
  }
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { connected: false, message: 'Gagal inisialisasi koneksi database.' };
  }

  const start = Date.now();
  try {
    const { data, error } = await supabase.from('visitors').select('id').limit(1);
    const latency = Date.now() - start;
    if (error) {
      return { connected: false, message: `Database error: ${error.message}` };
    }
    return { connected: true, message: `Koneksi database aktif & normal (${latency}ms).`, latency };
  } catch (err: any) {
    return { connected: false, message: `Gagal terhubung ke database: ${err?.message || 'Network Timeout'}` };
  }
};

/**
 * Saran Audit #1: Pastikan kolom second_gate_time ada di tabel visitors.
 * Dijalankan sekali saat app startup jika Supabase dikonfigurasi.
 * Jika kolom sudah ada: tidak ada perubahan. Jika belum: coba tambahkan via RPC.
 * Jika tidak ada privilege DDL, fallback ke notes-tag yang sudah berjalan.
 */
export const ensureSecondGateTimeColumn = async (): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    // Cek apakah kolom sudah ada
    const { error } = await supabase
      .from('visitors')
      .select('second_gate_time')
      .limit(1);

    if (!error) return; // Kolom sudah ada ✅

    // Kolom belum ada — coba buat via rpc exec (butuh service_role key)
    await supabase.rpc('exec', {
      query: 'ALTER TABLE visitors ADD COLUMN IF NOT EXISTS second_gate_time TEXT;',
    });
  } catch {
    // Silent fail — sistem tetap berjalan dengan fallback notes-tag
  }
};

/**
 * Storage bucket untuk foto KTP tamu. Dibuat/dikonfigurasi lewat SQL migration
 * (lihat supabase_schema.sql), bukan lewat client — anon key tidak punya privilege bikin bucket.
 */
const KTP_PHOTO_BUCKET = 'ktp-photos';

/**
 * Upload foto KTP (sudah dikompres di browser) ke Supabase Storage.
 * `fileName` idealnya pakai Form ID tamu (mis. "TJB-VST-005010.jpg") supaya
 * upload ulang otomatis menimpa foto lama milik tamu yang sama.
 */
export const uploadKtpPhoto = async (blob: Blob, fileName: string): Promise<string | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { error } = await supabase.storage.from(KTP_PHOTO_BUCKET).upload(fileName, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });
    if (error) {
      console.warn('Upload foto KTP gagal:', error.message);
      return null;
    }
    return fileName;
  } catch (err) {
    console.error('Upload foto KTP error:', err);
    return null;
  }
};

/**
 * Buat signed URL sementara untuk menampilkan foto KTP (bucket bersifat private).
 */
export const getKtpPhotoSignedUrl = async (path: string, expiresInSeconds = 300): Promise<string | null> => {
  const supabase = getSupabaseClient();
  if (!supabase || !path) return null;

  try {
    const { data, error } = await supabase.storage.from(KTP_PHOTO_BUCKET).createSignedUrl(path, expiresInSeconds);
    if (error) {
      console.warn('Gagal membuat signed URL foto KTP:', error.message);
      return null;
    }
    return data?.signedUrl || null;
  } catch (err) {
    console.error('Signed URL foto KTP error:', err);
    return null;
  }
};

/**
 * Hapus foto KTP dari storage (dipakai saat mengganti foto lama pada mode edit).
 */
export const deleteKtpPhoto = async (path: string): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase || !path) return false;

  try {
    const { error } = await supabase.storage.from(KTP_PHOTO_BUCKET).remove([path]);
    return !error;
  } catch {
    return false;
  }
};
