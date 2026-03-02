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

// Default weights — higher weight on sleep and HRV per research evidence
const DEFAULT_WEIGHTS = {
    sleep: 0.30,
    hrv: 0.25,
    activity: 0.20,
    mood: 0.20,
    cycle: 0.05,
}

// ---------- Sub-score Calculators ----------

/**
 * SleepScore (0-100)
 * Optimal: 7-9 hours, consistent bed/wake times
 * Penalizes: <6h, >9.5h, irregular schedule vs baseline
 */
function calculateSleepScore(
    sleepHours: number | null,
    sleepQuality: number | null,
    baselineAvgHours: number
): number {
    if (!sleepHours) return 50 // neutral if no data

    let score = 50

    // Duration component (0-50 points)
    if (sleepHours >= 7 && sleepHours <= 9) {
        score += 40 // optimal range
    } else if (sleepHours >= 6 && sleepHours < 7) {
        score += 25 // slightly short
    } else if (sleepHours > 9 && sleepHours <= 9.5) {
        score += 30 // slightly long
    } else if (sleepHours < 6) {
        score += Math.max(0, 15 - (6 - sleepHours) * 10) // severe penalty
    } else {
        score += 15 // oversleeping >9.5h
    }

    // Consistency vs personal baseline (0-10 points)
    const deviation = Math.abs(sleepHours - baselineAvgHours)
    if (deviation < 0.5) score += 10
    else if (deviation < 1) score += 5
    else score -= Math.min(10, deviation * 5)

    // Quality bonus if available (1-10 scale → 0-10 points)
    if (sleepQuality) {
        score += Math.round((sleepQuality / 10) * 10)
    }

    return Math.max(0, Math.min(100, score))
}

/**
 * HRVScore (0-100)
 * Compares today's RMSSD to 14-day rolling average
 * Higher HRV = better recovery, lower = more stress
 */
function calculateHRVScore(
    todayRmssd: number | null,
    baselineRmssd: number | null
): number {
    if (!todayRmssd || !baselineRmssd || baselineRmssd === 0) return 50

    const ratio = todayRmssd / baselineRmssd

    // Ratio > 1 means better than baseline, < 1 means worse
    if (ratio >= 1.1) return 90        // significantly better
    if (ratio >= 1.0) return 80        // at or above baseline
    if (ratio >= 0.9) return 65        // slightly below
    if (ratio >= 0.8) return 50        // moderately below
    if (ratio >= 0.7) return 35        // significantly below
    return Math.max(10, Math.round(ratio * 50)) // severely below
}

/**
 * ActivityScore (0-100)
 * Balance between sedentarism and overtraining
 * Optimal: ~7000-10000 steps/day, 30-60 min activity
 */
function calculateActivityScore(
    steps: number | null,
    activeMinutes: number | null,
    recentHighIntensityDays: number  // consecutive high-intensity days in last 7
): number {
    let score = 50

    // Steps component (0-40 points)
    const s = steps || 0
    if (s >= 7000 && s <= 12000) score += 40
    else if (s >= 5000 && s < 7000) score += 30
    else if (s >= 3000 && s < 5000) score += 20
    else if (s < 3000) score += 5  // very sedentary
    else if (s > 12000 && s <= 15000) score += 35
    else score += 25 // extreme activity

    // Active minutes (0-20 points)
    const am = activeMinutes || 0
    if (am >= 30 && am <= 60) score += 20
    else if (am >= 15 && am < 30) score += 12
    else if (am > 60 && am <= 90) score += 15
    else if (am < 15) score += 3
    else score += 10 // >90 min

    // Overtraining penalty
    if (recentHighIntensityDays >= 4) score -= 15
    else if (recentHighIntensityDays >= 3) score -= 8

    return Math.max(0, Math.min(100, score))
}

/**
 * MoodScore (0-100)
 * Based on today's check-in moods (can be multiple)
 * Penalizes abrupt drops and euphoria combined with poor sleep
 */
function calculateMoodScore(
    todayMoods: string[],
    sleepHours: number | null
): number {
    if (!todayMoods.length) return 50

    const moodValues: Record<string, number> = {
        'great': 90,
        'good': 75,
        'neutral': 55,
        'low': 30,
        'bad': 15,
    }

    // Average of all check-ins today
    const avgMood = todayMoods.reduce((sum, m) => sum + (moodValues[m] || 50), 0) / todayMoods.length

    let score = avgMood

    // SAFETY: euphoria + poor sleep = potential mania risk → cap score
    // This is a conservative signal, not a diagnosis
    const hasEuphoria = todayMoods.some(m => m === 'great')
    const poorSleep = (sleepHours || 7) < 5
    if (hasEuphoria && poorSleep) {
        score = Math.min(score, 45) // flag as concerning, not necessarily good energy
    }

    // Volatility penalty: if moods span wide range in same day
    if (todayMoods.length >= 2) {
        const values = todayMoods.map(m => moodValues[m] || 50)
        const range = Math.max(...values) - Math.min(...values)
        if (range > 40) score -= 10 // high volatility
    }

    return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * CycleModifier (-20 to +20)
 * Small adjustment based on menstrual cycle phase
 * NEVER the primary driver — just a modifier
 */
function calculateCycleModifier(cyclePhase: string | null): number {
    if (!cyclePhase) return 0

    const modifiers: Record<string, number> = {
        'menstrual': -8,     // lower energy typical
        'follicular': +5,    // rising energy
        'ovulatory': +8,     // peak energy typical
        'luteal': -3,        // gradual decline
    }

    return modifiers[cyclePhase] || 0
}

// ---------- Main Score Combiner ----------

function computeEnergyScore(
    sleepScore: number,
    hrvScore: number,
    activityScore: number,
    moodScore: number,
    cycleModifier: number,
    weights = DEFAULT_WEIGHTS
): number {
    const raw =
        weights.sleep * sleepScore +
        weights.hrv * hrvScore +
        weights.activity * activityScore +
        weights.mood * moodScore +
        cycleModifier * weights.cycle * 100 // scale modifier to weight range

    // SAFETY RULE: Never give high score when sleep is very poor AND mood is accelerated
    // This prevents masking potential hypo/mania episodes
    const isPoorSleep = sleepScore < 30
    const isAcceleratedMood = moodScore > 80
    if (isPoorSleep && isAcceleratedMood) {
        return Math.min(Math.round(raw), 40)
    }

    return Math.max(0, Math.min(100, Math.round(raw)))
}

// ---------- Edge Function Handler ----------

serve(async (req) => {
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

        // 1. Fetch today's health data
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

        // 3. Fetch baseline data (last 14 days of health_data for averages)
        const twoWeeksAgo = new Date()
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
        const { data: baselineData } = await supabaseClient
            .from('health_data')
            .select('sleep_hours, hrv_rmssd, steps, active_minutes')
            .eq('user_id', user.id)
            .gte('date', twoWeeksAgo.toISOString().split('T')[0])
            .lt('date', today)

        // 4. Compute baselines
        const baselineSleepHours = baselineData?.length
            ? baselineData.reduce((s, d) => s + (d.sleep_hours || 0), 0) / baselineData.filter(d => d.sleep_hours).length || 7.5
            : 7.5

        const baselineHrv = baselineData?.length
            ? baselineData.reduce((s, d) => s + (d.hrv_rmssd || 0), 0) / baselineData.filter(d => d.hrv_rmssd).length || null
            : null

        // 5. Count recent high-intensity days (for overtraining check)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const { data: recentExercises } = await supabaseClient
            .from('exercise_history')
            .select('intensity')
            .eq('user_id', user.id)
            .gte('date', sevenDaysAgo.toISOString().split('T')[0])
            .eq('completed', true)

        const highIntensityDays = recentExercises?.filter(e => e.intensity === 'intense').length || 0

        // 6. Get current cycle phase (from profile calculation)
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
        const todayMoods = todayCheckins?.map(c => c.humor_emoji).filter(Boolean) as string[] || []

        const sleepScore = calculateSleepScore(
            healthData?.sleep_hours || null,
            healthData?.sleep_quality || null,
            baselineSleepHours
        )

        const hrvScore = calculateHRVScore(
            healthData?.hrv_rmssd || null,
            baselineHrv
        )

        const activityScore = calculateActivityScore(
            healthData?.steps || null,
            healthData?.active_minutes || null,
            highIntensityDays
        )

        const moodScore = calculateMoodScore(todayMoods, healthData?.sleep_hours || null)

        const cycleModifier = calculateCycleModifier(cyclePhase)

        // 8. Compute final Energy Score
        const totalScore = computeEnergyScore(sleepScore, hrvScore, activityScore, moodScore, cycleModifier)

        // 9. Upsert to daily_energy
        const { error: upsertError } = await supabaseClient
            .from('daily_energy')
            .upsert({
                user_id: user.id,
                date: today,
                sleep_score: sleepScore,
                hrv_score: hrvScore,
                activity_score: activityScore,
                mood_score: moodScore,
                cycle_modifier: cycleModifier,
                total_score: totalScore,
                weights_used: DEFAULT_WEIGHTS,
                raw_data: {
                    health_data: healthData,
                    moods: todayMoods,
                    baselines: {
                        sleep_hours: baselineSleepHours,
                        hrv_rmssd: baselineHrv,
                    },
                    cycle_phase: cyclePhase,
                    high_intensity_days: highIntensityDays,
                },
            }, { onConflict: 'user_id,date' })

        if (upsertError) throw upsertError

        return new Response(
            JSON.stringify({
                total_score: totalScore,
                energy_level: totalScore >= 70 ? 'high' : totalScore >= 40 ? 'medium' : 'low',
                sub_scores: {
                    sleep: sleepScore,
                    hrv: hrvScore,
                    activity: activityScore,
                    mood: moodScore,
                    cycle_modifier: cycleModifier,
                },
                cycle_phase: cyclePhase,
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
