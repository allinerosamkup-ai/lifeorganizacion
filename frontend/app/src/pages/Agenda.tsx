import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft, ChevronRight, Plus, Wand2, CheckCircle2,
    CircleDashed, SplitSquareHorizontal, Trash2, Sparkles, Clock, X, Calendar as CalendarIcon, LayoutList
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
import type { Task } from '../components/TaskEditModal';

export const Agenda = () => {
    const { t } = useTranslation();
    const { user, profile } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskTime, setNewTaskTime] = useState('');
    const [isSplitting, setIsSplitting] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [dragTaskId, setDragTaskId] = useState<string | null>(null);
    const [energyHistory, setEnergyHistory] = useState<Record<string, { energy_level: string, total_score: number }>>({});

    // Fetch energy history for calendar colors
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

    // Generate calendar days for current month view
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const start = startOfWeek(monthStart, { weekStartsOn: 1 });
        const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    // Calculate cycle phase
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

    const phaseLabels: Record<string, { icon: string; label: string; color: string }> = {
        menstrual: { icon: '🌙', label: 'Menstrual', color: 'text-rose-600 bg-rose-50' },
        folicular: { icon: '🌱', label: 'Folicular', color: 'text-emerald-600 bg-emerald-50' },
        ovulatoria: { icon: '☀️', label: 'Ovulação', color: 'text-amber-600 bg-amber-50' },
        luteal: { icon: '🍂', label: 'Lútea', color: 'text-purple-600 bg-purple-50' },
    };

    const energyColors: Record<string, { bg: string, border: string, dot: string }> = {
        low: { bg: 'bg-red-50/50', border: 'border-red-200/50', dot: 'bg-red-400' },
        medium: { bg: 'bg-amber-50/50', border: 'border-amber-200/50', dot: 'bg-amber-400' },
        high: { bg: 'bg-emerald-50/50', border: 'border-emerald-200/50', dot: 'bg-emerald-400' },
    };

    // Fetch tasks
    useEffect(() => {
        if (!user) return;
        const fetchTasks = async () => {
            setLoading(true);
            try {
                if (viewMode === 'day') {
                    const dateStr = format(selectedDate, 'yyyy-MM-dd');
                    const { data, error } = await supabase
                        .from('tasks')
                        .select('*')
                        .eq('user_id', user.id)
                        .eq('due_date', dateStr)
                        .order('priority', { ascending: false });

                    if (!error && data) setTasks(data);
                } else {
                    const start = format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                    const end = format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                    const { data, error } = await supabase
                        .from('tasks')
                        .select('*')
                        .eq('user_id', user.id)
                        .gte('due_date', start)
                        .lte('due_date', end)
                        .order('due_date', { ascending: true });

                    if (!error && data) setTasks(data);
                }
            } catch (err) {
                console.error("Fetch tasks error", err);
            }
            setLoading(false);
        };
        fetchTasks();
    }, [user, selectedDate, viewMode]);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !user) return;

        const newTask = {
            user_id: user.id,
            title: newTaskTitle.trim(),
            energy_level: 'medium' as const,
            priority: 3,
            due_date: format(selectedDate, 'yyyy-MM-dd'),
            due_time: newTaskTime || null,
            subtasks: [],
            is_ai_suggested: false,
        };

        const { data, error } = await supabase.from('tasks').insert([newTask]).select();
        if (!error && data) {
            setTasks(prev => [...prev, data[0]]);
            setNewTaskTitle('');
            setNewTaskTime('');
            setShowAddForm(false);
        }
    };

    const handleQuickAdd = async (dateStr: string, title: string) => {
        if (!user) return;
        const newTask = {
            user_id: user.id,
            title: title.trim(),
            energy_level: 'medium' as const,
            priority: 3,
            due_date: dateStr,
            is_completed: false,
            subtasks: [],
            is_ai_suggested: false,
        };

        const { data, error } = await supabase.from('tasks').insert([newTask]).select();
        if (!error && data) {
            setTasks(prev => [...prev, data[0]]);
        }
    };

    const handleMoveTask = async (taskId: string, newDate: string) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, due_date: newDate } : t));
        await supabase.from('tasks').update({ due_date: newDate }).eq('id', taskId);
    };

    const handleDropReorder = async (dragId: string, dropId: string) => {
        if (dragId === dropId) return;
        setDragTaskId(null);

        const dragIndex = tasks.findIndex(t => t.id === dragId);
        const dropIndex = tasks.findIndex(t => t.id === dropId);
        if (dragIndex < 0 || dropIndex < 0) return;

        const newTasks = [...tasks];
        const [draggedItem] = newTasks.splice(dragIndex, 1);
        newTasks.splice(dropIndex, 0, draggedItem);

        setTasks(newTasks);

        const maxPriority = newTasks.length;
        for (let i = 0; i < newTasks.length; i++) {
            const task = newTasks[i];
            const p = maxPriority - i;
            if (task.priority !== p) {
                task.priority = p;
                await supabase.from('tasks').update({ priority: p }).eq('id', task.id);
            }
        }
    };

    const toggleTask = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const newStatus = !task.is_completed;

        const { error } = await supabase
            .from('tasks')
            .update({
                is_completed: newStatus,
                completed_at: newStatus ? new Date().toISOString() : null
            })
            .eq('id', taskId);

        if (!error) {
            setTasks(tasks.map(t => t.id === taskId ? { ...t, is_completed: newStatus } : t));
        }
    };

    const deleteTask = async (taskId: string) => {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (!error) setTasks(tasks.filter(t => t.id !== taskId));
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
                body: {
                    message: `Divida esta tarefa em 3-5 subtarefas práticas e acionáveis. Retorne APENAS um JSON array de strings, sem nenhum texto adicional antes ou depois. Exemplo: ["Subtarefa 1", "Subtarefa 2"]\n\nTarefa: "${task.title}"${task.description ? `\nDescrição: ${task.description}` : ''}`,
                    history: []
                }
            });

            if (error) throw error;

            if (data?.analysis) {
                const jsonMatch = data.analysis.match(/\[[\s\S]*?\]/);
                if (jsonMatch) {
                    const subtaskTitles: string[] = JSON.parse(jsonMatch[0]);
                    const subtasks = subtaskTitles.map((title: string) => ({
                        id: crypto.randomUUID(),
                        title: title.replace(/^\d+[.)]\s*/, ''),
                        is_completed: false
                    }));

                    const { error: updateError } = await supabase.from('tasks').update({ subtasks }).eq('id', task.id);
                    if (!updateError) setTasks(tasks.map(t => t.id === task.id ? { ...t, subtasks } : t));
                }
            }
        } catch (err) {
            console.error('AI split error:', err);
        } finally {
            setIsSplitting(null);
        }
    };

    const smartEntry = async () => {
        if (!user) return;
        setIsGenerating(true);
        try {
            const phase = getCyclePhaseForDate(selectedDate);
            const phaseLabel = phase ? phaseLabels[phase]?.label : 'desconhecida';
            const dateStr = format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });

            const { data, error } = await supabase.functions.invoke('chat-ai', {
                body: {
                    message: `Sugira 3 tarefas produtivas para ${dateStr}. A usuária está na fase ${phaseLabel}. Retorne APENAS um JSON array com: [{"title": "t", "energy_level": "low|medium|high", "priority": 1, "description": "d"}]`,
                    history: []
                }
            });

            if (error) throw error;
            if (data?.analysis) {
                const jsonMatch = data.analysis.match(/\[[\s\S]*?\]/);
                if (jsonMatch) {
                    const suggestions = JSON.parse(jsonMatch[0]);
                    const newTasks = suggestions.map((s: Record<string, string | number>) => ({
                        user_id: user.id,
                        title: s.title as string,
                        description: s.description as string,
                        energy_level: (s.energy_level as 'low' | 'medium' | 'high') || 'medium',
                        priority: (s.priority as number) || 3,
                        due_date: format(selectedDate, 'yyyy-MM-dd'),
                        subtasks: [],
                        is_ai_suggested: true,
                        ai_insight: s.description as string,
                    }));

                    const { data: inserted, error: insertError } = await supabase.from('tasks').insert(newTasks).select();
                    if (!insertError && inserted) {
                        setTasks(prev => [...prev, ...inserted]);
                    }
                }
            }
        } catch (err) {
            console.error('Smart entry error:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const currentPhase = getCyclePhaseForDate(selectedDate);

    return (
        <div className="min-h-full bg-gradient-to-br from-stone-50 via-orange-50 to-pink-50 pb-6 relative overflow-hidden">
            <div className="absolute top-[-5%] left-[-10%] w-96 h-96 bg-orange-300/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" />

            <div className="p-5 space-y-5 max-w-2xl mx-auto relative z-10 w-full">
                {/* Header */}
                <div className="flex justify-between items-center mt-4 flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-serif text-stone-800 tracking-tight">{t('agenda.title')}</h1>
                        <div className="flex bg-white/60 border border-white/80 rounded-xl p-1 mt-2 shadow-sm w-fit backdrop-blur-md">
                            <button
                                type="button"
                                onClick={() => setViewMode('day')}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'day' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                            >
                                <CalendarIcon className="w-4 h-4" /> Dia
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('week')}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'week' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                            >
                                <LayoutList className="w-4 h-4" /> Semana
                            </button>
                        </div>
                    </div>
                    {viewMode === 'day' && (
                        <button
                            type="button"
                            onClick={smartEntry}
                            disabled={isGenerating}
                            title="Gerar com IA"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-purple-500 text-white text-sm font-semibold shadow-md hover:bg-purple-600 transition-all disabled:opacity-50"
                        >
                            {isGenerating ? <Wand2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {isGenerating ? 'Gerando...' : 'Smart Entry'}
                        </button>
                    )}
                </div>

                {viewMode === 'day' ? (
                    <>
                        {/* Month Calendar */}
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
                                    const colors = energyColors[dayEnergy as keyof typeof energyColors];

                                    return (
                                        <button
                                            type="button"
                                            key={i}
                                            onClick={() => setSelectedDate(date)}
                                            className={`relative w-full aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all border
                                                ${!isCurrentMonth ? 'opacity-30 border-transparent' : ''}
                                                ${isSelected ? 'bg-stone-800 text-white shadow-xl scale-110 z-10 border-stone-800' : `${colors.bg} ${colors.border} hover:bg-stone-100/50 text-stone-700`}
                                                ${isToday(date) && !isSelected ? 'ring-2 ring-stone-800 ring-offset-1' : ''}
                                            `}
                                        >
                                            {format(date, 'd')}
                                            {isCurrentMonth && (
                                                <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : colors.dot}`} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex justify-center gap-4 mt-6">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                    <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">Alta</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                    <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">Média</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                    <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">Baixa</span>
                                </div>
                            </div>
                        </div>

                        {/* Selected Date Header */}
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="font-serif text-xl text-stone-800 capitalize">
                                    {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                                </h2>
                                {currentPhase && (
                                    <span
                                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 border border-black/5 shadow-sm ${phaseLabels[currentPhase].color}`}
                                    >
                                        <span className="text-xs">{phaseLabels[currentPhase].icon}</span> Fase {phaseLabels[currentPhase].label}
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                title={showAddForm ? "Cancelar" : "Adicionar tarefa"}
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="w-11 h-11 rounded-2xl bg-stone-800 text-white flex items-center justify-center shadow-lg hover:-translate-y-0.5 hover:bg-stone-900 transition-all"
                            >
                                {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Add Task Form */}
                        {showAddForm && (
                            <form onSubmit={handleAddTask} className="glass-card-chic rounded-2xl p-4 space-y-3">
                                <input
                                    type="text"
                                    title="Título da nova tarefa"
                                    aria-label="Título da nova tarefa"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Nova tarefa..."
                                    className="w-full bg-white/50 border border-white/60 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-orange-300/50"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="time"
                                        title="Horário da tarefa"
                                        aria-label="Horário da tarefa"
                                        value={newTaskTime}
                                        onChange={(e) => setNewTaskTime(e.target.value)}
                                        className="flex-1 bg-white/50 border border-white/60 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-orange-300/50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newTaskTitle.trim()}
                                        className="px-6 py-2.5 bg-orange-400 text-white rounded-xl font-semibold hover:bg-orange-500 disabled:opacity-50"
                                    >
                                        Adicionar
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Tasks List */}
                        <div className="space-y-3 pb-8">
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2].map(i => <div key={i} className="h-16 bg-white/40 rounded-2xl animate-pulse" />)}
                                </div>
                            ) : tasks.length > 0 ? (
                                tasks.map(task => (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => {
                                            setDragTaskId(task.id);
                                            e.dataTransfer.setData('text/plain', task.id);
                                            e.dataTransfer.effectAllowed = 'move';
                                        }}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            if (dragTaskId) {
                                                handleDropReorder(dragTaskId, task.id);
                                            }
                                        }}
                                        className={`relative glass-card-chic border border-white/60 rounded-3xl p-5 shadow-sm transition-all cursor-move ${dragTaskId === task.id ? 'opacity-50' : ''} ${task.is_completed ? 'opacity-60 grayscale-[0.2]' : ''}`}
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex gap-3 flex-1 cursor-pointer group" onClick={() => toggleTask(task.id)}>
                                                <button type="button" title="Alternar tarefa" className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${task.is_completed ? 'bg-emerald-400 text-white' : 'border-2 border-stone-300'}`}>
                                                    {task.is_completed && <CheckCircle2 className="w-4 h-4" />}
                                                </button>
                                                <div className="flex-1">
                                                    <span className={`text-stone-700 font-medium block ${task.is_completed ? 'line-through' : ''}`}>{task.title}</span>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        {task.due_time && (
                                                            <span className="text-xs text-stone-400 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" /> {task.due_time}
                                                            </span>
                                                        )}
                                                        <div className={`w-2 h-2 rounded-full ${task.energy_level === 'high' ? 'bg-rose-400' : task.energy_level === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                                        {task.is_ai_suggested && <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-bold">IA</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5 shrink-0">
                                                {(!task.subtasks || task.subtasks.length === 0) && !task.is_completed && (
                                                    <button type="button" title="Dividir tarefa com IA" onClick={() => splitTaskWithAI(task)} disabled={isSplitting === task.id} className="p-2 w-8 h-8 flex items-center justify-center rounded-xl bg-purple-50 text-purple-500 hover:bg-purple-100">
                                                        {isSplitting === task.id ? <Wand2 className="w-4 h-4 animate-spin" /> : <SplitSquareHorizontal className="w-4 h-4" />}
                                                    </button>
                                                )}
                                                <button type="button" title="Excluir tarefa" onClick={() => deleteTask(task.id)} className="p-2 w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-100">
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
                                                    <div key={st.id} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleSubtask(task.id, st.id)}>
                                                        <div className="text-stone-400 group-hover:text-emerald-500 transition-colors">
                                                            {st.is_completed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <CircleDashed className="w-4 h-4" />}
                                                        </div>
                                                        <span className={`text-sm text-stone-600 ${st.is_completed ? 'line-through opacity-60' : ''}`}>{st.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 px-8 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mb-4 shadow-sm text-4xl">🗓️</div>
                                    <p className="font-serif text-xl tracking-tight text-stone-800 mb-1">Dia livre</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Weekly Board */}
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
                            <div className="h-40 bg-white/40 rounded-2xl animate-pulse mt-4"></div>
                        ) : (
                            <WeeklyBoard
                                weekStart={startOfWeek(selectedDate, { weekStartsOn: 1 })}
                                tasks={tasks}
                                onMoveTask={handleMoveTask}
                                onQuickAdd={handleQuickAdd}
                                onToggleTask={toggleTask}
                            />
                        )}
                        <div className="pb-8"></div>
                    </>
                )}
            </div>
        </div>
    );
};
