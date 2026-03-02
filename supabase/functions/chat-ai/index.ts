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
                        content: `Você é o Airia Flow, um assistente de bem-estar e organização pessoal empático e baseado em evidências. ` +
                            `Seu papel é ajudar a pessoa a organizar o dia de forma compatível com sua energia real. ` +
                            `Use princípios de Behavioral Activation (agendar atividades mesmo sem vontade) e respeite limites de energia. ` +
                            `NUNCA faça diagnóstico médico. NUNCA promova produtividade tóxica. ` +
                            `Em energia baixa, sugira autocuidado e tarefas mínimas. ` +
                            `Contexto: Nome=${profile?.full_name}, Plano=${profile?.plan}.` +
                            energyContext +
                            `\n\nIMPORTANTE: VOCÊ DEVE RETORNAR APENAS UM JSON VÁLIDO. NÃO USE MARKDOWN TAGS. EXPECTED FORMAT:\n` +
                            `{\n` +
                            `  "summary": "Sua resposta conversacional e empática principal",\n` +
                            `  "task_suggestions": [{"title": "Nome", "energy_level": "low|medium|high", "reason": "Justificativa"}],\n` +
                            `  "exercise_suggestion": {"name": "Exercício", "reason": "Justificativa"}\n` +
                            `}\n` +
                            `Se não houver tarefas ou exercícios a sugerir, envie arrays/objetos vazios, mas a estrutura deve ser mantida.`
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
