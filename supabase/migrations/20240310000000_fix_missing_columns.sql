-- check_in_type: Home.tsx faz SELECT desta coluna mas ela não existe
ALTER TABLE public.check_ins
ADD COLUMN IF NOT EXISTS check_in_type TEXT DEFAULT 'morning' CHECK (
        check_in_type IN ('morning', 'evening', 'midday')
    );
-- completed_at: Tasks.tsx e Home.tsx atualizam esta coluna mas não está na migration original
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
-- category: Agenda.tsx filtra por esta coluna mas não está no schema
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS category TEXT CHECK (
        category IN (
            'saude',
            'trabalho',
            'pessoal',
```sql
            'estudo'
```
        )
    );
-- duration_minutes: necessário para timeline view (Structured-like)
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;
-- is_recurring + recurrence_rule: tarefas recorrentes (Elisi feature)
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;
-- Fix weekly_learnings: migration 99999999999999 tenta recriar a tabela com schema diferente
-- Como IF NOT EXISTS pula a criação, as colunas novas nunca são adicionadas
ALTER TABLE public.weekly_learnings
ADD COLUMN IF NOT EXISTS patterns JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS behavioral_patterns JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS ai_calibration JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS prompt_hints JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS key_insight TEXT,
    ADD COLUMN IF NOT EXISTS confidence_score INTEGER;