import { CheckCircle2, Clock, User, Check, Moon, Sun, Sparkles } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useEnergyScore } from '../hooks/useEnergyScore';
import { useCyclePhase } from '../hooks/useCyclePhase';
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

const phaseConfig: Record<string, { icon: string; label: string; cls: string; desc: string }> = {
    menstrual: { icon: '🌙', label: 'Menstrual', cls: 'phase-menstrual', desc: 'Descanse e cuide de você.' },
    folicular: { icon: '🌱', label: 'Folicular', cls: 'phase-folicular', desc: 'Energia subindo!' },
    ovulatoria: { icon: '☀️', label: 'Ovulação', cls: 'phase-ovulatoria', desc: 'Pico de energia.' },
    luteal: { icon: '🍂', label: 'Lútea', cls: 'phase-luteal', desc: 'Foco nas rotinas.' },
};

const energyDot = (level: string) => {
    if (level === 'high') return 'bg-emerald-400';
    if (level === 'medium') return 'bg-amber-400';
    return 'bg-rose-400';
};

const energyBadge = (level: string) => {
    if (level === 'high') return 'bg-emerald-50 text-emerald-700';
    if (level === 'medium') return 'bg-amber-50 text-amber-700';
    return 'bg-rose-50 text-rose-700';
};

const energyLabel = (level: string) => {
    if (level === 'high') return 'Intensa';
    if (level === 'medium') return 'Média';
    return 'Leve';
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

    const { getCyclePhaseForDate } = useCyclePhase();
    const firstName = profile?.full_name?.split(' ')[0] || 'você';
    const currentPhase = getCyclePhaseForDate(new Date());
    const phase = currentPhase ? phaseConfig[currentPhase] : null;

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

        const fetchTasks = async () => {
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

        fetchTasks();
        checkTodayCheckIns();
        fetchAiSuggestions();
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleTask = async (taskId: string) => {
        const { error } = await supabase
            .from('tasks')
            .update({ is_completed: true, completed_at: new Date().toISOString() })
            .eq('id', taskId);
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
        <div className="page-bg pb-28 relative overflow-hidden">
            {/* Decorative blobs — lighter, consistent */}
            <div className="pointer-events-none select-none">
                <div className="absolute top-[-8%] right-[-15%] w-72 h-72 bg-rose-200/30 organic-shape" />
                <div className="absolute top-[30%] left-[-18%] w-60 h-60 bg-violet-200/25 organic-shape-2" />
            </div>

            <div className="p-6 space-y-5 relative z-10 max-w-lg mx-auto">

                {/* ── Header ── */}
                <header className="flex justify-between items-start mt-5">
                    <div>
                        <h1 className="text-4xl font-serif text-stone-800 tracking-tight">
                            {mode === 'morning' ? 'Bom dia' : 'Boa noite'}
                        </h1>
                        <p className="text-stone-500 text-sm font-semibold mt-0.5">
                            {firstName}&nbsp;
                            <span className="text-base">{mode === 'morning' ? '🌸' : '🌙'}</span>
                        </p>
                        {phase && (
                            <span className={`pill border mt-2 ${phase.cls}`}>
                                <span>{phase.icon}</span>
                                <span>{phase.label}  ·  {phase.desc}</span>
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                        <span className={`pill ${mode === 'morning' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {mode === 'morning' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                            {mode === 'morning' ? 'Manhã' : 'Noite'}
                        </span>
                        <button
                            className="w-10 h-10 card-glass rounded-full flex items-center justify-center text-stone-600 hover-lift tap-spring transition-all"
                            onClick={() => navigate('profile')}
                            aria-label="Ir para perfil"
                        >
                            <User className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* ── Energy Gauge Card ── */}
                {!energyLoading && energy ? (
                    <div className="card-glass rounded-3xl p-5 flex items-center gap-5 animate-fade-in-up">
                        <EnergyGauge score={energy.total_score} size="md" showLabel />
                        <div className="flex-1 min-w-0">
                            <p className="font-serif text-lg text-stone-800">Energia de Hoje</p>
                            <p className="text-sm text-stone-500 mt-0.5 leading-snug">
                                {phaseConfig[energy.cycle_phase || '']?.desc || 'Baseada no seu ciclo e sono.'}
                            </p>
                            <div className="flex gap-2 mt-2.5 flex-wrap">
                                {energy.sub_scores.sleep > 0 && (
                                    <span className="pill bg-sky-50 text-sky-700">😴 Sono {energy.sub_scores.sleep}</span>
                                )}
                                {energy.sub_scores.mood > 0 && (
                                    <span className="pill bg-violet-50 text-violet-700">🧠 Humor {energy.sub_scores.mood}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ) : !energyLoading ? null : (
                    <div className="skeleton h-[100px] rounded-3xl" />
                )}

                {/* ── Energy History ── */}
                <EnergyHistoryStrip />

                {/* ── Morning / Evening Check-in card ── */}
                {mode === 'morning' && (
                    <div className={`rounded-3xl p-6 space-y-4 transition-all duration-500 animate-fade-in-up ${checkInDone ? 'card' : 'card-float'}`}>
                        <h2 className="font-serif text-xl text-stone-800 flex items-center gap-2">
                            <Sun className={`w-5 h-5 ${checkInDone ? 'text-amber-300' : 'text-amber-400'}`} />
                            {checkInDone ? 'Morning Prep Concluído ✓' : 'Morning Prep'}
                        </h2>
                        {!checkInDone ? (
                            <div className="space-y-3">
                                <p className="text-stone-500 text-sm leading-relaxed">Prepare seu corpo e mente para o dia de hoje.</p>
                                <button
                                    onClick={() => setIsCheckinModalOpen(true)}
                                    className="btn-dark flex items-center justify-center gap-2"
                                >
                                    Iniciar Check-in <Sparkles className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 text-stone-600 py-1">
                                <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center">
                                    <Check className="w-5 h-5 text-amber-600" />
                                </div>
                                <p className="text-sm font-semibold">Energia registrada — que seu dia flua! 🌸</p>
                            </div>
                        )}
                    </div>
                )}

                {mode === 'evening' && (
                    <div className={`rounded-3xl p-6 space-y-4 transition-all duration-500 animate-fade-in-up ${eveningDone ? 'card' : 'card-float'}`}>
                        <h2 className="font-serif text-xl text-stone-800 flex items-center gap-2">
                            <Moon className={`w-5 h-5 ${eveningDone ? 'text-indigo-300' : 'text-indigo-400'}`} />
                            {eveningDone ? 'Reflexão Registrada ✓' : 'Evening Reflection'}
                        </h2>
                        {!eveningDone ? (
                            <div className="space-y-3">
                                <p className="text-stone-500 text-sm leading-relaxed">Faça uma pausa e analise o que aconteceu hoje.</p>
                                <button
                                    onClick={() => navigate('reflections')}
                                    className="btn-dark flex items-center justify-center gap-2"
                                >
                                    Iniciar Reflexão <Sparkles className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 text-stone-600 py-1">
                                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <Check className="w-5 h-5 text-indigo-500" />
                                </div>
                                <p className="text-sm font-semibold">Reflexão salva. Descanse bem! 🌙</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── AI Suggestions ── */}
                {mode === 'morning' && aiSuggestions.length > 0 && (
                    <div className="space-y-3 animate-fade-in-up">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-violet-500" />
                            <h2 className="font-serif text-xl text-stone-800">Sugeridas pela IA</h2>
                        </div>
                        <p className="section-label -mt-1">Baseadas no seu ciclo e energia de hoje</p>
                        <div className="space-y-2">
                            {aiSuggestions.map((s, i) => (
                                <div key={i} className="card-glass rounded-2xl p-4 flex items-start gap-3 hover-lift">
                                    <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${energyDot(s.energy_level)}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-stone-700 font-semibold text-sm">{s.title}</p>
                                        {s.description && (
                                            <p className="text-stone-400 text-xs mt-0.5 leading-snug">{s.description}</p>
                                        )}
                                    </div>
                                    <span className={`pill shrink-0 ${energyBadge(s.energy_level)}`}>
                                        {energyLabel(s.energy_level)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Focus Session CTA ── */}
                <button
                    className="w-full text-left bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-7 relative overflow-hidden text-white hover-lift group animate-fade-in-up cursor-pointer"
                    onClick={() => navigate('focus')}
                    aria-label="Iniciar Focus Session"
                >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
                    <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <h2 className="font-serif text-3xl tracking-tight mb-1.5">Focus Session</h2>
                        <p className="text-emerald-50 text-sm font-medium mb-7 opacity-90">Deep work e respiração</p>
                        <span className="glass-button !text-emerald-900 !bg-white/90 px-7 py-2.5 rounded-full font-bold text-sm inline-flex items-center gap-1.5">
                            Quick Start
                        </span>
                    </div>
                    <Clock className="absolute top-7 right-7 w-7 h-7 text-white/30 group-hover:text-white/50 transition-colors" />
                </button>

                {/* ── Tasks List ── */}
                <div className="space-y-4 animate-fade-in-up">
                    <div>
                        <h2 className="font-serif text-2xl text-stone-800">Tarefas de Hoje</h2>
                        <p className="text-stone-400 text-sm font-medium mt-0.5">Alinhadas com sua energia atual.</p>
                    </div>

                    <div className="space-y-2.5">
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="skeleton h-[60px]" />)
                        ) : tasks.length > 0 ? (
                            tasks.map((task) => (
                                <button
                                    key={task.id}
                                    className="card rounded-2xl px-4 py-3.5 flex justify-between items-center hover-lift w-full text-left group"
                                    onClick={() => setEditingTask(task)}
                                    aria-label={`Editar tarefa: ${task.title}`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${energyDot(task.energy_level || 'medium')}`} />
                                        <span className="text-stone-700 font-semibold text-sm truncate">{task.title}</span>
                                        {task.is_ai_suggested && (
                                            <span className="pill bg-violet-50 text-violet-600 shrink-0 text-[10px]">IA</span>
                                        )}
                                    </div>
                                    <span
                                        role="img"
                                        aria-label={`Concluir tarefa`}
                                        className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center shrink-0 ml-2 group-hover:bg-emerald-400 group-hover:border-emerald-400 transition-all"
                                        onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                                    >
                                        <CheckCircle2 className="w-5 h-5 text-stone-300 group-hover:text-white transition-colors" />
                                    </span>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-10 card rounded-2xl border-dashed border-stone-200">
                                <p className="text-2xl mb-2">✨</p>
                                <p className="text-stone-500 font-semibold text-sm">Nenhuma tarefa pendente.</p>
                                <p className="text-stone-400 text-xs mt-0.5">Respire fundo e aproveite!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Modals ── */}
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
