// Airia — Energy Score Calculation Engine
// Computes a daily Energy Score (0-100) from objective + subjective inputs.
// Inspired by Oura Readiness Score, adapted for mood/energy cycling.
//
// Sub-scores: SleepScore, HRVScore, ActivityScore, MoodScore, CycleModifier
// References: pyhrv (RMSSD), Oura readiness model, behavioral activation literature

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ---------- Sub-score Calculators ----------

function calculateSleepScore(sleepHours: number | null): number {
    if (!sleepHours) return 30; // neutral se não tiver dados
    if (sleepHours >= 8) return 50;
    if (sleepHours >= 6) return 30;
    return 10;
}

function calculateMoodScore(todayMoods: string[]): number {
    if (!todayMoods.length) return 30; // neutral se não tiver

    // Mapeamento para texto e emoji
    const moodValues: Record<string, number> = {
        'great': 50,
        'good': 50,
        'neutral': 30,
        'okay': 30,
        'low': 10,
        'bad': 10,
        '🤩': 50,
        '🙂': 50,
        '😐': 30,
        '🥲': 10,
        '😔': 10
    };

    // Média de todos os check-ins / reflexões
    const sum = todayMoods.reduce((acc, m) => acc + (moodValues[m] || 30), 0);
    return Math.round(sum / todayMoods.length);
}

function computeEnergyScore(sleepScore: number, moodScore: number): number {
    return Math.max(0, Math.min(100, Math.round(sleepScore + moodScore)));
}

// ---------- Edge Function Handler ----------

serve(async (req: any) => {
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

        const today = new Date().toISOString().split('T')[0]

        // 1. Fetch today's health data (for sleep)
        const { data: healthData } = await supabaseClient
            .from('health_data')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle()

        // 2. Fetch today's check-ins (can be multiple)
        const { data: todayCheckins } = await supabaseClient
            .from('check_ins')
            .select('humor_emoji, energy_score')
            .eq('user_id', user.id)
            .gte('checked_at', `${today}T00:00:00`)
            .lte('checked_at', `${today}T23:59:59`)

        // 3. Get current cycle phase (from profile calculation) - keeping if needed
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('last_period_start, cycle_length, luteal_phase_length')
            .eq('id', user.id)
            .single()

        let cyclePhase: string | null = null
        if (profile?.last_period_start && profile?.cycle_length) {
            const lastPeriod = new Date(profile.last_period_start)
            const todayDate = new Date(today)
            const dayInCycle = Math.floor((todayDate.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24)) % profile.cycle_length
            const lutealLength = profile.luteal_phase_length || 14
            const ovulationDay = profile.cycle_length - lutealLength
            const follicularEnd = ovulationDay - 1

            if (dayInCycle < 5) cyclePhase = 'menstrual'
            else if (dayInCycle <= follicularEnd) cyclePhase = 'follicular'
            else if (dayInCycle <= ovulationDay + 1) cyclePhase = 'ovulatory'
            else cyclePhase = 'luteal'
        }

        // 7. Calculate sub-scores
        // Combine check_ins and daily_reflections
        const { data: todayReflections } = await supabaseClient
            .from('daily_reflections')
            .select('mood')
            .eq('user_id', user.id)
            .eq('date', today)

        const checkinMoods = todayCheckins?.map((c: any) => c.humor_emoji).filter(Boolean) as string[] || []
        const reflectionMoods = todayReflections?.map((c: any) => c.mood).filter(Boolean) as string[] || []
        const todayMoods = [...checkinMoods, ...reflectionMoods]

        const sleepScore = calculateSleepScore(healthData?.sleep_hours || null)
        const moodScore = calculateMoodScore(todayMoods)
        const totalScore = computeEnergyScore(sleepScore, moodScore)

        // 9. Upsert to daily_energy
        const { error: upsertError } = await supabaseClient
            .from('daily_energy')
            .upsert({
                user_id: user.id,
                date: today,
                sleep_score: sleepScore,
                mood_score: moodScore,
                total_score: totalScore,
                raw_data: {
                    health_data: healthData,
                    moods: todayMoods
                },
            }, { onConflict: 'user_id,date' })

        if (upsertError) throw upsertError

        return new Response(
            JSON.stringify({
                total_score: totalScore,
                energy_level: totalScore >= 70 ? 'high' : totalScore >= 40 ? 'medium' : 'low',
                sub_scores: {
                    sleep: sleepScore,
                    mood: moodScore
                }
            }),
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
