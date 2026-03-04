import { useAuth } from '../lib/AuthContext';

export type CyclePhase = 'menstrual' | 'folicular' | 'ovulatoria' | 'luteal';

/**
 * Returns a function that calculates the menstrual cycle phase for any given date.
 * Centralises the logic previously duplicated across Home, Agenda, CycleTracker, and Tasks.
 */
export function useCyclePhase() {
    const { profile } = useAuth();

    const getCyclePhaseForDate = (date: Date): CyclePhase | null => {
        if (!profile?.last_period_start || !profile?.tracks_cycle) return null;

        const lastPeriod = new Date(profile.last_period_start);
        const cycleLength =
            (profile as Record<string, unknown>).cycle_length as number || 28;
        const daysDiff = Math.floor(
            (date.getTime() - lastPeriod.getTime()) / (1000 * 3600 * 24)
        );
        const dayInCycle = ((daysDiff % cycleLength) + cycleLength) % cycleLength;

        if (dayInCycle < 5) return 'menstrual';
        if (dayInCycle < 13) return 'folicular';
        if (dayInCycle < 16) return 'ovulatoria';
        return 'luteal';
    };

    return { getCyclePhaseForDate };
}
