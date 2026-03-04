import { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Clock, User, Check, Moon, Sun, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useEnergyScore } from '../hooks/useEnergyScore';
import { EnergyGauge } from '../components/ui/EnergyGauge';
import { EnergyHistoryStrip } from '../components/EnergyHistoryStrip';
import { TaskEditModal } from '../components/TaskEditModal';
import { CheckinModal } from '../components/CheckinModal';
import { showToast } from '../components/ui/Toast';
import type { Task } from '../components/TaskEditModal';

interface AiSuggestion {
    title: string;
    energy_level: 'low' | 'medium' | 'high';
    description?: string;
}

const phaseLabels: Record<string, { icon: string; label: string; color: string; desc: string }> = {
    menstrual: { icon: '🌙', label: 'Menstrual', color: 'text-rose-600 bg-rose-50 border-rose-200', desc: 'Descanse e cuide de você.' },
    folicular: { icon: '🌱', label: 'Folicular', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', desc: 'Energia subindo!' },
    ovulatoria: { icon: '☀️', label: 'Ovulação', color: 'text-amber-600 bg-amber-50 border-amber-200', desc: 'Pico de energia.' },
    luteal: { icon: '🍂', label: 'Lútea', color: 'text-purple-600 bg-purple-50 border-purple-200', desc: 'Foco nas rotinas.' },
};

export const Home = ({ navigate }: { navigate: (view: string) => void }) => {
    const { user, profile } = useAuth();
    const { energy, loading: energyLoading, recalculate } = useEnergyScore();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkInDone, setCheckInDone] = useState(false);
    const [eveningDone, setEveningDone] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);

    const mode = useMemo<'morning' | 'evening'>(() => {
        const hour = new Date().getHours();
        return hour >= 17 ? 'evening' : 'morning';
    }, []);

    const firstName = profile?.full_name?.split(' ')[0] || 'você';

    const getCyclePhaseForDate = (date: Date) => {
        if (!profile?.last_period_start || !profile?.tracks_cycle) return null;
        const lastPeriod = new Date(profile.last_period_start);
        const cycleLength = (profile as Record<string, unknown>).cycle_length as number || 28;
        const daysDiff = Math.floor((date.getTime() - lastPeriod.getTime()) / (1000 * 3600 * 24));
        const dayInCycle = ((daysDiff % cycleLength) + cycleLength) % cycleLength;
        if (dayInCycle < 5) return 'menstrual';
        if (dayInCycle < 13) return 'folicular';
        if (dayInCycle < 16) return 'ovulatoria';
        return 'luteal';
    };

    const currentPhase = getCyclePhaseForDate(new Date());

    const fetchTasks = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .is('is_completed', false)
            .order('priority', { ascending: true })
            .limit(5);
        if (data) setTasks(data);
        setLoading(false);
    };

    useEffect(() => {
        if (!user) return;

        const checkTodayCheckIns = async () => {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('check_ins')
                .select('id, check_in_type')
                .eq('user_id', user.id)
                .eq('date', today);
            if (data && data.length > 0) {
                const hasMorning = data.some(c => c.check_in_type === 'morning' || !c.check_in_type);
                const hasEvening = data.some(c => c.check_in_type === 'evening');
                if (hasMorning) setCheckInDone(true);
                if (hasEvening) setEveningDone(true);
            }
        };

        const fetchAiSuggestions = async () => {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('ai_suggestions')
                .select('suggestions')
                .eq('user_id', user.id)
                .eq('date', today)
                .maybeSingle();
            if (data?.suggestions) setAiSuggestions(data.suggestions as AiSuggestion[]);
        };

        fetchTasks();
        checkTodayCheckIns();
        fetchAiSuggestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleMorningCheckIn = () => {
        setIsCheckinModalOpen(true);
    };

    const toggleTask = async (taskId: string) => {
        const { error } = await supabase.from('tasks').update({ is_completed: true, completed_at: new Date().toISOString() }).eq('id', taskId);
        if (!error) {
            setTasks(tasks.filter(t => t.id !== taskId));
            showToast('Tarefa concluída! 🎉');
        }
    };

    const handleCheckinComplete = () => {
        setIsCheckinModalOpen(false);
        if (mode === 'morning') setCheckInDone(true);
        if (mode === 'evening') setEveningDone(true);
        showToast('Check-in salvo com sucesso!');
        recalculate();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-purple-50 pb-24 relative overflow-hidden">
            <div className="absolute top-[-5%] right-[-10%] w-80 h-80 bg-orange-300/20 rounded-full mix-blend-multiply filter blur-[80px] animate-pulse" />
            <div className="absolute bottom-[20%] left-[-10%] w-72 h-72 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-[80px] animate-pulse animation-delay-2000" />

            <div className="p-6 space-y-6 relative z-10 max-w-lg mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mt-4">
                    <div>
                        <h1 className="text-4xl font-serif text-stone-800 tracking-tight">
                            {mode === 'morning' ? 'Bom dia' : 'Boa noite'}
                        </h1>
                        <p className="text-stone-500 text-sm font-medium mt-0.5">{firstName} ✨</p>
                        {currentPhase && (
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mt-1.5 border ${phaseLabels[currentPhase].color}`}>
                                <span>{phaseLabels[currentPhase].icon}</span> {phaseLabels[currentPhase].desc}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${mode === 'morning' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                            {mode === 'morning' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                            {mode === 'morning' ? 'Manhã' : 'Noite'}
                        </div>
                        <button
                            className="w-11 h-11 bg-white/60 shadow-glass-inset backdrop-blur-md rounded-full flex items-center justify-center text-stone-700 cursor-pointer border border-white/80 hover:bg-white/80 transition-all hover:scale-105"
                            onClick={() => navigate('profile')}
                            title="Perfil"
                        >
                            <User className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Energy Gauge */}
                {!energyLoading && energy && (
                    <div className="glass-card-chic rounded-3xl p-5 flex items-center gap-6">
                        <EnergyGauge score={energy.total_score} size="md" showLabel />
                        <div className="flex-1">
                            <p className="font-serif text-lg text-stone-800">Energia de Hoje</p>
                            <p className="text-sm text-stone-500 mt-0.5">{phaseLabels[energy.cycle_phase || '']?.desc || 'Baseada no seu ciclo e sono.'}</p>
                            <div className="flex gap-3 mt-2 flex-wrap">
                                {energy.sub_scores.sleep > 0 && (
                                    <span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-medium">😴 Sono {energy.sub_scores.sleep}</span>
                                )}
                                {energy.sub_scores.mood > 0 && (
                                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">🧠 Humor {energy.sub_scores.mood}</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Energy History Strip */}
                <EnergyHistoryStrip />

                {/* Morning Check-in */}
                {mode === 'morning' && (
                    <div className={`rounded-3xl p-6 space-y-5 transition-all duration-500 ${checkInDone ? 'bg-white/40 shadow-sm border border-white/50 backdrop-blur-sm' : 'glass-card-chic shadow-3d'}`}>
                        <h2 className="font-serif text-xl tracking-tight text-stone-800 flex items-center gap-2">
                            <Sun className="w-5 h-5 text-amber-400" />
                            {checkInDone ? 'Morning Prep Concluído ✓' : 'Morning Prep'}
                        </h2>

                        {!checkInDone ? (
                            <div className="space-y-4">
                                <p className="text-stone-500 text-sm">Prepare seu corpo e mente para o dia de hoje.</p>
                                <button
                                    onClick={handleMorningCheckIn}
                                    className="w-full py-4 rounded-2xl bg-stone-900 text-white font-bold text-sm shadow-md hover:bg-stone-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Iniciar Check-in <Sparkles className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-3 gap-3 text-stone-600">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                                    <Check className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-medium">Energia registrada — que seu dia flua! 🌸</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Evening Reflection */}
                {mode === 'evening' && (
                    <div className={`rounded-3xl p-6 space-y-5 transition-all duration-500 ${eveningDone ? 'bg-white/40 shadow-sm border border-white/50 backdrop-blur-sm' : 'glass-card-chic shadow-3d'}`}>
                        <h2 className="font-serif text-xl tracking-tight text-stone-800 flex items-center gap-2">
                            <Moon className="w-5 h-5 text-indigo-400" />
                            {eveningDone ? 'Reflexão Registrada ✓' : 'Evening Reflection'}
                        </h2>

                        {!eveningDone ? (
                            <div className="space-y-4">
                                <p className="text-stone-500 text-sm">Faça uma pausa e analise o que aconteceu hoje.</p>
                                <button
                                    onClick={() => navigate('reflections')}
                                    className="w-full py-4 rounded-2xl bg-stone-900 text-white font-bold text-sm shadow-md hover:bg-stone-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Iniciar Reflexão <Sparkles className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-stone-600">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500">
                                        <Check className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-medium">Reflexão salva. Descanse bem! 🌙</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* AI Suggestions */}
                {mode === 'morning' && aiSuggestions.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <h2 className="font-serif text-xl tracking-tight text-stone-800">Sugeridas pela IA</h2>
                        </div>
                        <p className="text-stone-400 text-xs font-medium -mt-1">Baseadas no seu ciclo e energia de hoje</p>
                        {aiSuggestions.map((s, i) => (
                            <div key={i} className="glass-card-chic rounded-2xl p-4 flex items-start gap-3">
                                <div className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${s.energy_level === 'high' ? 'bg-rose-400' : s.energy_level === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-stone-700 font-medium text-sm">{s.title}</p>
                                    {s.description && <p className="text-stone-400 text-xs mt-0.5">{s.description}</p>}
                                </div>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${s.energy_level === 'high' ? 'bg-rose-100 text-rose-700' : s.energy_level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {s.energy_level === 'high' ? 'Intensa' : s.energy_level === 'medium' ? 'Média' : 'Leve'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Focus Session CTA */}
                <div
                    className="bg-gradient-to-br from-emerald-500/80 to-teal-600/80 backdrop-blur-md shadow-3d rounded-3xl p-7 relative overflow-hidden text-white cursor-pointer hover:shadow-lg transition-all group"
                    onClick={() => navigate('focus')}
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative z-10">
                        <h2 className="font-serif text-3xl tracking-tight mb-2">Focus Session</h2>
                        <p className="text-emerald-50 text-sm font-medium mb-8 opacity-90">Deep work e respiração</p>
                        <button className="glass-button !text-emerald-900 !bg-white/90 hover:!bg-white px-8 py-2.5 rounded-full font-semibold text-sm backdrop-blur-sm shadow-sm transition-transform active:scale-95">
                            Quick Start
                        </button>
                    </div>
                    <Clock className="absolute top-8 right-8 w-7 h-7 text-white/40 group-hover:text-white/60 transition-colors" />
                </div>

                {/* Tasks list */}
                <div className="space-y-5">
                    <div className="space-y-1">
                        <h2 className="font-serif text-2xl tracking-tight text-stone-800">Tarefas de Hoje</h2>
                        <p className="text-stone-500 text-sm font-medium">Alinhadas com sua energia atual.</p>
                    </div>
                    <div className="space-y-3">
                        {loading ? (
                            [1, 2].map(i => <div key={i} className="h-16 bg-white/40 rounded-2xl animate-pulse" />)
                        ) : tasks.length > 0 ? (
                            tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="glass-card-chic rounded-2xl p-4 px-5 flex justify-between items-center group hover:bg-white/60 transition-all cursor-pointer"
                                    onClick={() => setEditingTask(task)}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-2.5 h-2.5 rounded-full shadow-inner-sm shrink-0 ${task.energy_level === 'high' ? 'bg-rose-400' : task.energy_level === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                        <span className="text-stone-700 font-medium truncate">{task.title}</span>
                                        {task.is_ai_suggested && <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-bold shrink-0">IA</span>}
                                    </div>
                                    <button
                                        title={`Marcar ${task.title} como concluído`}
                                        className="w-8 h-8 rounded-full bg-white/50 border border-stone-200/50 flex items-center justify-center shadow-sm cursor-pointer hover:bg-emerald-400 hover:border-emerald-500 transition-all active:scale-90 shrink-0 ml-2"
                                        onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                                    >
                                        <CheckCircle2 className="w-5 h-5 text-stone-400 hover:text-white transition-colors" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 glass-card-chic rounded-2xl border-dashed border-2 border-white/40">
                                <p className="text-stone-500 font-medium text-sm">Nenhuma tarefa pendente. Respire fundo! ✨</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isCheckinModalOpen && (
                <CheckinModal
                    onClose={() => setIsCheckinModalOpen(false)}
                    onComplete={handleCheckinComplete}
                />
            )}

            {editingTask && (
                <TaskEditModal
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                    onSave={(updated) => {
                        setTasks(tasks.map(t => t.id === updated.id ? updated : t));
                        setEditingTask(null);
                    }}
                />
            )}
        </div>
    );
};
