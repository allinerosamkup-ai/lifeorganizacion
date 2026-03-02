// Edge Function: process-checkin
// Processa check-in diário com análise de IA usando Claude API
// Monta payload de 5 camadas de contexto e retorna análise estruturada

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckinRequest {
  free_text?: string
  humor_emoji?: 'bad' | 'low' | 'neutral' | 'good' | 'great'
  energy_score?: number
  sleep_hours?: number
  sleep_quality?: number
}

interface CheckinResponse {
  analysis: string
  predicted_energy: number
  suggested_tasks: Array<{
    title: string
    description: string
    energy_level: 'low' | 'medium' | 'high'
    priority: number
    ai_reasoning?: string
  }>
  cycle_phase?: string
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

    const checkinData: CheckinRequest = await req.json()

    // Buscar dados do usuário para contexto
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Calcular fase do ciclo
    let cyclePhase = null
    if (profile?.last_period_start) {
      // Chamar calculate-cycle-phase internamente ou calcular aqui
      // Por enquanto, vamos calcular diretamente
      const daysSince = Math.floor(
        (new Date().getTime() - new Date(profile.last_period_start).getTime()) / (1000 * 60 * 60 * 24)
      )
      const dayOfCycle = (daysSince % (profile.cycle_length || 28)) + 1

      if (dayOfCycle <= 5) cyclePhase = 'menstrual'
      else if (dayOfCycle <= (profile.cycle_length || 28) - (profile.luteal_phase_length || 14)) cyclePhase = 'follicular'
      else cyclePhase = 'luteal'
    }

    // Buscar check-ins recentes para contexto
    const { data: recentCheckins } = await supabaseClient
      .from('check_ins')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(7)

    // Buscar tarefas pendentes
    const { data: pendingTasks } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_completed', false)
      .order('due_date', { ascending: true })
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
        day_of_cycle: cyclePhase ? Math.floor(
          (new Date().getTime() - new Date(profile.last_period_start).getTime()) / (1000 * 60 * 60 * 24)
        ) % (profile?.cycle_length || 28) + 1 : null,
      },
      biometric_context: {
        sleep_hours: checkinData.sleep_hours,
        sleep_quality: checkinData.sleep_quality,
        energy_score: checkinData.energy_score,
      },
      checkin_context: {
        free_text: checkinData.free_text || '',
        humor_emoji: checkinData.humor_emoji,
        energy_score: checkinData.energy_score,
      },
      task_context: {
        pending_tasks: pendingTasks?.length || 0,
        tasks_list: pendingTasks?.slice(0, 5).map(t => ({
          title: t.title,
          priority: t.priority,
          energy_level: t.energy_level,
        })) || [],
      },
      learning_context: {
        patterns: learnings?.[0] ? {
          success_rate: learnings[0].success_rate,
          peak_hour: learnings[0].peak_hour,
          avg_energy: learnings[0].avg_energy_score,
          calibration_insights: learnings[0].calibration_insights || [],
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
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você atua como um Sistema Operacional Pessoal Adaptativo (LifeOrganizer AI). Seu foco principal é analisar a ENERGIA DISPONÍVEL da usuária (Orçamento de Energia) com base no sono, humor e na biologia (fase do ciclo menstrual é apenas um dos fatores de entrada, o app NÃO É APENAS um tracker menstrual, é uma ferramenta de produtividade e gestão de rotina cirúrgica).`
          },
          {
            role: 'user',
            content: `Analise o check-in diário da usuária e forneça insights rigorosos e cirúrgicos sobre sua capacidade de execução hoje.

Contexto completo disponível da usuária:
${JSON.stringify(contextPayload, null, 2)}

Com base nisso, forneça uma análise estruturada e EXTREMAMENTE PERSONALIZADA (evite generalidades):
1. Uma análise breve e direta (em português) focada em produtividade. Se houver descompasso entre a fase biológica e o humor relatado (ex: fase folicular com humor péssimo), a IA deve priorizar o humor real em vez da teoria biológica, sugerindo ajustes de rota. Use as "calibration_insights" para validar tendências passadas.
2. O "Orçamento de Energia" previsto para hoje (de 1 a 10). Seja conservador se os sinais forem negativos.
3. 3-5 sugestões de tarefas adaptadas estritamente ao nível de energia e aos aprendizados históricos:
   - Dia de energia BAIXA: Sugerir apenas tarefas de manutenção rotineira, organização leve ou descanso planejado.
   - Dia de energia ALTA: Sugerir tarefas analíticas, difíceis e trabalho criativo intenso.
   - EXPLIQUE o motivo de cada sugestão (ex: "Sugerido porque você costuma performar melhor hoje").

Retorne APENAS um JSON válido com a exata estrutura abaixo:
{
  "analysis": "sua análise aqui",
  "predicted_energy": 5,
  "suggested_tasks": [
    {
      "title": "título curto da tarefa",
      "description": "por que fazer isso sob esse nível de energia",
      "energy_level": "low|medium|high",
      "priority": 1
    }
  ]
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
    let aiAnalysis: CheckinResponse;
    try {
      aiAnalysis = JSON.parse(content)
    } catch (e) {
      throw new Error('Invalid response format from OpenAI API')
    }

    // Salvar check-in no banco
    const { error: insertError } = await supabaseClient
      .from('check_ins')
      .upsert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        free_text: checkinData.free_text,
        humor_emoji: checkinData.humor_emoji,
        energy_score: checkinData.energy_score,
        sleep_hours: checkinData.sleep_hours,
        sleep_quality: checkinData.sleep_quality,
        cycle_phase: cyclePhase,
        ai_analysis: aiAnalysis.analysis,
        ai_suggestions: aiAnalysis.suggested_tasks,
      }, {
        onConflict: 'user_id,date'
      })

    if (insertError) {
      console.error('Error saving check-in:', insertError)
    }

    return new Response(
      JSON.stringify({
        ...aiAnalysis,
        cycle_phase: cyclePhase,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
