import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Check, Bell, Mic } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useEnergyScore } from '../lib/useEnergyScore';
import { EnergyGauge } from '../components/EnergyGauge';
import { showToast } from '../components/Toast';
import type { Task } from '../components/TaskEditModal';
import { TaskEditModal } from '../components/TaskEditModal';
import { EnergyHistoryStrip } from '../components/EnergyHistoryStrip';
import { DayTimeline } from '../components/DayTimeline';
import type { TimelineBlock } from '../components/DayTimeline';

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
    const { t } = useTranslation();
    const { user, profile } = useAuth();
    const { energy, loading: energyLoading, recalculate } = useEnergyScore();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [todayCheckInCount, setTodayCheckInCount] = useState(0);
    const [lastCheckInEmoji, setLastCheckInEmoji] = useState<string | null>(null);
    const [quickMoodText, setQuickMoodText] = useState('');
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [exerciseHistory, setExerciseHistory] = useState<any[]>([]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    const fetchTasks = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .is('is_completed', false)
            .order('priority', { ascending: true })
            .limit(5);

        if (data) setTasks(data);
    };

    const getCyclePhaseForDate = (date: Date) => {
        if (!profile?.last_period_start || !profile?.tracks_cycle) return null;
        const lastPeriod = new Date(profile.last_period_start);
        const cycleLength = profile.cycle_length || 28;
        const daysDiff = Math.floor((date.getTime() - lastPeriod.getTime()) / (1000 * 3600 * 24));
        const dayInCycle = ((daysDiff % cycleLength) + cycleLength) % cycleLength;

        if (dayInCycle < 5) return 'menstrual';
        if (dayInCycle < 13) return 'folicular';
        if (dayInCycle < 16) return 'ovulatoria';
        return 'luteal';
    };

    const phaseLabels: Record<string, { icon: string; label: string; color: string; desc: string }> = {
        menstrual: { icon: '🌙', label: 'Menstrual', color: 'text-rose-600 bg-rose-50 border-rose-200', desc: 'Energia mais baixa. Descanse.' },
        folicular: { icon: '🌱', label: 'Folicular', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', desc: 'Energia subindo!' },
        ovulatoria: { icon: '☀️', label: 'Ovulação', color: 'text-amber-600 bg-amber-50 border-amber-200', desc: 'Pico de energia.' },
        luteal: { icon: '🍂', label: 'Lútea', color: 'text-purple-600 bg-purple-50 border-purple-200', desc: 'Energia caindo. Foco.' },
    };

    useEffect(() => {
        if (!user) return;

        const doFetchTasks = async () => {
            await fetchTasks();
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

        const fetchExercises = async () => {
            const todayStr = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('exercise_history')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', todayStr);
            if (data) setExerciseHistory(data);
        };

        doFetchTasks();
        fetchCheckIns();
        fetchExercises();
    }, [user]);

    const handleCheckIn = async (moodKey: string) => {
        if (!user) return;

        setSelectedEmoji(moodKey);
        setTimeout(() => setSelectedEmoji(null), 2000);

        const mood = MOODS.find(m => m.key === moodKey);
        // If we are submitting a text-only mood with no explicit emoji selected yet, default to neutral
        const emojiToSave = mood ? mood.emoji : '😐';
        const scoreToSave = mood ? energyScoreMap[moodKey] || 5 : 5;

        const { error } = await supabase
            .from('check_ins')
            .insert([{
                user_id: user.id,
                humor_emoji: emojiToSave,
                energy_score: scoreToSave,
                free_text: quickMoodText || null,
                checked_at: new Date().toISOString(),
            }]);

        if (!error) {
            setTodayCheckInCount(prev => prev + 1);
            setLastCheckInEmoji(emojiToSave);
            setQuickMoodText('');
            showToast(t('home.checkin_saved'));

            // Recalculate energy score after new check-in
            recalculate();

            // Trigger Edge Function to analyze check-in
            if (quickMoodText.trim()) {
                supabase.functions.invoke('process-checkin', {
                    body: {
                        user_id: user.id,
                        text: quickMoodText,
                        humor_emoji: mood?.value || 'neutral',
                        energy_score: energyScoreMap[moodKey] || 5,
                    }
                });
            } else {
                supabase.functions.invoke('process-checkin', {
                    body: {
                        user_id: user.id,
                        humor_emoji: mood?.value || 'neutral',
                        energy_score: energyScoreMap[moodKey] || 5,
                    }
                });
            }
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

    const processQuickText = async () => {
        if (!user || !quickMoodText.trim()) return;

        const currentText = quickMoodText;
        setQuickMoodText('');
        showToast('Analisando intenção...');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const resp = await supabase.functions.invoke('voice-intent-parser', {
                body: { user_id: user.id, transcript: currentText }
            });

            if (resp.error) throw resp.error;

            const result = resp.data;

            if (result.intent === 'mood') {
                setTodayCheckInCount(prev => prev + 1);
                setLastCheckInEmoji(result.emoji || '😐');
                recalculate();

                if (currentText.trim()) {
                    supabase.functions.invoke('process-checkin', {
                        body: {
                            user_id: user.id,
                            text: currentText,
                            humor_emoji: result.emoji || 'neutral',
                            energy_score: 5,
                        }
                    });
                }
            } else if (result.intent === 'task' || result.intent === 'event') {
                showToast(`${result.intent === 'task' ? 'Tarefa' : 'Evento'} criado com sucesso!`);
                fetchTasks();
            } else {
                showToast('Ação registrada com sucesso.');
            }
        } catch (e) {
            console.error('Intent parser failed:', e);
            showToast('Erro ao processar o texto');
        }
    };

    const loadAISuggestions = async () => {
        if (!user || !energy) return;
        setLoadingSuggestions(true);
        const phase = getCyclePhaseForDate(new Date());
        const phaseName = phase ? phaseLabels[phase].label : 'desconhecida';

        try {
            const { data } = await supabase.functions.invoke('chat-ai', {
                body: {
                    message: `Gere 3 sugestões de tarefas/ações ultraconcretas e curtas (array JSON: [{"title": "Ex: Caminhar 10 min", "energy_level": "low|medium|high", "priority": 1}]) baseadas na energia de hoje (${energy.total_score}/100, nível ${energyLevel}) e fase do ciclo ${phaseName}. NENHUM TEXTO ADICIONAL. APENAS O JSON.`,
                    history: []
                }
            });
            if (data?.analysis) {
                const jsonMatch = data.analysis.match(/\[[\s\S]*?\]/);
                if (jsonMatch) {
                    setAiSuggestions(JSON.parse(jsonMatch[0]));
                }
            }
        } catch (e) { console.error('AI suggestions error', e); }
        setLoadingSuggestions(false);
    };

    const addSuggestedTask = async (sug: any, index: number) => {
        if (!user) return;
        const newTask = {
            user_id: user.id,
            title: sug.title,
            energy_level: sug.energy_level || 'medium',
            priority: sug.priority || 3,
            due_date: new Date().toISOString().split('T')[0],
            is_completed: false,
            subtasks: [],
            is_ai_suggested: true,
            ai_insight: "Sugestão baseada no seu estado atual",
        };

        const { error } = await supabase.from('tasks').insert([newTask]);
        if (!error) {
            setAiSuggestions(prev => prev.filter((_, idx) => idx !== index));
            fetchTasks();
            showToast('Tarefa adicionada!');
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
        recognition.interimResults = true;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: Record<string, any>) => {
            const transcript = Array.from(event.results as Iterable<any>)
                .map((r: any) => r[0].transcript)
                .join(' ');
            setQuickMoodText(transcript);
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

    const currentPhase = getCyclePhaseForDate(new Date());

    const buildTimelineBlocks = (): TimelineBlock[] => {
        const blocks: TimelineBlock[] = [];

        // Add tasks
        suggestedTasks.slice(0, 3).forEach(task => {
            blocks.push({
                id: task.id,
                label: 'Tarefa',
                start: task.due_time || '10:00', // fallback time
                end: '',
                type: 'task',
                title: task.title,
                is_completed: task.is_completed,
                onClick: () => setEditingTask(task as Task),
                onToggle: () => toggleTask(task.id)
            });
        });

        // Add exercise
        const todayExercise = exerciseHistory[0];
        if (todayExercise) {
            blocks.push({
                id: todayExercise.id || 'exercise-1',
                label: 'Exercício',
                start: '18:00', // default evening exercise
                end: '',
                type: 'exercise',
                title: todayExercise.exercise_type || 'Plano de Exercício',
                is_completed: todayExercise.completed,
                onClick: () => navigate('exercises')
            });
        }

        // Add focus session
        blocks.push({
            id: 'focus-1',
            label: 'Foco Profundo',
            start: '14:00',
            end: '15:00',
            type: 'focus',
            title: 'Sessão de Foco Profundo',
            onClick: () => navigate('focus')
        });

        return blocks;
    };

    const timelineBlocks = buildTimelineBlocks();

    return (
        <div className={`min-h-full bg-gradient-to-br ${energyLevel === 'high' ? 'from-emerald-50 via-emerald-50/50' : energyLevel === 'low' ? 'from-red-50 via-red-50/50' : 'from-orange-50 via-amber-50'} to-white pb-6 relative overflow-hidden transition-colors duration-1000`}>
            {/* Ambient Backgrounds */}
            <div className={`absolute top-[-5%] right-[-10%] w-80 h-80 rounded-full mix-blend-multiply filter blur-[80px] animate-pulse ${energyLevel === 'high' ? 'bg-emerald-300/20' : energyLevel === 'low' ? 'bg-red-300/20' : 'bg-orange-300/20'}`}></div>
            <div className={`absolute bottom-[20%] left-[-10%] w-72 h-72 rounded-full mix-blend-multiply filter blur-[80px] animate-pulse animation-delay-2000 ${energyLevel === 'high' ? 'bg-teal-300/20' : energyLevel === 'low' ? 'bg-rose-300/20' : 'bg-amber-300/20'}`}></div>

            <div className="p-4 space-y-4 relative z-10 max-w-lg mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mt-4">
                    <div>
                        <h1 className="text-3xl font-serif text-stone-800 tracking-tight">{t('home.my_day')}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-stone-500 text-xs font-medium">
                                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </p>
                            {currentPhase && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${phaseLabels[currentPhase].color}`}>
                                    <span className="text-xs">{phaseLabels[currentPhase].icon}</span> Fase {phaseLabels[currentPhase].label}
                                </span>
                            )}
                        </div>
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
                                {energy.energy_level === 'high' ? t('home.energy_high') :
                                    energy.energy_level === 'medium' ? t('home.energy_medium') :
                                        t('home.energy_low')}
                            </p>
                            <p className="text-stone-500 text-xs mt-1">
                                {energy.energy_level === 'low'
                                    ? t('home.energy_low_desc')
                                    : energy.energy_level === 'high'
                                        ? t('home.energy_high_desc')
                                        : t('home.energy_medium_desc')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Energy History Strip */}
                <EnergyHistoryStrip />

                {/* Quick Mood Entry */}
                <form
                    onSubmit={e => { e.preventDefault(); processQuickText(); }}
                    className="relative group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-3xl blur-md transition-all group-hover:blur-lg opacity-50"></div>
                    <div className="relative glass-card-chic rounded-3xl p-2 flex items-center gap-2 transition-all border border-white/80 focus-within:border-emerald-300 shadow-sm focus-within:shadow-md">
                        <input
                            type="text"
                            placeholder={t('home.quick_mood_placeholder')}
                            value={quickMoodText}
                            onChange={(e) => setQuickMoodText(e.target.value)}
                            aria-label={t('home.quick_mood_placeholder')}
                            className="flex-1 bg-transparent text-stone-700 text-[15px] placeholder:text-stone-400/80 outline-none px-4 py-2 font-medium"
                        />
                        <div className="flex shrink-0 items-center pr-1 gap-1">
                            <button
                                type="button"
                                onClick={toggleSpeechToText}
                                title="Ditar"
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isListening
                                    ? 'bg-rose-100 text-rose-500 shadow-inner-sm'
                                    : 'bg-white/60 text-stone-500 hover:bg-white hover:text-emerald-600 border border-transparent hover:border-white/80 shadow-sm'
                                    }`}
                            >
                                {isListening ? (
                                    <div className="flex items-center gap-0.5">
                                        <div className="w-1 h-3 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1 h-4 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                                        <div className="w-1 h-3 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                    </div>
                                ) : <Mic className="w-5 h-5" />}
                            </button>
                            <button
                                type="submit"
                                disabled={!quickMoodText.trim()}
                                title="Enviar nota"
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${!quickMoodText.trim() ? 'bg-stone-100/50 text-stone-300' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md hover:-translate-y-0.5'}`}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            </button>
                        </div>
                    </div>

                    {/* Inline emojis for text input */}
                    {quickMoodText && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                            <p className="text-xs text-stone-500 w-full mb-1">Deseja adicionar uma emoção?</p>
                            {MOODS.slice(0, 4).map(m => (
                                <button
                                    key={m.key}
                                    type="button"
                                    onClick={() => handleCheckIn(m.key)}
                                    className="px-3 py-1.5 bg-white/70 hover:bg-white border border-white/60 hover:border-emerald-200 rounded-xl text-xs font-semibold text-stone-700 flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                                >
                                    <span>{m.emoji}</span> Enviar
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Listening feedback */}
                    {isListening && (
                        <p className="text-xs text-rose-500 animate-pulse mt-2 font-medium">
                            🎙️ Escutando... Fale agora
                        </p>
                    )}
                </form>

                {/* Compact Check-in — 3×3 emoji grid */}
                <div className="glass-card-chic rounded-[1.5rem] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-serif text-base tracking-tight text-stone-800 flex items-center gap-2">
                            {t('home.mood_board')}
                            {todayCheckInCount > 0 && <span className="text-emerald-600 text-xs font-bold bg-emerald-100/50 px-2 py-0.5 rounded-full">{todayCheckInCount} check-in{todayCheckInCount > 1 ? 's' : ''} hoje</span>}
                        </h2>
                        {todayCheckInCount > 0 && (
                            <div className="bg-emerald-100/50 border border-emerald-200/50 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-inner-sm">
                                <span className="text-lg leading-none">{lastCheckInEmoji}</span>
                                <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {MOODS.map((mood) => (
                            <button
                                key={mood.key}
                                onClick={() => handleCheckIn(mood.key)}
                                className={`relative overflow-hidden flex flex-col items-center justify-center rounded-xl py-2 gap-1 bg-gradient-to-b border transition-all active:scale-[0.97] group shadow-sm hover:shadow-md
                                    ${selectedEmoji === mood.key ? 'from-emerald-50/50 to-emerald-100/50 scale-110 ring-4 ring-emerald-400/30 border-emerald-300' : 'from-white/70 to-white/40 hover:from-white hover:to-white/80 border-white/60'}
                                `}
                            >
                                <span className="text-2xl group-hover:scale-110 group-hover:-translate-y-0.5 transition-transform duration-300 drop-shadow-sm">{mood.emoji}</span>
                                <span className="text-[10px] font-medium text-stone-600/90 tracking-wide">{mood.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <DayTimeline blocks={timelineBlocks} />

                {/* AI Suggestions Block */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-serif text-xl tracking-tight text-stone-800 flex items-center gap-2">Dicas da IA <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-bold">BETA</span></h2>
                            <p className="text-stone-500 text-xs font-medium">Ações concretas baseadas na sua energia.</p>
                        </div>
                        <button onClick={loadAISuggestions} disabled={loadingSuggestions} className="text-xs text-purple-600 font-semibold bg-purple-50 px-3 py-1.5 rounded-full hover:bg-purple-100 disabled:opacity-50 transition-colors">
                            {loadingSuggestions ? 'Gerando...' : 'Gerar Novas'}
                        </button>
                    </div>

                    {aiSuggestions.length > 0 ? (
                        <div className="space-y-2">
                            {aiSuggestions.map((sug, i) => (
                                <div key={i} className="glass-card-chic rounded-xl p-3 border border-purple-100 flex justify-between items-center bg-purple-50/40 shadow-sm">
                                    <div>
                                        <p className="text-sm font-medium text-stone-800">{sug.title}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => addSuggestedTask(sug, i)} className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-2.5 py-1.5 rounded-lg font-bold transition-all active:scale-95">Aceitar</button>
                                        <button onClick={() => setAiSuggestions(prev => prev.filter((_, idx) => idx !== i))} className="text-xs bg-stone-100 text-stone-500 hover:bg-stone-200 px-2.5 py-1.5 rounded-lg font-bold transition-all active:scale-95">Ignorar</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-5 glass-card-chic rounded-2xl border-dashed border-2 border-white/40">
                            <p className="text-sm text-stone-500 px-6">Nenhuma dica gerada ainda. Toque em "Gerar Novas" para receber sugestões de acordo com o seu momento.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editingTask && (
                <TaskEditModal
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                    onSave={(updatedTask) => setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t))}
                />
            )}
        </div>
    );
};
