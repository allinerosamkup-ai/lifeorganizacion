import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization header')

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user } } = await supabaseClient.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const { message, history = [] } = await req.json()

        // Buscar contexto do usuário
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        // Fetch today's energy score and health data for enriched AI context
        // Inspired by Oura Readiness Score integration patterns
        const today = new Date().toISOString().split('T')[0]
        const { data: energyData } = await supabaseClient
            .from('daily_energy')
            .select('total_score, energy_level, sleep_score, hrv_score, activity_score, mood_score')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle()

        const { data: healthData } = await supabaseClient
            .from('health_data')
            .select('sleep_hours, hrv_rmssd, steps, active_minutes')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle()

        // Fetch recent check_ins for memory context
        const { data: recentCheckins } = await supabaseClient
            .from('check_ins')
            .select('date, humor_emoji, energy_score, free_text, ai_analysis')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(3)

        // Build energy context string for the system prompt
        let energyContext = ''
        if (energyData) {
            energyContext = `\nENERGIA HOJE: Score=${energyData.total_score}/100 (${energyData.energy_level}). ` +
                `Sub-scores: Sono=${energyData.sleep_score}, HRV=${energyData.hrv_score}, ` +
                `Atividade=${energyData.activity_score}, Humor=${energyData.mood_score}.`
        }
        if (healthData) {
            energyContext += `\nDADOS DE SAÚDE: ` +
                (healthData.sleep_hours ? `Sono=${healthData.sleep_hours}h, ` : '') +
                (healthData.hrv_rmssd ? `HRV RMSSD=${healthData.hrv_rmssd}ms, ` : '') +
                (healthData.steps ? `Passos=${healthData.steps}, ` : '') +
                (healthData.active_minutes ? `Minutos ativos=${healthData.active_minutes}` : '')
        }
        let memoryContext = ''
        if (recentCheckins && recentCheckins.length > 0) {
            memoryContext = `\nMEMÓRIA RECENTE (últimos check-ins):\n` + recentCheckins.map(c => `- ${c.date}: Humor ${c.humor_emoji}, Energia ${c.energy_score}/10. Nota: ${c.free_text || 'Sem nota'}`).join('\n');
        }

        const openAiApiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openAiApiKey) {
            throw new Error('OPENAI_API_KEY não configurada nos secrets da Edge Function')
        }

        const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAiApiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: `Você é o Airia Flow, um assistente de bem-estar e organização pessoal empático e baseado em evidências.\n` +
                            `Seu papel não é apenas um chat livre, mas conduzir uma SESSÃO GUIADA:\n` +
                            `1. Puxe a memória (temas e check-ins recentes).\n` +
                            `2. Faça 1-2 perguntas muito focadas para a pessoa refletir.\n` +
                            `3. Termine com UMA pequena ação sugerida (Behavioral Activation).\n` +
                            `NUNCA faça diagnóstico médico. Em energia baixa, sugira autocuidado extremo e mínimo atrito.\n` +
                            `Contexto: Nome=${profile?.full_name}, Plano=${profile?.plan}.` +
                            energyContext +
                            memoryContext +
                            `\n\nIMPORTANTE: VOCÊ DEVE RETORNAR APENAS UM JSON VÁLIDO. NÃO USE MARKDOWN TAGS. EXPECTED FORMAT:\n` +
                            `{\n` +
                            `  "summary": "Sua resposta conversacional e empática principal contendo a reflexão e as perguntas focadas",\n` +
                            `  "task_suggestions": [{"title": "Nome de ação minúscula sugerida", "energy_level": "low|medium|high", "reason": "Justificativa"}],\n` +
                            `  "exercise_suggestion": {"name": "Exercício leve (se apropriado)", "reason": "Justificativa"}\n` +
                            `}\n` +
                            `Se não houver tarefas ou ferramentas a sugerir, envie arrays/objetos vazios, mas a estrutura deve ser mantida.`
                    },
                    ...history,
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
            }),
        })

        if (!openAiResponse.ok) {
            const errorBody = await openAiResponse.text()
            throw new Error(`OpenAI API error ${openAiResponse.status}: ${errorBody}`)
        }

        const openAiData = await openAiResponse.json()
        const aiMessage = openAiData.choices?.[0]?.message?.content
        if (!aiMessage) {
            throw new Error('Resposta vazia do OpenAI')
        }

        let parsedMessage;
        try {
            parsedMessage = JSON.parse(aiMessage);
        } catch (e) {
            parsedMessage = { summary: aiMessage };
        }

        return new Response(
            JSON.stringify({ analysis: parsedMessage }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return new Response(
            JSON.stringify({ error: message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
