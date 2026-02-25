import { Activity, Book, Brain, CheckCircle2, Droplet, Moon, Smile } from 'lucide-react';

export const Onboarding2 = ({ onNext }: { onNext: () => void }) => {
    const goals = [
        { id: 'skincare', label: 'Skincare', icon: <Smile className="w-8 h-8" />, color: 'bg-blue-200/60', checked: true },
        { id: 'journaling', label: 'Journaling', icon: <Book className="w-8 h-8" />, color: 'bg-emerald-200/60', checked: false },
        { id: 'meditation', label: 'Meditation', icon: <Activity className="w-8 h-8" />, color: 'bg-purple-200/60', checked: true },
        { id: 'hydration', label: 'Hydration', icon: <Droplet className="w-8 h-8" />, color: 'bg-teal-200/60', checked: true },
        { id: 'focus', label: 'Deep Focus', icon: <Brain className="w-8 h-8" />, color: 'bg-orange-200/60', checked: false },
        { id: 'sleep', label: 'Sleep Routine', icon: <Moon className="w-8 h-8" />, color: 'bg-yellow-200/60', checked: false },
    ];

    return (
        <div className="min-h-screen flex flex-col p-6 bg-orange-50">
            <div className="text-center mb-8 mt-12">
                <h1 className="text-3xl font-serif text-stone-800 mb-2">What are your goals<br />for today?</h1>
                <p className="text-stone-600">Step 2 of 3: Select habits for your journey</p>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
                {goals.map(goal => (
                    <div key={goal.id} className={`${goal.color} rounded-3xl p-5 relative flex flex-col items-center justify-center gap-3`}>
                        <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center ${goal.checked ? 'bg-orange-400 border-orange-400' : 'border-stone-400/30'}`}>
                            {goal.checked && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <div className="text-stone-700">{goal.icon}</div>
                        <span className="text-stone-800 font-medium">{goal.label}</span>
                    </div>
                ))}
            </div>

            <button onClick={onNext} className="w-full bg-red-300/80 text-white py-4 rounded-full font-medium text-lg shadow-sm mt-8 mb-6">
                Continue
            </button>
        </div>
    );
};
