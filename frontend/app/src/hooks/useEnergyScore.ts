import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export interface EnergyData {
    total_score: number;
    energy_level: 'low' | 'medium' | 'high';
    sub_scores: {
        sleep: number;
        hrv: number;
        activity: number;
        mood: number;
        cycle_modifier: number;
    };
    cycle_phase: string | null;
}

/** Maps a raw `daily_energy` DB row to the typed `EnergyData` shape. */
function mapEnergyRow(data: Record<string, unknown>): EnergyData {
    return {
        total_score: data.total_score as number,
        energy_level: data.energy_level as 'low' | 'medium' | 'high',
        sub_scores: {
            sleep: data.sleep_score as number,
            hrv: data.hrv_score as number,
            activity: data.activity_score as number,
            mood: data.mood_score as number,
            cycle_modifier: data.cycle_modifier as number,
        },
        cycle_phase: (data.raw_data as Record<string, unknown> | null)?.cycle_phase as string | null ?? null,
    };
}

export function useEnergyScore() {
    const { user } = useAuth();
    const [energy, setEnergy] = useState<EnergyData | null>(null);
    const [loading, setLoading] = useState(true);

    /** Refetch today's energy from the DB. */
    const fetchEnergy = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
            .from('daily_energy')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle();

        if (data) setEnergy(mapEnergyRow(data));
        setLoading(false);
    }, [user]);

    /** Call the Edge Function to recalculate today's energy score. */
    const recalculate = useCallback(async () => {
        if (!user) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const resp = await supabase.functions.invoke('calculate-energy-score', {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });

            if (resp.data && !resp.error) {
                setEnergy(resp.data as EnergyData);
            }
        } catch (e) {
            console.error('Energy recalculation failed:', e);
        }
    }, [user]);

    // Initial load: fetch from DB, or trigger calculation if none exists yet.
    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!user) {
                if (!cancelled) setLoading(false);
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('daily_energy')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .maybeSingle();

            if (cancelled) return;

            if (data) {
                setEnergy(mapEnergyRow(data));
            } else {
                // No record yet — ask the backend to generate one
                recalculate();
            }
            setLoading(false);
        })();

        return () => { cancelled = true; };
    }, [user, recalculate]);

    return { energy, loading, recalculate, refetch: fetchEnergy };
}
