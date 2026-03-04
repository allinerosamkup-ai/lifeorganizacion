export type CyclePhase = 'menstrual' | 'folicular' | 'ovulatoria' | 'luteal';

export function getCyclePhase(
    lastPeriodStart: string | null | undefined,
    cycleLength: number = 28,
    date: Date = new Date()
): CyclePhase | null {
    if (!lastPeriodStart) return null;
    const last = new Date(lastPeriodStart);
    // normalizar hora para não dar problema nos dias
    const lastNormalized = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    const dateNormalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diff = Math.floor((dateNormalized.getTime() - lastNormalized.getTime()) / 86400000);
    const day = ((diff % cycleLength) + cycleLength) % cycleLength;

    if (day < 5) return 'menstrual';
    if (day < 13) return 'folicular';
    if (day < 16) return 'ovulatoria';
    return 'luteal';
}

export const PHASE_LABELS: Record<CyclePhase, string> = {
    menstrual: 'Menstrual',
    folicular: 'Folicular',
    ovulatoria: 'Ovulatória',
    luteal: 'Luteal',
};

export const PHASE_COLORS: Record<CyclePhase, string> = {
    menstrual: '#EBBAB9',
    folicular: '#CDE6C4',
    ovulatoria: '#F9EAC2',
    luteal: '#D8CDEA',
};
