-- Migration para adicionar as Funções RPC do n8n
-- 0. Adicionar suporte a tokens do Firebase FCM (Google)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
-- =========================================================================
-- 1. get_users_without_checkin_today
-- Retorna usuárias sem check-in + fase atual + streak
-- =========================================================================
CREATE OR REPLACE FUNCTION get_users_without_checkin_today(timezone_offset INT DEFAULT 0) RETURNS TABLE (
        user_id UUID,
        fcm_token TEXT,
        cycle_phase TEXT,
        streak INT
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE target_date DATE := (
        now() AT TIME ZONE 'UTC' + (timezone_offset || ' minutes')::interval
    )::date;
BEGIN RETURN QUERY
SELECT p.id AS user_id,
    p.fcm_token,
    COALESCE(
        (
            SELECT ch.cycle_phase
            FROM check_ins ch
            WHERE ch.user_id = p.id
            ORDER BY ch.date DESC
            LIMIT 1
        ), 'unknown'
    ) AS cycle_phase,
    COALESCE(p.current_streak, 0) AS streak
FROM profiles p
    LEFT JOIN check_ins ch ON ch.user_id = p.id
    AND ch.date = target_date
WHERE ch.id IS NULL;
-- Only users who do NOT have a check_in for target_date
END;
$$;
-- =========================================================================
-- 2. get_users_near_phase_transition(days_ahead)
-- Retorna usuárias com transição de fase em N dias
-- =========================================================================
CREATE OR REPLACE FUNCTION get_users_near_phase_transition(days_ahead INT DEFAULT 1) RETURNS TABLE (
        user_id UUID,
        fcm_token TEXT,
        next_phase TEXT,
        transition_date DATE
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE target_date DATE := CURRENT_DATE + days_ahead;
BEGIN RETURN QUERY
SELECT p.id AS user_id,
    p.fcm_token,
    CASE
        WHEN c.follicular_start = target_date THEN 'Folicular'
        WHEN c.ovulation_date = target_date THEN 'Ovulatória'
        WHEN c.luteal_start = target_date THEN 'Luteal'
        WHEN c.next_period_predicted = target_date THEN 'Menstrual'
        ELSE NULL
    END AS next_phase,
    target_date AS transition_date
FROM profiles p
    JOIN cycle_data c ON c.user_id = p.id
WHERE c.follicular_start = target_date
    OR c.ovulation_date = target_date
    OR c.luteal_start = target_date
    OR c.next_period_predicted = target_date;
END;
$$;
-- =========================================================================
-- 3. get_active_users_weekly_data
-- Retorna dados agregados da semana por usuária
-- =========================================================================
CREATE OR REPLACE FUNCTION get_active_users_weekly_data(min_checkins INT DEFAULT 3) RETURNS TABLE (
        user_id UUID,
        checkins_count BIGINT,
        avg_energy DECIMAL(4, 2),
        avg_sleep DECIMAL(4, 2),
        avg_sleep_quality DECIMAL(4, 2)
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY
SELECT ch.user_id,
    COUNT(ch.date) AS checkins_count,
    AVG(ch.energy_score)::DECIMAL(4, 2) AS avg_energy,
    AVG(ch.sleep_hours)::DECIMAL(4, 2) AS avg_sleep,
    AVG(ch.sleep_quality)::DECIMAL(4, 2) AS avg_sleep_quality
FROM check_ins ch
WHERE ch.date >= CURRENT_DATE - 7
GROUP BY ch.user_id
HAVING COUNT(ch.date) >= min_checkins;
END;
$$;
-- =========================================================================
-- 4. get_users_weekly_learning_data
-- Retorna check-ins + tarefas + sessões foco da semana para a IA processar
-- =========================================================================
CREATE OR REPLACE FUNCTION get_users_weekly_learning_data(weeks_back INT DEFAULT 1) RETURNS TABLE (
        user_id UUID,
        checkins_data JSON,
        tasks_data JSON,
        focus_sessions_data JSON
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE start_date DATE := CURRENT_DATE - (weeks_back * 7);
end_date DATE := CURRENT_DATE - ((weeks_back - 1) * 7);
BEGIN RETURN QUERY
SELECT p.id AS user_id,
    COALESCE(
        (
            SELECT json_agg(row_to_json(ch))
            FROM check_ins ch
            WHERE ch.user_id = p.id
                AND ch.date >= start_date
                AND ch.date < end_date
        ),
        '[]'::json
    ) AS checkins_data,
    COALESCE(
        (
            SELECT json_agg(row_to_json(t))
            FROM tasks t
            WHERE t.user_id = p.id
                AND t.created_at::date >= start_date
                AND t.created_at::date < end_date
        ),
        '[]'::json
    ) AS tasks_data,
    COALESCE(
        (
            SELECT json_agg(row_to_json(fs))
            FROM focus_sessions fs
            WHERE fs.user_id = p.id
                AND fs.started_at::date >= start_date
                AND fs.started_at::date < end_date
        ),
        '[]'::json
    ) AS focus_sessions_data
FROM profiles p;
END;
$$;