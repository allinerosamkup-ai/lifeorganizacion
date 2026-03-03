import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const { user_id, transcript } = await req.json();

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openAiApiKey) throw new Error('OPENAI_API_KEY not configured');

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
                        content: `Você extrai a intenção de transcrições de voz do usuário. Categorize em "task", "event" ou "mood".
Extraia título, data/hora e emoção correspondente se aplicável.
Retorne um JSON: {"intent": "task|event|mood", "title": "titulo", "time": "HH:MM", "date": "YYYY-MM-DD", "emoji": "😊"}`
                    },
                    {
                        role: 'user',
                        content: `Transcrição: "${transcript}"`
                    }
                ],
                temperature: 0,
                response_format: { type: "json_object" }
            }),
        });

        const openAiData = await openAiResponse.json();
        const result = JSON.parse(openAiData.choices[0].message.content);

        // Save based on intent
        const today = new Date().toISOString().split("T")[0];

        if (result.intent === 'mood') {
            const { error } = await supabase.from('check_ins').insert({
                user_id: user_id,
                humor_emoji: result.emoji || '😐',
                energy_score: 5,
                free_text: transcript,
                checked_at: new Date().toISOString()
            });
            if (error) throw error;
        } else {
            const { error } = await supabase.from('tasks').insert({
                user_id: user_id,
                title: result.title || transcript,
                due_date: result.date || today,
                due_time: result.time || null,
                energy_level: 'medium',
                priority: 3
            });
            if (error) throw error;
        }

        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
});
