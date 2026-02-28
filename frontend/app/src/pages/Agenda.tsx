import { useState, useEffect } from 'react';
import { Calendar, Plus, Wand2, CheckCircle2, CircleDashed, SplitSquareHorizontal, User, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

export const Agenda = ({ navigate }: { navigate: (view: string) => void }) => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isSplitting, setIsSplitting] = useState<string | null>(null);

    // Generate week days
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

    useEffect(() => {
        if (!user) return;

        const fetchTasks = async () => {
            setLoading(true);
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');
            const { data } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .order('priority', { ascending: true });

            // For now, filtering mainly on the client or showing all if they don't have due_dates strictly enforced yet.
            // Ideally we'd filter by due_date === formattedDate
            if (data) {
                const dayTasks = data.filter(t => !t.due_date || t.due_date === formattedDate);
                setTasks(dayTasks);
            }
            setLoading(false);
        };

        fetchTasks();
    }, [user, selectedDate]);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !user) return;

        const newTask = {
            user_id: user.id,
            title: newTaskTitle,
            energy_level: 'medium',
            priority: 3,
            due_date: format(selectedDate, 'yyyy-MM-dd'),
            subtasks: []
        };

        const { data, error } = await supabase.from('tasks').insert([newTask]).select();

        if (!error && data) {
            setTasks([...tasks, data[0]]);
            setNewTaskTitle('');
        }
    };

    const toggleSubtask = async (taskId: string, subtaskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const updatedSubtasks = task.subtasks.map((st: any) =>
            st.id === subtaskId ? { ...st, is_completed: !st.is_completed } : st
        );

        const { error } = await supabase
            .from('tasks')
            .update({ subtasks: updatedSubtasks })
            .eq('id', taskId);

        if (!error) {
            setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t));
        }
    };

    const splitTaskWithAI = async (task: any) => {
        // Placeholder for Gemini API call
        setIsSplitting(task.id);

        try {
            // Using a simulated frontend split for now to guarantee it works immediately.
            // In a real prod enviroment this would hit the edge function or Gemini directly 
            // with the GOOGLE_AI_STUDIO_KEY.
            const prompt = `Break down this task into 3-4 actionable subtasks: "${task.title}". Return ONLY a JSON array of strings.`;

            // SIMULATED DELAY & FAKE RESPONSE since frontend shouldn't hold the key securely yet
            // Wait 1.5s to simulate AI thinking
            await new Promise(resolve => setTimeout(resolve, 1500));
            const generatedSubtasks = [
                { id: crypto.randomUUID(), title: `Plan strategy for ${task.title.substring(0, 10)}...`, is_completed: false },
                { id: crypto.randomUUID(), title: `Gather required materials`, is_completed: false },
                { id: crypto.randomUUID(), title: `Execute and review`, is_completed: false }
            ];

            const { error } = await supabase
                .from('tasks')
                .update({ subtasks: generatedSubtasks })
                .eq('id', task.id);

            if (!error) {
                setTasks(tasks.map(t => t.id === task.id ? { ...t, subtasks: generatedSubtasks } : t));
            }
        } catch (error) {
            console.error(error);
            alert("Failed to split task with AI.");
        } finally {
            setIsSplitting(null);
        }
    };

    const suggestTasks = () => {
        alert("Smart Entry: This will analyze your cycle and recent journal to suggest the perfect tasks for today!");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50 to-pink-50 pb-24 relative overflow-hidden">
            {/* Ambient Depth Backgrounds */}
            <div className="absolute top-[-5%] left-[-10%] w-96 h-96 bg-orange-300/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>

            <div className="p-6 space-y-6 max-w-lg mx-auto relative z-10">
                <div className="flex justify-between items-center mt-4">
                    <h1 className="text-4xl font-serif text-stone-800 tracking-tight">Agenda</h1>
                    <div className="flex gap-3">
                        <div className="w-11 h-11 shadow-glass-inset bg-white/60 backdrop-blur-md rounded-full flex items-center justify-center text-stone-700 cursor-pointer border border-white/80 hover:bg-white/80 transition-all hover:scale-105" onClick={() => navigate('profile')}>
                            <User className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Calendar Weekly View */}
                <div className="glass-card-chic rounded-3xl p-5 shadow-3d">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-serif text-lg text-stone-800">{format(selectedDate, 'MMMM yyyy')}</h2>
                        <Calendar className="w-5 h-5 text-stone-500" />
                    </div>
                    <div className="flex justify-between gap-1">
                        {weekDays.map((date, i) => {
                            const isSelected = isSameDay(date, selectedDate);
                            return (
                                <div
                                    key={i}
                                    onClick={() => setSelectedDate(date)}
                                    className={`flex flex-col items-center p-2 rounded-2xl cursor-pointer transition-all ${isSelected ? 'bg-orange-400 text-white shadow-md scale-105' : 'hover:bg-white/50 text-stone-600'}`}
                                >
                                    <span className="text-xs font-semibold uppercase opacity-80">{format(date, 'EEE')}</span>
                                    <span className="text-lg font-bold">{format(date, 'd')}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <h2 className="font-serif text-xl text-stone-800 tracking-tight">Focus & Tasks</h2>
                        <button onClick={suggestTasks} className="text-xs font-semibold text-purple-600 flex items-center gap-1 hover:text-purple-800 transition-colors">
                            <Wand2 className="w-3 h-3" /> Smart Entry
                        </button>
                    </div>

                    <form onSubmit={handleAddTask} className="relative group">
                        <div className="absolute inset-0 bg-white/20 rounded-2xl shadow-inner-sm transition-opacity group-focus-within:opacity-100 opacity-0"></div>
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Add a new task manually..."
                            className="w-full bg-white/40 backdrop-blur-sm border border-white/60 rounded-2xl py-3.5 pl-4 pr-12 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-300/50 shadow-sm transition-all"
                        />
                        <button type="submit" disabled={!newTaskTitle.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white cursor-pointer hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                            <Plus className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="space-y-3 pt-2">
                        {loading ? (
                            <div className="h-16 bg-white/40 rounded-2xl animate-pulse"></div>
                        ) : tasks.length > 0 ? (
                            tasks.map((task) => (
                                <div key={task.id} className="glass-card-chic rounded-2xl p-4 space-y-3">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex gap-3">
                                            <div className={`mt-1 w-2.5 h-2.5 rounded-full shadow-inner-sm shrink-0 ${task.energy_level === 'high' ? 'bg-rose-400' : task.energy_level === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                                            <span className={`text-stone-700 font-medium ${task.is_completed ? 'line-through opacity-50' : ''}`}>{task.title}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {(!task.subtasks || task.subtasks.length === 0) && (
                                                <button
                                                    onClick={() => splitTaskWithAI(task)}
                                                    disabled={isSplitting === task.id}
                                                    className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors shadow-sm disabled:opacity-50"
                                                    title="Break down with AI"
                                                >
                                                    {isSplitting === task.id ? <Wand2 className="w-4 h-4 animate-spin" /> : <SplitSquareHorizontal className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Subtasks */}
                                    {task.subtasks && task.subtasks.length > 0 && (
                                        <div className="pl-6 space-y-2 mt-2 border-l-2 border-stone-200/50">
                                            {task.subtasks.map((st: any) => (
                                                <div key={st.id} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleSubtask(task.id, st.id)}>
                                                    <div className="text-stone-400 group-hover:text-emerald-500 transition-colors">
                                                        {st.is_completed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <CircleDashed className="w-4 h-4" />}
                                                    </div>
                                                    <span className={`text-sm text-stone-600 ${st.is_completed ? 'line-through opacity-60' : ''}`}>{st.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 glass-card-chic rounded-2xl border-dashed border-2 border-white/40">
                                <p className="text-stone-500 font-medium text-sm">Your agenda is clear today. 🌿</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
