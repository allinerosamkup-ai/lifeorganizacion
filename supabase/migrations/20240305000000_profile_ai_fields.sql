-- Migration: Add extra AI setting fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS ai_persona TEXT DEFAULT 'empatica' CHECK (
        ai_persona IN ('empatica', 'direta', 'cientifica')
    );
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS ai_language TEXT DEFAULT 'pt-BR' CHECK (ai_language IN ('pt-BR', 'en-US'));
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS prefers_clinical_terms BOOLEAN DEFAULT false;