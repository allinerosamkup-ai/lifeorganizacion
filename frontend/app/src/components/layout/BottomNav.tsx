import { Home as HomeIcon, Calendar as CalendarIcon, CheckCircle2, User, Brain } from 'lucide-react';

export const BottomNav = ({ current, navigate }: { current: string, navigate: (view: string) => void }) => {
    if (['login', 'onboarding-1', 'onboarding-2', 'onboarding-3', 'sanctuary'].includes(current)) return null;

    return (
        <nav className="w-full bg-white/80 backdrop-blur-xl border-t border-white/50 flex justify-around py-3 pb-6 px-4 z-50 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
            <button onClick={() => navigate('home')} className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${current === 'home' ? 'text-emerald-600' : 'text-stone-400'}`}>
                <HomeIcon className={`w-6 h-6 ${current === 'home' ? 'fill-emerald-600/20' : ''}`} />
                <span className="text-[10px] font-medium">Home</span>
            </button>
            <button onClick={() => navigate('agenda')} className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${current === 'agenda' ? 'text-blue-500' : 'text-stone-400'}`}>
                <CalendarIcon className={`w-6 h-6 ${current === 'agenda' ? 'fill-blue-500/20' : ''}`} />
                <span className="text-[10px] font-medium">Agenda</span>
            </button>
            <button onClick={() => navigate('tasks')} className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${current === 'tasks' ? 'text-purple-500' : 'text-stone-400'}`}>
                <CheckCircle2 className={`w-6 h-6 ${current === 'tasks' ? 'fill-purple-500/20' : ''}`} />
                <span className="text-[10px] font-medium">Tarefas</span>
            </button>
            <button onClick={() => navigate('insights')} className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${current === 'insights' ? 'text-orange-500' : 'text-stone-400'}`}>
                <Brain className={`w-6 h-6 ${current === 'insights' ? 'fill-orange-500/20' : ''}`} />
                <span className="text-[10px] font-medium">Insights</span>
            </button>
            <button onClick={() => navigate('profile')} className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${current === 'profile' ? 'text-stone-600' : 'text-stone-400'}`}>
                <User className={`w-6 h-6 ${current === 'profile' ? 'fill-stone-600/20' : ''}`} />
                <span className="text-[10px] font-medium">Perfil</span>
            </button>
        </nav>
    );
};
