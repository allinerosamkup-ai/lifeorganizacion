import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dumbbell, Send, Check, ChevronRight } from 'lucide-react';
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
    const { t } = useTranslation();
    const { user } = useAuth();
    const { energy, loading: energyLoading } = useEnergyScore();
    const [history, setHistory] = useState<ExerciseEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [customRequest, setCustomRequest] = useState('');
    const [generating, setGenerating] = useState(false);
    const [aiPlan, setAiPlan] = useState<string | null>(null);
    const [selectedExercise, setSelectedExercise] = useState<any | null>(null);

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
    const energyLevel = energy?.energy_level || 'medium';
    const availableExercises = QUICK_OPTIONS.filter(ex => ex.minEnergy <= energyScore);

    const suggestions = {
        low: {
            type: 'Alongamento + Respiração',
            duration: 10,
            intensity: 'leve',
            description: 'Alongamentos suaves + 5 min respiração box (4-4-4-4)',
            icon: '🌙'
        },
        medium: {
            type: 'Caminhada moderada',
            duration: 20,
            intensity: 'moderado',
            description: 'Caminhada ao ar livre, ritmo confortável',
            icon: '🚶'
        },
        high: {
            type: 'Corrida intervalada',
            duration: 30,
            intensity: 'intenso',
            description: '5 min aquecimento + 6x (2 min corrida rápida + 1 min caminhada)',
            icon: '🏃'
        }
    };

    const currentSuggestion = suggestions[energyLevel as keyof typeof suggestions];

    const openQuickExercise = (option: typeof QUICK_OPTIONS[0]) => {
        setSelectedExercise({
            title: option.label,
            type: option.type,
            duration_minutes: option.intensity === 'light' ? 15 : option.intensity === 'moderate' ? 30 : 45,
            intensity: option.intensity,
            description: `Este é um exercício de intensidade ${option.intensity === 'light' ? 'leve' : option.intensity === 'moderate' ? 'moderada' : 'alta'} para ajudar a recuperar ou gastar energia no seu ritmo.`,
        });
    };

    const openRecommended = () => {
        setSelectedExercise({
            title: currentSuggestion.type,
            type: 'recommended',
            duration_minutes: currentSuggestion.duration,
            intensity: currentSuggestion.intensity,
            description: currentSuggestion.description,
        });
    };

    const openHistoryExercise = (entry: ExerciseEntry) => {
        let desc = `Sessão de ${entry.title}.`;
        if (entry.ai_generated_plan && typeof entry.ai_generated_plan === 'object') {
            const plan: any = entry.ai_generated_plan;
            desc = `${plan.ai_reasoning || ''}\n\nExercícios:\n- ${(plan.items || []).join('\n- ')}`;
        }
        setSelectedExercise({
            id: entry.id,
            title: entry.title,
            type: entry.type,
            duration_minutes: entry.duration_minutes,
            intensity: entry.intensity,
            description: desc,
        });
    };

    const generateAIPlan = async () => {
        if (!user || !customRequest.trim()) return;

        setGenerating(true);
        setAiPlan(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const resp = await supabase.functions.invoke('generate-exercise-plan', {
                body: {
                    user_id: user.id,
                    user_request: customRequest,
                },
            });

            if (resp.data) {
                const plan = resp.data.ai_generated_plan;
                const formattedPlan = `${plan.title} (${plan.duration} min - ${plan.intensity})\n\nMotivo: ${plan.ai_reasoning}\n\nExercícios:\n- ${plan.items.join('\n- ')}`;
                setAiPlan(formattedPlan);

                setHistory(prev => [resp.data, ...prev]);
                showToast('Plano gerado com sucesso!');
            }
        } catch (e) {
            console.error('AI exercise generation failed:', e);
            showToast('Erro ao gerar plano');
        } finally {
            setGenerating(false);
        }
    };

    const markCompleted = async () => {
        if (!selectedExercise || !user) return;

        if (selectedExercise.id) {
            // Update existing
            const { error } = await supabase
                .from('exercise_history')
                .update({ completed: true, completed_at: new Date().toISOString() })
                .eq('id', selectedExercise.id);

            if (!error) {
                setHistory(history.map(h => h.id === selectedExercise.id ? { ...h, completed: true } : h));
                showToast('Exercício concluído! 💪');
            }
        } else {
            // Insert new
            const { data, error } = await supabase
                .from('exercise_history')
                .insert([{
                    user_id: user.id,
                    type: selectedExercise.type,
                    title: selectedExercise.title,
                    duration_minutes: selectedExercise.duration_minutes,
                    intensity: selectedExercise.intensity,
                    energy_at_start: energyScore,
                    completed: true,
                    completed_at: new Date().toISOString()
                }]).select();

            if (!error && data) {
                setHistory([data[0] as ExerciseEntry, ...history]);
                showToast('Exercício concluído! 💪');
            }
        }
        setSelectedExercise(null);
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
                            {t('exercises.title')}
                        </h1>
                        <p className="text-stone-500 text-xs font-medium mt-0.5">Movimento proporcional à sua energia</p>
                    </div>
                    {!energyLoading && energy && (
                        <EnergyGauge score={energy.total_score} size="sm" showLabel={false} />
                    )}
                </div>

                {/* Energy-based recommendation */}
                {!energyLoading && energy && (
                    <div
                        onClick={openRecommended}
                        className={`p-4 rounded-xl shadow-sm border border-white/60 mb-2 cursor-pointer transition-transform hover:-translate-y-0.5 active:scale-95 ${energyLevel === 'high' ? 'bg-gradient-to-r from-orange-100 to-rose-100' :
                            energyLevel === 'medium' ? 'bg-gradient-to-r from-yellow-100 to-amber-100' :
                                'bg-gradient-to-r from-purple-100 to-indigo-100'
                            }`}
                    >
                        <div className="flex items-start gap-4 pointer-events-none">
                            <span className="text-4xl mt-1 drop-shadow-sm">{currentSuggestion.icon}</span>
                            <div className="flex-1">
                                <h3 className="font-serif text-[17px] text-stone-800 leading-tight">Recomendado hoje</h3>
                                <p className="text-[11px] text-stone-600 font-medium mb-3">Baseado na sua energia: {energy.total_score}/100</p>

                                <div className="bg-white/40 rounded-xl p-3">
                                    <p className="font-bold text-sm text-stone-800">{currentSuggestion.type}</p>
                                    <div className="flex gap-2 mt-3">
                                        <span className="px-2.5 py-1 bg-white/70 rounded-md text-[10px] font-bold text-stone-600 shadow-sm">{currentSuggestion.duration} min</span>
                                        <span className="px-2.5 py-1 bg-white/70 rounded-md text-[10px] font-bold text-stone-600 shadow-sm capitalize">{currentSuggestion.intensity}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
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
                                onClick={() => openQuickExercise(option)}
                                className={`flex items-center gap-2 p-3 rounded-2xl border transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm hover:shadow-md bg-white/80 border-white hover:bg-white text-stone-700`}
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
                            <div
                                key={entry.id}
                                onClick={() => !entry.completed && openHistoryExercise(entry)}
                                className={`glass-card-chic rounded-2xl p-3 flex items-center justify-between ${!entry.completed ? 'cursor-pointer hover:bg-white/60 transition-colors' : ''}`}
                            >
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

            {/* Exercise Modal */}
            {selectedExercise && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl transform transition-all space-y-6">
                        <div>
                            <h2 className="text-2xl font-serif text-stone-800 mb-2 leading-tight">{selectedExercise.title}</h2>
                            <div className="flex gap-2 mb-4">
                                <span className="px-2.5 py-1 bg-purple-50 rounded-lg text-xs font-bold text-purple-600 uppercase tracking-wide">
                                    {selectedExercise.duration_minutes} min
                                </span>
                                <span className="px-2.5 py-1 bg-stone-100 rounded-lg text-xs font-bold text-stone-600 uppercase tracking-wide">
                                    {selectedExercise.intensity}
                                </span>
                            </div>
                            <div className="bg-stone-50 rounded-2xl p-4">
                                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{selectedExercise.description}</p>
                            </div>
                        </div>

                        <div className="flex justify-between gap-3 pt-2">
                            <button
                                onClick={() => setSelectedExercise(null)}
                                className="flex-1 py-3 px-4 rounded-2xl font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={markCompleted}
                                className="flex-1 py-3 px-4 rounded-2xl font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Concluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
