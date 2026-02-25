import {
    Home as HomeIcon, Calendar as CalendarIcon,
    MessageCircle, User
} from 'lucide-react';

export const BottomNav = ({ current, navigate }: { current: string, navigate: (view: string) => void }) => {
    if (['login', 'onboarding-1', 'onboarding-2', 'onboarding-3', 'sanctuary', 'focus'].includes(current)) return null;

    return (
        <div className="absolute bottom-0 w-full bg-white/80 backdrop-blur-xl border-t border-white/50 flex justify-around py-4 pb-8 px-4 z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <button onClick={() => navigate('home')} className={`flex flex-col items-center gap-1 ${current === 'home' ? 'text-emerald-600' : 'text-stone-400'}`}>
                <HomeIcon className={`w-6 h-6 ${current === 'home' ? 'fill-emerald-600/20' : ''}`} />
                <span className="text-[10px] font-medium">Home</span>
            </button>
            <button onClick={() => navigate('cycle')} className={`flex flex-col items-center gap-1 ${current === 'cycle' ? 'text-pink-500' : 'text-stone-400'}`}>
                <CalendarIcon className={`w-6 h-6 ${current === 'cycle' ? 'fill-pink-500/20' : ''}`} />
                <span className="text-[10px] font-medium">Cycle</span>
            </button>
            <button onClick={() => navigate('chat')} className={`flex flex-col items-center gap-1 ${current === 'chat' ? 'text-orange-500' : 'text-stone-400'}`}>
                <MessageCircle className={`w-6 h-6 ${current === 'chat' ? 'fill-orange-500/20' : ''}`} />
                <span className="text-[10px] font-medium">Journal</span>
            </button>
            <button onClick={() => navigate('profile')} className={`flex flex-col items-center gap-1 ${current === 'profile' ? 'text-purple-500' : 'text-stone-400'}`}>
                <User className={`w-6 h-6 ${current === 'profile' ? 'fill-purple-500/20' : ''}`} />
                <span className="text-[10px] font-medium">Profile</span>
            </button>
        </div>
    );
};
