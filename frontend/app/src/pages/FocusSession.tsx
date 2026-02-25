import { ChevronLeft } from 'lucide-react';

export const FocusSession = ({ navigate }: { navigate: (view: string) => void }) => (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-emerald-50 to-pink-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <button onClick={() => navigate('home')} className="absolute top-8 left-6 w-10 h-10 flex items-center justify-center text-stone-800 z-20">
            <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center z-10 mb-16">
            <h1 className="text-4xl font-serif text-stone-900 leading-tight">Breathe and<br />Focus Session</h1>
        </div>

        <div className="relative w-72 h-72 flex items-center justify-center z-10 mb-16">
            <div className="absolute inset-0 border border-white/40 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-4 border border-white/50 rounded-full opacity-40"></div>
            <div className="absolute inset-8 border border-white/60 rounded-full opacity-60"></div>
            <div className="absolute inset-12 bg-white/20 backdrop-blur-sm rounded-full shadow-inner flex flex-col items-center justify-center gap-2">
                <span className="text-stone-800 font-medium">Breathe In</span>
                <span className="text-stone-800 font-medium text-lg">Breathe Out</span>
                <span className="text-stone-800 font-medium text-xl">Breathe Out</span>
                <span className="text-stone-800 font-medium text-lg">Breathe Out</span>
                <span className="text-stone-800 font-medium">Breathe In</span>
            </div>
        </div>

        <div className="flex gap-4 z-10">
            <button className="bg-white/40 backdrop-blur-md text-stone-800 px-6 py-4 rounded-2xl font-medium shadow-sm border border-white/50">10 min</button>
            <button className="bg-white/60 backdrop-blur-md text-stone-800 px-6 py-4 rounded-2xl font-medium shadow-sm border border-white/50">15 min</button>
            <button className="bg-white/40 backdrop-blur-md text-stone-800 px-6 py-4 rounded-2xl font-medium shadow-sm border border-white/50">25 min</button>
        </div>
    </div>
);
