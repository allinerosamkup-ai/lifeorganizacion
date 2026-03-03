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

        const { user_id, user_request } = await req.json();

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        const today = new Date().toISOString().split("T")[0];
        const { data: energy } = await supabase.from('daily_energy').select('energy_level, total_score').eq('user_id', user_id).eq('date', today).maybeSingle();

        let energyLvl = energy?.energy_level || 'medium';
        let plan = {};

        if (energyLvl === 'low') {
            plan = {
                type: 'Mobility & Breathe',
                duration: 15,
                intensity: 'leve',
                title: "Evolua: Resgate Vitalício",
                items: ["Alongamento Costas", "Yoga de Restauração", "Respiração 4x4"],
                ai_reasoning: "Energia baixa detectada. Foco em recuperação e ativação suave."
            };
        } else if (energyLvl === 'medium') {
            plan = {
                type: 'Cardio',
                duration: 30,
                intensity: 'moderado',
                title: "Evolua: Movimento Flow",
                items: ["Caminhada moderada", "Aquecimento rápido", "Alongamento dinâmico"],
                ai_reasoning: "Nível de energia estável. O objetivo é manter o fluxo sanguíneo e regular humor."
            };
        } else {
            plan = {
                type: 'HIIT / Força',
                duration: 45,
                intensity: 'intenso',
                title: "Evolua: Pique Total",
                items: ["Corrida 20 min", "Série funcional (Flexões/Agachamentos)", "Alongamento"],
                ai_reasoning: "Energia alta hoje. Vamos canalizar isso em exercícios intensos, mantendo limite saudável."
            };
        }

        // Save history
        const { data: inserted, error: insertError } = await supabase.from('exercise_history').insert({
            user_id: user_id,
            date: today,
            exercise_type: plan.type,
            title: plan.title,
            duration_minutes: plan.duration,
            intensity: plan.intensity,
            source: 'evolua',
            ai_generated_plan: plan,
            user_request: user_request || null,
            completed: false
        }).select().single();

        if (insertError) throw insertError;

        return new Response(JSON.stringify(inserted), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
});
