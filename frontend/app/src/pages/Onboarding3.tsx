import { Sparkles } from 'lucide-react';

export const Onboarding3 = ({ onNext }: { onNext: () => void }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-pink-100 to-purple-200 text-center">
        <div className="mb-8 relative">
            <div className="absolute inset-0 bg-white/40 blur-2xl rounded-full"></div>
            <Sparkles className="w-20 h-20 text-yellow-400 relative z-10" />
        </div>

        <h1 className="text-4xl font-serif text-white mb-6 drop-shadow-sm">Almost there...</h1>

        <div className="space-y-6 text-stone-800 text-lg leading-relaxed">
            <p>LifeOrganizer AI is finalizing your personalized plan.</p>
            <p>Your guide is ready to sync with your unique cycle and daily habits, creating a sanctuary just for you.</p>
        </div>

        <button onClick={onNext} className="w-full bg-orange-400/80 text-white py-4 rounded-full font-medium text-lg shadow-lg mt-12">
            Enter My Sanctuary
        </button>
    </div>
);
