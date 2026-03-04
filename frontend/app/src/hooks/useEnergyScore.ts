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

export function useEnergyScore() {
    const { user } = useAuth();
    const [energy, setEnergy] = useState<EnergyData | null>(null);
    const [loading, setLoading] = useState(true);

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

        if (data) {
            setEnergy({
                total_score: data.total_score,
                energy_level: data.energy_level,
                sub_scores: {
                    sleep: data.sleep_score,
                    hrv: data.hrv_score,
                    activity: data.activity_score,
                    mood: data.mood_score,
                    cycle_modifier: data.cycle_modifier,
                },
                cycle_phase: data.raw_data?.cycle_phase || null,
            });
        }
        setLoading(false);
    }, [user]);

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

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!user) return;
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('daily_energy')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .maybeSingle();

            if (cancelled) return;
            if (data) {
                setEnergy({
                    total_score: data.total_score,
                    energy_level: data.energy_level,
                    sub_scores: {
                        sleep: data.sleep_score,
                        hrv: data.hrv_score,
                        activity: data.activity_score,
                        mood: data.mood_score,
                        cycle_modifier: data.cycle_modifier,
                    },
                    cycle_phase: data.raw_data?.cycle_phase || null,
                });
            } else if (!data && user) {
                recalculate();
            }
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [user, recalculate]);

    return { energy, loading, recalculate, refetch: fetchEnergy };
}
