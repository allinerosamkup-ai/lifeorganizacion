CREATE TABLE daily_reflections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    mood TEXT,
    -- 'great','good','neutral','low','bad'
    free_text TEXT,
    ai_summary TEXT,
    ai_themes JSONB,
    -- ["trabalho","família"]
    ai_actions JSONB,
    -- ["tarefa sugerida"]
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, date)
);
ALTER TABLE daily_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own reflections" ON daily_reflections FOR ALL USING (auth.uid() = user_id);