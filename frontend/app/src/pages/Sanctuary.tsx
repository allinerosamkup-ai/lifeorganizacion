import { Activity, Book, Calendar as CalendarIcon, Moon } from 'lucide-react';

export const Sanctuary = ({ onNext }: { onNext: () => void }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-orange-100 via-pink-100 to-purple-200">
        <h1 className="text-4xl font-serif text-stone-900 mb-10 text-center leading-tight">Sanctuary<br />Unlocked</h1>

        <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 shadow-xl border border-white/50 w-full max-w-sm">
            <p className="text-xl font-serif text-stone-800 text-center mb-8 leading-relaxed">
                Welcome to the inner circle, Sarah. Your journey to a more balanced you begins now.
            </p>

            <div className="space-y-6">
                <p className="text-center text-stone-600 font-medium">New Features Unlocked</p>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <Moon className="w-6 h-6 text-purple-400" />
                        <span className="text-sm text-stone-700 font-medium">AI-Guided Cycle Insights</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Book className="w-6 h-6 text-orange-400" />
                        <span className="text-sm text-stone-700 font-medium">Premium Journal Prompts</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Activity className="w-6 h-6 text-emerald-400" />
                        <span className="text-sm text-stone-700 font-medium">Curated Wellness Audio</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <CalendarIcon className="w-6 h-6 text-blue-400" />
                        <span className="text-sm text-stone-700 font-medium">Advanced Planner Integration</span>
                    </div>
                </div>
            </div>
        </div>

        <button onClick={onNext} className="w-full max-w-sm bg-gradient-to-r from-yellow-600 to-yellow-400 text-white py-4 rounded-full font-medium text-lg shadow-lg mt-12">
            Enter My Sanctuary
        </button>
    </div>
);
