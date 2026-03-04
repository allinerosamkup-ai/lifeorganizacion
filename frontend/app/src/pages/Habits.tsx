import { useState, useEffect } from 'react';
import { Plus, Flame, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { format, subDays, parseISO } from 'date-fns';
import { showToast } from '../components/Toast';

interface Habit {
    id: string;
    title: string;
    emoji: string;
    color: string;
    frequency: string;
}

interface HabitCompletion {
    habit_id: string;
    completed_date: string;
}

const AddHabitModal = ({ onClose, onSave }: { onClose: () => void, onSave: (title: string, emoji: string) => void }) => {
    const [title, setTitle] = useState('');
    const [emoji, setEmoji] = useState('⭐');

    return (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl p-6 pb-10 shadow-2xl overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif text-xl text-stone-800">Novo Hábito</h3>
                    <button onClick={onClose} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-full">✕</button>
                </div>
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <input title="Emoji" value={emoji} onChange={e => setEmoji(e.target.value)} className="w-16 text-center text-2xl bg-stone-100 rounded-xl" maxLength={2} />
                        <input title="Nome do hábito" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome do hábito" className="flex-1 bg-stone-100 rounded-xl px-4 outline-none focus:ring-2 focus:ring-purple-300/50" />
                    </div>
                </div>
                <button onClick={() => onSave(title, emoji)} disabled={!title.trim()} className="mt-6 w-full bg-purple-500 hover:bg-purple-600 transition-all active:scale-[0.98] text-white rounded-xl py-4 font-bold disabled:opacity-50">
                    Criar Hábito
                </button>
            </div>
        </div>
    );
};

export const Habits = ({ navigate }: { navigate?: (v: string) => void }) => {
    if (navigate) { /* skip */ }
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [completions, setCompletions] = useState<HabitCompletion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchHabits = async () => {
        if (!user) return;
        const { data: hData } = await supabase.from('habits').select('*').eq('user_id', user.id).eq('is_active', true);
        if (hData) setHabits(hData);

        const { data: cData } = await supabase.from('habit_completions').select('habit_id, completed_date').eq('user_id', user.id);
        if (cData) setCompletions(cData);
        setLoading(false);
    };

    useEffect(() => {
        // eslint-disable-next-line
        fetchHabits();
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    const computeStreak = (comps: string[]): number => {
        const sorted = [...comps].sort().reverse();
        const today = format(new Date(), 'yyyy-MM-dd');
        const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        let streak = 0;
        let checkDate = sorted.includes(today) ? today : yesterday;
        for (const d of sorted) {
            if (d === checkDate) {
                streak++;
                checkDate = format(subDays(parseISO(checkDate), 1), 'yyyy-MM-dd');
            } else break;
        }
        return streak;
    };

    const toggleHabit = async (habitId: string, isCompletedToday: boolean) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        if (isCompletedToday) {
            const { error } = await supabase.from('habit_completions')
                .delete().eq('habit_id', habitId).eq('completed_date', today);
            if (!error) {
                setCompletions(completions.filter(c => !(c.habit_id === habitId && c.completed_date === today)));
            }
        } else {
            const { error } = await supabase.from('habit_completions')
                .insert({ habit_id: habitId, user_id: user?.id, completed_date: today });
            if (!error) {
                setCompletions([...completions, { habit_id: habitId, completed_date: today }]);
                showToast('Hábito registrado! 🔥', 'success');
            }
        }
    };

    const saveHabit = async (title: string, emoji: string) => {
        const { data, error } = await supabase.from('habits').insert({
            user_id: user?.id,
            title,
            emoji,
        }).select().single();
        if (data && !error) {
            setHabits([...habits, data]);
            setShowAddModal(false);
            showToast('Hábito criado!', 'success');
        }
    };

    const today = format(new Date(), 'yyyy-MM-dd');

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 pb-24 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-[80px]" />

            <div className="p-6 space-y-6 relative z-10 max-w-lg mx-auto">
                <div className="flex justify-between items-center mt-4">
                    <div>
                        <h1 className="text-4xl font-serif text-stone-800 tracking-tight">Meus Hábitos</h1>
                        <p className="text-stone-500 text-sm font-medium mt-1">Construa rotinas poderosas</p>
                    </div>
                    <button
                        title="Adicionar Hábito"
                        onClick={() => setShowAddModal(true)}
                        className="w-12 h-12 bg-white/60 shadow-glass-inset backdrop-blur-md rounded-full flex items-center justify-center text-purple-600 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                {loading ? (
                    [1, 2].map(i => (
                        <div key={i} className="glass-card-chic rounded-3xl p-5 animate-pulse">
                            <div className="h-4 bg-stone-200/60 rounded-xl w-3/4 mb-3" />
                            <div className="h-3 bg-stone-100/60 rounded-xl w-1/2" />
                        </div>
                    ))
                ) : habits.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center">
                        <Sparkles className="w-16 h-16 text-purple-300 mb-4" />
                        <p className="font-serif text-xl tracking-tight text-stone-800 mb-1">Construa hábitos poderosos ✨</p>
                        <button onClick={() => setShowAddModal(true)} className="mt-4 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full font-semibold shadow-md active:scale-95 transition-all">
                            Criar meu primeiro hábito
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {habits.map(habit => {
                            const habitCompletions = completions.filter(c => c.habit_id === habit.id).map(c => c.completed_date);
                            const streak = computeStreak(habitCompletions);
                            const isDoneToday = habitCompletions.includes(today);

                            return (
                                <div key={habit.id} className={`glass-card-chic rounded-3xl p-5 flex items-center gap-4 transition-all ${isDoneToday ? 'opacity-80' : ''}`}>
                                    <button
                                        onClick={() => toggleHabit(habit.id, isDoneToday)}
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-transform active:scale-90 ${isDoneToday ? 'bg-purple-100 shadow-inner' : 'bg-white hover:bg-stone-50'}`}
                                    >
                                        {habit.emoji}
                                    </button>
                                    <div className="flex-1">
                                        <h3 className={`font-semibold ${isDoneToday ? 'text-stone-500 line-through' : 'text-stone-800'}`}>{habit.title}</h3>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Flame className={`w-4 h-4 ${streak > 0 ? 'text-orange-500' : 'text-stone-300'}`} />
                                            <span className={`text-xs font-bold ${streak > 0 ? 'text-orange-600' : 'text-stone-400'}`}>{streak} dias seguidos</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {showAddModal && <AddHabitModal onClose={() => setShowAddModal(false)} onSave={saveHabit} />}
        </div>
    );
};
