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
