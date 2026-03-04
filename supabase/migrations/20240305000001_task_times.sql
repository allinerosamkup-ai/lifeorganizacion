-- start_time, duration_minutes, energy_level, ai_insight, is_ai_suggested
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS start_time TIME,
    ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
    ADD COLUMN IF NOT EXISTS energy_level TEXT DEFAULT 'medium' CHECK (energy_level IN ('low', 'medium', 'high')),
    ADD COLUMN IF NOT EXISTS ai_insight TEXT,
    ADD COLUMN IF NOT EXISTS is_ai_suggested BOOLEAN DEFAULT false;