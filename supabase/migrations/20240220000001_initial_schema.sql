-- Migration inicial: Schema completo do LifeOrganizer AI
-- Baseado no documento Master Project Document v2.0
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_net";
-- ============================================
-- TABELA: profiles
-- Dados do usuário, plano Stripe, configurações de ciclo e preferências
-- ============================================
-- ============================================
-- TABELA: profiles
-- Dados do usuário, plano Stripe, configurações de ciclo e preferências
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    stripe_customer_id TEXT,
    onboarding_completed BOOLEAN DEFAULT false,
    -- Configurações de ciclo menstrual
    last_period_start DATE,
    cycle_length INTEGER DEFAULT 28 CHECK (
        cycle_length BETWEEN 21 AND 35
    ),
    luteal_phase_length INTEGER DEFAULT 14 CHECK (
        luteal_phase_length BETWEEN 10 AND 16
    ),
    -- Preferências cognitivas (array de strings)
    cognitive_preference TEXT [],
    -- Configurações de sono
    sleep_time TIME DEFAULT '22:30',
    wake_time TIME DEFAULT '07:00',
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- ============================================
-- TABELA: check_ins
-- Registro diário com humor, energia, texto livre e análise da IA
-- ============================================
-- ============================================
-- TABELA: check_ins
-- Registro diário com humor, energia, texto livre e análise da IA
-- ============================================
CREATE TABLE IF NOT EXISTS check_ins (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    -- Dados do check-in
    free_text TEXT,
    humor_emoji TEXT CHECK (
        humor_emoji IN ('bad', 'low', 'neutral', 'good', 'great')
    ),
    energy_score INTEGER CHECK (
        energy_score BETWEEN 1 AND 10
    ),
    -- Dados de sono
    sleep_hours DECIMAL(4, 2),
    sleep_quality INTEGER CHECK (
        sleep_quality BETWEEN 1 AND 10
    ),
    -- Dados do ciclo (calculados)
    cycle_phase TEXT,
    -- Análise da IA
    ai_analysis TEXT,
    ai_suggestions JSONB DEFAULT '[]',
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Constraint: um check-in por usuário por dia
    UNIQUE(user_id, date)
);
-- ============================================
-- TABELA: tasks
-- Tarefas com subtarefas (JSONB), prioridade, nível de energia necessário
-- ============================================
-- ============================================
-- TABELA: tasks
-- Tarefas com subtarefas (JSONB), prioridade, nível de energia necessário
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    -- Dados da tarefa
    title TEXT NOT NULL,
    description TEXT,
    energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')),
    priority INTEGER DEFAULT 3 CHECK (
        priority BETWEEN 1 AND 5
    ),
    -- Datas e horários
    due_date DATE,
    due_time TIME,
    -- Status
    is_completed BOOLEAN DEFAULT false,
    -- Relacionamentos
    related_objective TEXT,
    -- Subtarefas (JSONB array)
    subtasks JSONB DEFAULT '[]',
    -- Insights da IA
    ai_insight TEXT,
    is_ai_suggested BOOLEAN DEFAULT false,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- ============================================
-- TABELA: cycle_data
-- Histórico do ciclo menstrual para cálculo de fases
-- ============================================
-- ============================================
-- TABELA: cycle_data
-- Histórico do ciclo menstrual para cálculo de fases
-- ============================================
CREATE TABLE IF NOT EXISTS cycle_data (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    -- Dados do ciclo
    period_start_date DATE NOT NULL,
    period_end_date DATE,
    cycle_length INTEGER,
    -- Fases calculadas
    follicular_start DATE,
    ovulation_date DATE,
    luteal_start DATE,
    next_period_predicted DATE,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now()
);
-- ============================================
-- TABELA: ai_suggestions
-- Sugestões geradas pela IA por data
-- ============================================
-- ============================================
-- TABELA: ai_suggestions
-- Sugestões geradas pela IA por data
-- ============================================
CREATE TABLE IF NOT EXISTS ai_suggestions (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    -- Sugestões (JSONB array de tarefas sugeridas)
    suggestions JSONB DEFAULT '[]',
    -- Contexto usado para gerar
    context_used JSONB,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Constraint: uma sugestão por usuário por dia
    UNIQUE(user_id, date)
);
-- ============================================
-- TABELA: weekly_learnings
-- Padrões aprendidos — taxa de sucesso por fase, pico de produtividade
-- ============================================
-- ============================================
-- TABELA: weekly_learnings
-- Padrões aprendidos — taxa de sucesso por fase, pico de produtividade
-- ============================================
CREATE TABLE IF NOT EXISTS weekly_learnings (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    -- Período analisado
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    -- Padrões aprendidos
    phase TEXT,
    success_rate DECIMAL(5, 2),
    -- Percentual de sucesso (0-100)
    peak_hour INTEGER CHECK (
        peak_hour BETWEEN 0 AND 23
    ),
    avg_tasks_completed DECIMAL(5, 2),
    avg_energy_score DECIMAL(4, 2),
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Constraint: uma análise por usuário por semana
    UNIQUE(user_id, week_start)
);
-- ============================================
-- TABELA: focus_sessions
-- Sessões de Modo Foco (Pomodoro adaptativo)
-- ============================================
CREATE TABLE IF NOT EXISTS focus_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    -- Dados da sessão
    task_id UUID REFERENCES tasks(id) ON DELETE
    SET NULL,
        duration_minutes INTEGER NOT NULL,
        completed BOOLEAN DEFAULT false,
        -- Contexto biológico no momento da sessão
        cycle_phase TEXT,
        energy_level TEXT,
        -- Timestamps
        started_at TIMESTAMPTZ DEFAULT now(),
        completed_at TIMESTAMPTZ
);
-- ============================================
-- ÍNDICES para performance
-- ============================================
-- ============================================
-- ÍNDICES para performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_check_ins_user_date ON check_ins(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON tasks(user_id, due_date, is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_cycle_data_user_period ON cycle_data(user_id, period_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_learnings_user_week ON weekly_learnings(user_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_started ON focus_sessions(user_id, started_at DESC);
-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Usuários só veem seus próprios dados
-- ============================================
-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
-- Políticas para profiles
-- Políticas para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR
SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR
INSERT WITH CHECK (auth.uid() = id);
-- Políticas para check_ins
DROP POLICY IF EXISTS "Users can manage own check_ins" ON check_ins;
CREATE POLICY "Users can manage own check_ins" ON check_ins FOR ALL USING (auth.uid() = user_id);
-- Políticas para tasks
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
CREATE POLICY "Users can manage own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);
-- Políticas para cycle_data
DROP POLICY IF EXISTS "Users can manage own cycle_data" ON cycle_data;
CREATE POLICY "Users can manage own cycle_data" ON cycle_data FOR ALL USING (auth.uid() = user_id);
-- Políticas para ai_suggestions
DROP POLICY IF EXISTS "Users can manage own ai_suggestions" ON ai_suggestions;
CREATE POLICY "Users can manage own ai_suggestions" ON ai_suggestions FOR ALL USING (auth.uid() = user_id);
-- Políticas para weekly_learnings
DROP POLICY IF EXISTS "Users can manage own weekly_learnings" ON weekly_learnings;
CREATE POLICY "Users can manage own weekly_learnings" ON weekly_learnings FOR ALL USING (auth.uid() = user_id);
-- Políticas para focus_sessions
DROP POLICY IF EXISTS "Users can manage own focus_sessions" ON focus_sessions;
CREATE POLICY "Users can manage own focus_sessions" ON focus_sessions FOR ALL USING (auth.uid() = user_id);
-- ============================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ language 'plpgsql';
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE
UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE
UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================
-- TRIGGER: Criar perfil automaticamente ao criar usuário
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (id, email, full_name)
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
-- ============================================
-- COMENTÁRIOS nas tabelas
-- ============================================
COMMENT ON TABLE profiles IS 'Perfis de usuários com configurações de ciclo, sono e preferências';
COMMENT ON TABLE check_ins IS 'Check-ins diários com análise de IA';
COMMENT ON TABLE tasks IS 'Tarefas com subtarefas e insights de IA';
COMMENT ON TABLE cycle_data IS 'Histórico de ciclos menstruais';
COMMENT ON TABLE ai_suggestions IS 'Sugestões de tarefas geradas pela IA';
COMMENT ON TABLE weekly_learnings IS 'Padrões aprendidos pela IA sobre a usuária';
COMMENT ON TABLE focus_sessions IS 'Sessões de Modo Foco (Pomodoro adaptativo)';