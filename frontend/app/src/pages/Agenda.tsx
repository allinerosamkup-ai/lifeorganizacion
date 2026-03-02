import { useState, useEffect, useMemo } from 'react';
import {
    ChevronLeft, ChevronRight, Plus, Wand2, CheckCircle2,
    CircleDashed, SplitSquareHorizontal, Trash2, Sparkles, Clock, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval, isSameDay,
    isSameMonth, isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Task {
    id: string;
    title: string;
    description?: string;
    energy_level: 'low' | 'medium' | 'high';
    priority: number;
    due_date: string | null;
    due_time?: string;
    is_completed: boolean;
    subtasks: Array<{ id: string; title: string; is_completed: boolean }>;
    ai_insight?: string;
    is_ai_suggested?: boolean;
}

export const Agenda = () => {
    const { user, profile } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskTime, setNewTaskTime] = useState('');
    const [isSplitting, setIsSplitting] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
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

    const phaseLabels: Record<string, { icon: string; label: string; color: string }> = {
        menstrual: { icon: '🌙', label: 'Menstrual', color: 'text-rose-600 bg-rose-50' },
        folicular: { icon: '🌱', label: 'Folicular', color: 'text-emerald-600 bg-emerald-50' },
        ovulatoria: { icon: '☀️', label: 'Ovulação', color: 'text-amber-600 bg-amber-50' },
        luteal: { icon: '🍂', label: 'Lútea', color: 'text-purple-600 bg-purple-50' },
    };

    const energyColors: Record<string, string> = {
        low: 'bg-red-200/60 text-red-800',
        medium: 'bg-amber-200/60 text-amber-800',
        high: 'bg-emerald-200/60 text-emerald-800',
    };

    // Fetch tasks for selected date
    useEffect(() => {
        if (!user) return;
        const fetchTasks = async () => {
            setLoading(true);
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .eq('due_date', dateStr)
                .order('priority', { ascending: false });

            if (!error && data) {
                setTasks(data);
            }
            setLoading(false);
        };
        fetchTasks();
    }, [user, selectedDate]);

    // Add task
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

    // Toggle task completion
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

    // Delete task
    const deleteTask = async (taskId: string) => {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (!error) {
            setTasks(tasks.filter(t => t.id !== taskId));
        }
    };

    // Toggle subtask
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

    // AI Split task into subtasks
    const splitTaskWithAI = async (task: Task) => {
        setIsSplitting(task.id);
        try {
            const { data, error } = await supabase.functions.invoke('chat-ai', {
                body: {
                    message: `Divida esta tarefa em 3-5 subtarefas práticas e acionáveis. Retorne APENAS um JSON array de strings, sem nenhum texto adicional antes ou depois. Exemplo: ["Subtarefa 1", "Subtarefa 2", "Subtarefa 3"]\n\nTarefa: "${task.title}"${task.description ? `\nDescrição: ${task.description}` : ''}`,
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

                    const { error: updateError } = await supabase
                        .from('tasks')
                        .update({ subtasks })
                        .eq('id', task.id);

                    if (!updateError) {
                        setTasks(tasks.map(t => t.id === task.id ? { ...t, subtasks } : t));
                    }
                }
            }
        } catch (err) {
            console.error('AI split error:', err);
            alert('Erro ao dividir tarefa com IA. Tente novamente.');
        } finally {
            setIsSplitting(null);
        }
    };

    // AI Smart Entry - Generate task suggestions
    const smartEntry = async () => {
        if (!user) return;
        setIsGenerating(true);
        try {
            const phase = getCyclePhaseForDate(selectedDate);
            const phaseLabel = phase ? phaseLabels[phase]?.label : 'desconhecida';
            const dateStr = format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });

            const { data, error } = await supabase.functions.invoke('chat-ai', {
                body: {
                    message: `Sugira 3 tarefas produtivas para ${dateStr}. A usuária está na fase ${phaseLabel} do ciclo menstrual. Considere o nível de energia típico desta fase.

Retorne APENAS um JSON array de objetos com esta estrutura exata, sem texto adicional:
[{"title": "titulo da tarefa", "energy_level": "low|medium|high", "priority": 1, "description": "breve explicacao de por que esta tarefa é ideal para esta fase"}]`,
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

                    const { data: inserted, error: insertError } = await supabase
                        .from('tasks')
                        .insert(newTasks)
                        .select();

                    if (!insertError && inserted) {
                        setTasks(prev => [...prev, ...inserted]);
                    }
                }
            }
        } catch (err) {
            console.error('Smart entry error:', err);
            alert('Erro ao gerar sugestões. Tente novamente.');
        } finally {
            setIsGenerating(false);
        }
    };

    const currentPhase = getCyclePhaseForDate(selectedDate);

    return (
        <div className="min-h-full bg-gradient-to-br from-stone-50 via-orange-50 to-pink-50 pb-6 relative overflow-hidden">
            <div className="absolute top-[-5%] left-[-10%] w-96 h-96 bg-orange-300/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" />

            <div className="p-5 space-y-5 max-w-lg mx-auto relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center mt-4">
                    <h1 className="text-3xl font-serif text-stone-800 tracking-tight">Agenda</h1>
                    <button
                        type="button"
                        onClick={smartEntry}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-purple-500 text-white text-sm font-semibold shadow-md hover:bg-purple-600 transition-all disabled:opacity-50"
                    >
                        {isGenerating ? <Wand2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {isGenerating ? 'Gerando...' : 'Smart Entry'}
                    </button>
                </div>

                {/* Month Calendar */}
                <div className="glass-card-chic rounded-3xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-white/80">
                    <div className="flex justify-between items-center mb-4">
                        <button type="button" title="Mês anterior" onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100/50">
                            <ChevronLeft className="w-5 h-5 text-stone-500" />
                        </button>
                        <h2 className="font-serif text-lg text-stone-800 capitalize">
                            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                        </h2>
                        <button type="button" title="Próximo mês" onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100/50">
                            <ChevronRight className="w-5 h-5 text-stone-500" />
                        </button>
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-stone-400 uppercase">{d}</div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((date, i) => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const isSelected = isSameDay(date, selectedDate);
                            const isCurrentMonth = isSameMonth(date, currentMonth);

                            const dayEnergy = energyHistory[dateStr]?.energy_level;
                            const energyColorClass = dayEnergy ? energyColors[dayEnergy] : '';

                            return (
                                <button
                                    type="button"
                                    key={i}
                                    onClick={() => setSelectedDate(date)}
                                    className={`w-full aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all
                                        ${!isCurrentMonth ? 'opacity-30' : ''}
                                        ${isSelected ? 'bg-stone-800 text-white shadow-md scale-110 z-10' : `${energyColorClass} hover:bg-stone-200/50`}
                                        ${isToday(date) && !isSelected ? 'ring-2 ring-stone-400' : ''}
                                    `}
                                >
                                    {format(date, 'd')}
                                </button>
                            );
                        })}
                    </div>

                    {/* Energy legend */}
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
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${phaseLabels[currentPhase].color}`}>
                                {phaseLabels[currentPhase].icon} {phaseLabels[currentPhase].label}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        title={showAddForm ? "Cancelar" : "Adicionar tarefa"}
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="w-11 h-11 rounded-2xl bg-stone-800 text-white flex items-center justify-center shadow-lg shadow-stone-800/20 hover:-translate-y-0.5 hover:bg-stone-900 transition-all active:scale-[0.95]"
                    >
                        {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </button>
                </div>

                {/* Add Task Form */}
                {showAddForm && (
                    <form onSubmit={handleAddTask} className="glass-card-chic rounded-2xl p-4 space-y-3">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Nova tarefa..."
                            className="w-full bg-white/50 border border-white/60 rounded-xl py-3 px-4 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-300/50"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <input
                                type="time"
                                value={newTaskTime}
                                onChange={(e) => setNewTaskTime(e.target.value)}
                                title="Horário da tarefa"
                                placeholder="Horário"
                                className="flex-1 bg-white/50 border border-white/60 rounded-xl py-2.5 px-4 text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-300/50"
                            />
                            <button
                                type="submit"
                                disabled={!newTaskTitle.trim()}
                                className="px-6 py-2.5 bg-orange-400 text-white rounded-xl font-semibold hover:bg-orange-500 transition-all disabled:opacity-50 shadow-sm"
                            >
                                Adicionar
                            </button>
                        </div>
                    </form>
                )}

                {/* Tasks List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => <div key={i} className="h-16 bg-white/40 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : tasks.length > 0 ? (
                        tasks.map(task => (
                            <div key={task.id} className={`relative glass-card-chic border border-white/60 hover:border-white rounded-3xl p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.99] ${task.is_completed ? 'opacity-60 grayscale-[0.2]' : ''}`}>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent rounded-3xl pointer-events-none"></div>
                                <div className="relative flex justify-between items-start gap-4">
                                    <div className="flex gap-3 flex-1 cursor-pointer group" onClick={() => toggleTask(task.id)}>
                                        <button type="button" title={task.is_completed ? "Desmarcar tarefa" : "Concluir tarefa"} className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${task.is_completed ? 'bg-emerald-400 text-white' : 'border-2 border-stone-300 group-hover:border-emerald-400'}`}>
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
                                                <span className="text-[10px] text-stone-400 font-medium uppercase">{task.energy_level === 'high' ? 'Alta' : task.energy_level === 'medium' ? 'Média' : 'Baixa'}</span>
                                                {task.is_ai_suggested && <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-bold">IA</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                        {(!task.subtasks || task.subtasks.length === 0) && !task.is_completed && (
                                            <button
                                                type="button"
                                                onClick={() => splitTaskWithAI(task)}
                                                disabled={isSplitting === task.id}
                                                className="p-2 w-8 h-8 flex items-center justify-center rounded-xl bg-purple-50 text-purple-500 hover:bg-purple-100 hover:text-purple-700 transition-all active:scale-[0.9] disabled:opacity-50 shadow-sm"
                                                title="Dividir com IA"
                                            >
                                                {isSplitting === task.id ? <Wand2 className="w-4 h-4 animate-spin" /> : <SplitSquareHorizontal className="w-4 h-4" />}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => deleteTask(task.id)}
                                            className="p-2 w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 transition-all active:scale-[0.9] shadow-sm"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* AI Insight */}
                                {task.ai_insight && (
                                    <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50">
                                        <p className="text-xs text-emerald-700 italic">✨ {task.ai_insight}</p>
                                    </div>
                                )}

                                {/* Subtasks */}
                                {task.subtasks && task.subtasks.length > 0 && (
                                    <div className="pl-5 space-y-2 border-l-2 border-stone-200/50">
                                        {task.subtasks.map(st => (
                                            <div key={st.id} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleSubtask(task.id, st.id)}>
                                                <div className="text-stone-400 group-hover:text-emerald-500 transition-colors">
                                                    {st.is_completed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <CircleDashed className="w-4 h-4" />}
                                                </div>
                                                <span className={`text-sm text-stone-600 ${st.is_completed ? 'line-through opacity-60' : ''}`}>{st.title}</span>
                                            </div>
                                        ))}
                                        <div className="mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                                style={{ width: `${(task.subtasks.filter(s => s.is_completed).length / task.subtasks.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 px-8 flex flex-col items-center">
                            <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                <span className="text-4xl drop-shadow-sm">🗓️</span>
                            </div>
                            <p className="font-serif text-xl tracking-tight text-stone-800 mb-1">
                                Dia livre de tarefas
                            </p>
                            <p className="text-[13px] text-stone-500 max-w-[200px] leading-relaxed">
                                Adicione manualmente ou use o Smart Entry.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
