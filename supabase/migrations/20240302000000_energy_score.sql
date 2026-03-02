-- Migration: Energy Score engine tables + check_ins & tasks extensions
-- Part of Airia evolution: mood/energy cycling app
-- ============================================
-- TABLE: health_data
-- Objective data from wearables or manual entry (sleep, HRV, activity)
-- ============================================
CREATE TABLE IF NOT EXISTS health_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    -- Sleep data
    sleep_hours DECIMAL(4, 2),
    sleep_quality INTEGER CHECK (
        sleep_quality BETWEEN 1 AND 10
    ),
    bedtime TIME,
    waketime TIME,
    -- HRV data (from wearable or manual)
    hrv_rmssd DECIMAL(8, 2),
    -- Root Mean Square of Successive Differences (ms)
    resting_hr INTEGER,
    -- Resting heart rate (bpm)
    -- Activity data
    steps INTEGER DEFAULT 0,
    active_minutes INTEGER DEFAULT 0,
    exercise_type TEXT,
    -- e.g., 'running', 'walking', 'yoga'
    exercise_duration_minutes INTEGER,
    -- Source tracking
    data_source TEXT DEFAULT 'manual',
    -- 'manual', 'google_fit', 'apple_health'
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, date)
);
-- ============================================
-- TABLE: daily_energy
-- Computed daily Energy Score (0-100) with sub-scores
-- ============================================
CREATE TABLE IF NOT EXISTS daily_energy (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    -- Sub-scores (0-100 each)
    sleep_score INTEGER CHECK (
        sleep_score BETWEEN 0 AND 100
    ),
    hrv_score INTEGER CHECK (
        hrv_score BETWEEN 0 AND 100
    ),
    activity_score INTEGER CHECK (
        activity_score BETWEEN 0 AND 100
    ),
    mood_score INTEGER CHECK (
        mood_score BETWEEN 0 AND 100
    ),
    cycle_modifier INTEGER DEFAULT 0 CHECK (
        cycle_modifier BETWEEN -20 AND 20
    ),
    -- Final combined score
    total_score INTEGER CHECK (
        total_score BETWEEN 0 AND 100
    ),
    -- Computation metadata
    weights_used JSONB DEFAULT '{"sleep": 0.30, "hrv": 0.25, "activity": 0.20, "mood": 0.20, "cycle": 0.05}',
    raw_data JSONB,
    -- snapshot of inputs used for audit
    -- Energy level label derived from total_score
    energy_level TEXT GENERATED ALWAYS AS (
        CASE
            WHEN total_score >= 70 THEN 'high'
            WHEN total_score >= 40 THEN 'medium'
            ELSE 'low'
        END
    ) STORED,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, date)
);
-- ============================================
-- TABLE: exercise_history
-- AI-suggested and completed exercise sessions
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    -- Exercise details
    type TEXT NOT NULL,
    -- 'stretching', 'walking', 'running', 'strength', 'breathing', 'yoga'
    title TEXT,
    -- descriptive title
    duration_minutes INTEGER,
    intensity TEXT CHECK (intensity IN ('light', 'moderate', 'intense')),
    energy_at_start INTEGER CHECK (
        energy_at_start BETWEEN 0 AND 100
    ),
    -- AI generation
    ai_generated_plan JSONB,
    -- full AI-generated workout plan
    user_request TEXT,
    -- what the user asked for
    -- Completion
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    user_feedback TEXT,
    -- optional feedback after completion
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now()
);
-- ============================================
-- ALTER: check_ins — allow multiple per day
-- ============================================
-- Drop the unique constraint so users can do multiple check-ins per day
ALTER TABLE check_ins DROP CONSTRAINT IF EXISTS check_ins_user_id_date_key;
-- Add a timestamp for precise ordering of multiple check-ins
ALTER TABLE check_ins
ADD COLUMN IF NOT EXISTS checked_at TIMESTAMPTZ DEFAULT now();
-- ============================================
-- ALTER: tasks — add notes and edit tracking
-- ============================================
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_health_data_user_date ON health_data(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_energy_user_date ON daily_energy(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_history_user_date ON exercise_history(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_checked_at ON check_ins(user_id, checked_at DESC);
-- ============================================
-- RLS for new tables
-- ============================================
ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_energy ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own health_data" ON health_data;
CREATE POLICY "Users can manage own health_data" ON health_data FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own daily_energy" ON daily_energy;
CREATE POLICY "Users can manage own daily_energy" ON daily_energy FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own exercise_history" ON exercise_history;
CREATE POLICY "Users can manage own exercise_history" ON exercise_history FOR ALL USING (auth.uid() = user_id);
-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_health_data_updated_at ON health_data;
CREATE TRIGGER update_health_data_updated_at BEFORE
UPDATE ON health_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_daily_energy_updated_at ON daily_energy;
CREATE TRIGGER update_daily_energy_updated_at BEFORE
UPDATE ON daily_energy FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
COMMENT ON TABLE health_data IS 'Objective health data from wearables or manual entry';
COMMENT ON TABLE daily_energy IS 'Computed daily Energy Score with sub-scores';
COMMENT ON TABLE exercise_history IS 'AI-suggested and completed exercise sessions';