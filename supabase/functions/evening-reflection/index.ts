import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { text, mood, user_id, date } = await req.json();

        if (!text || !user_id) {
            return new Response(JSON.stringify({ error: 'Missing text or user_id' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            const isAnon = req.headers.get('apikey') === Deno.env.get('SUPABASE_ANON_KEY');
            if (!isAnon) {
                return new Response(JSON.stringify({ error: 'Missing or invalid authentication.' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 401,
                });
            }
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: { persistSession: false }
            }
        );

        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not set');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Atue como um analista empático e gentil (Justly-style).
Analise a seguinte reflexão do dia do usuário:
"${text}"

Formate a resposta ESTRITAMENTE em JSON com a seguinte estrutura exata:
{
  "ai_summary": "Resuma em 1 frase como foi o dia",
  "ai_themes": ["emoção/tema 1", "emoção/tema 2", "emoção/tema 3"],
  "ai_actions": ["ação 1 para amanhã", "ação 2 para amanhã"]
}`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        let jsonResponse = { ai_summary: "", ai_themes: [], ai_actions: [] };
        try {
            const match = response.match(/\{[\s\S]*\}/);
            if (match) {
                jsonResponse = JSON.parse(match[0]);
            } else {
                jsonResponse = JSON.parse(response);
            }
        } catch (e) {
            console.error("Failed to parse Gemini response as JSON", response);
        }

        const targetDate = date || new Date().toISOString().split('T')[0];

        const { data, error } = await supabaseClient
            .from('daily_reflections')
            .upsert({
                user_id,
                date: targetDate,
                mood: mood || 'neutral',
                free_text: text,
                ai_summary: jsonResponse.ai_summary,
                ai_themes: jsonResponse.ai_themes,
                ai_actions: jsonResponse.ai_actions
            }, { onConflict: 'user_id, date' })
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        return new Response(JSON.stringify({ data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
