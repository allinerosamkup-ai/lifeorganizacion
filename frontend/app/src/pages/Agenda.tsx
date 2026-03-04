import { useState, useEffect, useMemo } from 'react';
import {
    ChevronLeft, ChevronRight, Plus, Wand2, CheckCircle2,
    CircleDashed, SplitSquareHorizontal, Trash2, Sparkles, Clock, X,
    Calendar as CalendarIcon, LayoutList, Inbox
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval, isSameDay,
    isSameMonth, isToday, addWeeks, subWeeks
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WeeklyBoard } from '../components/WeeklyBoard';
import { TaskEditModal } from '../components/TaskEditModal';
import { DayTimeline } from '../components/DayTimeline';
import { showToast } from '../components/Toast';
import type { Task } from '../components/TaskEditModal';

type Category = 'all' | 'saude' | 'trabalho' | 'pessoal' | 'ciclo';

const CATEGORIES: { key: Category; label: string; emoji: string }[] = [
    { key: 'all', label: 'Todas', emoji: '✨' },
    { key: 'saude', label: 'Saúde', emoji: '💚' },
    { key: 'trabalho', label: 'Trabalho', emoji: '💼' },
    { key: 'pessoal', label: 'Pessoal', emoji: '🌸' },
    { key: 'ciclo', label: 'Ciclo', emoji: '🌙' },
];

const phaseLabels: Record<string, { icon: string; label: string; color: string }> = {
    menstrual: { icon: '🌙', label: 'Menstrual', color: 'text-rose-600 bg-rose-50' },
    folicular: { icon: '🌱', label: 'Folicular', color: 'text-emerald-600 bg-emerald-50' },
    ovulatoria: { icon: '☀️', label: 'Ovulação', color: 'text-amber-600 bg-amber-50' },
    luteal: { icon: '🍂', label: 'Lútea', color: 'text-purple-600 bg-purple-50' },
};

const energyColors: Record<string, { bg: string; borderLeft: string; dot: string }> = {
    low: { bg: 'bg-emerald-50/50', borderLeft: 'border-l-4 border-l-emerald-400', dot: 'bg-emerald-400' },
    medium: { bg: 'bg-purple-50/50', borderLeft: 'border-l-4 border-l-purple-400', dot: 'bg-purple-400' },
    high: { bg: 'bg-rose-50/50', borderLeft: 'border-l-4 border-l-rose-400', dot: 'bg-rose-400' },
};

const calEnergyColors: Record<string, { bg: string; border: string; dot: string }> = {
    low: { bg: 'bg-red-50/50', border: 'border-red-200/50', dot: 'bg-red-400' },
    medium: { bg: 'bg-amber-50/50', border: 'border-amber-200/50', dot: 'bg-amber-400' },
    high: { bg: 'bg-emerald-50/50', border: 'border-emerald-200/50', dot: 'bg-emerald-400' },
};

export const Agenda = ({ navigate }: { navigate?: (view: string) => void } = {}) => {
    if (navigate) { /* skip */ }
    const { user, profile } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'timeline'>('timeline');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskTime, setNewTaskTime] = useState('');
    const [isSplitting, setIsSplitting] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [dragTaskId, setDragTaskId] = useState<string | null>(null);
    const [energyHistory, setEnergyHistory] = useState<Record<string, { energy_level: string }>>({});
    const [activeCategory, setActiveCategory] = useState<Category>('all');
    const [showInbox, setShowInbox] = useState(false);
    const [inboxText, setInboxText] = useState('');
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    useEffect(() => {
        const fetchEnergy = async () => {
            if (!user) return;
            const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
            const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
            const { data } = await supabase
                .from('check_ins')
                .select('date, energy_score')
                .eq('user_id', user.id)
                .gte('date', start)
                .lte('date', end);
            if (data) {
                const historyMap: Record<string, { energy_level: string }> = {};
                data.forEach(d => {
                    const score = (d.energy_score as number) || 5;
                    historyMap[d.date] = { energy_level: score >= 7 ? 'high' : score >= 4 ? 'medium' : 'low' };
                });
                setEnergyHistory(historyMap);
            }
        };
        fetchEnergy();
    }, [user, currentMonth]);

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const start = startOfWeek(monthStart, { weekStartsOn: 1 });
        const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const getCyclePhaseForDate = (date: Date) => {
        if (!profile?.last_period_start) return null;
        const lastPeriod = new Date(profile.last_period_start);
        const cycleLength = (profile as Record<string, unknown>).cycle_length as number || 28;
        const daysDiff = Math.floor((date.getTime() - lastPeriod.getTime()) / (1000 * 3600 * 24));
        const dayInCycle = ((daysDiff % cycleLength) + cycleLength) % cycleLength;
        if (dayInCycle < 5) return 'menstrual';
        if (dayInCycle < 13) return 'folicular';
        if (dayInCycle < 16) return 'ovulatoria';
        return 'luteal';
    };

    const fetchTasks = async () => {
        if (!user) return;
        setLoading(true);
        try {
            if (viewMode === 'day' || viewMode === 'timeline') {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                const { data } = await supabase.from('tasks').select('*').eq('user_id', user.id).eq('due_date', dateStr).order('priority', { ascending: true });
                setTasks(data || []);
            } else {
                const weekStart = format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                const weekEnd = format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                const { data } = await supabase.from('tasks').select('*').eq('user_id', user.id).gte('due_date', weekStart).lte('due_date', weekEnd).order('due_date', { ascending: true });
                setTasks(data || []);
            }
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, selectedDate, viewMode]);

    const filteredTasks = useMemo(() => {
        if (activeCategory === 'all') return tasks;
        return tasks.filter(t => (t as unknown as Record<string, unknown>).category === activeCategory);
    }, [tasks, activeCategory]);

    const highTasks = filteredTasks.filter(t => t.energy_level === 'high' && !t.is_completed);
    const medTasks = filteredTasks.filter(t => t.energy_level === 'medium' && !t.is_completed);
    const lowTasks = filteredTasks.filter(t => t.energy_level === 'low' && !t.is_completed);
    const doneTasks = filteredTasks.filter(t => t.is_completed);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newTaskTitle.trim()) return;
        const { data, error } = await supabase.from('tasks').insert([{
            user_id: user.id, title: newTaskTitle.trim(),
            due_date: format(selectedDate, 'yyyy-MM-dd'),
            start_time: newTaskTime || null,
            energy_level: 'medium', priority: 3, subtasks: [],
        }]).select().single();
        if (!error && data) {
            setTasks(prev => [data, ...prev]);
            setNewTaskTitle(''); setNewTaskTime(''); setShowAddForm(false);
            showToast('Tarefa adicionada!');
        }
    };

    const handleInboxCapture = async () => {
        if (!user || !inboxText.trim()) return;
        const { data, error } = await supabase.from('tasks').insert([{
            user_id: user.id, title: inboxText.trim(),
            due_date: format(selectedDate, 'yyyy-MM-dd'),
            energy_level: 'medium', priority: 5, subtasks: [],
        }]).select().single();
        if (!error && data) {
            setTasks(prev => [data, ...prev]);
            setInboxText(''); setShowInbox(false);
            showToast('Capturado! ✅');
        }
    };

    const handleMoveTask = async (taskId: string, newDate: string) => {
        await supabase.from('tasks').update({ due_date: newDate }).eq('id', taskId);
        await fetchTasks();
    };

    const handleQuickAdd = async (dateStr: string, title: string) => {
        if (!user) return;
        const { data, error } = await supabase.from('tasks').insert([{
            user_id: user.id, title, due_date: dateStr, energy_level: 'medium', priority: 3, subtasks: [],
        }]).select().single();
        if (!error && data) setTasks(prev => [...prev, data]);
    };

    const handleDropReorder = async (dragId: string, dropId: string) => {
        const dropTask = tasks.find(t => t.id === dropId);
        if (!dropTask) return;
        const p = dropTask.priority;
        setTasks(tasks.map(t => t.id === dragId ? { ...t, priority: p } : t));
        setDragTaskId(null);
        await supabase.from('tasks').update({ priority: p }).eq('id', dragId);
    };

    const toggleTask = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const newStatus = !task.is_completed;
        const { error } = await supabase.from('tasks').update({
            is_completed: newStatus,
            completed_at: newStatus ? new Date().toISOString() : null
        }).eq('id', taskId);
        if (!error) {
            setTasks(tasks.map(t => t.id === taskId ? { ...t, is_completed: newStatus } : t));
            if (newStatus) showToast('Concluída! 🎉');
        }
    };

    const handleTimeChange = async (taskId: string, newTime: string) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, start_time: newTime } : t));
        const { error } = await supabase.from('tasks').update({ start_time: newTime }).eq('id', taskId);
        if (error) {
            showToast('Erro ao atualizar horário', 'error');
            await fetchTasks();
        }
    };

    const deleteTask = async (taskId: string) => {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (!error) { setTasks(tasks.filter(t => t.id !== taskId)); showToast('Tarefa removida.'); }
    };

    const toggleSubtask = async (taskId: string, subtaskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const updatedSubtasks = task.subtasks.map(st =>
            st.id === subtaskId ? { ...st, is_completed: !st.is_completed } : st
        );
        const { error } = await supabase.from('tasks').update({ subtasks: updatedSubtasks }).eq('id', taskId);
        if (!error) setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t));
    };

    const splitTaskWithAI = async (task: Task) => {
        setIsSplitting(task.id);
        try {
            const { data, error } = await supabase.functions.invoke('chat-ai', {
                body: { message: `Divida esta tarefa em 3-5 subtarefas práticas. Retorne APENAS um JSON array de strings.\n\nTarefa: "${task.title}"`, history: [] }
            });
            if (error) throw error;
            if (data?.analysis) {
                const jsonMatch = data.analysis.match(/\[[\s\S]*?\]/);
                if (jsonMatch) {
                    const subtasks = (JSON.parse(jsonMatch[0]) as string[]).map((title: string) => ({
                        id: crypto.randomUUID(), title: title.replace(/^\d+[.)]\s*/, ''), is_completed: false
                    }));
                    const { error: updateError } = await supabase.from('tasks').update({ subtasks }).eq('id', task.id);
                    if (!updateError) { setTasks(tasks.map(t => t.id === task.id ? { ...t, subtasks } : t)); showToast('Subtarefas criadas! ✨'); }
                }
            }
        } catch { showToast('Erro ao dividir.'); }
        finally { setIsSplitting(null); }
    };

    const smartEntry = async () => {
        if (!user) return;
        setIsGenerating(true);
        try {
            const phase = getCyclePhaseForDate(selectedDate);
            const phaseLabel = phase ? phaseLabels[phase]?.label : 'desconhecida';
            const dateStr = format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });
            const { data, error } = await supabase.functions.invoke('chat-ai', {
                body: { message: `Sugira 3 tarefas para ${dateStr}. Fase: ${phaseLabel}. Retorne APENAS JSON: [{"title":"t","energy_level":"low|medium|high","priority":1,"description":"d"}]`, history: [] }
            });
            if (error) throw error;
            if (data?.analysis) {
                const jsonMatch = data.analysis.match(/\[[\s\S]*?\]/);
                if (jsonMatch) {
                    const suggestions = JSON.parse(jsonMatch[0]) as Record<string, string | number>[];
                    const newTasks = suggestions.map(s => ({
                        user_id: user.id, title: s.title as string, description: s.description as string,
                        energy_level: (s.energy_level as 'low' | 'medium' | 'high') || 'medium',
                        priority: (s.priority as number) || 3, due_date: format(selectedDate, 'yyyy-MM-dd'),
                        subtasks: [], is_ai_suggested: true, ai_insight: s.description as string,
                    }));
                    const { data: inserted, error: insertError } = await supabase.from('tasks').insert(newTasks).select();
                    if (!insertError && inserted) { setTasks(prev => [...prev, ...inserted]); showToast(`${inserted.length} sugestões criadas! ✨`); }
                }
            }
        } catch { showToast('Erro ao gerar sugestões.'); }
        finally { setIsGenerating(false); }
    };

    const currentPhase = getCyclePhaseForDate(selectedDate);

    const renderTaskCard = (task: Task) => {
        const ec = energyColors[task.energy_level || 'medium'];
        return (
            <div key={task.id} draggable
                onDragStart={(e) => { setDragTaskId(task.id); e.dataTransfer.setData('text/plain', task.id); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (dragTaskId) handleDropReorder(dragTaskId, task.id); }}
                className={`relative rounded-3xl p-5 shadow-sm transition-all cursor-pointer border border-white/60
                    ${ec.bg} ${ec.borderLeft}
                    ${dragTaskId === task.id ? 'opacity-50' : ''}
                    ${task.is_completed ? 'opacity-60' : ''}
                    backdrop-blur-sm`}
                onClick={() => setEditingTask(task)}>
                <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3 flex-1" onClick={e => { e.stopPropagation(); toggleTask(task.id); }}>
                        <button type="button" title="Concluir" className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${task.is_completed ? 'bg-emerald-400 text-white' : 'border-2 border-stone-300'}`}>
                            {task.is_completed && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <div className="flex-1">
                            <span className={`text-stone-700 font-medium block ${task.is_completed ? 'line-through' : ''}`}>{task.title}</span>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {task.start_time && (
                                    <span className="text-xs text-stone-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {task.start_time as string}
                                    </span>
                                )}
                                {task.is_ai_suggested && <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-bold">IA</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                        {(!task.subtasks || task.subtasks.length === 0) && !task.is_completed && (
                            <button type="button" title="Dividir com IA" onClick={() => splitTaskWithAI(task)} disabled={isSplitting === task.id}
                                className="p-2 w-8 h-8 flex items-center justify-center rounded-xl bg-purple-50 text-purple-500 hover:bg-purple-100">
                                {isSplitting === task.id ? <Wand2 className="w-4 h-4 animate-spin" /> : <SplitSquareHorizontal className="w-4 h-4" />}
                            </button>
                        )}
                        <button type="button" title="Excluir" onClick={() => deleteTask(task.id)}
                            className="p-2 w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-100">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {task.ai_insight && (
                    <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50 mt-3">
                        <p className="text-xs text-emerald-700 italic">✨ {task.ai_insight}</p>
                    </div>
                )}

                {task.subtasks && task.subtasks.length > 0 && (
                    <div className="pl-5 space-y-2 border-l-2 border-stone-200/50 mt-3">
                        {task.subtasks.map(st => (
                            <div key={st.id} className="flex items-center gap-3 cursor-pointer"
                                onClick={e => { e.stopPropagation(); toggleSubtask(task.id, st.id); }}>
                                {st.is_completed ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <CircleDashed className="w-4 h-4 text-stone-400 shrink-0" />}
                                <span className={`text-sm text-stone-600 ${st.is_completed ? 'line-through opacity-60' : ''}`}>{st.title}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-full bg-gradient-to-br from-stone-50 via-orange-50 to-pink-50 pb-6 relative overflow-hidden">
            <div className="absolute top-[-5%] left-[-10%] w-96 h-96 bg-orange-300/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" />

            <div className="p-5 space-y-5 max-w-2xl mx-auto relative z-10 w-full">
                {/* Header */}
                <div className="flex justify-between items-center mt-4 flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-serif text-stone-800 tracking-tight">Agenda</h1>
                        <div className="flex bg-white/60 border border-white/80 rounded-xl p-1 mt-2 shadow-sm w-fit backdrop-blur-md">
                            <button type="button" onClick={() => setViewMode('day')}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'day' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
                                <CalendarIcon className="w-4 h-4" /> Dia
                            </button>
                            <button type="button" onClick={() => setViewMode('week')}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'week' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
                                <LayoutList className="w-4 h-4" /> Semana
                            </button>
                            <button type="button" onClick={() => setViewMode('timeline')}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'timeline' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
                                <Clock className="w-4 h-4" /> Timeline
                            </button>
                        </div>
                    </div>
                    {(viewMode === 'day' || viewMode === 'timeline') && (
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setShowInbox(true)} title="Capturar ideia"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/70 text-stone-600 text-sm font-semibold shadow-sm hover:bg-white transition-all border border-white/80">
                                <Inbox className="w-4 h-4" /> Inbox
                            </button>
                            <button type="button" onClick={smartEntry} disabled={isGenerating} title="Gerar com IA"
                                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-purple-500 text-white text-sm font-semibold shadow-md hover:bg-purple-600 transition-all disabled:opacity-50">
                                {isGenerating ? <Wand2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {isGenerating ? 'Gerando…' : 'Smart Entry'}
                            </button>
                        </div>
                    )}
                </div>

                {viewMode === 'day' ? (
                    <>
                        {/* Calendar */}
                        <div className="glass-card-chic rounded-3xl p-5 shadow-sm border border-white/80">
                            <div className="flex justify-between items-center mb-4">
                                <button type="button" onClick={() => setCurrentMonth(m => subMonths(m, 1))} title="Mês anterior" className="w-8 h-8 flex items-center justify-center hover:bg-stone-100/50 rounded-full">
                                    <ChevronLeft className="w-5 h-5 text-stone-500" />
                                </button>
                                <h2 className="font-serif text-lg text-stone-800 capitalize">
                                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                                </h2>
                                <button type="button" onClick={() => setCurrentMonth(m => addMonths(m, 1))} title="Próximo mês" className="w-8 h-8 flex items-center justify-center hover:bg-stone-100/50 rounded-full">
                                    <ChevronRight className="w-5 h-5 text-stone-500" />
                                </button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                                    <div key={d} className="text-center text-[10px] font-bold text-stone-400 uppercase">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((date, i) => {
                                    const dateStr = format(date, 'yyyy-MM-dd');
                                    const isSelected = isSameDay(date, selectedDate);
                                    const isCurrentMonth = isSameMonth(date, currentMonth);
                                    const dayEnergy = energyHistory[dateStr]?.energy_level || 'medium';
                                    const colors = calEnergyColors[dayEnergy];
                                    return (
                                        <button type="button" key={i} onClick={() => setSelectedDate(date)}
                                            className={`relative w-full aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all border
                                                ${!isCurrentMonth ? 'opacity-30 border-transparent' : ''}
                                                ${isSelected ? 'bg-stone-800 text-white shadow-xl scale-110 z-10 border-stone-800' : `${colors.bg} ${colors.border} hover:bg-stone-100/50 text-stone-700`}
                                                ${isToday(date) && !isSelected ? 'ring-2 ring-stone-800 ring-offset-1' : ''}`}>
                                            {format(date, 'd')}
                                            {isCurrentMonth && (
                                                <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : colors.dot}`} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Category Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {CATEGORIES.map(cat => (
                                <button key={cat.key} type="button" onClick={() => setActiveCategory(cat.key)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === cat.key ? 'bg-stone-800 text-white shadow-sm' : 'bg-white/60 text-stone-600 hover:bg-white/90 border border-white/80'}`}>
                                    {cat.emoji} {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Date Header */}
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="font-serif text-xl text-stone-800 capitalize">
                                    {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                                </h2>
                                {currentPhase && (
                                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 border border-black/5 shadow-sm ${phaseLabels[currentPhase].color}`}>
                                        {phaseLabels[currentPhase].icon} Fase {phaseLabels[currentPhase].label}
                                    </span>
                                )}
                            </div>
                            <button type="button" title={showAddForm ? "Cancelar" : "Adicionar"} onClick={() => setShowAddForm(!showAddForm)}
                                className="w-11 h-11 rounded-2xl bg-stone-800 text-white flex items-center justify-center shadow-lg hover:-translate-y-0.5 hover:bg-stone-900 transition-all">
                                {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Add Form */}
                        {showAddForm && (
                            <form onSubmit={handleAddTask} className="glass-card-chic rounded-2xl p-4 space-y-3">
                                <input type="text" title="Nova tarefa" aria-label="Nova tarefa" value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)} placeholder="Nova tarefa…" autoFocus
                                    className="w-full bg-white/50 border border-white/60 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-orange-300/50" />
                                <div className="flex gap-2">
                                    <input type="time" title="Horário" aria-label="Horário" value={newTaskTime}
                                        onChange={e => setNewTaskTime(e.target.value)}
                                        className="flex-1 bg-white/50 border border-white/60 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-orange-300/50" />
                                    <button type="submit" disabled={!newTaskTitle.trim()} className="px-6 py-2.5 bg-orange-400 text-white rounded-xl font-semibold hover:bg-orange-500 disabled:opacity-50">
                                        Adicionar
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Inbox */}
                        {showInbox && (
                            <div className="glass-card-chic rounded-2xl p-4 space-y-3 border border-white/80">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-serif text-lg text-stone-800 flex items-center gap-2"><Inbox className="w-5 h-5 text-stone-500" /> Capturar</h3>
                                    <button type="button" onClick={() => setShowInbox(false)} title="Fechar"><X className="w-5 h-5 text-stone-400" /></button>
                                </div>
                                <input type="text" aria-label="Capturar ideia" placeholder="O que está na sua cabeça?" value={inboxText}
                                    onChange={e => setInboxText(e.target.value)} autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleInboxCapture()}
                                    className="w-full bg-white/50 border border-white/60 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-purple-300/50" />
                                <button type="button" onClick={handleInboxCapture} disabled={!inboxText.trim()}
                                    className="w-full py-2.5 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 disabled:opacity-50 transition-all">
                                    Capturar
                                </button>
                            </div>
                        )}

                        {/* Tasks by Energy Level */}
                        <div className="space-y-4 pb-8">
                            {loading ? (
                                [1, 2].map(i => <div key={i} className="h-16 bg-white/40 rounded-2xl animate-pulse" />)
                            ) : filteredTasks.filter(t => !t.is_completed).length === 0 && doneTasks.length === 0 ? (
                                <div className="text-center py-20 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mb-4 text-4xl">🗓️</div>
                                    <p className="font-serif text-xl tracking-tight text-stone-800 mb-1">Dia livre!</p>
                                    <p className="text-stone-400 text-sm">Use Smart Entry para sugestões da IA.</p>
                                </div>
                            ) : (
                                <>
                                    {highTasks.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                                                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Alta Energia</span>
                                            </div>
                                            <div className="space-y-2">{highTasks.map(renderTaskCard)}</div>
                                        </div>
                                    )}
                                    {medTasks.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                                                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Energia Média</span>
                                            </div>
                                            <div className="space-y-2">{medTasks.map(renderTaskCard)}</div>
                                        </div>
                                    )}
                                    {lowTasks.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Energia Leve</span>
                                            </div>
                                            <div className="space-y-2">{lowTasks.map(renderTaskCard)}</div>
                                        </div>
                                    )}
                                    {doneTasks.length > 0 && (
                                        <div className="opacity-60">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Concluídas</span>
                                            </div>
                                            <div className="space-y-2">{doneTasks.map(renderTaskCard)}</div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                ) : viewMode === 'timeline' ? (
                    <DayTimeline
                        onTimeChange={handleTimeChange}
                        blocks={filteredTasks.filter((t: Task) => t.start_time).map((t: Task) => {
                            const timeStr = t.start_time!;
                            const [h, m] = timeStr.split(':').map(Number);
                            const startD = new Date(); startD.setHours(h, m, 0, 0);
                            const endD = new Date(startD.getTime() + (t.duration_minutes || 30) * 60000);
                            const endH = endD.getHours().toString().padStart(2, '0');
                            const endM = endD.getMinutes().toString().padStart(2, '0');
                            return {
                                id: t.id,
                                start: timeStr.substring(0, 5),
                                end: `${endH}:${endM}`,
                                type: 'task',
                                label: t.category || 'task',
                                title: t.title,
                                is_completed: t.is_completed,
                                onClick: () => setEditingTask(t),
                                onToggle: () => toggleTask(t.id)
                            };
                        })}
                    />
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-2">
                            <button type="button" title="Semana anterior" onClick={() => setSelectedDate(d => subWeeks(d, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-stone-100/50 rounded-full">
                                <ChevronLeft className="w-5 h-5 text-stone-500" />
                            </button>
                            <h2 className="font-serif text-lg text-stone-800 capitalize">
                                Semana de {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "d 'de' MMMM", { locale: ptBR })}
                            </h2>
                            <button type="button" title="Próxima semana" onClick={() => setSelectedDate(d => addWeeks(d, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-stone-100/50 rounded-full">
                                <ChevronRight className="w-5 h-5 text-stone-500" />
                            </button>
                        </div>
                        {loading && tasks.length === 0 ? (
                            <div className="h-40 bg-white/40 rounded-2xl animate-pulse mt-4" />
                        ) : (
                            <WeeklyBoard
                                weekStart={startOfWeek(selectedDate, { weekStartsOn: 1 })}
                                tasks={tasks}
                                onMoveTask={handleMoveTask}
                                onQuickAdd={handleQuickAdd}
                                onToggleTask={toggleTask}
                            />
                        )}
                        <div className="pb-8" />
                    </>
                )}
            </div>

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
