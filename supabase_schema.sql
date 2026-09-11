-- ==============================================================================
-- SAMBUT PLN - Supabase Database Schema & RLS Setup
-- Execute this script in your Supabase SQL Editor: (Dashboard > SQL Editor > New Query)
-- ==============================================================================

-- 1. Create Visitors Table
CREATE TABLE IF NOT EXISTS public.visitors (
    id TEXT PRIMARY KEY,
    visitor_name TEXT NOT NULL,
    company TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    identify_no TEXT,
    gender TEXT DEFAULT 'Laki-laki',
    visited TEXT NOT NULL,
    purpose TEXT NOT NULL,
    schedule TEXT NOT NULL,
    in_time TEXT,
    out_time TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    stakeholder TEXT NOT NULL DEFAULT 'PLN', -- 'PLN' | 'KPJB' | 'TJBPS' | 'AGP'
    main_gate_pass TEXT DEFAULT 'TJB-PASS-01',
    second_gate_pass TEXT DEFAULT 'TJB-PASS-02',
    second_gate_time TEXT,
    receptionist_time TEXT,
    receptionist_badge TEXT,
    valid_until TEXT,
    validity_option TEXT DEFAULT 'SAME_DAY',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrasi jika tabel sudah ada sebelumnya (Non-Destructive):
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS stakeholder TEXT DEFAULT 'PLN';
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS second_gate_time TEXT;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS receptionist_time TEXT;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS receptionist_badge TEXT;

-- 2. Create Indexes for High Performance Search & Filters
CREATE INDEX IF NOT EXISTS idx_visitors_status ON public.visitors(status);
CREATE INDEX IF NOT EXISTS idx_visitors_stakeholder ON public.visitors(stakeholder);
CREATE INDEX IF NOT EXISTS idx_visitors_schedule ON public.visitors(schedule);
CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON public.visitors(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies: Allow Public/Anonymous Read, Insert, Update, Delete for seamless operation
CREATE POLICY "Allow public read access" 
ON public.visitors 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert for guest bookings" 
ON public.visitors 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update for status approvals and check-in" 
ON public.visitors 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete" 
ON public.visitors 
FOR DELETE 
USING (true);

-- 5. Enable Realtime Replication for Visitors Table
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitors;

-- ==============================================================================
-- CHECKPOINT POS 2, RECEPTIONIST, DAN ENTITAS
-- ==============================================================================
-- Empat kolom ini sempat tidak ada di database, sehingga aplikasi menyelipkan
-- nilainya sebagai penanda teks di dalam kolom notes ("[Pos 2: ...]",
-- "[Lobby: ...]", "[Entitas: ...]"). Akibatnya data checkpoint tidak bisa
-- di-query/difilter dengan benar dan catatan tamu jadi tercampur.
-- Jangan dihapus: aplikasi menulis langsung ke kolom-kolom ini.
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS second_gate_time   TEXT;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS receptionist_time  TEXT;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS receptionist_badge TEXT;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS stakeholder        TEXT DEFAULT 'PLN';

-- ==============================================================================
-- FOTO KTP TAMU - Kolom, Storage Bucket, RLS, dan Auto-Delete Retensi 7 Hari
-- ==============================================================================

-- 6. Kolom untuk path foto KTP & timestamp kadaluarsa mesin-terbaca (pendamping valid_until)
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS ktp_photo_path TEXT;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS valid_until_ts TIMESTAMPTZ;

-- 7. Storage bucket privat untuk foto KTP (foto tidak bisa diakses via URL publik langsung)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ktp-photos', 'ktp-photos', false)
ON CONFLICT (id) DO NOTHING;

-- 8. RLS Storage: mengikuti trust model yang sama dengan tabel visitors (anon key, akses penuh)
DROP POLICY IF EXISTS "Allow public upload ktp photos" ON storage.objects;
CREATE POLICY "Allow public upload ktp photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ktp-photos');

DROP POLICY IF EXISTS "Allow public read ktp photos" ON storage.objects;
CREATE POLICY "Allow public read ktp photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'ktp-photos');

DROP POLICY IF EXISTS "Allow public update ktp photos" ON storage.objects;
CREATE POLICY "Allow public update ktp photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ktp-photos')
WITH CHECK (bucket_id = 'ktp-photos');

DROP POLICY IF EXISTS "Allow public delete ktp photos" ON storage.objects;
CREATE POLICY "Allow public delete ktp photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'ktp-photos');

-- 9. Pembersihan foto KTP: TIDAK lagi dilakukan dari database.
--
-- Pendekatan lama memakai pg_cron + DELETE FROM storage.objects, dan gagal
-- setiap hari: Supabase memasang pemicu storage.protect_delete() yang menolak
-- penghapusan file langsung dari tabel storage ("Use the Storage API instead").
-- Jadwal dan fungsinya sudah dihapus agar tidak menyisakan error harian.
--
-- Penggantinya: api/cleanup-ktp.js, dijalankan Vercel Cron sekali sehari
-- (03:00 UTC / 10:00 WIB) memakai Storage API resmi. Aturannya:
--   1. Retensi  - hapus foto 45 hari setelah valid_until_ts terlampaui.
--   2. Pengaman - bila isi bucket melewati 800 MB, hapus yang terlama
--                 sampai turun sekitar 100 MB (batas paket Free: 1 GB).

-- ==============================================================================
-- 10. FORM ID TAMU DARI SEQUENCE DATABASE
-- ==============================================================================
-- Dulu Form ID dihitung di browser (ID terbesar di daftar + 1) lalu disimpan
-- dengan upsert. Pada 11 Sep 2026, empat HP tamu yang mengirim hampir bersamaan
-- sama-sama mendapat TJB-VST-005077 dan saling menimpa: tiga pengajuan hilang
-- tanpa pesan error. Kini nomor diambil dari sequence (atomik, tidak mungkin
-- kembar) dan tamu baru disimpan dengan INSERT sehingga bentrok ditolak.
CREATE SEQUENCE IF NOT EXISTS public.visitor_id_seq;
SELECT setval('public.visitor_id_seq', GREATEST(
  (SELECT COALESCE(MAX(SUBSTRING(id FROM '[0-9]+$')::BIGINT), 5008) FROM public.visitors),
  (SELECT last_value FROM public.visitor_id_seq)));

CREATE OR REPLACE FUNCTION public.next_visitor_id() RETURNS TEXT
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  SELECT 'TJB-VST-' || LPAD(NEXTVAL('public.visitor_id_seq')::TEXT, 6, '0')
$$;
REVOKE ALL ON FUNCTION public.next_visitor_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_visitor_id() TO anon, authenticated;
