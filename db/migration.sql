-- Create ideas table
CREATE TABLE IF NOT EXISTS public.ideas (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  industry VARCHAR(100),
  target_market VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_ideas_status ON public.ideas(status);

-- Set up Row Level Security (RLS)
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read" ON public.ideas
  FOR SELECT USING (true);

-- Allow public insert
CREATE POLICY "Allow public insert" ON public.ideas
  FOR INSERT WITH CHECK (true);

-- Allow public update
CREATE POLICY "Allow public update" ON public.ideas
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow public delete
CREATE POLICY "Allow public delete" ON public.ideas
  FOR DELETE USING (true);
