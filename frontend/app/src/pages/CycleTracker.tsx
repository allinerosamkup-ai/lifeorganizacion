import { useState, useMemo, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight, User
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval,
    isSameMonth, isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const phaseInfo: Record<string, { label: string; icon: string; color: string; bg: string; tip: string }> = {
    menstrual: {
        label: 'Fase Menstrual', icon: '🌙', color: 'text-rose-600', bg: 'bg-rose-200/60',
        tip: 'Priorize descanso e tarefas leves. Seu corpo está se renovando.'
    },
    folicular: {
        label: 'Fase Folicular', icon: '🌱', color: 'text-emerald-600', bg: 'bg-emerald-200/60',
        tip: 'Energia crescente! Ótimo momento para planejamento e projetos novos.'
    },
    ovulatoria: {
        label: 'Ovulação', icon: '☀️', color: 'text-amber-600', bg: 'bg-amber-200/60',
        tip: 'Pico de energia e comunicação. Ideal para reuniões e apresentações.'
    },
    luteal: {
        label: 'Fase Lútea', icon: '🍂', color: 'text-purple-600', bg: 'bg-purple-200/60',
        tip: 'Foco em finalizar tarefas e autocuidado. Evite sobrecarga.'
    },
};

export const CycleTracker = ({ navigate }: { navigate: (view: string) => void }) => {
    const { user, profile } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const loading = !profile;
    const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
    const [crampLevel, setCrampLevel] = useState(0);
    const [headacheLevel, setHeadacheLevel] = useState(0);
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [energyHistory, setEnergyHistory] = useState<Record<string, { energy_level: string, total_score: number }>>({});

    // Fetch energy history when month changes
    useEffect(() => {
        const fetchEnergy = async () => {
            if (!user) return;
            const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
            const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

            const { data } = await supabase
                .from('daily_energy')
                .select('date, energy_level, total_score')
                .eq('user_id', user.id)
                .gte('date', start)
                .lte('date', end);

            if (data) {
                const historyMap: Record<string, { energy_level: string, total_score: number }> = {};
                data.forEach(d => { historyMap[d.date] = { energy_level: d.energy_level, total_score: d.total_score }; });
                setEnergyHistory(historyMap);
            }
        };
        fetchEnergy();
    }, [user, currentMonth]);

    // Calculate cycle phase for a given date
    const getCyclePhaseForDate = (date: Date) => {
        if (!profile?.last_period_start) return null;
        const lastPeriod = new Date(profile.last_period_start);
        const cycleLength = profile.cycle_length || 28;
        const daysDiff = Math.floor((date.getTime() - lastPeriod.getTime()) / (1000 * 3600 * 24));
        const dayInCycle = ((daysDiff % cycleLength) + cycleLength) % cycleLength;

        if (dayInCycle < 5) return 'menstrual';
        if (dayInCycle < 13) return 'folicular';
        if (dayInCycle < 16) return 'ovulatoria';
        return 'luteal';
    };

    const getDayInCycle = () => {
        if (!profile?.last_period_start) return null;
        const lastPeriod = new Date(profile.last_period_start);
        const cycleLength = profile.cycle_length || 28;
        const daysDiff = Math.floor((new Date().getTime() - lastPeriod.getTime()) / (1000 * 3600 * 24));
        return ((daysDiff % cycleLength) + cycleLength) % cycleLength + 1;
    };

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const start = startOfWeek(monthStart, { weekStartsOn: 1 });
        const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const currentPhase = getCyclePhaseForDate(new Date());
    const dayInCycle = getDayInCycle();
    const phase = currentPhase ? phaseInfo[currentPhase] : null;

    const phaseColors: Record<string, string> = {
        menstrual: 'bg-rose-200/60',
        folicular: 'bg-emerald-200/60',
        ovulatoria: 'bg-amber-200/60',
        luteal: 'bg-purple-200/60',
    };

    // Save symptoms
    const saveSymptoms = async () => {
        if (!user) return;
        setSaving(true);

        const moodMap: Record<string, string> = { '🌩️': 'bad', '🌸': 'neutral', '☀️': 'great' };

        const metabolicContext = {
            flow: selectedFlow,
            cramps: crampLevel,
            headache: headacheLevel,
            mood_detail: selectedMood,
        };

        await supabase.from('check_ins').upsert({
            user_id: user.id,
            date: format(new Date(), 'yyyy-MM-dd'),
            humor_emoji: selectedMood ? moodMap[selectedMood] || 'neutral' : null,
            cycle_phase: currentPhase,
            cycle_day: dayInCycle,
            metabolic_context: metabolicContext,
        }, { onConflict: 'user_id,date' });

        setSaving(false);
        setSelectedFlow(null);
        setCrampLevel(0);
        setHeadacheLevel(0);
        setSelectedMood(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-100 pb-28 relative overflow-hidden">
            <div className="absolute top-[-5%] left-[-10%] w-96 h-96 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" />
            <div className="absolute bottom-[10%] right-[-10%] w-80 h-80 bg-orange-300/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" />

            <div className="p-6 space-y-6 max-w-lg mx-auto relative z-10">
                <div className="flex justify-between items-center mt-4">
                    <h1 className="text-3xl font-serif text-stone-800 tracking-tight">Ciclo</h1>
                    <div className="flex gap-3">
                        <div className="w-11 h-11 shadow-glass-inset bg-white/60 backdrop-blur-md rounded-full flex items-center justify-center text-stone-700 cursor-pointer border border-white/80 hover:bg-white/80 transition-all hover:scale-105" onClick={() => navigate('profile')}>
                            <User className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Current Phase Card */}
                {phase && (
                    <div className="glass-card-chic rounded-3xl p-6 shadow-3d space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-stone-500 font-medium">Fase Atual</p>
                                <h2 className={`text-2xl font-serif ${phase.color}`}>{phase.icon} {phase.label}</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-serif text-stone-800">{dayInCycle}</p>
                                <p className="text-xs text-stone-400 font-medium">dia do ciclo</p>
                            </div>
                        </div>
                        <p className="text-sm text-stone-600 leading-relaxed">{phase.tip}</p>

                        {/* Cycle progress bar */}
                        <div className="pt-2">
                            <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
                                <div className="bg-rose-300 flex-[5]" />
                                <div className="bg-emerald-300 flex-[8]" />
                                <div className="bg-amber-300 flex-[3]" />
                                <div className="bg-purple-300 flex-[12]" />
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-[9px] text-stone-400">Menstrual</span>
                                <span className="text-[9px] text-stone-400">Folicular</span>
                                <span className="text-[9px] text-stone-400">Ovulação</span>
                                <span className="text-[9px] text-stone-400">Lútea</span>
                            </div>
                            {/* Current day marker */}
                            {dayInCycle && profile?.cycle_length && (
                                <div className="relative h-0 -mt-5">
                                    <div
                                        className="absolute top-0 w-0.5 h-4 bg-stone-800 rounded-full"
                                        style={{ left: `${(dayInCycle / profile.cycle_length) * 100}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!profile?.last_period_start && !loading && (
                    <div className="glass-card-chic rounded-3xl p-6 shadow-3d text-center">
                        <p className="text-lg font-serif text-stone-700 mb-2">Configure seu ciclo</p>
                        <p className="text-sm text-stone-500 mb-4">Vá para configurações e insira a data do seu último período.</p>
                        <button type="button" onClick={() => navigate('settings')} className="px-6 py-2.5 bg-pink-400 text-white rounded-xl font-semibold">
                            Ir para Configurações
                        </button>
                    </div>
                )}

                {/* Calendar */}
                <div className="glass-card-chic rounded-3xl p-6 shadow-3d">
                    <div className="flex justify-between items-center mb-4">
                        <button type="button" title="Mês anterior" onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100/50 transition-colors">
                            <ChevronLeft className="w-5 h-5 text-stone-500" />
                        </button>
                        <h2 className="font-serif text-lg text-stone-800 capitalize">
                            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                        </h2>
                        <button type="button" title="Próximo mês" onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100/50 transition-colors">
                            <ChevronRight className="w-5 h-5 text-stone-500" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-y-2 text-center mb-4">
                        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d, i) => (
                            <div key={i} className="text-[10px] font-bold text-stone-400 uppercase">{d}</div>
                        ))}
                        {calendarDays.map((date, i) => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const isCurrentMonth = isSameMonth(date, currentMonth);
                            const phaseForDay = getCyclePhaseForDate(date);
                            const energyForDay = energyHistory[dateStr];

                            let bgColor = 'bg-stone-50 text-stone-700';
                            if (energyForDay?.energy_level === 'high') bgColor = 'bg-emerald-200/60 text-emerald-800';
                            else if (energyForDay?.energy_level === 'medium') bgColor = 'bg-amber-200/60 text-amber-800';
                            else if (energyForDay?.energy_level === 'low') bgColor = 'bg-rose-200/60 text-rose-800';

                            return (
                                <div key={i} className="flex flex-col items-center gap-0.5">
                                    <div
                                        className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all relative
                                            ${!isCurrentMonth ? 'opacity-20' : ''}
                                            ${isToday(date) ? 'ring-2 ring-stone-400 ring-offset-2 font-bold scale-110' : ''}
                                            ${bgColor}
                                        `}
                                    >
                                        {format(date, 'd')}
                                    </div>
                                    {/* Secondary indicator: Cycle Phase Dot */}
                                    {phaseForDay && isCurrentMonth && (
                                        <div className={`w-1.5 h-1.5 rounded-full ${phaseColors[phaseForDay].replace('bg-', 'bg-').replace('/60', '')} opacity-60`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Energy legend */}
                    <div className="flex justify-center gap-4 flex-wrap border-t border-stone-200/50 pt-4 mb-2">
                        <div className="flex items-center gap-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                            <span className="text-[10px] text-stone-500 font-medium">Alta Energia</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            <span className="text-[10px] text-stone-500 font-medium">Média Energia</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                            <span className="text-[10px] text-stone-500 font-medium">Baixa Energia</span>
                        </div>
                    </div>
                    {/* Cycle Legend */}
                    <div className="flex justify-center gap-3 flex-wrap opacity-60">
                        {Object.entries(phaseInfo).map(([key, info]) => (
                            <div key={key} className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${phaseColors[key].replace('/60', '')}`} />
                                <span className="text-[9px] text-stone-500">{info.label.replace('Fase ', '')}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Symptoms Tracker */}
                <div className="glass-card-chic rounded-3xl p-6 shadow-3d space-y-5">
                    <h2 className="font-serif text-xl tracking-tight text-stone-800">Sintomas de Hoje</h2>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <span className="w-20 text-sm font-semibold text-stone-600">Fluxo</span>
                            <div className="flex-1 flex gap-2">
                                {['Leve', 'Médio', 'Intenso'].map(level => (
                                    <button
                                        type="button"
                                        key={level}
                                        onClick={() => setSelectedFlow(selectedFlow === level ? null : level)}
                                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${selectedFlow === level ? 'bg-pink-400 text-white shadow-sm' : 'bg-white/40 text-stone-500 border border-white/60'}`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="w-20 text-sm font-semibold text-stone-600">Cólica</span>
                            <div className="flex-1 flex gap-2">
                                {[0, 1, 2, 3].map(level => (
                                    <button
                                        type="button"
                                        key={level}
                                        onClick={() => setCrampLevel(level)}
                                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${crampLevel === level ? 'bg-rose-400 text-white shadow-sm' : 'bg-white/40 text-stone-500 border border-white/60'}`}
                                    >
                                        {level === 0 ? 'Sem' : level === 1 ? 'Leve' : level === 2 ? 'Mod.' : 'Forte'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="w-20 text-sm font-semibold text-stone-600 leading-tight">Dor de Cabeça</span>
                            <div className="flex-1 flex gap-2">
                                {[0, 1, 2, 3].map(level => (
                                    <button
                                        type="button"
                                        key={level}
                                        onClick={() => setHeadacheLevel(level)}
                                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${headacheLevel === level ? 'bg-orange-400 text-white shadow-sm' : 'bg-white/40 text-stone-500 border border-white/60'}`}
                                    >
                                        {level === 0 ? 'Sem' : level === 1 ? 'Leve' : level === 2 ? 'Mod.' : 'Forte'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="w-20 text-sm font-semibold text-stone-600">Humor</span>
                            <div className="flex-1 flex gap-2">
                                {['🌩️', '🌸', '☀️'].map(mood => (
                                    <button
                                        type="button"
                                        key={mood}
                                        onClick={() => setSelectedMood(selectedMood === mood ? null : mood)}
                                        className={`flex-1 py-3 rounded-2xl text-xl transition-all ${selectedMood === mood ? 'bg-pink-100/80 shadow-inner border border-pink-200/50 scale-105' : 'bg-white/40 hover:bg-white/60'}`}
                                    >
                                        {mood}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={saveSymptoms}
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white py-3.5 rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? 'Salvando...' : 'Registrar Sintomas'}
                    </button>
                </div>
            </div>
        </div>
    );
};
