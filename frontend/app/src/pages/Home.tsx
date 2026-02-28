import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, User, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';


interface Task {
    id: string;
    title: string;
    is_completed: boolean;
    energy_level: 'low' | 'medium' | 'high';
    priority: number;
}

export const Home = ({ navigate }: { navigate: (view: string) => void }) => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkInDone, setCheckInDone] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchTasks = async () => {
            const { data } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .is('is_completed', false)
                .order('priority', { ascending: true });

            if (data) setTasks(data);
            setLoading(false);
        };

        const checkTodayCheckIn = async () => {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('check_ins')
                .select('id')
                .eq('user_id', user.id)
                .eq('date', today)
                .maybeSingle();

            if (data) setCheckInDone(true);
        };

        fetchTasks();
        checkTodayCheckIn();
    }, [user]);

    const handleCheckIn = async (moodType: string) => {
        if (!user || checkInDone) return;

        const moodMap: Record<string, string> = {
            'Feliz': 'great',
            'Normal': 'neutral',
            'Triste': 'low',
            'Irritado': 'bad',
            'Cansado': 'low',
            'Disposto': 'good'
        };

        const energyScoreMap: Record<string, number> = {
            'Feliz': 8,
            'Normal': 5,
            'Triste': 3,
            'Irritado': 4,
            'Cansado': 2,
            'Disposto': 9
        };

        const { error } = await supabase
            .from('check_ins')
            .insert([{
                user_id: user.id,
                humor_emoji: moodMap[moodType] || 'neutral',
                energy_score: energyScoreMap[moodType] || 5
            }]);

        if (!error) {
            setCheckInDone(true);
            // Trigger Edge Function to analyze check-in and generate suggestions
            // Translate back to English internally for the Edge Function if needed by the prompt, or just send raw.
            supabase.functions.invoke('process-checkin', {
                body: { user_id: user.id, humor: moodType }
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
        }
    };

    return (

        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-emerald-50 to-orange-100 pb-24 relative overflow-hidden">
            {/* Ambient Backgrounds */}
            <div className="absolute top-[-5%] right-[-10%] w-80 h-80 bg-orange-300/20 rounded-full mix-blend-multiply filter blur-[80px] animate-pulse"></div>
            <div className="absolute bottom-[20%] left-[-10%] w-72 h-72 bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-[80px] animate-pulse animation-delay-2000"></div>

            <div className="p-6 space-y-8 relative z-10 max-w-lg mx-auto">
                <div className="flex justify-between items-center mt-4">
                    <h1 className="text-4xl font-serif text-stone-800 tracking-tight">My Day</h1>
                    <div className="w-11 h-11 bg-white/60 shadow-glass-inset backdrop-blur-md rounded-full flex items-center justify-center text-stone-700 cursor-pointer border border-white/80 hover:bg-white/80 transition-all hover:scale-105" onClick={() => navigate('profile')}>
                        <User className="w-5 h-5" />
                    </div>
                </div>

                <div className={`rounded-3xl p-6 space-y-5 transition-all duration-500 ${checkInDone ? 'bg-white/40 shadow-sm border border-white/50 backdrop-blur-sm' : 'glass-card-chic shadow-3d'}`}>
                    <h2 className="font-serif text-xl tracking-tight text-stone-800">
                        {checkInDone ? 'Check-in Concluído' : 'Check-in Diário'}
                    </h2>
                    {!checkInDone ? (
                        <div className="flex justify-between gap-3 flex-wrap">
                            {['Feliz', 'Normal', 'Triste', 'Irritado', 'Cansado', 'Disposto'].map((mood) => (
                                <button
                                    key={mood}
                                    onClick={() => handleCheckIn(mood)}
                                    className="glass-button flex flex-col items-center flex-1 min-w-[30%] rounded-2xl p-4 gap-2 hover:bg-white/80 transition-all group"
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner-sm transition-transform group-hover:scale-110 ${mood === 'Feliz' || mood === 'Disposto' ? 'bg-yellow-100/80' :
                                        mood === 'Normal' ? 'bg-orange-100/80' :
                                            mood === 'Triste' || mood === 'Cansado' ? 'bg-blue-100/80' :
                                                'bg-red-200/80'
                                        }`}>
                                        {mood === 'Feliz' ? '😊' : mood === 'Normal' ? '😐' : mood === 'Triste' ? '☹️' : mood === 'Irritado' ? '😡' : mood === 'Cansado' ? '🥱' : '💪'}
                                    </div>
                                    <span className="text-xs font-semibold text-stone-600 tracking-wide">{mood}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-4 gap-3 text-stone-600">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                <Check className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-medium">Sua energia foi registrada. Tenha um ótimo dia!</p>
                        </div>
                    )}
                    {!checkInDone && <p className="text-center text-stone-600 text-sm pt-2">Como você está se sentindo hoje?</p>}
                </div>


                <div className="bg-gradient-to-br from-emerald-500/80 to-teal-600/80 backdrop-blur-md shadow-3d rounded-3xl p-7 relative overflow-hidden text-white cursor-pointer hover:shadow-lg transition-all group" onClick={() => navigate('focus')}>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <h2 className="font-serif text-3xl tracking-tight mb-2">Focus Session</h2>
                        <p className="text-emerald-50 text-sm font-medium mb-8 opacity-90">Deep work and breathing</p>
                        <button className="glass-button !text-emerald-900 !bg-white/90 hover:!bg-white px-8 py-2.5 rounded-full font-semibold text-sm backdrop-blur-sm shadow-sm transition-transform active:scale-95">
                            Quick Start
                        </button>
                    </div>
                    <Clock className="absolute top-8 right-8 w-7 h-7 text-white/40 group-hover:text-white/60 transition-colors" />
                </div>

                <div className="space-y-5">
                    <div className="space-y-1">
                        <h2 className="font-serif text-2xl tracking-tight text-stone-800">AI-Generated Tasks</h2>
                        <p className="text-stone-500 text-sm font-medium">Curated for your energy today.</p>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-16 bg-white/40 rounded-2xl animate-pulse"></div>
                                ))}
                            </div>
                        ) : tasks.length > 0 ? (
                            tasks.map((task) => (
                                <div key={task.id} className="glass-card-chic rounded-2xl p-4 px-5 flex justify-between items-center group hover:bg-white/60 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2.5 h-2.5 rounded-full shadow-inner-sm ${task.energy_level === 'high' ? 'bg-rose-400' : task.energy_level === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                                        <span className="text-stone-700 font-medium">{task.title}</span>
                                    </div>
                                    <button
                                        title={`Mark ${task.title} as completed`}
                                        className="w-8 h-8 rounded-full bg-white/50 border border-stone-200/50 flex items-center justify-center shadow-sm cursor-pointer hover:bg-emerald-400 hover:border-emerald-500 transition-all active:scale-90 group/btn"
                                        onClick={() => toggleTask(task.id)}
                                    >
                                        <CheckCircle2 className="w-5 h-5 text-stone-400 group-hover/btn:text-white transition-colors" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 glass-card-chic rounded-2xl border-dashed border-2 border-white/40">
                                <p className="text-stone-500 font-medium text-sm">No tasks pending. Deep breaths and rest! ✨</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

