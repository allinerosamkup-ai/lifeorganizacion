import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CheckCircle2, CircleDashed, Trash2, Plus, Filter,
    Wand2, SplitSquareHorizontal, Clock, X, Pencil
} from 'lucide-react';
import { showToast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { format, startOfWeek, endOfWeek } from 'date-fns';

import { TaskEditModal } from '../components/TaskEditModal';

export interface Task {
    id: string;
    title: string;
    description?: string;
    note?: string;
    energy_level: 'low' | 'medium' | 'high';
    priority: number;
    due_date: string | null;
    due_time?: string;
    is_completed: boolean;
    subtasks: Array<{ id: string; title: string; is_completed: boolean }>;
    ai_insight?: string;
    is_ai_suggested?: boolean;
    created_at: string;
    edited_at?: string;
}

const phaseMap: Record<string, { color: string; bg: string; icon: string; label: string }> = {
    menstrual: { color: '#E8606A', bg: '#FDEAEA', icon: '🌙', label: 'Menstrual' },
    folicular: { color: '#5FBF8A', bg: '#E8F5EE', icon: '🌱', label: 'Folicular' },
    ovulatoria: { color: '#F0C04A', bg: '#FDF6E3', icon: '☀️', label: 'Ovulatória' },
    luteal: { color: '#9B7DE0', bg: '#F0EBF8', icon: '🍂', label: 'Luteal' },
};

const energyMap: Record<string, { icon: string; label: string; tw: string }> = {
    low: { icon: '🌙', label: 'Baixa', tw: 'text-purple-600 bg-purple-50' },
    medium: { icon: '🌿', label: 'Média', tw: 'text-emerald-600 bg-emerald-50' },
    high: { icon: '🔥', label: 'Alta', tw: 'text-orange-600 bg-orange-50' },
};

export const Tasks = () => {
    const { t } = useTranslation();
    const { user, profile } = useAuth();
    const [tab, setTab] = useState<'today' | 'week' | 'completed'>('today');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterEnergy, setFilterEnergy] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isSplitting, setIsSplitting] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newEnergy, setNewEnergy] = useState<'low' | 'medium' | 'high'>('medium');
    const [newPriority, setNewPriority] = useState(3);

    // Edit modal state
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const today = format(new Date(), 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const getCurrentPhase = () => {
        if (!profile?.last_period_start) return null;
        const lastPeriod = new Date(profile.last_period_start);
        const cycleLength = profile.cycle_length || 28;
        const daysDiff = Math.floor((new Date().getTime() - lastPeriod.getTime()) / (1000 * 3600 * 24));
        const dayInCycle = ((daysDiff % cycleLength) + cycleLength) % cycleLength;
        if (dayInCycle < 5) return 'menstrual';
        if (dayInCycle < 13) return 'folicular';
        if (dayInCycle < 16) return 'ovulatoria';
        return 'luteal';
    };

    useEffect(() => {
        if (!user) return;
        fetchTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, tab]);

    const fetchTasks = async () => {
        if (!user) return;
        setLoading(true);

        let query = supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id);

        if (tab === 'today') {
            query = query.eq('is_completed', false).eq('due_date', today);
        } else if (tab === 'week') {
            query = query.eq('is_completed', false).gte('due_date', weekStart).lte('due_date', weekEnd);
        } else {
            query = query.eq('is_completed', true);
        }

        query = query.order('priority', { ascending: false }).order('created_at', { ascending: false });

        const { data, error } = await query;
        if (!error && data) {
            setTasks(data);
        }
        setLoading(false);
    };

    const toggleTask = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const newStatus = !task.is_completed;

        const { error } = await supabase
            .from('tasks')
            .update({ is_completed: newStatus, completed_at: newStatus ? new Date().toISOString() : null })
            .eq('id', taskId);

        if (!error) {
            setTasks(tasks.filter(t => t.id !== taskId));
            showToast(newStatus ? 'Tarefa concluída!' : 'Tarefa reaberta');
        }
    };

    const deleteTask = async (taskId: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (!error) {
            setTasks(tasks.filter(t => t.id !== taskId));
            showToast('Tarefa excluída');
        }
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
    };

    const toggleSubtask = async (taskId: string, subtaskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const updatedSubtasks = task.subtasks.map(st =>
            st.id === subtaskId ? { ...st, is_completed: !st.is_completed } : st
        );

        const { error } = await supabase
            .from('tasks')
            .update({ subtasks: updatedSubtasks })
            .eq('id', taskId);

        if (!error) {
            setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t));
        }
    };

    const splitTaskWithAI = async (task: Task) => {
        setIsSplitting(task.id);
        try {
            const { data } = await supabase.functions.invoke('chat-ai', {
                body: {
                    message: `Divida esta tarefa em 3-5 subtarefas práticas e acionáveis. Retorne APENAS um JSON array de strings, sem texto adicional. Tarefa: "${task.title}"`,
                    history: []
                }
            });

            if (data?.analysis) {
                const jsonMatch = data.analysis.match(/\[[\s\S]*?\]/);
                if (jsonMatch) {
                    const titles: string[] = JSON.parse(jsonMatch[0]);
                    const subtasks = titles.map(t => ({
                        id: crypto.randomUUID(),
                        title: t.replace(/^\d+[.)]\s*/, ''),
                        is_completed: false
                    }));
                    const { error } = await supabase.from('tasks').update({ subtasks }).eq('id', task.id);
                    if (!error) {
                        setTasks(tasks.map(t => t.id === task.id ? { ...t, subtasks } : t));
                    }
                }
            }
        } catch (err) {
            console.error('Split error:', err);
            alert(t('tasks.split_error'));
        } finally {
            setIsSplitting(null);
        }
    };

    const addTask = async () => {
        if (!newTitle.trim() || !user) return;
        const { data, error } = await supabase.from('tasks').insert([{
            user_id: user.id,
            title: newTitle.trim(),
            energy_level: newEnergy,
            priority: newPriority,
            due_date: today,
            subtasks: [],
        }]).select();

        if (!error && data) {
            if (tab === 'today') setTasks(prev => [data[0], ...prev]);
            setNewTitle('');
            setNewPriority(3);
            setNewEnergy('medium');
            setShowAddModal(false);
        }
    };

    const filtered = filterEnergy ? tasks.filter(t => t.energy_level === filterEnergy) : tasks;
    const currentPhase = getCurrentPhase();

    const tabs: { id: 'today' | 'week' | 'completed'; label: string }[] = [
        { id: 'today', label: t('tasks.tab_today') },
        { id: 'week', label: t('tasks.tab_week') },
        { id: 'completed', label: t('tasks.tab_completed') },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-rose-50/50 to-purple-50/50 pb-28">
            {/* Header */}
            <div className="bg-white/60 backdrop-blur-2xl pt-14 pb-4 px-6 sticky top-0 z-30 border-b border-white/80 shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-serif text-stone-800 tracking-tight">{t('tasks.title')}</h1>
                        {currentPhase && (
                            <span
                                className="text-[11px] font-bold px-2.5 py-1 rounded-full mt-1.5 inline-flex items-center gap-1 shadow-sm border border-black/5"
                                style={{ background: phaseMap[currentPhase].bg, color: phaseMap[currentPhase].color }}
                            >
                                <span className="text-sm">{phaseMap[currentPhase].icon}</span> {phaseMap[currentPhase].label}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2.5">
                        <button
                            type="button"
                            title={t('tasks.filter_tasks')}
                            onClick={() => setShowFilters(f => !f)}
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-[0.95] ${filterEnergy ? 'bg-orange-400 text-white shadow-lg shadow-orange-400/30' : 'bg-white/80 text-stone-600 hover:bg-white border border-white hover:shadow-md'}`}
                        >
                            <Filter className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                        <button
                            type="button"
                            title={t('tasks.add')}
                            onClick={() => setShowAddModal(true)}
                            className="w-11 h-11 rounded-2xl bg-stone-800 text-white flex items-center justify-center shadow-lg shadow-stone-800/20 hover:-translate-y-0.5 hover:bg-stone-900 transition-all active:scale-[0.95]"
                        >
                            <Plus className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-stone-100/50 p-1 rounded-2xl">
                    {tabs.map(t => (
                        <button
                            type="button"
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex-1 py-2 text-[13px] font-bold rounded-xl transition-all ${tab === t.id ? 'bg-white text-stone-800 shadow-sm border border-stone-200/50' : 'text-stone-500 hover:text-stone-700 hover:bg-white/40'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="px-5 py-3 bg-white/50 backdrop-blur-md border-b border-white/40">
                    <p className="text-[10px] font-bold text-stone-400 uppercase mb-2">{t('tasks.filter_energy')}</p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setFilterEnergy(null)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${!filterEnergy ? 'bg-orange-400 text-white' : 'bg-white/60 text-stone-500'}`}
                        >
                            {t('tasks.all')}
                        </button>
                        {Object.entries(energyMap).map(([k, v]) => (
                            <button
                                type="button"
                                key={k}
                                onClick={() => setFilterEnergy(filterEnergy === k ? null : k)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterEnergy === k ? 'bg-orange-400 text-white' : 'bg-white/60 text-stone-500'}`}
                            >
                                {v.icon} {v.label}
                            </button>
                        ))}
                    </div>
                    {filterEnergy && (
                        <button type="button" onClick={() => setFilterEnergy(null)} className="mt-2 text-xs text-rose-500 font-semibold">
                            ✕ {t('tasks.clear_filter')}
                        </button>
                    )}
                </div>
            )}

            {/* Task List */}
            <div className="p-4 px-5 space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/40 rounded-3xl animate-pulse" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 px-8 flex flex-col items-center">
                        <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <span className="text-4xl drop-shadow-sm">{tab === 'completed' ? '🏆' : '✨'}</span>
                        </div>
                        <p className="font-serif text-xl tracking-tight text-stone-800 mb-1">
                            {tab === 'completed' ? 'Nenhuma concluída' : 'Tudo limpo por aqui'}
                        </p>
                        <p className="text-[13px] text-stone-500 max-w-[200px] leading-relaxed">
                            {tab === 'completed' ? 'Suas vitórias aparecerão aqui.' : 'Aproveite o momento ou adicione uma nova tarefa.'}
                        </p>
                    </div>
                ) : filtered.map(task => {
                    const e = energyMap[task.energy_level] || energyMap.medium;
                    const isExpanded = expandedId === task.id;
                    const subDone = task.subtasks?.filter(s => s.is_completed).length || 0;

                    return (
                        <div key={task.id} className={`relative glass-card-chic rounded-3xl p-5 border border-white/60 hover:border-white shadow-sm hover:shadow-md transition-all active:scale-[0.99] group ${task.is_completed ? 'opacity-60 grayscale-[0.2]' : ''}`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent rounded-3xl pointer-events-none"></div>

                            <div className="relative flex gap-3.5 items-start">
                                <button
                                    type="button"
                                    title={task.is_completed ? 'Desmarcar tarefa' : 'Concluir tarefa'}
                                    onClick={() => toggleTask(task.id)}
                                    className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${task.is_completed ? 'bg-emerald-400 text-white' : 'border-2 border-stone-300 hover:border-emerald-400'}`}
                                >
                                    {task.is_completed && <span className="text-xs">✓</span>}
                                </button>

                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : task.id)}>
                                    <div className="flex justify-between items-start gap-2">
                                        <p className={`text-sm font-semibold text-stone-800 ${task.is_completed ? 'line-through' : ''}`}>{task.title}</p>
                                        {task.due_time && (
                                            <span className="text-[10px] text-stone-400 shrink-0 flex items-center gap-0.5">
                                                <Clock className="w-3 h-3" /> {task.due_time}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1.5 mt-1.5 flex-wrap items-center">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${e.tw}`}>{e.icon} {e.label}</span>
                                        {task.subtasks?.length > 0 && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 font-semibold">
                                                {subDone}/{task.subtasks.length}
                                            </span>
                                        )}
                                        {task.is_ai_suggested && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 font-bold">IA</span>
                                        )}
                                        {[...Array(Math.min(task.priority, 5))].map((_, i) => (
                                            <span key={i} className="text-[8px]">⭐</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-1 shrink-0">
                                    {(!task.subtasks || task.subtasks.length === 0) && !task.is_completed && (
                                        <button
                                            type="button"
                                            onClick={() => splitTaskWithAI(task)}
                                            disabled={isSplitting === task.id}
                                            className="p-1.5 rounded-lg bg-purple-50 text-purple-500 hover:bg-purple-100 disabled:opacity-50"
                                            title="Dividir com IA"
                                        >
                                            {isSplitting === task.id ? <Wand2 className="w-3.5 h-3.5 animate-spin" /> : <SplitSquareHorizontal className="w-3.5 h-3.5" />}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => openEditModal(task)}
                                        className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-all active:scale-90"
                                        title="Editar"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteTask(task.id)}
                                        className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-all active:scale-90"
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded content */}
                            {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-stone-100 space-y-3">
                                    {task.subtasks?.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-stone-400 uppercase">Subtarefas</p>
                                            {task.subtasks.map(st => (
                                                <div key={st.id} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => toggleSubtask(task.id, st.id)}>
                                                    {st.is_completed
                                                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                        : <CircleDashed className="w-4 h-4 text-stone-400 group-hover:text-emerald-400 shrink-0" />}
                                                    <span className={`text-sm ${st.is_completed ? 'line-through text-stone-400' : 'text-stone-600'}`}>{st.title}</span>
                                                </div>
                                            ))}
                                            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mt-2">
                                                <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${(subDone / task.subtasks.length) * 100}%` }} />
                                            </div>
                                        </div>
                                    )}

                                    {task.note && (
                                        <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/50">
                                            <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Nota</p>
                                            <p className="text-xs text-stone-600">{task.note}</p>
                                        </div>
                                    )}

                                    {task.ai_insight && (
                                        <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50">
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Insight IA</p>
                                            <p className="text-xs text-stone-600 italic">"{task.ai_insight}"</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add Task Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-2 sm:p-4">
                    <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-[2rem] w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-serif text-stone-800">Nova Tarefa</h2>
                            <button type="button" title="Fechar" onClick={() => setShowAddModal(false)} className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-500">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="O que você precisa fazer?"
                                autoFocus
                                className="w-full bg-white/70 border border-white/60 shadow-inner-sm rounded-2xl py-3.5 px-4 text-stone-800 placeholder:text-stone-400 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all"
                            />
                            <div>
                                <p className="text-[10px] font-bold text-stone-400 uppercase mb-2">Energia</p>
                                <div className="flex gap-2">
                                    {(['low', 'medium', 'high'] as const).map(e => (
                                        <button
                                            type="button"
                                            key={e}
                                            onClick={() => setNewEnergy(e)}
                                            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${newEnergy === e ? 'bg-orange-400 text-white' : 'bg-stone-50 text-stone-500 border border-stone-200'}`}
                                        >
                                            {energyMap[e].icon} {energyMap[e].label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-stone-400 uppercase mb-2">Prioridade</p>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(p => (
                                        <button
                                            type="button"
                                            key={p}
                                            onClick={() => setNewPriority(p)}
                                            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${newPriority === p ? 'bg-orange-400 text-white' : 'bg-stone-50 text-stone-500 border border-stone-200'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={addTask}
                                disabled={!newTitle.trim()}
                                className="w-full mt-2 py-3.5 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none active:scale-[0.98]"
                            >
                                Criar Tarefa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            {editingTask && (
                <TaskEditModal
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                    onSave={(updatedTask) => setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t))}
                />
            )}
        </div>
    );
};
