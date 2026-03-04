import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { X, ArrowRight, Check } from 'lucide-react';
import { showToast } from './ui/Toast';

const MOODS = [
    { value: 1, emoji: '😖', label: 'Péssimo' },
    { value: 2, emoji: '😕', label: 'Ruim' },
    { value: 3, emoji: '😐', label: 'Mais ou\nmenos' },
    { value: 4, emoji: '🙂', label: 'Bem' },
    { value: 5, emoji: '🤩', label: 'Incrível' },
];

const EMOTIONS = [
    'Alegre', 'Calma', 'Focada', 'Cansada',
    'Ansiosa', 'Estressada', 'Produtiva', 'Triste',
    'Empolgada', 'Nostálgica', 'Gratidão', 'Irritada',
];

export const CheckinModal = ({
    onClose,
    onComplete,
}: {
    onClose: () => void;
    onComplete: () => void;
}) => {
    const { user, profile } = useAuth();
    const [step, setStep] = useState(1);
    const [energy, setEnergy] = useState<number | null>(null);
    const [emotions, setEmotions] = useState<string[]>([]);
    const [note, setNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const totalSteps = 3;
    const progress = ((step - 1) / (totalSteps - 1)) * 100;

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
                energy: energy * 2, // Map 1–5 → 2–10
                emotions,
                note: note.trim() || null,
                check_in_type: currentPeriod,
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
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in sm:items-center"
            style={{ background: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Check-in de energia"
        >
            {/* Sheet */}
            <div
                className="w-full max-w-lg flex flex-col overflow-hidden animate-scale-in"
                style={{
                    height: '88dvh',
                    background: '#FAF8F5',
                    borderRadius: '28px 28px 0 0',
                    boxShadow: '0 -8px 40px rgba(0,0,0,0.16)',
                }}
            >
                {/* Progress bar */}
                <div className="h-1 bg-stone-100 rounded-full mx-6 mt-3 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-rose-400 to-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Top bar */}
                <div className="flex justify-between items-center px-6 py-4">
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 tap-spring hover:bg-stone-200 transition-colors"
                        aria-label="Fechar check-in"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-1.5" aria-label={`Passo ${step} de ${totalSteps}`}>
                        {Array.from({ length: totalSteps }, (_, i) => (
                            <div
                                key={i}
                                className={`rounded-full transition-all duration-300 ${i + 1 === step
                                    ? 'w-6 h-2 bg-violet-500'
                                    : i + 1 < step
                                        ? 'w-2 h-2 bg-violet-300'
                                        : 'w-2 h-2 bg-stone-200'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-xs font-bold text-stone-400 w-9 text-right">
                        {step}/{totalSteps}
                    </span>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 no-scrollbar">

                    {/* Step 1: Mood selection */}
                    {step === 1 && (
                        <div className="flex flex-col items-center justify-center h-full space-y-10 animate-fade-in-up">
                            <div className="text-center">
                                <h2 className="text-3xl font-serif text-stone-800 leading-tight">
                                    Como você está agora?
                                </h2>
                                <p className="text-stone-400 text-sm mt-2">
                                    Escolha o que mais descreve seu estado atual
                                </p>
                            </div>

                            <div className="grid grid-cols-5 gap-2 w-full">
                                {MOODS.map(m => (
                                    <button
                                        key={m.value}
                                        onClick={() => {
                                            setEnergy(m.value);
                                            setTimeout(() => setStep(2), 280);
                                        }}
                                        className={`
                                            flex flex-col items-center gap-2.5 py-4 rounded-2xl
                                            transition-all duration-200 tap-spring
                                            ${energy === m.value
                                                ? 'bg-violet-100 scale-110 shadow-md shadow-violet-100'
                                                : 'bg-white hover:bg-stone-50 hover:scale-105'}
                                        `}
                                        aria-label={m.label}
                                        aria-pressed={energy === m.value}
                                    >
                                        <span className={`text-4xl transition-all duration-200 ${energy === m.value ? '' : 'grayscale hover:grayscale-0'}`}>
                                            {m.emoji}
                                        </span>
                                        <span className={`text-[10px] font-bold text-center leading-tight ${energy === m.value ? 'text-violet-700' : 'text-stone-400'}`}>
                                            {m.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Emotions */}
                    {step === 2 && (
                        <div className="flex flex-col pt-2 space-y-5 animate-fade-in-up">
                            <div>
                                <h2 className="text-2xl font-serif text-stone-800">Como você se sente?</h2>
                                <p className="text-stone-400 text-sm mt-1">Selecione o que se encaixa — pode ser mais de um</p>
                            </div>

                            <div className="flex flex-wrap gap-2.5">
                                {EMOTIONS.map(em => (
                                    <button
                                        key={em}
                                        onClick={() => toggleEmotion(em)}
                                        aria-pressed={emotions.includes(em)}
                                        className={`
                                            px-4 py-2 rounded-full text-sm font-semibold
                                            transition-all duration-150 tap-spring
                                            ${emotions.includes(em)
                                                ? 'bg-violet-500 text-white shadow-md shadow-violet-200'
                                                : 'bg-white border border-stone-200 text-stone-600 hover:border-violet-300 hover:text-violet-600'}
                                        `}
                                    >
                                        {em}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-4 mt-auto">
                                <button
                                    onClick={() => setStep(3)}
                                    className="btn-dark"
                                >
                                    Continuar <ArrowRight className="w-5 h-5" />
                                </button>
                                {emotions.length === 0 && (
                                    <p className="text-center text-stone-400 text-xs mt-2">
                                        Pode pular — é opcional
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Note */}
                    {step === 3 && (
                        <div className="flex flex-col pt-2 space-y-5 h-full animate-fade-in-up">
                            <div>
                                <h2 className="text-2xl font-serif text-stone-800">Algum pensamento?</h2>
                                <p className="text-stone-400 text-sm mt-1">Um mini-diário do seu momento atual</p>
                            </div>

                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="Hoje eu... (opcional)"
                                className="
                                    flex-1 min-h-[160px] bg-white border border-stone-200 rounded-2xl
                                    p-5 text-stone-700 text-[15px] leading-relaxed
                                    placeholder:text-stone-300 outline-none resize-none
                                    focus:border-violet-300 focus:ring-2 focus:ring-violet-100
                                    transition-all duration-200
                                "
                            />

                            <div className="space-y-3">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="btn-primary"
                                    aria-busy={isSaving}
                                >
                                    {isSaving ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            Salvando...
                                        </span>
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Salvar Check-in
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setStep(2)}
                                    className="btn-ghost w-full"
                                >
                                    ← Voltar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
