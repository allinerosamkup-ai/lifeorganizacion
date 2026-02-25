// Edge Function: calculate-cycle-phase
// Calcula a fase atual do ciclo menstrual baseado em last_period_start e cycle_length
// Adaptado do algoritmo do repositório peri (IraSoro/peri)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CyclePhaseResult {
  phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
  day_of_cycle: number
  percentage: number
  days_until_next_phase: number
  next_phase: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Obter user_id do header de autorização
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

    // Obter dados do usuário
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('last_period_start, cycle_length, luteal_phase_length')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Profile not found')
    }

    if (!profile.last_period_start) {
      return new Response(
        JSON.stringify({ error: 'last_period_start not set' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Calcular fase do ciclo
    const result = calculateCyclePhase(
      new Date(profile.last_period_start),
      profile.cycle_length || 28,
      profile.luteal_phase_length || 14
    )

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Calcula a fase atual do ciclo menstrual
 * Adaptado do algoritmo do repositório peri
 */
function calculateCyclePhase(
  lastPeriodStart: Date,
  cycleLength: number = 28,
  lutealPhaseLength: number = 14
): CyclePhaseResult {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const periodStart = new Date(lastPeriodStart)
  periodStart.setHours(0, 0, 0, 0)
  
  // Calcular dias desde o início do último período
  const daysSincePeriod = Math.floor((today.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
  
  // Normalizar para o ciclo atual (caso tenha passado mais de um ciclo)
  const dayOfCycle = (daysSincePeriod % cycleLength) + 1
  
  // Calcular fases
  const follicularLength = cycleLength - lutealPhaseLength
  const ovulationDay = follicularLength + 1
  
  let phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
  let percentage: number
  let daysUntilNextPhase: number
  let nextPhase: string
  
  if (dayOfCycle <= 5) {
    // Fase Menstrual (dias 1-5)
    phase = 'menstrual'
    percentage = (dayOfCycle / 5) * 100
    daysUntilNextPhase = 6 - dayOfCycle
    nextPhase = 'follicular'
  } else if (dayOfCycle <= follicularLength) {
    // Fase Folicular (dias 6 até ovulação)
    phase = 'follicular'
    const daysInPhase = dayOfCycle - 5
    const phaseLength = follicularLength - 5
    percentage = (daysInPhase / phaseLength) * 100
    daysUntilNextPhase = ovulationDay - dayOfCycle
    nextPhase = 'ovulation'
  } else if (dayOfCycle <= ovulationDay + 1) {
    // Ovulação (2 dias)
    phase = 'ovulation'
    percentage = dayOfCycle === ovulationDay ? 50 : 100
    daysUntilNextPhase = (ovulationDay + 2) - dayOfCycle
    nextPhase = 'luteal'
  } else {
    // Fase Lútea (até próximo período)
    phase = 'luteal'
    const daysInPhase = dayOfCycle - (ovulationDay + 1)
    percentage = (daysInPhase / lutealPhaseLength) * 100
    daysUntilNextPhase = cycleLength - dayOfCycle + 1
    nextPhase = 'menstrual'
  }
  
  return {
    phase,
    day_of_cycle: dayOfCycle,
    percentage: Math.round(percentage),
    days_until_next_phase: daysUntilNextPhase,
    next_phase: nextPhase
  }
}
