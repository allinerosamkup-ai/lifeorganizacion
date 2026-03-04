import { useState, useEffect } from 'react';
import { Activity, Award, Flame, Sparkles, Brain } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { EnergyHistoryStrip } from '../components/EnergyHistoryStrip';

export const Insights = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [streak, setStreak] = useState(0);
    const [tasksCompleted, setTasksCompleted] = useState(0);
    const [aiSummary, setAiSummary] = useState('');

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            setLoading(true);

            const [{ data: checkins }, { count: taskCount }] = await Promise.all([
                supabase
                    .from('check_ins')
                    .select('date, energy_score, humor_emoji, sleep_quality')
                    .eq('user_id', user.id)
                    .order('date', { ascending: false })
                    .limit(7),
                supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('is_completed', true),
            ]);

            if (checkins) setStreak(checkins.length > 0 ? checkins.length : 0);
            if (taskCount) setTasksCompleted(taskCount);

            setAiSummary(
                'Você tem mantido uma energia incrível esta semana! Seu sono melhorou 20%, o que reflete diretamente no seu humor positivo. Continue focando nas sessões de deep work nas manhãs.'
            );
            setLoading(false);
        };

        fetchData();
    }, [user]);

    const stats = [
        {
            icon: Flame,
            iconColor: 'text-orange-500',
            iconBg: 'bg-orange-50',
            value: streak,
            label: 'Dias Seguidos',
        },
        {
            icon: Award,
            iconColor: 'text-violet-500',
            iconBg: 'bg-violet-50',
            value: tasksCompleted,
            label: 'Tarefas Feitas',
        },
    ];

    const moodData = [
        { emoji: '😊', label: 'Feliz', pct: 40, color: 'bg-amber-400' },
        { emoji: '😐', label: 'Normal', pct: 30, color: 'bg-emerald-400' },
        { emoji: '🥱', label: 'Cansada', pct: 20, color: 'bg-sky-400' },
        { emoji: '🧘', label: 'Calma', pct: 10, color: 'bg-violet-400' },
    ];

    return (
        <div className="page-bg min-h-screen pb-28">
            {/* Header */}
            <div className="page-header pt-14 pb-4 px-6">
                <h1 className="text-3xl font-serif text-stone-800 tracking-tight">Insights</h1>
                <p className="text-stone-400 text-sm mt-1 font-medium">Seu progresso e padrões</p>
            </div>

            <div className="p-6 space-y-5 max-w-lg mx-auto">
                {loading ? (
                    <div className="space-y-4 stagger">
                        <div className="skeleton h-32 rounded-3xl animate-fade-in-up" />
                        <div className="skeleton h-36 rounded-3xl animate-fade-in-up" />
                        <div className="skeleton h-28 rounded-3xl animate-fade-in-up" />
                    </div>
                ) : (
                    <>
                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-3 stagger">
                            {stats.map(({ icon: Icon, iconColor, iconBg, value, label }) => (
                                <div
                                    key={label}
                                    className="card rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-1.5 animate-fade-in-up hover-lift"
                                >
                                    <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center mb-1`}>
                                        <Icon className={`w-6 h-6 ${iconColor}`} />
                                    </div>
                                    <span className="text-3xl font-bold text-stone-800">{value}</span>
                                    <span className="section-label">{label}</span>
                                </div>
                            ))}
                        </div>

                        {/* AI Insight card */}
                        <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-lg animate-fade-in-up"
                            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)' }}>
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute left-0 bottom-0 w-32 h-32 bg-black/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <h2 className="font-serif text-xl tracking-tight">Análise da Semana</h2>
                                </div>
                                <p className="text-sm text-white/85 leading-relaxed">{aiSummary}</p>
                            </div>
                        </div>

                        {/* Energy Trends */}
                        <div className="card rounded-3xl p-6 space-y-4 animate-fade-in-up">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                                    <Activity className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-lg text-stone-800">Seu Ritmo</h3>
                                    <p className="text-xs text-stone-400 font-medium">Últimos 7 dias de energia</p>
                                </div>
                            </div>
                            <EnergyHistoryStrip />
                        </div>

                        {/* Mood breakdown */}
                        <div className="card rounded-3xl p-6 space-y-4 animate-fade-in-up">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center">
                                    <Brain className="w-4 h-4 text-rose-400" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-lg text-stone-800">Distribuição de Humor</h3>
                                    <p className="text-xs text-stone-400 font-medium">Semana atual</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {moodData.map(({ emoji, label, pct, color }) => (
                                    <div key={label} className="flex items-center gap-3">
                                        <span className="text-lg w-7 shrink-0">{emoji}</span>
                                        <span className="text-sm font-semibold text-stone-600 w-20 shrink-0">{label}</span>
                                        <div className="flex-1 h-2.5 bg-stone-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${color} transition-all duration-700`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-stone-400 w-8 text-right">{pct}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
