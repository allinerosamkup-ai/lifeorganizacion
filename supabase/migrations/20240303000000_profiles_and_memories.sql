-- Migration: Add fields to profiles and user_memories table
-- ============================================
-- ALTER: profiles
-- ============================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS ai_tone TEXT DEFAULT 'empatica',
    ADD COLUMN IF NOT EXISTS ai_language TEXT DEFAULT 'pt-BR',
    ADD COLUMN IF NOT EXISTS prefers_clinical_terms BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS cycle_length INTEGER DEFAULT 28,
    ADD COLUMN IF NOT EXISTS luteal_phase_length INTEGER DEFAULT 14;
-- ============================================
-- TABLE: user_memories
-- ============================================
CREATE TABLE IF NOT EXISTS user_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category TEXT,
    -- 'padrão sono', 'gatilho', 'vitória', 'sintoma'
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own memories" ON user_memories FOR ALL USING (auth.uid() = user_id);