-- ==============================================================================
-- SIMATA PLN - Supabase Database Schema & RLS Setup
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

-- 9. Auto-delete: hapus foto KTP 7 hari setelah pas/barcode kadaluarsa (valid_until_ts)
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.cleanup_expired_ktp_photos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Hapus file fisik dari storage bucket
  DELETE FROM storage.objects
  WHERE bucket_id = 'ktp-photos'
    AND name IN (
      SELECT ktp_photo_path FROM public.visitors
      WHERE ktp_photo_path IS NOT NULL
        AND valid_until_ts IS NOT NULL
        AND valid_until_ts + INTERVAL '7 days' < now()
    );

  -- Kosongkan referensi path di tabel visitors
  UPDATE public.visitors
  SET ktp_photo_path = NULL
  WHERE ktp_photo_path IS NOT NULL
    AND valid_until_ts IS NOT NULL
    AND valid_until_ts + INTERVAL '7 days' < now();
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-ktp-photos-daily') THEN
    PERFORM cron.unschedule('cleanup-expired-ktp-photos-daily');
  END IF;
END $$;

-- Jadwal harian jam 03:00 UTC (~10:00 WIB)
SELECT cron.schedule(
  'cleanup-expired-ktp-photos-daily',
  '0 3 * * *',
  $$ SELECT public.cleanup_expired_ktp_photos(); $$
);
