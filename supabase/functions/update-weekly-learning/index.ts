// Edge Function: update-weekly-learning
// Analisa semana de check-ins e atualiza padrões aprendidos em weekly_learnings
// Pode ser chamado via cron (n8n) toda sexta 18h

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeeklyLearning {
  phase: string
  success_rate: number
  peak_hour: number
  avg_tasks_completed: number
  avg_energy_score: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Pode ser chamado com ou sem autenticação (se for cron)
    const authHeader = req.headers.get('Authorization')
    const requestData = await req.json().catch(() => ({}))

    // Se não tiver auth header, usar service role (para cron jobs)
    const supabaseClient = authHeader
      ? createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      )
      : createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

    // Obter user_id do request ou do auth
    let userId: string | null = null

    if (authHeader) {
      const { data: { user } } = await supabaseClient.auth.getUser()
      userId = user?.id || null
    }

    userId = userId || requestData.user_id || null

    if (!userId) {
      throw new Error('user_id required')
    }

    // Calcular semana (segunda a domingo)
    const targetDate = requestData.week_start
      ? new Date(requestData.week_start)
      : new Date()

    // Ajustar para segunda-feira da semana
    const dayOfWeek = targetDate.getDay()
    const diff = targetDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const weekStart = new Date(targetDate.setDate(diff))
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    // Buscar check-ins da semana
    const { data: checkins, error: checkinsError } = await supabaseClient
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .gte('date', weekStartStr)
      .lte('date', weekEndStr)
      .order('date', { ascending: true })

    if (checkinsError) {
      throw new Error(`Error fetching check-ins: ${checkinsError.message}`)
    }

    if (!checkins || checkins.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No check-ins found for this week'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Buscar tarefas da semana
    const { data: tasks } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString())

    // Buscar perfil para obter fase do ciclo
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('last_period_start, cycle_length, luteal_phase_length')
      .eq('id', userId)
      .single()

    // Calcular fase predominante da semana
    let predominantPhase = 'unknown'
    if (profile?.last_period_start) {
      const phaseCounts: Record<string, number> = {}
      checkins.forEach(checkin => {
        if (checkin.cycle_phase) {
          phaseCounts[checkin.cycle_phase] = (phaseCounts[checkin.cycle_phase] || 0) + 1
        }
      })
      predominantPhase = Object.entries(phaseCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown'
    }

    // Calcular métricas
    const completedTasks = tasks?.filter(t => t.is_completed) || []
    const totalTasks = tasks?.length || 0
    const successRate = totalTasks > 0
      ? (completedTasks.length / totalTasks) * 100
      : 0

    const avgEnergyScore = checkins.length > 0
      ? checkins.reduce((sum, c) => sum + (c.energy_score || 0), 0) / checkins.length
      : 0

    // Calcular pico de produtividade (hora do dia com mais tarefas completadas)
    const hourCounts: Record<number, number> = {}
    completedTasks.forEach(task => {
      if (task.updated_at) {
        const hour = new Date(task.updated_at).getHours()
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
      }
    })
    const peakHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0]
      ? parseInt(Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0][0])
      : 10 // Default: 10h

    // --- AI Calibration Logic ---
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY')
    let calibrationInsights = []

    if (openAiApiKey && checkins.length > 0) {
      try {
        const aiContext = {
          user_id: userId,
          phase: predominantPhase,
          success_rate: Math.round(successRate),
          avg_energy: Math.round(avgEnergyScore),
          daily_logs: checkins.map(c => ({
            date: c.date,
            energy: c.energy_score,
            humor: c.humor_emoji,
            text: c.free_text
          })),
          tasks_summary: tasks?.map(t => ({
            title: t.title,
            completed: t.is_completed,
            energy: t.energy_level
          }))
        }

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'Você é o Analista de Dados Científico do LifeOrganizer AI. Sua missão é identificar padrões SUTIS e NÃO ÓBVIOS entre o comportamento da usuária, seu ciclo menstrual e sua produtividade real.'
              },
              {
                role: 'user',
                content: `Analise os dados da semana e gere 3 insights cirúrgicos de calibração para o futuro. 
                Seja específico (ex: "Foco cai drasticamente após as 16h em dias de cansaço na fase luteal").
                Retorne um JSON com a chave "insights" contendo um array de strings curtas.
                Dados: ${JSON.stringify(aiContext)}`
              }
            ],
            response_format: { type: "json_object" }
          })
        })

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          calibrationInsights = JSON.parse(aiData.choices[0].message.content).insights || []
        }
      } catch (err) {
        console.error('AI Calibration failed:', err)
      }
    }

    // Criar objeto de aprendizado
    const learning: WeeklyLearning & { calibration_insights: string[] } = {
      phase: predominantPhase,
      success_rate: Math.round(successRate * 100) / 100,
      peak_hour: peakHour,
      avg_tasks_completed: Math.round((completedTasks.length / 7) * 100) / 100,
      avg_energy_score: Math.round(avgEnergyScore * 100) / 100,
      calibration_insights: calibrationInsights
    }

    // Salvar em weekly_learnings
    const { error: insertError } = await supabaseClient
      .from('weekly_learnings')
      .upsert({
        user_id: userId,
        week_start: weekStartStr,
        week_end: weekEndStr,
        ...learning,
      }, {
        onConflict: 'user_id,week_start'
      })

    if (insertError) {
      throw new Error(`Error saving learning: ${insertError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        week_start: weekStartStr,
        week_end: weekEndStr,
        learning,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
