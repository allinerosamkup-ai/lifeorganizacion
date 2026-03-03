// Airia Flow — Stripe Checkout Session Creator
// Creates a checkout session for Pro subscription plans
// Uses Stripe API via esm.sh import (Deno-compatible)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
        if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured')

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2022-11-15',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization header')

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user } } = await supabaseClient.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const { price_id } = await req.json()
        if (!price_id) throw new Error('price_id is required')

        // Check if user already has a Stripe customer ID
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('stripe_customer_id, email, full_name')
            .eq('id', user.id)
            .single()

        let customerId = profile?.stripe_customer_id

        // Create Stripe customer if not exists
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: profile?.email || user.email,
                name: profile?.full_name || undefined,
                metadata: { supabase_user_id: user.id },
            })
            customerId = customer.id

            // Save customer ID to profile
            await supabaseClient
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', user.id)
        }

        // Create checkout session
        const origin = req.headers.get('origin') || 'http://localhost:5173'
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: price_id, quantity: 1 }],
            success_url: `${origin}?checkout=success`,
            cancel_url: `${origin}?checkout=cancelled`,
            client_reference_id: user.id,
            metadata: { supabase_user_id: user.id },
        })

        return new Response(
            JSON.stringify({ sessionId: session.id, url: session.url }),
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
