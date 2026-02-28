import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Play, Pause, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';


export const FocusSession = ({ navigate }: { navigate: (view: string) => void }) => {
    const { user } = useAuth();
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [selectedMinutes, setSelectedMinutes] = useState(0);

    const handleComplete = useCallback(async () => {
        if (!user) return;

        await supabase.from('focus_sessions').insert({
            user_id: user.id,
            duration_minutes: selectedMinutes,
            completed: true
        });
    }, [user, selectedMinutes]);

    const handleStart = (mins: number) => {
        setSelectedMinutes(mins);
        setTimeLeft(mins * 60);
        setIsActive(true);
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            // Defer state update to next tick to avoid React warning
            setTimeout(() => {
                setIsActive(false);
                handleComplete();
            }, 0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, handleComplete]);




    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (

        <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Depth Backgrounds */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-300/30 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-teal-300/30 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse animation-delay-4000"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/40 rounded-full filter blur-[100px] opacity-60"></div>

            <button
                onClick={() => navigate('home')}
                title="Back to home"
                className="absolute top-8 left-6 w-11 h-11 shadow-glass-inset bg-white/60 backdrop-blur-md flex items-center justify-center rounded-full text-stone-700 z-20 border border-white/80 hover:bg-white/80 transition-all hover:scale-105"
            >
                <ChevronLeft className="w-6 h-6 ml-[-2px]" />
            </button>

            <div className="text-center z-10 mb-16 relative">
                <h1 className="text-5xl font-serif text-stone-800 tracking-tight drop-shadow-sm leading-tight">
                    Breathe & <br />Focus
                </h1>
                <p className="mt-4 text-emerald-800/60 font-medium uppercase tracking-widest text-sm">Deep session</p>
            </div>

            <div className="relative w-72 h-72 flex items-center justify-center z-10 mb-20 group">
                <div className={`absolute inset-0 border border-emerald-400/40 rounded-full shadow-glow ${isActive ? 'animate-ping' : ''} opacity-30`}></div>
                <div className="absolute inset-4 border border-teal-300/50 rounded-full opacity-50 shadow-inner"></div>
                <div className="absolute inset-8 border border-white/70 rounded-full opacity-70"></div>
                <div className="absolute inset-12 bg-white/40 backdrop-blur-md rounded-full shadow-3d border border-white/60 flex flex-col items-center justify-center gap-2 transition-transform duration-700 hover:scale-105">
                    <span className="text-5xl font-serif text-stone-800 drop-shadow-sm">{timeLeft > 0 ? formatTime(timeLeft) : 'Ready?'}</span>
                    <p className="text-xs text-stone-500 font-bold uppercase tracking-widest">{isActive ? 'Flowing' : 'Choose time'}</p>
                </div>
            </div>

            {!isActive ? (
                <div className="flex gap-4 z-10">
                    {[10, 15, 25].map(mins => (
                        <button
                            key={mins}
                            onClick={() => handleStart(mins)}
                            className="glass-button text-stone-700 px-6 py-4 rounded-2xl font-bold text-lg hover:text-emerald-700 w-24"
                        >
                            {mins}<span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-widest mt-1">min</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="flex gap-6 z-10">
                    <button
                        onClick={() => setIsActive(!isActive)}
                        title={isActive ? "Pause session" : "Start session"}
                        className="glass-button text-stone-700 p-5 rounded-full hover:text-emerald-700"
                    >
                        {isActive ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
                    </button>
                    <button
                        onClick={() => { setIsActive(false); setTimeLeft(0); }}
                        title="Reset session"
                        className="glass-button text-stone-700 p-5 rounded-full hover:text-emerald-700"
                    >
                        <RotateCcw className="w-7 h-7" />
                    </button>
                </div>
            )}

        </div>
    );
};
