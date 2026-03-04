import { Home as HomeIcon, Calendar as CalendarIcon, CheckCircle2, User, Brain } from 'lucide-react';

const NAV_ITEMS = [
    {
        id: 'home',
        icon: HomeIcon,
        label: 'Home',
        activeColor: 'text-rose-500',
        activeBg: 'bg-rose-50',
        activeDot: 'bg-rose-400',
    },
    {
        id: 'agenda',
        icon: CalendarIcon,
        label: 'Agenda',
        activeColor: 'text-sky-500',
        activeBg: 'bg-sky-50',
        activeDot: 'bg-sky-400',
    },
    {
        id: 'tasks',
        icon: CheckCircle2,
        label: 'Tarefas',
        activeColor: 'text-violet-500',
        activeBg: 'bg-violet-50',
        activeDot: 'bg-violet-400',
    },
    {
        id: 'insights',
        icon: Brain,
        label: 'Insights',
        activeColor: 'text-orange-500',
        activeBg: 'bg-orange-50',
        activeDot: 'bg-orange-400',
    },
    {
        id: 'profile',
        icon: User,
        label: 'Perfil',
        activeColor: 'text-stone-700',
        activeBg: 'bg-stone-100',
        activeDot: 'bg-stone-500',
    },
] as const;

export const BottomNav = ({ current, navigate }: { current: string, navigate: (view: string) => void }) => {
    if (['login', 'onboarding-1', 'onboarding-2', 'onboarding-3', 'sanctuary'].includes(current)) return null;

    return (
        <nav
            className="w-full flex justify-around py-2 px-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))] z-50 shrink-0"
            style={{
                background: 'rgba(255, 255, 255, 0.90)',
                backdropFilter: 'blur(24px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.04)',
            }}
            aria-label="Navegação principal"
        >
            {NAV_ITEMS.map(({ id, icon: Icon, label, activeColor, activeBg, activeDot }) => {
                const isActive = current === id;
                return (
                    <button
                        key={id}
                        onClick={() => navigate(id)}
                        className={`
                            relative flex flex-col items-center gap-1 px-3 py-2 rounded-2xl
                            transition-all duration-200 ease-out tap-spring
                            ${isActive ? `${activeBg} ${activeColor}` : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50/60'}
                        `}
                        style={{ minWidth: 52 }}
                        aria-label={label}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        {/* Icon */}
                        <Icon
                            className={`w-[22px] h-[22px] transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}
                            strokeWidth={isActive ? 2.2 : 1.8}
                        />

                        {/* Label */}
                        <span
                            className={`
                                text-[10px] font-bold tracking-wide transition-all duration-200
                                ${isActive ? 'opacity-100' : 'opacity-75'}
                            `}
                        >
                            {label}
                        </span>

                        {/* Active dot indicator */}
                        <span
                            className={`
                                absolute -bottom-0.5 w-1 h-1 rounded-full transition-all duration-300
                                ${isActive ? `${activeDot} opacity-100 scale-100` : 'opacity-0 scale-0'}
                            `}
                        />
                    </button>
                );
            })}
        </nav>
    );
};
