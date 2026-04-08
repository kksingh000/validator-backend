-- ============================================================
-- Supabase SQL Migration: Startup Idea Validator
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Create the ideas table
CREATE TABLE IF NOT EXISTS ideas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  industry      TEXT,
  target_market TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'analyzing', 'completed', 'failed')),

  -- AI-generated analysis (stored as JSONB for flexibility)
  analysis      JSONB,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Index for faster queries
CREATE INDEX IF NOT EXISTS idx_ideas_status     ON ideas (status);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas (created_at DESC);

-- 3. Auto-update the updated_at timestamp on every row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON ideas;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 4. Enable Row Level Security (optional — disable if using service key)
-- ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for anon" ON ideas FOR ALL USING (true);
