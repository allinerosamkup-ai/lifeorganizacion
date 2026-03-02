-- Migration: Hyper-Personalization Engine
-- Add columns for AI calibration and feedback loops
ALTER TABLE public.weekly_learnings
ADD COLUMN IF NOT EXISTS calibration_insights JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS suggested_energy_level TEXT,
    ADD COLUMN IF NOT EXISTS actual_energy_required TEXT,
    ADD COLUMN IF NOT EXISTS ai_reasoning TEXT;
ALTER TABLE public.check_ins
ADD COLUMN IF NOT EXISTS metabolic_context JSONB DEFAULT '{}'::jsonb;
-- Context for physical symptoms/activities
COMMENT ON COLUMN public.weekly_learnings.calibration_insights IS 'Specific patterns learned by AI about the user (e.g., "Sleeps poorly on day 26")';
COMMENT ON COLUMN public.tasks.ai_reasoning IS 'Why the AI suggested this task for today';