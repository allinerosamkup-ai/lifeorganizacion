import { useState } from 'react';
import { Calendar as CalendarIcon, Minus, Plus } from 'lucide-react';

export const Onboarding1 = ({ onNext }: { onNext: (data: any) => void }) => {
    const [lastPeriod, setLastPeriod] = useState(new Date().toISOString().split('T')[0]);
    const [cycleLength, setCycleLength] = useState(28);
    const [periodDuration, setPeriodDuration] = useState(5);

    const handleContinue = () => {
        onNext({
            last_period_start: lastPeriod,
            cycle_length: cycleLength,
            period_duration: periodDuration
        });
    };

    return (
        <div className="min-h-screen flex flex-col p-6 bg-gradient-to-b from-orange-50 to-orange-100/50">
            <div className="flex gap-2 mb-8 mt-4">
                <div className="h-2 flex-1 bg-emerald-600/40 rounded-full"></div>
                <div className="h-2 flex-1 bg-emerald-600/10 rounded-full"></div>
                <div className="h-2 flex-1 bg-emerald-600/10 rounded-full"></div>
            </div>

            <div className="text-center mb-10">
                <p className="text-emerald-700/60 text-sm font-medium mb-2">1 of 3</p>
                <h1 className="text-4xl font-serif text-stone-800 leading-tight">Let's personalize<br />your cycle</h1>
            </div>

            <div className="space-y-4 flex-1">
                <div className="bg-orange-200/50 rounded-3xl p-5 space-y-3">
                    <label className="text-stone-800 font-serif text-lg">Last period start date</label>
                    <div className="bg-white/60 rounded-2xl p-3.5 flex justify-between items-center">
                        <input
                            type="date"
                            id="last-period-date"
                            value={lastPeriod}
                            onChange={(e) => setLastPeriod(e.target.value)}
                            className="bg-transparent border-none outline-none text-stone-800 w-full"
                            title="Last period start date"
                            aria-label="Last period start date"
                        />
                        <CalendarIcon className="w-5 h-5 text-stone-500" />
                    </div>
                </div>

                <div className="bg-orange-100/80 rounded-3xl p-5 space-y-3">
                    <label className="text-stone-800 font-serif text-lg">Average cycle length</label>
                    <div className="bg-white/60 rounded-2xl p-2 flex justify-between items-center">
                        <span className="pl-3 text-stone-800 text-lg">{cycleLength} days</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCycleLength(prev => Math.max(21, prev - 1))}
                                className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-stone-600 shadow-sm"
                                title="Decrease cycle length"
                                aria-label="Decrease cycle length"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCycleLength(prev => Math.min(35, prev + 1))}
                                className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-stone-800 shadow-sm"
                                title="Increase cycle length"
                                aria-label="Increase cycle length"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-orange-50/80 rounded-3xl p-5 space-y-3">
                    <label className="text-stone-800 font-serif text-lg">Period duration</label>
                    <div className="bg-white/60 rounded-2xl p-2 flex justify-between items-center">
                        <span className="pl-3 text-stone-800 text-lg">{periodDuration} days</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPeriodDuration(prev => Math.max(1, prev - 1))}
                                className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-stone-600 shadow-sm"
                                title="Decrease period duration"
                                aria-label="Decrease period duration"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPeriodDuration(prev => Math.min(10, prev + 1))}
                                className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-stone-800 shadow-sm"
                                title="Increase period duration"
                                aria-label="Increase period duration"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <button onClick={handleContinue} className="w-full bg-emerald-600/60 text-white py-4 rounded-full font-medium text-lg shadow-sm mt-8">
                Continue
            </button>
        </div>
    );
};

