CREATE TABLE IF NOT EXISTS public.habits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    emoji TEXT DEFAULT '⭐',
    color TEXT DEFAULT '#D946EF',
    frequency TEXT DEFAULT 'daily' CHECK (
        frequency IN ('daily', 'weekdays', 'weekends', 'custom')
    ),
    custom_days INTEGER [],
    -- 0=Dom..6=Sab
    target_streak INTEGER DEFAULT 0,
    -- 0 = sem limite
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.habit_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    completed_date DATE DEFAULT CURRENT_DATE,
    note TEXT,
    energy_level TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(habit_id, completed_date)
);
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own habits" ON habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own habit_completions" ON habit_completions FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON habit_completions(user_id, completed_date DESC);