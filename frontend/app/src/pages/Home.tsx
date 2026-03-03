import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, User, Check, Bell, Mic } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useEnergyScore } from '../lib/useEnergyScore';
import { EnergyGauge } from '../components/EnergyGauge';
import { showToast } from '../components/Toast';
import type { Task } from '../components/TaskEditModal';
import { TaskEditModal } from '../components/TaskEditModal';
import { EnergyHistoryStrip } from '../components/EnergyHistoryStrip';

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
    const { user } = useAuth();
    const { energy, loading: energyLoading, recalculate } = useEnergyScore();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [todayCheckInCount, setTodayCheckInCount] = useState(0);
    const [lastCheckInEmoji, setLastCheckInEmoji] = useState<string | null>(null);
    const [quickMoodText, setQuickMoodText] = useState('');
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
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
                    onSubmit={e => { e.preventDefault(); if (quickMoodText) handleCheckIn('neutral'); }}
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

                {/* Focus Session - elegant compact card */}
                <div
                    className="relative overflow-hidden bg-stone-800 shadow-lg rounded-2xl p-3 flex items-center gap-3 cursor-pointer group active:scale-[0.98] transition-all"
                    onClick={() => navigate('focus')}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>

                    <div className="w-10 h-10 bg-white/10 border border-white/10 rounded-[12px] flex items-center justify-center shrink-0 shadow-inner">
                        <Clock className="w-5 h-5 text-emerald-300" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 relative z-10">
                        <h2 className="font-serif text-base text-white tracking-wide leading-tight">{t('home.focus')}</h2>
                        <p className="text-stone-400 text-[10px] font-medium tracking-wide">{t('home.focus_desc')}</p>
                    </div>
                    <button className="relative z-10 bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all group-hover:bg-emerald-500 group-hover:text-white border border-emerald-500/30">
                        {t('home.focus_start')}
                    </button>
                </div>

                {/* Today's Suggestions (Energy-driven) */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-serif text-xl tracking-tight text-stone-800">{t('home.todays_suggestions')}</h2>
                            <p className="text-stone-500 text-xs font-medium">
                                {energy ? `${t('home.energy_based_on')} (${energy.total_score}/100)` : t('home.tasks_for_today')}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('tasks')}
                            className="text-xs text-emerald-600 font-semibold hover:underline"
                        >
                            {t('home.see_all')}
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
                                <div
                                    key={task.id}
                                    className="glass-card-chic rounded-2xl p-3.5 px-4 flex justify-between items-center group hover:bg-white/60 transition-all cursor-pointer"
                                    onClick={() => setEditingTask(task as Task)}
                                >
                                    <div className="flex items-center gap-3 w-full pr-2 overflow-hidden">
                                        <div className={`w-2 h-2 shrink-0 rounded-full shadow-inner-sm ${task.energy_level === 'high' ? 'bg-rose-400' :
                                            task.energy_level === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
                                            }`}></div>
                                        <span className="text-stone-700 font-medium text-sm truncate">{task.title}</span>
                                    </div>
                                    <button
                                        title={`Mark ${task.title} as completed`}
                                        className="w-7 h-7 shrink-0 rounded-full bg-white/50 border border-stone-200/50 flex items-center justify-center shadow-sm cursor-pointer hover:bg-emerald-400 hover:border-emerald-500 transition-all active:scale-90 group/btn"
                                        onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                                    >
                                        <CheckCircle2 className="w-4 h-4 text-stone-400 group-hover/btn:text-white transition-colors" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 glass-card-chic rounded-2xl border-dashed border-2 border-white/40">
                                <p className="text-stone-500 font-medium text-sm">{t('home.no_tasks')}</p>
                            </div>
                        )}
                    </div>
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
