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

export const Reflections = ({ onBack }: { onBack: () => void }) => {
    const { user } = useAuth();
    const [text, setText] = useState('');
    const [mood, setMood] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'create' | 'result' | 'history'>('create');
    const [result, setResult] = useState<{ ai_summary?: string; ai_themes?: string[]; ai_actions?: string[] } | null>(null);
    const [history, setHistory] = useState<{ id: string; date: string; mood: string; ai_summary?: string; ai_themes?: string[]; free_text: string }[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('daily_reflections')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(7);
            if (data) setHistory(data);
        };

        if (view === 'history') {
            fetchHistory();
        }
    }, [view, user]);

    const handleReflect = async () => {
        if (!user || !text.trim() || !mood) {
            showToast('Por favor, escreva como foi e escolha um humor.', 'error');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('evening-reflection', {
                body: { text, mood, user_id: user.id }
            });

            if (error) throw error;

            setResult(data.data);
            setView('result');
            showToast('Reflexão concluída✨', 'success');

            // Grava task action na verdade poderiamos criar, mas sigo o UI
        } catch (err) {
            console.error(err);
            showToast('Erro ao analisar reflexão.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 pb-24 animate-fade-in">
            <div className="bg-white/60 backdrop-blur-2xl pt-14 pb-4 px-6 sticky top-0 z-30 border-b border-stone-200">
                <button onClick={onBack} className="flex items-center text-stone-500 font-medium mb-3">
                    <ChevronLeft className="w-5 h-5 mr-1" /> Voltar
                </button>
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-serif text-stone-800 tracking-tight">Reflexão da Noite</h1>
                    <button onClick={() => setView(v => v === 'history' ? 'create' : 'history')} className="text-indigo-500 p-2 rounded-full hover:bg-stone-100 flex items-center justify-center">
                        <History className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="p-6 max-w-lg mx-auto">
                {view === 'create' && (
                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100">
                            <p className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Como você se sentiu hoje?</p>
                            <div className="flex justify-between gap-2 overflow-x-auto pb-2">
                                {MOODS.map(m => (
                                    <button
                                        key={m.value}
                                        onClick={() => setMood(m.value)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${mood === m.value ? 'bg-indigo-50 border-indigo-200 shadow-sm scale-105 border' : 'bg-stone-50 border border-transparent hover:bg-stone-100 grayscale-[0.5]'} shrink-0 min-w-[72px]`}
                                    >
                                        <span className="text-3xl">{m.emoji}</span>
                                        <span className={`text-[10px] font-bold ${mood === m.value ? 'text-indigo-600' : 'text-stone-500'}`}>{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                            <div className="p-5 border-b border-stone-50 bg-stone-50/50">
                                <p className="text-sm font-bold text-stone-500 uppercase tracking-widest">Diário</p>
                            </div>
                            <textarea
                                value={text}
                                onChange={e => setText(e.target.value)}
                                placeholder="Escreva o que aconteceu de bom, ruim, ou pensamentos que ficaram na sua cabeça..."
                                className="w-full h-48 p-5 text-stone-700 bg-transparent resize-none focus:outline-none placeholder:text-stone-300 leading-relaxed"
                            />
                        </div>

                        <button
                            onClick={handleReflect}
                            disabled={loading || !text.trim() || !mood}
                            className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {loading ? <Sparkles className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            {loading ? 'Refletindo...' : 'Refletir com IA'}
                        </button>
                    </div>
                )}

                {view === 'result' && result && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-xl shadow-indigo-600/20 text-center space-y-3 relative overflow-hidden">
                            <div className="absolute top-[-50%] right-[-10%] w-40 h-40 bg-white/20 blur-2xl rounded-full" />
                            <Sparkles className="w-8 h-8 mx-auto text-indigo-200" />
                            <p className="font-serif text-xl font-medium leading-tight relative">{result.ai_summary}</p>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-3 mb-4">Temas de Hoje</h3>
                            <div className="flex flex-wrap gap-2">
                                {result.ai_themes?.map((t: string, i: number) => (
                                    <span key={i} className="px-3 py-1.5 bg-stone-100 text-stone-600 rounded-full text-sm font-medium">{t}</span>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-3 mb-4">Para Amanhã</h3>
                            <ul className="space-y-3">
                                {result.ai_actions?.map((act: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-stone-700 font-medium bg-stone-50 p-4 rounded-xl items-center">
                                        <ArrowRight className="w-5 h-5 text-indigo-400 shrink-0" />
                                        {act}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button onClick={onBack} className="w-full py-4 text-stone-500 font-bold hover:text-stone-800 transition-colors">Voltar ao Início</button>
                    </div>
                )}

                {view === 'history' && (
                    <div className="space-y-4">
                        {history.length === 0 ? (
                            <p className="text-center text-stone-400 py-10">Nenhuma reflexão passada.</p>
                        ) : (
                            history.map(item => {
                                const moodObj = MOODS.find(m => m.value === item.mood);
                                return (
                                    <div key={item.id} className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-sm font-bold text-indigo-600">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                                            <span className="text-2xl" title={moodObj?.label}>{moodObj?.emoji}</span>
                                        </div>
                                        <p className="text-stone-800 font-serif mb-2">{item.ai_summary || item.free_text.substring(0, 60) + '...'}</p>
                                        <div className="flex gap-2 flex-wrap mt-3">
                                            {item.ai_themes?.map((t: string, i: number) => (
                                                <span key={i} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-1 rounded-full uppercase tracking-wider">{t}</span>
                                            ))}
                                        </div>
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
