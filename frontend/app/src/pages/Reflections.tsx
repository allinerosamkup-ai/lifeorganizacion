import { useState, useEffect } from 'react';
import { ChevronLeft, Sparkles, History, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { showToast } from '../components/ui/Toast';

const MOODS = [
    { value: 'great', emoji: '🤩', label: 'Excelente' },
    { value: 'good', emoji: '🙂', label: 'Bom' },
    { value: 'okay', emoji: '😐', label: 'Ok' },
    { value: 'low', emoji: '🥲', label: 'Baixo' },
    { value: 'bad', emoji: '😔', label: 'Ruim' },
];

const getMoodObj = (value: string) => MOODS.find(m => m.value === value);

export const Reflections = ({ onBack }: { onBack: () => void }) => {
    const { user } = useAuth();
    const [text, setText] = useState('');
    const [mood, setMood] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'create' | 'result' | 'history'>('create');
    const [result, setResult] = useState<{
        ai_summary?: string;
        ai_themes?: string[];
        ai_actions?: string[];
    } | null>(null);
    const [history, setHistory] = useState<{
        id: string;
        date: string;
        mood: string;
        ai_summary?: string;
        ai_themes?: string[];
        free_text: string;
    }[]>([]);

    useEffect(() => {
        if (view !== 'history' || !user) return;
        const fetchHistory = async () => {
            const { data } = await supabase
                .from('daily_reflections')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(7);
            if (data) setHistory(data);
        };
        fetchHistory();
    }, [view, user]);

    const handleReflect = async () => {
        if (!user || !text.trim() || !mood) {
            showToast('Por favor, escreva como foi e escolha um humor.', 'error');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('evening-reflection', {
                body: { text, mood, user_id: user.id },
            });
            if (error) throw error;
            setResult(data.data);
            setView('result');
            showToast('Reflexão concluída ✨', 'success');
        } catch {
            showToast('Erro ao analisar reflexão.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const isHistory = view === 'history';

    return (
        <div className="page-bg min-h-screen pb-28 animate-fade-in">

            {/* Header */}
            <div className="page-header pt-12 pb-4 px-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1 text-stone-500 font-semibold text-sm mb-3 hover:text-stone-800 transition-colors tap-spring"
                    aria-label="Voltar para o início"
                >
                    <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-serif text-stone-800 tracking-tight">
                        {isHistory ? 'Histórico' : 'Reflexão da Noite'}
                    </h1>
                    <button
                        onClick={() => setView(v => v === 'history' ? 'create' : 'history')}
                        className={`
                            w-9 h-9 rounded-xl flex items-center justify-center
                            tap-spring transition-all duration-200
                            ${isHistory ? 'bg-violet-100 text-violet-600' : 'bg-stone-100 text-stone-500 hover:bg-violet-50 hover:text-violet-500'}
                        `}
                        aria-label={isHistory ? 'Ver formulário de reflexão' : 'Ver histórico de reflexões'}
                        aria-pressed={isHistory}
                    >
                        <History className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="p-6 max-w-lg mx-auto space-y-4">

                {/* ── Create view ── */}
                {view === 'create' && (
                    <div className="space-y-4 animate-fade-in-up">

                        {/* Mood selector */}
                        <div className="card rounded-3xl p-5">
                            <p className="section-label mb-4">Como você se sentiu hoje?</p>
                            <div className="grid grid-cols-5 gap-2">
                                {MOODS.map(m => (
                                    <button
                                        key={m.value}
                                        onClick={() => setMood(m.value)}
                                        aria-pressed={mood === m.value}
                                        className={`
                                            flex flex-col items-center gap-2 py-3 rounded-2xl
                                            transition-all duration-200 tap-spring
                                            ${mood === m.value
                                                ? 'bg-violet-50 border border-violet-200 scale-105'
                                                : 'hover:bg-stone-50 border border-transparent'}
                                        `}
                                    >
                                        <span className={`text-3xl transition-all ${mood === m.value ? '' : 'grayscale-[0.5]'}`}>
                                            {m.emoji}
                                        </span>
                                        <span className={`text-[10px] font-bold ${mood === m.value ? 'text-violet-700' : 'text-stone-400'}`}>
                                            {m.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Diary text */}
                        <div className="card rounded-3xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-stone-50 bg-stone-50/60">
                                <p className="section-label">Mini-diário</p>
                            </div>
                            <textarea
                                value={text}
                                onChange={e => setText(e.target.value)}
                                placeholder="Escreva o que aconteceu de bom, ruim, ou pensamentos que ficaram na sua cabeça..."
                                className="
                                    w-full h-44 p-5 text-stone-700 text-sm
                                    bg-transparent resize-none focus:outline-none
                                    placeholder:text-stone-300 leading-relaxed
                                "
                            />
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleReflect}
                            disabled={loading || !text.trim() || !mood}
                            className="btn-primary"
                            aria-busy={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Refletindo com IA...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Refletir com IA
                                </>
                            )}
                        </button>

                        {(!text.trim() || !mood) && (
                            <p className="text-center text-stone-400 text-xs -mt-1">
                                {!mood ? 'Escolha um humor para continuar' : 'Escreva algo para continuar'}
                            </p>
                        )}
                    </div>
                )}

                {/* ── Result view ── */}
                {view === 'result' && result && (
                    <div className="space-y-4 animate-fade-in-up">

                        {/* AI Summary banner */}
                        <div
                            className="relative overflow-hidden rounded-3xl p-6 text-white text-center space-y-3"
                            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)' }}
                        >
                            <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/15 blur-3xl rounded-full pointer-events-none" />
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <p className="font-serif text-xl leading-snug relative">{result.ai_summary}</p>
                        </div>

                        {/* Themes */}
                        {result.ai_themes && result.ai_themes.length > 0 && (
                            <div className="card rounded-3xl p-6">
                                <h3 className="section-label mb-4">Temas de Hoje</h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.ai_themes.map((t, i) => (
                                        <span key={i} className="pill bg-stone-100 text-stone-600 border border-stone-200 text-sm py-1.5">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        {result.ai_actions && result.ai_actions.length > 0 && (
                            <div className="card rounded-3xl p-6">
                                <h3 className="section-label mb-4">Para Amanhã</h3>
                                <ul className="space-y-2.5">
                                    {result.ai_actions.map((act, i) => (
                                        <li key={i} className="flex items-center gap-3 bg-stone-50 p-4 rounded-2xl">
                                            <div className="w-7 h-7 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                                                <ArrowRight className="w-4 h-4 text-violet-500" />
                                            </div>
                                            <span className="text-stone-700 font-semibold text-sm leading-snug">{act}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={onBack}
                            className="btn-ghost w-full"
                        >
                            Voltar ao Início
                        </button>
                    </div>
                )}

                {/* ── History view ── */}
                {view === 'history' && (
                    <div className="space-y-3 animate-fade-in-up">
                        {history.length === 0 ? (
                            <div className="card rounded-3xl py-14 text-center">
                                <p className="text-4xl mb-3">📖</p>
                                <p className="text-stone-500 font-semibold">Nenhuma reflexão ainda</p>
                                <p className="text-stone-400 text-sm mt-1">Comece a refletir sobre seu dia!</p>
                            </div>
                        ) : (
                            history.map(item => {
                                const moodObj = getMoodObj(item.mood);
                                return (
                                    <div key={item.id} className="card rounded-3xl p-5 hover-lift">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <span className="text-sm font-bold text-violet-600">
                                                    {new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                    })}
                                                </span>
                                            </div>
                                            <span className="text-2xl" title={moodObj?.label} aria-label={moodObj?.label}>
                                                {moodObj?.emoji}
                                            </span>
                                        </div>
                                        <p className="text-stone-700 font-serif text-sm leading-relaxed mb-3">
                                            {item.ai_summary || item.free_text.substring(0, 80) + '...'}
                                        </p>
                                        {item.ai_themes && item.ai_themes.length > 0 && (
                                            <div className="flex gap-1.5 flex-wrap">
                                                {item.ai_themes.map((t, i) => (
                                                    <span key={i} className="pill bg-stone-100 text-stone-500 border border-stone-100">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
