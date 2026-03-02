import { useState, useEffect } from 'react';
import { Dumbbell, Flame, Wind, Footprints, Send, Check, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useEnergyScore } from '../lib/useEnergyScore';
import { EnergyGauge } from '../components/EnergyGauge';
import { showToast } from '../components/Toast';

interface ExerciseEntry {
    id: string;
    type: string;
    title: string;
    duration_minutes: number;
    intensity: string;
    completed: boolean;
    ai_generated_plan: Record<string, unknown> | null;
    created_at: string;
}

// AI-driven exercise suggestion based on energy level
// Inspired by behavioral activation: match exercise intensity to current capacity
const QUICK_OPTIONS = [
    { label: 'Alongamento leve', icon: '🧘', type: 'stretching', intensity: 'light', minEnergy: 0 },
    { label: 'Caminhada curta', icon: '🚶', type: 'walking', intensity: 'light', minEnergy: 0 },
    { label: 'Respiração guiada', icon: '🌬️', type: 'breathing', intensity: 'light', minEnergy: 0 },
    { label: 'Yoga suave', icon: '🧘‍♀️', type: 'yoga', intensity: 'light', minEnergy: 20 },
    { label: 'Caminhada + força leve', icon: '💪', type: 'strength', intensity: 'moderate', minEnergy: 40 },
    { label: 'Corrida leve', icon: '🏃', type: 'running', intensity: 'moderate', minEnergy: 50 },
    { label: 'Treino HIIT moderado', icon: '🔥', type: 'hiit', intensity: 'intense', minEnergy: 65 },
    { label: 'Corrida intervalada', icon: '⚡', type: 'running', intensity: 'intense', minEnergy: 70 },
];

export const Exercises = () => {
    const { user } = useAuth();
    const { energy, loading: energyLoading } = useEnergyScore();
    const [history, setHistory] = useState<ExerciseEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [customRequest, setCustomRequest] = useState('');
    const [generating, setGenerating] = useState(false);
    const [aiPlan, setAiPlan] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        const fetchHistory = async () => {
            const { data } = await supabase
                .from('exercise_history')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) setHistory(data as ExerciseEntry[]);
            setLoading(false);
        };
        fetchHistory();
    }, [user]);

    const energyScore = energy?.total_score ?? 50;
    const availableExercises = QUICK_OPTIONS.filter(ex => ex.minEnergy <= energyScore);

    const startQuickExercise = async (option: typeof QUICK_OPTIONS[0]) => {
        if (!user) return;

        const { error } = await supabase
            .from('exercise_history')
            .insert([{
                user_id: user.id,
                type: option.type,
                title: option.label,
                duration_minutes: option.intensity === 'light' ? 15 : option.intensity === 'moderate' ? 30 : 45,
                intensity: option.intensity,
                energy_at_start: energyScore,
                user_request: option.label,
            }]);

        if (!error) {
            showToast('Exercício iniciado!');
            // Refetch history
            const { data } = await supabase
                .from('exercise_history')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);
            if (data) setHistory(data as ExerciseEntry[]);
        }
    };

    const generateAIPlan = async () => {
        if (!user || !customRequest.trim()) return;

        setGenerating(true);
        setAiPlan(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const resp = await supabase.functions.invoke('chat-ai', {
                body: {
                    message: `Gere um plano de exercício curto e prático baseado no pedido: "${customRequest}". 
Minha energia atual é ${energyScore}/100 (${energy?.energy_level || 'medium'}).
${energyScore < 40 ? 'IMPORTANTE: minha energia está baixa. Sugira algo muito leve e seguro.' : ''}
${energyScore > 70 ? 'Tenho boa energia, posso fazer algo mais desafiador mas com limites claros.' : ''}
Formate como lista simples de exercícios com duração. Máximo 5 exercícios. Seja direto.`,
                    history: [],
                },
            });

            if (resp.data?.analysis) {
                setAiPlan(resp.data.analysis);

                // Save to history
                await supabase.from('exercise_history').insert([{
                    user_id: user.id,
                    type: 'custom',
                    title: customRequest,
                    duration_minutes: 30,
                    intensity: energyScore > 70 ? 'intense' : energyScore > 40 ? 'moderate' : 'light',
                    energy_at_start: energyScore,
                    user_request: customRequest,
                    ai_generated_plan: { plan: resp.data.analysis },
                }]);
            }
        } catch (e) {
            console.error('AI exercise generation failed:', e);
            showToast('Erro ao gerar plano');
        } finally {
            setGenerating(false);
        }
    };

    const markCompleted = async (exerciseId: string) => {
        const { error } = await supabase
            .from('exercise_history')
            .update({ completed: true, completed_at: new Date().toISOString() })
            .eq('id', exerciseId);

        if (!error) {
            setHistory(history.map(h => h.id === exerciseId ? { ...h, completed: true } : h));
            showToast('Exercício concluído! 💪');
        }
    };

    return (
        <div className="min-h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-6 relative overflow-hidden">
            <div className="absolute top-[-5%] right-[-10%] w-80 h-80 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-[80px] animate-pulse"></div>

            <div className="p-5 space-y-5 relative z-10 max-w-lg mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mt-4">
                    <div>
                        <h1 className="text-3xl font-serif text-stone-800 tracking-tight flex items-center gap-2">
                            <Dumbbell className="w-6 h-6 text-purple-500" />
                            Exercícios
                        </h1>
                        <p className="text-stone-500 text-xs font-medium mt-0.5">Movimento proporcional à sua energia</p>
                    </div>
                    {!energyLoading && energy && (
                        <EnergyGauge score={energy.total_score} size="sm" showLabel={false} />
                    )}
                </div>

                {/* Energy-based recommendation */}
                {!energyLoading && energy && (
                    <div className={`rounded-2xl p-4 border ${energy.energy_level === 'high' ? 'bg-emerald-50/80 border-emerald-200/60' :
                        energy.energy_level === 'medium' ? 'bg-amber-50/80 border-amber-200/60' :
                            'bg-red-50/80 border-red-200/60'
                        }`}>
                        <div className="flex items-center gap-2 mb-1">
                            {energy.energy_level === 'high' ? <Flame className="w-4 h-4 text-emerald-600" /> :
                                energy.energy_level === 'medium' ? <Footprints className="w-4 h-4 text-amber-600" /> :
                                    <Wind className="w-4 h-4 text-red-500" />}
                            <span className="font-semibold text-sm text-stone-700">
                                {energy.energy_level === 'high' ? 'Boa energia para treinar!' :
                                    energy.energy_level === 'medium' ? 'Exercício moderado recomendado' :
                                        'Hoje é dia de movimento suave'}
                            </span>
                        </div>
                        <p className="text-xs text-stone-500">
                            {energy.energy_level === 'low'
                                ? 'Priorize alongamento, respiração ou uma caminhada curta. Nada de se forçar.'
                                : energy.energy_level === 'high'
                                    ? 'Bom momento para um treino mais intenso, mas respeite seus limites.'
                                    : 'Combine caminhada com exercícios leves de força. Evite exageros.'}
                        </p>
                    </div>
                )}

                {/* Quick Start Options */}
                <div className="space-y-3">
                    <h2 className="font-serif text-lg text-stone-800">Início Rápido</h2>
                    <div className="grid grid-cols-2 gap-2">
                        {availableExercises.map((option) => (
                            <button
                                key={option.label}
                                title={option.label}
                                onClick={() => startQuickExercise(option)}
                                className={`flex items-center gap-2 p-3 rounded-2xl border transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm hover:shadow-md ${option.intensity === 'intense' ? 'bg-orange-50/80 border-orange-200/60 hover:bg-orange-100/80 text-orange-700' :
                                    option.intensity === 'moderate' ? 'bg-amber-50/80 border-amber-200/60 hover:bg-amber-100/80 text-amber-700' :
                                        'bg-white/80 border-white hover:bg-white text-stone-700'
                                    }`}
                            >
                                <span className="text-xl drop-shadow-sm">{option.icon}</span>
                                <span className="text-[13px] font-semibold text-left leading-tight">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom AI Request */}
                <div className="space-y-3">
                    <h2 className="font-serif text-lg text-stone-800">Peça à IA</h2>
                    <div className="glass-card-chic rounded-2xl p-2.5 flex items-center gap-2 border border-white/60 shadow-inner-sm">
                        <input
                            type="text"
                            placeholder="Ex: Treino rápido de 15 min..."
                            value={customRequest}
                            onChange={(e) => setCustomRequest(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && generateAIPlan()}
                            className="flex-1 bg-transparent text-stone-800 text-sm placeholder:text-stone-400 font-medium outline-none px-3"
                        />
                        <button
                            title="Gerar plano com IA"
                            onClick={generateAIPlan}
                            disabled={generating || !customRequest.trim()}
                            className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center transition-all hover:bg-purple-600 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 shadow-md shadow-purple-500/20"
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </div>

                    {generating && (
                        <div className="glass-card-chic rounded-2xl p-4 animate-pulse">
                            <div className="h-3 bg-stone-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-stone-200 rounded w-1/2"></div>
                        </div>
                    )}

                    {aiPlan && (
                        <div className="glass-card-chic rounded-2xl p-4 space-y-2">
                            <h3 className="font-semibold text-sm text-stone-700">Plano Gerado</h3>
                            <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">{aiPlan}</p>
                        </div>
                    )}
                </div>

                {/* Recent History */}
                <div className="space-y-3">
                    <h2 className="font-serif text-lg text-stone-800">Histórico</h2>
                    {loading ? (
                        <div className="space-y-2">
                            {[1, 2].map(i => (
                                <div key={i} className="h-14 bg-white/40 rounded-2xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : history.length > 0 ? (
                        history.map((entry) => (
                            <div key={entry.id} className="glass-card-chic rounded-2xl p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${entry.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-500'
                                        }`}>
                                        {entry.completed ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-stone-700">{entry.title}</p>
                                        <p className="text-[10px] text-stone-400">
                                            {entry.duration_minutes}min · {entry.intensity}
                                            {entry.completed ? ' · ✓ Concluído' : ''}
                                        </p>
                                    </div>
                                </div>
                                {!entry.completed && (
                                    <button
                                        onClick={() => markCompleted(entry.id)}
                                        className="text-xs text-emerald-600 font-semibold px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 transition-all active:scale-95"
                                    >
                                        Concluir
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16 px-6 flex flex-col items-center">
                            <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                <span className="text-3xl drop-shadow-sm">💤</span>
                            </div>
                            <p className="font-serif text-[17px] tracking-tight text-stone-800 mb-1">
                                Nenhum exercício ainda
                            </p>
                            <p className="text-[13px] text-stone-500 max-w-[200px] leading-relaxed">
                                Comece um treino rápido ou peça uma sugestão para a IA.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
