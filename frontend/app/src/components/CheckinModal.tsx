import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { X, ArrowRight, Check } from 'lucide-react';
import { showToast } from './ui/Toast';

const MOODS = [
    { value: 1, emoji: '😖', label: 'Péssimo' },
    { value: 2, emoji: '😕', label: 'Ruim' },
    { value: 3, emoji: '😐', label: 'Mais ou menos' },
    { value: 4, emoji: '🙂', label: 'Bem' },
    { value: 5, emoji: '🤩', label: 'Incrível' },
];

const EMOTIONS = [
    'Alegre', 'Calmo', 'Focado', 'Cansado', 'Ansioso', 'Estressado',
    'Produtivo', 'Triste', 'Empolgado', 'Nostálgico', 'Gratidão', 'Irritado'
];

export const CheckinModal = ({ onClose, onComplete }: { onClose: () => void, onComplete: () => void }) => {
    const { user, profile } = useAuth();
    const [step, setStep] = useState(1);
    const [energy, setEnergy] = useState<number | null>(null);
    const [emotions, setEmotions] = useState<string[]>([]);
    const [note, setNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const toggleEmotion = (emotion: string) => {
        setEmotions(prev =>
            prev.includes(emotion)
                ? prev.filter(e => e !== emotion)
                : [...prev, emotion]
        );
    };

    const handleSave = async () => {
        if (!user || !energy) return;
        setIsSaving(true);

        const hour = new Date().getHours();
        let currentPeriod = 'midday';
        if (hour >= 5 && hour < 12) currentPeriod = 'morning';
        else if (hour >= 18 || hour < 5) currentPeriod = 'evening';

        const today = new Date().toISOString().split('T')[0];

        const { error } = await supabase
            .from('check_ins')
            .insert([{
                user_id: user.id,
                date: today,
                cycle_day: profile?.current_cycle_day || 1,
                energy: energy * 2, // Map 1-5 to 2-10 for backward compat
                emotions,
                note: note.trim() || null,
                check_in_type: currentPeriod
            }]);

        setIsSaving(false);
        if (!error) {
            showToast('Check-in registrado com sucesso!', 'success');
            onComplete();
            onClose();
        } else {
            showToast('Erro ao salvar check-in.', 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in sm:items-center">
            <div className="w-full h-[90vh] sm:h-auto sm:max-h-[90vh] max-w-lg bg-stone-50 sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden relative">

                {/* ProgressBar */}
                <div className="absolute top-0 left-0 right-0 flex h-1 bg-stone-200">
                    <div className="bg-indigo-500 transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }}></div>
                </div>

                <div className="flex justify-between items-center px-6 py-4 mt-2">
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 active:scale-95"><X className="w-5 h-5" /></button>
                    <span className="text-sm font-semibold text-stone-400">Passo {step} de 3</span>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
                    {step === 1 && (
                        <div className="flex flex-col items-center justify-center flex-1 space-y-10 animate-fade-in-up">
                            <h2 className="text-3xl font-serif text-stone-800 text-center leading-tight">Como você está se sentindo agora?</h2>

                            <div className="flex justify-between w-full gap-2">
                                {MOODS.map(m => (
                                    <button
                                        key={m.value}
                                        onClick={() => { setEnergy(m.value); setTimeout(() => setStep(2), 300); }}
                                        className={`flex flex-col items-center gap-3 p-3 rounded-2xl transition-all ${energy === m.value ? 'bg-indigo-100 scale-110' : 'bg-transparent hover:bg-stone-100 grayscale hover:grayscale-0'}`}
                                    >
                                        <span className="text-5xl drop-shadow-sm select-none">{m.emoji}</span>
                                        <span className={`text-xs font-medium ${energy === m.value ? 'text-indigo-700' : 'text-stone-500'}`}>{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-col flex-1 animate-fade-in-up">
                            <h2 className="text-2xl font-serif text-stone-800 mb-2">O que melhor descreve seu estado?</h2>
                            <p className="text-stone-500 text-sm mb-6">Selecione as emoções ou sentimentos (Opcional)</p>

                            <div className="flex flex-wrap gap-3">
                                {EMOTIONS.map(em => (
                                    <button
                                        key={em}
                                        onClick={() => toggleEmotion(em)}
                                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95 ${emotions.includes(em) ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'}`}
                                    >
                                        {em}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-auto pt-10">
                                <button
                                    onClick={() => setStep(3)}
                                    className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold flex justify-center items-center gap-2 active:scale-95 transition-transform"
                                >
                                    Continuar <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col flex-1 animate-fade-in-up">
                            <h2 className="text-2xl font-serif text-stone-800 mb-2">Algum pensamento final?</h2>
                            <p className="text-stone-500 text-sm mb-6">Um bom lugar para um mini-diário.</p>

                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="Hoje eu..."
                                className="w-full flex-1 bg-white border border-stone-200 rounded-2xl p-5 text-stone-700 outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-[15px]"
                            />

                            <div className="mt-6">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-bold flex justify-center items-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                                >
                                    {isSaving ? 'Salvando...' : <><Check className="w-5 h-5" /> Salvar Check-in</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
