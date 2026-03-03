import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Task } from '../components/TaskEditModal'; // adjust import as needed
import { CheckCircle2, CircleDashed } from 'lucide-react';

interface WeeklyBoardProps {
    weekStart: Date;
    tasks: Task[];
    onMoveTask: (taskId: string, newDate: string) => void;
    onQuickAdd: (date: string, title: string) => void;
    onToggleTask: (taskId: string) => void;
}

export function WeeklyBoard({ weekStart, tasks, onMoveTask, onQuickAdd, onToggleTask }: WeeklyBoardProps) {
    const days = [...Array(7)].map((_, i) => addDays(weekStart, i));
    const [dragTaskId, setDragTaskId] = useState<string | null>(null);

    const handleDrop = (e: React.DragEvent, targetStr: string) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) {
            onMoveTask(taskId, targetStr);
        }
        setDragTaskId(null);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mt-4">
            {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayTasks = tasks.filter((t) => t.due_date === dateStr);
                const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

                return (
                    <div
                        key={dateStr}
                        onDragOver={(e) => { e.preventDefault(); }}
                        onDrop={(e) => handleDrop(e, dateStr)}
                        className={`bg-white/80 rounded-2xl p-3 border flex flex-col min-h-[160px] shadow-sm transition-colors ${isToday ? 'border-emerald-300 ring-2 ring-emerald-100 ring-offset-1' : 'border-stone-100/80 hover:border-stone-200'
                            }`}
                    >
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-stone-100/50">
                            <div className="flex items-baseline gap-1.5">
                                <span className={`text-xl font-serif text-stone-800 tracking-tight ${isToday ? 'text-emerald-700' : ''}`}>{format(day, 'dd')}</span>
                                <span className="text-[11px] text-stone-500 font-medium capitalize tracking-wide">{format(day, 'E', { locale: ptBR })}</span>
                            </div>
                            <span className="text-[10px] bg-stone-100/80 text-stone-500 px-1.5 py-0.5 rounded-md font-semibold">{dayTasks.length}</span>
                        </div>

                        <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2">
                            {dayTasks.map((t) => {
                                const levelColor = t.energy_level === 'high' ? 'bg-rose-400' : t.energy_level === 'medium' ? 'bg-amber-400' : 'bg-emerald-400';

                                return (
                                    <div
                                        key={t.id}
                                        draggable
                                        onDragStart={(e) => {
                                            setDragTaskId(t.id);
                                            e.dataTransfer.setData("text/plain", t.id);
                                        }}
                                        onDragEnd={() => setDragTaskId(null)}
                                        className={`group relative text-[11px] p-2.5 rounded-xl border shadow-sm cursor-grab active:cursor-grabbing transition-all ${dragTaskId === t.id ? 'opacity-50 scale-95'
                                            : t.is_completed ? 'bg-stone-50 text-stone-400 border-stone-100 grayscale hover:grayscale-0'
                                                : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <button onClick={() => onToggleTask(t.id)} className="mt-0.5 shrink-0 transition-transform active:scale-90">
                                                {t.is_completed ?
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> :
                                                    <CircleDashed className="w-3.5 h-3.5 text-stone-300 group-hover:text-emerald-400" />
                                                }
                                            </button>
                                            <div className={`flex-1 ${t.is_completed ? 'line-through' : 'font-medium'}`}>
                                                {t.title}
                                            </div>
                                        </div>
                                        {/* Color dot indication */}
                                        <div className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-full m-2 shadow-sm ${levelColor}`}></div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Quick Add Form */}
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target as HTMLFormElement);
                            const title = formData.get('title') as string;
                            if (title.trim()) {
                                onQuickAdd(dateStr, title.trim());
                                (e.target as HTMLFormElement).reset();
                            }
                        }} className="mt-auto pt-2">
                            <input
                                name="title"
                                placeholder="Adicionar tarefa..."
                                className="w-full text-[11px] bg-stone-100/50 hover:bg-stone-100 border border-transparent rounded-xl px-2.5 py-2 outline-none focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all font-medium text-stone-700 placeholder:text-stone-400"
                                autoComplete="off"
                            />
                        </form>
                    </div>
                );
            })}
        </div>
    );
}
