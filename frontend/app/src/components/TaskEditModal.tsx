import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Save } from 'lucide-react';
import { showToast } from './Toast';

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

interface TaskEditModalProps {
    task: Task;
    onClose: () => void;
    onSave: (updatedTask: Task) => void;
}

export const TaskEditModal = ({ task, onClose, onSave }: TaskEditModalProps) => {
    const [title, setTitle] = useState(task.title);
    const [note, setNote] = useState(task.note || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setTitle(task.title);
        setNote(task.note || '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [task]);

    const handleSave = async () => {
        setIsSaving(true);
        const newTitle = title.trim();
        const newNote = note.trim() || undefined;

        const { error } = await supabase
            .from('tasks')
            .update({
                title: newTitle,
                note: newNote || null,
                edited_at: new Date().toISOString(),
            })
            .eq('id', task.id);

        setIsSaving(false);

        if (!error) {
            onSave({ ...task, title: newTitle, note: newNote, edited_at: new Date().toISOString() });
            showToast('Tarefa atualizada');
            onClose();
        } else {
            showToast('Erro ao atualizar tarefa');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-slide-up">
                <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                    <h3 className="font-serif text-lg text-stone-800">Editar Tarefa</h3>
                    <button type="button" title="Fechar" onClick={onClose} className="p-2 -mr-2 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-500 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Título da Tarefa</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full border-2 border-stone-100 bg-stone-50/50 rounded-xl px-4 py-2.5 text-stone-700 outline-none focus:border-emerald-400 focus:bg-white transition-colors"
                            placeholder="O que precisa ser feito?"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Notas de Humor ou Esforço</label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            rows={3}
                            className="w-full border-2 border-stone-100 bg-stone-50/50 rounded-xl px-4 py-3 text-stone-700 outline-none focus:border-emerald-400 focus:bg-white transition-colors resize-none text-sm leading-relaxed"
                            placeholder="Ex: Tarefa desgastante mas consegui terminar, precisou muita concentração..."
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !title.trim()}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};
