import { useState, useEffect } from 'react';
import { Bell, Brain, ChevronRight, Droplet, HelpCircle, Lock, Sparkles, User, LogOut, Flame, CheckCircle2, Activity } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { subDays, format } from 'date-fns';

const HABIT_LABELS: Record<string, { label: string; emoji: string }> = {
    skincare: { label: 'Skincare', emoji: '✨' },
    journaling: { label: 'Journaling', emoji: '📓' },
    meditation: { label: 'Meditação', emoji: '🧘' },
    hydration: { label: 'Hidratação', emoji: '💧' },
    focus: { label: 'Foco', emoji: '🎯' },
    sleep: { label: 'Sono', emoji: '🌙' },
};

interface StreakData {
    habit: string;
    streak: number;
    completedToday: boolean;
}

export const Profile = () => {
    const { user, profile, signOut } = useAuth();
    const [streaks, setStreaks] = useState<StreakData[]>([]);
    const [weeklyStats, setWeeklyStats] = useState({ focusHours: 0, checkInStreak: 0, highEnergyDays: 0 });
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchAll = async () => {
            setStatsLoading(true);
            const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
            const weekAgoStr = format(subDays(new Date(), 7), 'yyyy-MM-dd');

            // Check-in streak
            const { data: checkInData } = await supabase
                .from('check_ins')
                .select('date, energy_score')
                .eq('user_id', user.id)
                .gte('date', thirtyDaysAgo)
                .order('date', { ascending: false });

            let streak = 0;
            const today = new Date();
            for (let i = 0; i < 30; i++) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const found = checkInData?.some(c => c.date === dateStr);
                if (found) streak++;
                else break;
            }

            const highEnergyDays = checkInData?.filter(c => (c.energy_score as number) >= 7).length || 0;

            // Focus hours
            const { data: sessions } = await supabase
                .from('focus_sessions')
                .select('duration_minutes')
                .eq('user_id', user.id)
                .eq('completed', true)
                .gte('started_at', weekAgoStr);
            const totalMinutes = sessions?.reduce((sum, s) => sum + ((s.duration_minutes as number) || 0), 0) || 0;
            const focusHours = Math.round((totalMinutes / 60) * 10) / 10;

            // Check-ins this week
            const { count } = await supabase
                .from('check_ins')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('date', weekAgoStr);

            setWeeklyStats({ focusHours, checkInStreak: count || 0, highEnergyDays });

            // Habit streaks
            if (profile?.cognitive_preference?.length) {
                const habits = (profile.cognitive_preference as string[]).slice(0, 4);
                const streakData: StreakData[] = habits.map((habit: string, idx: number) => ({
                    habit,
                    streak: Math.max(0, streak - idx),
                    completedToday: streak > 0,
                }));
                setStreaks(streakData);
            }

            setStatsLoading(false);
        };
        fetchAll();
    }, [user, profile?.cognitive_preference]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-100 pb-24 relative overflow-hidden">
            <div className="absolute top-[-5%] left-[-10%] w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" />
            <div className="absolute bottom-[20%] right-[-10%] w-72 h-72 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse animation-delay-2000" />

            <div className="p-6 space-y-6 max-w-lg mx-auto relative z-10">
                <div className="text-center mt-8 mb-6 relative">
                    <Sparkles className="absolute -top-2 left-6 w-6 h-6 text-orange-400 opacity-60 animate-pulse" />
                    <Sparkles className="absolute top-8 right-6 w-4 h-4 text-pink-400 opacity-40 animate-pulse animation-delay-2000" />
                    <h1 className="text-2xl font-serif text-stone-900 drop-shadow-sm">LifeOrganizer AI</h1>
                    <h2 className="text-4xl font-serif text-stone-800 tracking-tight mt-1">Perfil</h2>
                </div>

                {/* Avatar Card */}
                <div className="glass-card-chic rounded-[2rem] p-8 shadow-3d space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 blur-3xl rounded-full" />
                    <div className="flex justify-center flex-col items-center gap-4 text-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full blur-md opacity-40" />
                            <img
                                src={user?.user_metadata?.avatar_url || "https://picsum.photos/seed/victoria/200/200"}
                                alt={user?.user_metadata?.full_name || "Profile"}
                                className="w-24 h-24 rounded-full object-cover border-[3px] border-white shadow-md relative z-10"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                        <h3 className="text-3xl font-serif text-stone-800 tracking-tight">{profile?.full_name || user?.user_metadata?.full_name || "Você"}</h3>
                        <p className="text-stone-500 text-sm font-medium">{user?.email}</p>
                    </div>
                </div>

                {/* Weekly Stats */}
                <div className="pt-2">
                    <h4 className="font-serif text-xl tracking-tight text-stone-800 mb-4 px-2">Esta Semana</h4>
                    {statsLoading ? (
                        <div className="grid grid-cols-3 gap-3 animate-pulse">
                            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-white/40 rounded-2xl" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gradient-to-br from-emerald-100/80 to-teal-50/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 shadow-inner-sm border border-white/60">
                                <Brain className="w-6 h-6 text-emerald-600" />
                                <span className="text-2xl font-serif text-stone-800">{weeklyStats.focusHours || '—'}</span>
                                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Horas Foco</span>
                            </div>
                            <div className="bg-gradient-to-br from-orange-100/80 to-amber-50/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 shadow-inner-sm border border-white/60">
                                <Flame className="w-6 h-6 text-orange-500" />
                                <span className="text-2xl font-serif text-stone-800">{weeklyStats.checkInStreak}</span>
                                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Check-ins</span>
                            </div>
                            <div className="bg-gradient-to-br from-purple-100/80 to-pink-50/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 shadow-inner-sm border border-white/60">
                                <Activity className="w-6 h-6 text-purple-500" />
                                <span className="text-2xl font-serif text-stone-800">{weeklyStats.highEnergyDays}</span>
                                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Alta<br />Energia</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Cycle Status */}
                {profile?.last_period_start && (
                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-4 flex items-center gap-4 border border-rose-100/60 shadow-sm">
                        <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-lg">🌙</div>
                        <div>
                            <p className="text-sm font-semibold text-stone-700">Ciclo ativo</p>
                            <p className="text-xs text-stone-400">Último período: {new Date(profile.last_period_start).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <Droplet className="w-4 h-4 text-rose-400 ml-auto" />
                    </div>
                )}

                {/* Habit Streaks */}
                {streaks.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-serif text-xl tracking-tight text-stone-800 px-2">Seus Hábitos</h4>
                        <div className="space-y-2">
                            {streaks.map(({ habit, streak, completedToday }) => {
                                const info = HABIT_LABELS[habit] || { label: habit, emoji: '⭐' };
                                return (
                                    <div key={habit} className="flex items-center justify-between bg-white/50 border border-white/60 rounded-2xl p-4 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{info.emoji}</span>
                                            <div>
                                                <p className="text-sm font-semibold text-stone-700">{info.label}</p>
                                                <p className="text-xs text-stone-400">{streak} dia{streak !== 1 ? 's' : ''} seguido{streak !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {streak >= 3 && (
                                                <div className="flex items-center gap-1 text-orange-500 text-xs font-bold">
                                                    <Flame className="w-4 h-4" /> {streak}
                                                </div>
                                            )}
                                            {completedToday
                                                ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                : <div className="w-5 h-5 rounded-full border-2 border-stone-200" />
                                            }
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* AI Usage Gauge */}
                <div className="flex flex-col items-center justify-center py-6 glass-card-chic rounded-3xl shadow-3d border border-white/40 relative">
                    <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl" />
                    <div className="relative w-36 h-36 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#f3e8ff" strokeWidth="8" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="url(#gradient)" strokeWidth="8" strokeDasharray="283" strokeDashoffset="150" strokeLinecap="round" />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#f472b6" />
                                    <stop offset="100%" stopColor="#d946ef" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-serif tracking-tight text-stone-800">45<span className="text-sm text-stone-400">/100</span></span>
                        </div>
                    </div>
                    <p className="text-sm font-semibold text-stone-600 mt-4 flex items-center gap-2 bg-white/50 px-4 py-1.5 rounded-full shadow-inner-sm">
                        AI Messages Used <Sparkles className="w-4 h-4 text-orange-400" />
                    </p>
                </div>

                {/* Upgrade Banner */}
                <div className="bg-gradient-to-br from-pink-400 to-purple-500 rounded-3xl p-7 text-center relative overflow-hidden shadow-3d text-white group cursor-pointer hover:shadow-glow transition-all">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Sparkles className="absolute top-6 right-6 w-6 h-6 text-white/50 animate-pulse" />
                    <Sparkles className="absolute bottom-6 left-6 w-5 h-5 text-white/40 animate-pulse animation-delay-2000" />
                    <h4 className="font-serif text-2xl tracking-tight mb-2 relative z-10">Unlock Potential</h4>
                    <p className="text-sm text-white/80 font-medium mb-6 relative z-10">IA ilimitada e insights avançados</p>
                    <button className="glass-button !text-purple-900 !bg-white/90 hover:!bg-white px-8 py-3 rounded-full font-bold shadow-sm transition-transform active:scale-95 relative z-10 w-full sm:w-auto">
                        Upgrade Now
                    </button>
                </div>

                {/* Settings Menu */}
                <div className="space-y-3 pt-2">
                    {[
                        { icon: <User className="w-5 h-5" />, label: 'Conta' },
                        { icon: <Bell className="w-5 h-5" />, label: 'Notificações' },
                        { icon: <Lock className="w-5 h-5" />, label: 'Privacidade' },
                        { icon: <HelpCircle className="w-5 h-5" />, label: 'Ajuda & Suporte' },
                    ].map((item, i) => (
                        <button type="button" key={i} className="w-full flex items-center justify-between p-4 bg-white/40 hover:bg-white/70 rounded-2xl transition-all cursor-pointer shadow-sm border border-white/50 group">
                            <div className="flex items-center gap-4 text-stone-700">
                                <div className="bg-white/60 p-2 rounded-xl shadow-inner-sm text-stone-500 group-hover:text-purple-500 transition-colors">{item.icon}</div>
                                <span className="font-semibold">{item.label}</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-stone-400" />
                        </button>
                    ))}

                    <button type="button" onClick={signOut}
                        className="w-full flex items-center justify-between p-4 bg-red-50/50 hover:bg-red-100/80 rounded-2xl transition-all cursor-pointer text-red-600 mt-6 border border-red-100 group shadow-sm text-left">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/80 p-2 rounded-xl shadow-inner-sm group-hover:bg-red-200 transition-colors"><LogOut className="w-5 h-5" /></div>
                            <span className="font-bold">Sair</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};
