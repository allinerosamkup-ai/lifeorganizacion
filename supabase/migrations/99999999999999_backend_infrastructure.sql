-- ==========================================
-- BACKEND INFRASTRUCTURE CONSOLIDATED SETUP
-- ==========================================
-- Este script configura extensões, tabelas de log e triggers necessários para o n8n.
-- 1. Habilitar a extensão pg_net se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "pg_net";
-- 2. Tabela de logs de notificação (Welcome Workflow)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT,
    -- 'welcome', 'checkin_reminder', etc.
    channel TEXT,
    -- 'whatsapp', 'email'
    sent_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);
-- 3. Tabela de logs de lembretes (Daily Check-in)
CREATE TABLE IF NOT EXISTS public.reminder_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT,
    -- 'daily_checkin', etc.
    channel TEXT,
    -- 'whatsapp'
    ab_variant TEXT,
    -- 'A' ou 'B'
    sent_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);
-- 4. Tabela de notificações In-App (Cycle Alerts)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT,
    title TEXT,
    body TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- 5. Tabela de relatórios semanais (Weekly Insights)
CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_score INTEGER,
    biggest_win TEXT,
    key_pattern TEXT,
    next_week_strategy TEXT,
    report_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- 6. Tabela de aprendizado do motor de IA (Weekly Learning Engine)
CREATE TABLE IF NOT EXISTS public.weekly_learnings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    phase TEXT,
    patterns JSONB DEFAULT '{}'::jsonb,
    behavioral_patterns JSONB DEFAULT '{}'::jsonb,
    -- Adicionado para compatibilidade com WF 06
    ai_calibration JSONB DEFAULT '{}'::jsonb,
    -- Adicionado para compatibilidade com WF 06
    prompt_hints JSONB DEFAULT '[]'::jsonb,
    -- Adicionado para compatibilidade com WF 06
    key_insight TEXT,
    confidence_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- 7. Configurar RLS e Permissões para todas as novas tabelas
DO $$
DECLARE t TEXT;
BEGIN FOR t IN
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN (
        'notification_logs',
        'reminder_logs',
        'notifications',
        'weekly_reports',
        'weekly_learnings'
    ) LOOP EXECUTE format(
        'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;',
        t
    );
EXECUTE format(
    'DROP POLICY IF EXISTS "Users can view own %I" ON public.%I;',
    t,
    t
);
EXECUTE format(
    'CREATE POLICY "Users can view own %I" ON public.%I FOR SELECT USING (auth.uid() = user_id);',
    t,
    t
);
EXECUTE format('GRANT ALL ON public.%I TO authenticated;', t);
EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
END LOOP;
END $$;
-- 8. Trigger para Welcome Workflow (n8n Webhook)
CREATE OR REPLACE FUNCTION public.notify_welcome_workflow() RETURNS TRIGGER AS $$
DECLARE webhook_url TEXT := 'https://n8n-n8n.vaax5y.easypanel.host/webhook/lifeorganizer-new-user';
BEGIN PERFORM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
        'id',
        NEW.id,
        'email',
        NEW.email,
        'full_name',
        NEW.full_name,
        'created_at',
        NEW.created_at
    )
);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_profile_created_notify_n8n ON public.profiles;
CREATE TRIGGER on_profile_created_notify_n8n
AFTER
INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.notify_welcome_workflow();