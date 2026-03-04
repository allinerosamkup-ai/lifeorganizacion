import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Star, Clock, CalendarIcon } from 'lucide-react';
import { showToast } from './Toast';

export interface Task {
    id: string;
    title: string;
    description?: string;
    note?: string;
    category?: string;
    duration_minutes?: number;
    energy_level: 'low' | 'medium' | 'high';
    priority: number;
    due_date: string | null;
    start_time?: string;
    is_completed: boolean;
    subtasks: Array<{ id: string; title: string; is_completed: boolean }>;
    ai_insight?: string;
    is_ai_suggested?: boolean;
    created_at: string;
    edited_at?: string;
}

interface TaskEditModalProps {
    task: Task;
    onClose: () => void;
    onSave: (updatedTask: Task) => void;
}

export const TaskEditModal = ({ task, onClose, onSave }: TaskEditModalProps) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [dueDate, setDueDate] = useState(task.due_date || '');
    const [startTime, setStartTime] = useState(task.start_time || '');
    const [duration, setDuration] = useState(task.duration_minutes || 30);
    const [energyLevel, setEnergyLevel] = useState(task.energy_level || 'medium');
    const [priority, setPriority] = useState(task.priority || 3);
    const [category, setCategory] = useState(task.category || 'pessoal');
    const [isAiSuggested, setIsAiSuggested] = useState(task.is_ai_suggested || false);
    const [aiInsight, setAiInsight] = useState(task.ai_insight || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line
        setTitle(task.title);
        setDescription(task.description || '');
        setDueDate(task.due_date || '');
        setStartTime(task.start_time || '');
        setDuration(task.duration_minutes || 30);
        setEnergyLevel(task.energy_level || 'medium');
        setPriority(task.priority || 3);
        setCategory(task.category || 'pessoal');
        setIsAiSuggested(task.is_ai_suggested || false);
        setAiInsight(task.ai_insight || '');
    }, [task]);

    const handleSave = async () => {
        setIsSaving(true);
        const newTitle = title.trim();
        const newDescription = description.trim() || undefined;

        const { error } = await supabase
            .from('tasks')
            .update({
                title: newTitle,
                description: newDescription || null,
                due_date: dueDate || null,
                start_time: startTime || null,
                duration_minutes: duration,
                energy_level: energyLevel,
                priority: priority,
                category: category,
                is_ai_suggested: isAiSuggested,
                ai_insight: aiInsight || null,
                edited_at: new Date().toISOString(),
            })
            .eq('id', task.id);

        setIsSaving(false);

        if (!error) {
            onSave({
                ...task,
                title: newTitle,
                description: newDescription,
                due_date: dueDate || null,
                start_time: startTime || undefined,
                duration_minutes: duration,
                energy_level: energyLevel,
                priority: priority,
                category: category,
                is_ai_suggested: isAiSuggested,
                ai_insight: aiInsight || undefined,
                edited_at: new Date().toISOString()
            });
            showToast('Tarefa atualizada', 'success');
            onClose();
        } else {
            showToast('Erro ao atualizar tarefa', 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in sm:items-center">
            <div className="w-full h-[90vh] sm:h-auto sm:max-h-[90vh] max-w-lg bg-[#F2F2F7] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-stone-200 shrink-0">
                    <button onClick={onClose} className="text-indigo-500 font-medium active:opacity-50">Cancelar</button>
                    <h3 className="font-semibold text-stone-800">Detalhes da Tarefa</h3>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !title.trim()}
                        className="text-indigo-500 font-bold active:opacity-50 disabled:opacity-30 disabled:text-stone-400"
                    >
                        {isSaving ? '...' : 'Guardar'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                    {/* Top: Icon and Title */}
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center text-2xl shadow-sm text-stone-500 cursor-pointer active:scale-95 transition-transform">
                            {/* Mocking icon picker as a static check for now */}
                            📍
                        </div>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-transparent text-center text-2xl font-bold text-stone-800 outline-none placeholder:text-stone-300"
                            placeholder="O que vamos fazer?"
                        />
                    </div>

                    {/* Section: Quando (When) */}
                    <div className="space-y-1">
                        <div className="mx-2 text-xs font-semibold text-stone-500 uppercase tracking-widest">Quando</div>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 divide-y divide-stone-100">
                            {/* Date */}
                            <div className="flex justify-between items-center px-4 py-3">
                                <div className="flex items-center gap-3 text-stone-700">
                                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-500 flex items-center justify-center">
                                        <CalendarIcon className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium text-[15px]">Data</span>
                                </div>
                                <input
                                    type="date"
                                    title="Data de Vencimento"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="bg-stone-100 text-stone-700 px-3 py-1.5 rounded-lg text-sm font-medium border-none outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            {/* Time */}
                            <div className="flex justify-between items-center px-4 py-3">
                                <div className="flex items-center gap-3 text-stone-700">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-500 flex items-center justify-center">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium text-[15px]">Hora de Início</span>
                                </div>
                                <input
                                    type="time"
                                    title="Hora de Início"
                                    value={startTime}
                                    onChange={e => setStartTime(e.target.value)}
                                    className="bg-stone-100 text-stone-700 px-3 py-1.5 rounded-lg text-sm font-medium border-none outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            {/* Duration */}
                            <div className="flex justify-between items-center px-4 py-3">
                                <div className="flex items-center gap-3 text-stone-700">
                                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-500 flex items-center justify-center font-bold text-xs">
                                        ⏳
                                    </div>
                                    <span className="font-medium text-[15px]">Duração (min)</span>
                                </div>
                                <select
                                    className="bg-stone-100 text-stone-700 px-3 py-1.5 rounded-lg text-sm font-medium border-none outline-none focus:ring-2 focus:ring-indigo-500 appearance-none text-center"
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    title="Duração"
                                >
                                    <option value={15}>15 m</option>
                                    <option value={30}>30 m</option>
                                    <option value={45}>45 m</option>
                                    <option value={60}>1 h</option>
                                    <option value={90}>1 h 30 m</option>
                                    <option value={120}>2 h</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section: Configurações App */}
                    <div className="space-y-1">
                        <div className="mx-2 text-xs font-semibold text-stone-500 uppercase tracking-widest">Atributos</div>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 divide-y divide-stone-100 pb-2">
                            {/* Categoria */}
                            <div className="px-4 py-3">
                                <span className="block font-medium text-[15px] text-stone-700 mb-2">Categoria</span>
                                <div className="flex flex-wrap gap-2">
                                    {['saude', 'trabalho', 'pessoal', 'ciclo', 'estudo'].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategory(cat)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${category === cat ? 'bg-indigo-500 text-white' : 'bg-stone-100 text-stone-600'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Energia */}
                            <div className="px-4 py-3">
                                <span className="block font-medium text-[15px] text-stone-700 mb-2">Energia Necessária</span>
                                <div className="flex gap-2">
                                    {[
                                        { val: 'low', label: 'Leve', color: 'emerald' },
                                        { val: 'medium', label: 'Média', color: 'amber' },
                                        { val: 'high', label: 'Alta', color: 'rose' }
                                    ].map(level => (
                                        <button
                                            key={level.val}
                                            onClick={() => setEnergyLevel(level.val as 'low' | 'medium' | 'high')}
                                            className={`flex-1 py-1.5 text-center transition-colors rounded-lg text-xs font-bold ${energyLevel === level.val
                                                ? `bg-${level.color}-100 text-${level.color}-600 border border-${level.color}-200`
                                                : 'bg-stone-50 text-stone-500 border border-stone-100'}`}
                                        >
                                            {level.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Prioridade */}
                            <div className="px-4 py-3 flex justify-between items-center">
                                <span className="font-medium text-[15px] text-stone-700 mb-2 mt-1">Prioridade</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button key={star} title={`Prioridade ${star}`} onClick={() => setPriority(star)} className="focus:outline-none transition-transform active:scale-95">
                                            <Star className={`w-6 h-6 ${star <= priority ? 'fill-orange-400 text-orange-400' : 'text-stone-200'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Notas & IA */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <div className="mx-2 text-xs font-semibold text-stone-500 uppercase tracking-widest">Descrição</div>
                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 text-[15px] text-stone-700 outline-none resize-none placeholder:text-stone-400"
                                    placeholder="Adicionar sub-tarefas ou detalhes..."
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                            <label className="flex items-center gap-3 mb-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isAiSuggested}
                                    onChange={e => setIsAiSuggested(e.target.checked)}
                                    className="w-5 h-5 rounded border-stone-300 text-purple-500 focus:ring-purple-500"
                                />
                                <span className="text-[15px] font-medium text-stone-700">Sugerida por IA</span>
                            </label>

                            {isAiSuggested && (
                                <textarea
                                    value={aiInsight}
                                    onChange={e => setAiInsight(e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-3 bg-purple-50/50 text-[14px] text-purple-800 rounded-xl outline-none resize-none border border-purple-100 placeholder:text-purple-300"
                                    placeholder="Insite ou motivo gerado pela IA..."
                                />
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
