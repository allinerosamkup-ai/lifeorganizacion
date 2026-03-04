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
                supabase.from('check_ins').select('date, energy_score, humor_emoji, sleep_quality').eq('user_id', user.id).order('date', { ascending: false }).limit(7),
                supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_completed', true)
            ]);

            if (checkins) {
                // fake streak calc
                setStreak(checkins.length > 0 ? 3 : 0);
            }
            if (taskCount) setTasksCompleted(taskCount);

            // Fetch an AI summary or generic phrase
            setAiSummary("Você tem mantido uma energia incrível esta semana! Seu sono melhorou 20%, o que reflete diretamente no seu humor positivo. Continue focando nas sessões de deep work nas manhãs.");

            setLoading(false);
        };
        fetchData();
    }, [user]);

    return (
        <div className="min-h-screen bg-stone-50 pb-28 relative">
            <div className="bg-white/60 backdrop-blur-2xl pt-14 pb-4 px-6 sticky top-0 z-30 border-b border-stone-100">
                <h1 className="text-3xl font-serif text-stone-800 tracking-tight">Insights</h1>
                <p className="text-stone-500 text-sm mt-1">Seu progresso e padrões</p>
            </div>

            <div className="p-6 space-y-6">
                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-32 bg-stone-200 rounded-3xl" />
                        <div className="h-32 bg-stone-200 rounded-3xl" />
                    </div>
                ) : (
                    <>
                        {/* Highlights Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white shadow-sm border border-stone-100 rounded-3xl p-5 flex flex-col items-center justify-center text-center">
                                <Flame className="w-8 h-8 text-orange-500 mb-2" />
                                <span className="text-2xl font-bold text-stone-800">{streak}</span>
                                <span className="text-xs font-semibold text-stone-500 uppercase tracking-widest mt-1">Dias Seguidos</span>
                            </div>
                            <div className="bg-white shadow-sm border border-stone-100 rounded-3xl p-5 flex flex-col items-center justify-center text-center">
                                <Award className="w-8 h-8 text-indigo-500 mb-2" />
                                <span className="text-2xl font-bold text-stone-800">{tasksCompleted}</span>
                                <span className="text-xs font-semibold text-stone-500 uppercase tracking-widest mt-1">Tarefas Feitas</span>
                            </div>
                        </div>

                        {/* AI Insight Card */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                <Sparkles className="w-5 h-5 text-indigo-200" />
                                <h2 className="font-serif text-xl tracking-tight">Análise da Semana</h2>
                            </div>
                            <p className="text-sm text-indigo-50 leading-relaxed relative z-10">
                                {aiSummary}
                            </p>
                        </div>

                        {/* Energy Trends */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-4">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-emerald-500" />
                                <h3 className="font-serif text-xl text-stone-800">Seu Ritmo</h3>
                            </div>
                            <p className="text-sm text-stone-500 mb-4">Veja como sua energia fluiu nos últimos dias.</p>
                            <div className="-mx-2">
                                <EnergyHistoryStrip />
                            </div>
                        </div>

                        {/* Mood Breakdown (Mock simple chart) */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-4">
                            <div className="flex items-center gap-2">
                                <Brain className="w-5 h-5 text-rose-400" />
                                <h3 className="font-serif text-xl text-stone-800">Distribuição de Humor</h3>
                            </div>
                            <div className="flex flex-col gap-3 mt-4">
                                {['😊 Feliz (40%)', '😐 Normal (30%)', '🥱 Cansado (20%)', '🧘 Calmo (10%)'].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-stone-600 w-28">{item.split(' ')[0]} {item.split(' ')[1]}</span>
                                        <div className="flex-1 h-3 bg-stone-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-emerald-400' : i === 2 ? 'bg-blue-400' : 'bg-purple-400'}`} style={{ width: item.match(/\((.*?)\%\)/)?.[1] + '%' }} />
                                        </div>
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
