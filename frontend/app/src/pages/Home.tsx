import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Clock, User, Check, Bell, Mic, MicOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useEnergyScore } from '../lib/useEnergyScore';
import { EnergyGauge } from '../components/EnergyGauge';
import { showToast } from '../components/Toast';

interface Task {
    id: string;
    title: string;
    is_completed: boolean;
    energy_level: 'low' | 'medium' | 'high';
    priority: number;
}

const MOODS = [
    { key: 'great', emoji: '😊', label: 'Feliz', value: 'great' },
    { key: 'good', emoji: '💪', label: 'Disposto', value: 'good' },
    { key: 'neutral', emoji: '😐', label: 'Normal', value: 'neutral' },
    { key: 'low', emoji: '☹️', label: 'Triste', value: 'low' },
    { key: 'bad', emoji: '😡', label: 'Irritado', value: 'bad' },
    { key: 'tired', emoji: '🥱', label: 'Cansado', value: 'low' },
    { key: 'anxious', emoji: '😰', label: 'Ansioso', value: 'bad' },
    { key: 'calm', emoji: '🧘', label: 'Calmo', value: 'good' },
    { key: 'creative', emoji: '🎨', label: 'Criativo', value: 'great' },
];

const energyScoreMap: Record<string, number> = {
    'great': 9, 'good': 8, 'neutral': 5,
    'low': 3, 'bad': 2, 'tired': 2,
    'anxious': 3, 'calm': 7, 'creative': 8,
};

export const Home = ({ navigate }: { navigate: (view: string) => void }) => {
    const { user } = useAuth();
    const { energy, loading: energyLoading, recalculate } = useEnergyScore();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [todayCheckInCount, setTodayCheckInCount] = useState(0);
    const [lastCheckInEmoji, setLastCheckInEmoji] = useState<string | null>(null);
    const [quickMoodText, setQuickMoodText] = useState('');
    const [isListening, setIsListening] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (!user) return;

        const fetchTasks = async () => {
            const { data } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .is('is_completed', false)
                .order('priority', { ascending: true })
                .limit(5);

            if (data) setTasks(data);
            setLoading(false);
        };

        const fetchCheckIns = async () => {
            const today = new Date().toISOString().split('T')[0];
            const { data, count } = await supabase
                .from('check_ins')
                .select('humor_emoji', { count: 'exact' })
                .eq('user_id', user.id)
                .gte('checked_at', `${today}T00:00:00`)
                .lte('checked_at', `${today}T23:59:59`);

            setTodayCheckInCount(count || 0);
            if (data && data.length > 0) {
                setLastCheckInEmoji(data[data.length - 1].humor_emoji);
            }
        };

        fetchTasks();
        fetchCheckIns();
    }, [user]);

    const handleCheckIn = async (moodKey: string) => {
        if (!user) return;

        const mood = MOODS.find(m => m.key === moodKey);
        if (!mood) return;

        const { error } = await supabase
            .from('check_ins')
            .insert([{
                user_id: user.id,
                humor_emoji: mood.value,
                energy_score: energyScoreMap[moodKey] || 5,
                free_text: quickMoodText || null,
                checked_at: new Date().toISOString(),
            }]);

        if (!error) {
            setTodayCheckInCount(prev => prev + 1);
            setLastCheckInEmoji(mood.value);
            setQuickMoodText('');
            showToast('Check-in salvo');

            // Recalculate energy score after new check-in
            recalculate();

            // Trigger Edge Function to analyze check-in
            supabase.functions.invoke('process-checkin', {
                body: {
                    humor_emoji: mood.value,
                    energy_score: energyScoreMap[moodKey] || 5,
                }
            });
        }
    };

    const toggleTask = async (taskId: string) => {
        const { error } = await supabase
            .from('tasks')
            .update({ is_completed: true })
            .eq('id', taskId);

        if (!error) {
            setTasks(tasks.filter(t => t.id !== taskId));
            showToast('Tarefa concluída');
        }
    };

    // Speech-to-Text using Web Speech API
    const toggleSpeechToText = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognition = (window as Record<string, any>).SpeechRecognition || (window as Record<string, any>).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast('Speech-to-text não suportado neste navegador');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = false;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: Record<string, any>) => {
            const transcript = event.results[0][0].transcript;
            setQuickMoodText(prev => prev ? `${prev} ${transcript}` : transcript);
            setIsListening(false);
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    };

    const energyLevel = energy?.energy_level || 'medium';
    const suggestedTasks = tasks.filter(t => {
        if (energyLevel === 'low') return t.energy_level === 'low';
        if (energyLevel === 'medium') return t.energy_level !== 'high';
        return true;
    });

    return (
        <div className="min-h-full bg-gradient-to-br from-orange-50 via-emerald-50 to-orange-100 pb-6 relative overflow-hidden">
            {/* Ambient Backgrounds */}
            <div className="absolute top-[-5%] right-[-10%] w-80 h-80 bg-orange-300/20 rounded-full mix-blend-multiply filter blur-[80px] animate-pulse"></div>
            <div className="absolute bottom-[20%] left-[-10%] w-72 h-72 bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-[80px] animate-pulse animation-delay-2000"></div>

            <div className="p-5 space-y-5 relative z-10 max-w-lg mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mt-4">
                    <div>
                        <h1 className="text-3xl font-serif text-stone-800 tracking-tight">My Day</h1>
                        <p className="text-stone-500 text-xs font-medium mt-0.5">
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </p>
                    </div>
                    <div className="flex gap-2 items-center">
                        {/* Energy Gauge - compact */}
                        {!energyLoading && energy && (
                            <EnergyGauge score={energy.total_score} size="sm" showLabel={false} />
                        )}
                        <div className="w-10 h-10 bg-white/60 shadow-glass-inset backdrop-blur-md rounded-full flex items-center justify-center text-stone-700 cursor-pointer border border-white/80 hover:bg-white/80 transition-all active:scale-95" onClick={() => navigate('notifications')}>
                            <Bell className="w-4 h-4" />
                        </div>
                        <div className="w-10 h-10 bg-white/60 shadow-glass-inset backdrop-blur-md rounded-full flex items-center justify-center text-stone-700 cursor-pointer border border-white/80 hover:bg-white/80 transition-all active:scale-95" onClick={() => navigate('settings')}>
                            <User className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                {/* Energy Score Banner (when data available) */}
                {!energyLoading && energy && (
                    <div className={`rounded-2xl p-4 flex items-center gap-4 border transition-all ${energy.energy_level === 'high' ? 'bg-emerald-50/80 border-emerald-200/60' :
                        energy.energy_level === 'medium' ? 'bg-amber-50/80 border-amber-200/60' :
                            'bg-red-50/80 border-red-200/60'
                        }`}>
                        <EnergyGauge score={energy.total_score} size="md" />
                        <div className="flex-1">
                            <p className="text-stone-700 text-sm font-semibold">
                                {energy.energy_level === 'high' ? 'Boa energia hoje!' :
                                    energy.energy_level === 'medium' ? 'Energia moderada' :
                                        'Dia para pegar leve'}
                            </p>
                            <p className="text-stone-500 text-xs mt-1">
                                {energy.energy_level === 'low'
                                    ? 'Foque em autocuidado e tarefas leves.'
                                    : energy.energy_level === 'high'
                                        ? 'Bom momento para avançar em metas importantes.'
                                        : 'Equilibre produtividade com pausas.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Quick Mood Entry */}
                <div className="glass-card-chic rounded-2xl p-3 flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Como você está se sentindo agora?"
                        value={quickMoodText}
                        onChange={(e) => setQuickMoodText(e.target.value)}
                        className="flex-1 bg-transparent text-stone-700 text-sm placeholder:text-stone-400 outline-none px-2"
                    />
                    <button
                        onClick={toggleSpeechToText}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${isListening
                            ? 'bg-red-100 text-red-600 animate-pulse'
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                            }`}
                    >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                </div>

                {/* Compact Check-in — 3×3 emoji grid */}
                <div className="glass-card-chic rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-serif text-base tracking-tight text-stone-800">
                            {todayCheckInCount > 0 ? `Check-in (${todayCheckInCount}x hoje)` : 'Check-in'}
                        </h2>
                        {todayCheckInCount > 0 && (
                            <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Último: {lastCheckInEmoji}
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {MOODS.map((mood) => (
                            <button
                                key={mood.key}
                                onClick={() => handleCheckIn(mood.key)}
                                className="flex flex-col items-center rounded-xl p-2 gap-1 bg-white/50 hover:bg-white/80 border border-white/60 transition-all active:scale-95 group"
                            >
                                <span className="text-xl group-hover:scale-110 transition-transform">{mood.emoji}</span>
                                <span className="text-[10px] font-medium text-stone-600">{mood.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Focus Session - compact 80x80 card */}
                <div
                    className="bg-gradient-to-br from-emerald-500/80 to-teal-600/80 backdrop-blur-md shadow-md rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg transition-all group active:scale-[0.98]"
                    onClick={() => navigate('focus')}
                >
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6 text-white/80" />
                    </div>
                    <div className="flex-1">
                        <h2 className="font-serif text-lg text-white tracking-tight">Focus Session</h2>
                        <p className="text-emerald-50 text-xs opacity-80">Deep work and breathing</p>
                    </div>
                    <button className="bg-white/90 text-emerald-900 px-4 py-2 rounded-full font-semibold text-xs shadow-sm transition-transform active:scale-95">
                        Start
                    </button>
                </div>

                {/* Today's Suggestions (Energy-driven) */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-serif text-xl tracking-tight text-stone-800">Sugestões de Hoje</h2>
                            <p className="text-stone-500 text-xs font-medium">
                                {energy ? `Baseado na sua energia (${energy.total_score}/100)` : 'Tarefas para hoje'}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('tasks')}
                            className="text-xs text-emerald-600 font-semibold hover:underline"
                        >
                            Ver todas
                        </button>
                    </div>

                    <div className="space-y-2.5">
                        {loading ? (
                            <div className="space-y-2.5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-14 bg-white/40 rounded-2xl animate-pulse"></div>
                                ))}
                            </div>
                        ) : suggestedTasks.length > 0 ? (
                            suggestedTasks.slice(0, 4).map((task) => (
                                <div key={task.id} className="glass-card-chic rounded-2xl p-3.5 px-4 flex justify-between items-center group hover:bg-white/60 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full shadow-inner-sm ${task.energy_level === 'high' ? 'bg-rose-400' :
                                            task.energy_level === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
                                            }`}></div>
                                        <span className="text-stone-700 font-medium text-sm">{task.title}</span>
                                    </div>
                                    <button
                                        title={`Mark ${task.title} as completed`}
                                        className="w-7 h-7 rounded-full bg-white/50 border border-stone-200/50 flex items-center justify-center shadow-sm cursor-pointer hover:bg-emerald-400 hover:border-emerald-500 transition-all active:scale-90 group/btn"
                                        onClick={() => toggleTask(task.id)}
                                    >
                                        <CheckCircle2 className="w-4 h-4 text-stone-400 group-hover/btn:text-white transition-colors" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 glass-card-chic rounded-2xl border-dashed border-2 border-white/40">
                                <p className="text-stone-500 font-medium text-sm">Sem tarefas pendentes. Respire fundo! ✨</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
