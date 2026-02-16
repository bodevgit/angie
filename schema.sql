
-- Create dates table
CREATE TABLE IF NOT EXISTS dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  location TEXT,
  type TEXT DEFAULT 'meetup',
  created_by TEXT, -- 'angy' or 'bozy'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'General',
  created_by TEXT, -- 'angy' or 'bozy'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_profile TEXT NOT NULL, -- 'angy' or 'bozy'
  day TEXT NOT NULL,
  period TEXT NOT NULL,
  subject TEXT NOT NULL,
  time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_profile, day, period)
);

-- Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY, -- 'angy' or 'bozy'
  name TEXT,
  bio TEXT,
  avatar_url TEXT,
  background_url TEXT,
  status TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create config table for global settings like next meeting
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial data if tables are empty
INSERT INTO config (key, value)
VALUES ('next_meeting', '{"date": "2026-03-01T12:00:00"}')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing public access for simplicity in this pair app, or restricted to auth users)
-- Since we are using anon key and maybe no auth for now (user context is just local state switching), 
-- we should allow public access or based on the anon role.
CREATE POLICY "Allow public read/write access to dates" ON dates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access to plans" ON plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access to schedules" ON schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access to config" ON config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access to profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- MIGRATIONS (Run these if tables exist)
-- ==========================================

-- Add created_by column to dates table
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dates' AND column_name = 'created_by') THEN 
    ALTER TABLE dates ADD COLUMN created_by TEXT; 
  END IF; 
END $$;

-- Add created_by column to plans table
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plans' AND column_name = 'created_by') THEN 
    ALTER TABLE plans ADD COLUMN created_by TEXT; 
  END IF; 
END $$;

-- Add status column to profiles table (if missing)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN 
    ALTER TABLE profiles ADD COLUMN status TEXT; 
  END IF; 
END $$;
