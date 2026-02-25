// Edge Function: generate-daily-suggestions
// Gera 3-5 tarefas recomendadas para o dia baseado em contexto de 5 camadas
// Chama Claude API com prompt estruturado para sugestões personalizadas

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TaskSuggestion {
  title: string
  description: string
  energy_level: 'low' | 'medium' | 'high'
  priority: number
  due_time?: string
  subtasks?: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Obter data (hoje por padrão)
    const requestData = await req.json().catch(() => ({}))
    const targetDate = requestData.date || new Date().toISOString().split('T')[0]

    // Buscar dados do usuário
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Calcular fase do ciclo
    let cyclePhase = null
    let dayOfCycle = null
    if (profile?.last_period_start) {
      const daysSince = Math.floor(
        (new Date(targetDate).getTime() - new Date(profile.last_period_start).getTime()) / (1000 * 60 * 60 * 24)
      )
      dayOfCycle = (daysSince % (profile.cycle_length || 28)) + 1

      const follicularLength = (profile.cycle_length || 28) - (profile.luteal_phase_length || 14)
      if (dayOfCycle <= 5) cyclePhase = 'menstrual'
      else if (dayOfCycle <= follicularLength) cyclePhase = 'follicular'
      else if (dayOfCycle <= follicularLength + 2) cyclePhase = 'ovulation'
      else cyclePhase = 'luteal'
    }

    // Buscar check-in do dia (se existir)
    const { data: todayCheckin } = await supabaseClient
      .from('check_ins')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', targetDate)
      .single()

    // Buscar tarefas pendentes
    const { data: pendingTasks } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_completed', false)
      .order('due_date', { ascending: true })
      .limit(10)

    // Buscar tarefas completadas hoje
    const { data: completedToday } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .eq('updated_at', targetDate)
      .limit(10)

    // Buscar aprendizados semanais
    const { data: learnings } = await supabaseClient
      .from('weekly_learnings')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(1)

    // Montar payload de 5 camadas de contexto
    const contextPayload = {
      user_context: {
        name: profile?.full_name || 'Usuária',
        cycle_phase: cyclePhase,
        day_of_cycle: dayOfCycle,
        cognitive_preferences: profile?.cognitive_preference || [],
      },
      biometric_context: {
        sleep_hours: todayCheckin?.sleep_hours,
        sleep_quality: todayCheckin?.sleep_quality,
        energy_score: todayCheckin?.energy_score,
        current_energy: todayCheckin?.energy_score || 5,
      },
      checkin_context: {
        free_text: todayCheckin?.free_text || '',
        humor_emoji: todayCheckin?.humor_emoji,
        has_checkin_today: !!todayCheckin,
      },
      task_context: {
        pending_count: pendingTasks?.length || 0,
        completed_today: completedToday?.length || 0,
        pending_tasks: pendingTasks?.slice(0, 5).map(t => ({
          title: t.title,
          priority: t.priority,
          energy_level: t.energy_level,
          due_date: t.due_date,
        })) || [],
      },
      learning_context: {
        patterns: learnings?.[0] ? {
          success_rate: learnings[0].success_rate,
          peak_hour: learnings[0].peak_hour,
          avg_energy: learnings[0].avg_energy_score,
          best_phase: learnings[0].phase,
        } : null,
      },
    }

    // Chamar OpenAI API
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiApiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `Você atua como um Assistente de Produtividade Cirúrgico de um Sistema Operacional Pessoal Adaptativo. 
O foco absoluto é a ENERGIA DA USUÁRIA. Você não fornece suporte emocional nem foca excessivamente no ciclo menstrual como um dado isolado; o ciclo é apenas um dos dados biológicos usados para calcular o potencial de foco e as atividades recomendadas (junto com horas dormidas, contexto de tarefas, etc).`
          },
          {
            role: 'user',
            content: `Alocação de rotina solicitada para ${targetDate}.

Contexto completo do orçamento de energia, tarefas pendentes e biologia atual:
${JSON.stringify(contextPayload, null, 2)}

INSTRUÇÕES DE ALOCAÇÃO:
- Se a energia ou disposição física estimada indicar baixa capacidade (ex: dia ${dayOfCycle} do ciclo em fase ${cyclePhase} + sono ruim), SUGIRA APENAS TAREFAS DE MANUTENÇÃO (arrumar espaço, revisar, delegar), forçando o repouso cognitivo.
- Se a energia estiver alta, force ALOCAÇÃO DE TAREFAS ANALÍTICAS E COMPLEXAS.
- Ajuste e escolha as tarefas baseando-se no que está pendente, selecionando de 3 a 5 itens apenas. Seletividade é a chave da produtividade.
- Sugira horários (Time Blocking) para as atividades, encaixando-as de acordo com a predição de ritmo circadiano.

Responda APENAS em JSON válido com a seguinte estrutura:
{
  "suggestions": [
    {
      "title": "título da tarefa",
      "description": "por que foi alocado dessa forma pro orçamento de energia do dia",
      "energy_level": "low|medium|high",
      "priority": 1,
      "due_time": "14:30",
      "subtasks": ["subtarefa 1"]
    }
  ],
  "reasoning": "Resumo de 2 linhas focado no raciocínio da alocação de energia"
}`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    })

    if (!openAiResponse.ok) {
      const error = await openAiResponse.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const openAiData = await openAiResponse.json()
    const content = openAiData.choices[0].message.content

    // Extrair JSON da resposta
    let aiResponse;
    try {
      aiResponse = JSON.parse(content)
    } catch (e) {
      throw new Error('Invalid response format from OpenAI API')
    }

    // Salvar sugestões no banco
    const { error: insertError } = await supabaseClient
      .from('ai_suggestions')
      .upsert({
        user_id: user.id,
        date: targetDate,
        suggestions: aiResponse.suggestions,
        context_used: contextPayload,
      }, {
        onConflict: 'user_id,date'
      })

    if (insertError) {
      console.error('Error saving suggestions:', insertError)
    }

    return new Response(
      JSON.stringify(aiResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
