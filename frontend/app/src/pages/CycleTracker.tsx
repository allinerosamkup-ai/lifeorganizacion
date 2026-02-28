import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Droplet, Edit2, Settings, User, Zap } from 'lucide-react';


import { useAuth } from '../lib/AuthContext';

interface CycleRecord {
    period_start_date?: string;
    [key: string]: unknown;
}

export const CycleTracker = ({ navigate }: { navigate: (view: string) => void }) => {
    const { profile } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [cycleData, setCycleData] = useState<CycleRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [phaseName, setPhaseName] = useState('Checking...');

    useEffect(() => {
        const isMounted = true;

        if (!profile) {
            // Avoid setting state synchronously block rendering
            setTimeout(() => {
                if (isMounted) setLoading(false);
            }, 0);
            return;
        }

        const calculatePhase = () => {
            if (profile.last_period_start) {
                const lastPeriod = new Date(profile.last_period_start);
                const today = new Date();
                const cycleLength = profile.cycle_length || 28;
                const daysDiff = Math.floor((today.getTime() - lastPeriod.getTime()) / (1000 * 3600 * 24));

                // Day in cycle (handles multiple cycles if period wasn't logged recently)
                const dayInCycle = ((daysDiff % cycleLength) + cycleLength) % cycleLength;

                if (dayInCycle < 5) setPhaseName('Menstrual Phase');
                else if (dayInCycle < 13) setPhaseName('Follicular Phase');
                else if (dayInCycle < 16) setPhaseName('Ovulation');
                else setPhaseName('Luteal Phase');

                setCycleData([{ period_start_date: profile.last_period_start }]);
            } else {
                setPhaseName('Track your cycle');
            }
            setLoading(false);
        };

        calculatePhase();
    }, [profile]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-100 pb-24 relative overflow-hidden">
            {/* Ambient Depth Backgrounds */}
            <div className="absolute top-[-5%] left-[-10%] w-96 h-96 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[10%] right-[-10%] w-80 h-80 bg-orange-300/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse animation-delay-2000"></div>

            <div className="p-6 space-y-6 max-w-lg mx-auto relative z-10">
                <div className="flex justify-between items-center mt-4">
                    <h1 className="text-4xl font-serif text-stone-800 tracking-tight">
                        {loading ? 'Checking...' : cycleData.length > 0 ? phaseName : 'Track your cycle'}
                    </h1>

                    <div className="flex gap-3">
                        <div className="w-11 h-11 shadow-glass-inset bg-white/60 backdrop-blur-md rounded-full flex items-center justify-center text-stone-700 cursor-pointer border border-white/80 hover:bg-white/80 transition-all hover:scale-105" onClick={() => navigate('profile')}>
                            <User className="w-5 h-5" />
                        </div>
                        <div className="w-11 h-11 shadow-glass-inset bg-white/60 backdrop-blur-md rounded-full flex items-center justify-center text-stone-700 cursor-pointer border border-white/80 hover:bg-white/80 transition-all hover:scale-105">
                            <Settings className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div className="glass-card-chic rounded-3xl p-6 shadow-3d space-y-4">
                    <h2 className="font-serif text-xl tracking-tight text-stone-800">Cycle Overview</h2>
                    <div className="flex items-end justify-between h-32 gap-1.5 px-2">
                        {[40, 50, 60, 40, 80, 70, 60, 50, 40, 30].map((h, i) => (
                            <div
                                key={i}
                                className={`w-full rounded-t-xl transition-all duration-700 ${i === 4 ? 'bg-gradient-to-t from-pink-400 to-rose-300 shadow-glow scale-110 z-10' : i < 4 ? 'bg-gradient-to-t from-purple-300/60 to-purple-200/60 shadow-inner' : 'bg-gradient-to-t from-orange-300/60 to-orange-200/60 shadow-inner'} h-[${h}%]`}
                            ></div>

                        ))}
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider mt-2">
                        <span>Previous</span>
                        <span>Upcoming</span>
                    </div>
                </div>

                <div className="glass-card-chic rounded-3xl p-6 shadow-3d">
                    <div className="flex justify-between items-center mb-6">
                        <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100/50 transition-colors"><ChevronLeft className="w-5 h-5 text-stone-500" /></button>
                        <h2 className="font-serif text-xl tracking-tight text-stone-800">November 2024</h2>
                        <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100/50 transition-colors"><ChevronRight className="w-5 h-5 text-stone-500" /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-y-4 text-center mb-6">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} className="text-xs font-semibold text-stone-400 uppercase">{d}</div>
                        ))}
                        {/* Empty slots */}
                        <div /><div /><div />
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-pink-300/40 text-stone-700 shadow-inner-sm">1</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-pink-300/40 text-stone-700 shadow-inner-sm">2</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-pink-300/40 text-stone-700 shadow-inner-sm">3</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-pink-300/40 text-stone-700 shadow-inner-sm">4</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-pink-300/40 text-stone-700 shadow-inner-sm">5</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-pink-300/40 text-stone-700 shadow-inner-sm">6</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-pink-300/40 text-stone-700 shadow-inner-sm">7</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-emerald-200/60 text-stone-800 shadow-inner-sm">8</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-emerald-200/60 text-stone-800 shadow-inner-sm">9</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-emerald-200/60 text-stone-800 shadow-inner-sm">10</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-emerald-200/60 text-stone-800 shadow-inner-sm">11</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-orange-200/60 text-stone-800 shadow-inner-sm">12</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-orange-200/60 text-stone-800 shadow-inner-sm">13</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-orange-200/60 text-stone-800 shadow-inner-sm">14</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-400 text-white font-bold shadow-md shadow-pink-300/50 scale-110">15</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-orange-200/60 text-stone-800 shadow-inner-sm">16</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-orange-200/60 text-stone-800 shadow-inner-sm">17</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-orange-200/60 text-stone-800 shadow-inner-sm">18</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-orange-200/60 text-stone-800 shadow-inner-sm">19</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-orange-200/60 text-stone-800 shadow-inner-sm">20</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-orange-200/60 text-stone-800 shadow-inner-sm">21</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-orange-200/60 text-stone-800 shadow-inner-sm">22</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-orange-200/60 text-stone-800 shadow-inner-sm">23</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-orange-200/60 text-stone-800 shadow-inner-sm">24</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-orange-200/60 text-stone-800 shadow-inner-sm">25</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-orange-200/60 text-stone-800 shadow-inner-sm">26</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-orange-200/60 text-stone-800 shadow-inner-sm">27</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-orange-200/60 text-stone-800 shadow-inner-sm">28</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-orange-200/60 text-stone-800 shadow-inner-sm">29</div>
                        <div className="w-9 h-9 mx-auto flex items-center justify-center rounded-full bg-orange-200/60 text-stone-800 shadow-inner-sm">30</div>
                    </div>
                    <button className="glass-button w-full text-stone-700 py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2">
                        Edit Dates <Edit2 className="w-4 h-4 ml-1" />
                    </button>
                </div>

                <div className="glass-card-chic rounded-3xl p-6 shadow-3d space-y-6">
                    <h2 className="font-serif text-xl tracking-tight text-stone-800">Symptoms Tracker</h2>

                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <span className="w-24 text-sm font-semibold text-stone-600 tracking-wide">Flow</span>
                            <div className="flex-1 flex justify-between items-center bg-white/40 p-2 rounded-2xl shadow-inner-sm">
                                <Droplet className="w-5 h-5 text-pink-400" />
                                <div className="flex-1 h-1.5 bg-pink-100/50 mx-3 rounded-full relative">
                                    <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border border-pink-200 rounded-full shadow-md"></div>
                                </div>
                                <div className="flex gap-[-2px]"><Droplet className="w-5 h-5 text-rose-500" /><Droplet className="w-5 h-5 text-rose-500" /></div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="w-24 text-sm font-semibold text-stone-600 tracking-wide">Cramps</span>
                            <div className="flex-1 flex justify-between items-center bg-white/40 p-2 py-3 rounded-2xl shadow-inner-sm">
                                <span className="text-xs font-bold text-stone-400 pl-2">Mild</span>
                                <div className="flex-1 h-1.5 bg-pink-100/50 mx-3 rounded-full relative">
                                    <div className="absolute left-3/4 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border border-pink-200 rounded-full shadow-md"></div>
                                </div>
                                <span className="text-xs font-bold text-stone-400 pr-2">Severe</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="w-24 text-sm font-semibold text-stone-600 tracking-wide leading-tight">Dor de<br />Cabeça</span>
                            <div className="flex-1 flex justify-between items-center bg-white/40 p-2 py-3 rounded-2xl shadow-inner-sm">
                                <span className="text-xs font-bold text-stone-400 pl-2">Mild</span>
                                <div className="flex-1 h-1.5 bg-pink-100/50 mx-3 rounded-full relative">
                                    <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border border-pink-200 rounded-full shadow-md"></div>
                                </div>
                                <span className="text-xs font-bold text-stone-400 pr-2">Severe</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="w-24 text-sm font-semibold text-stone-600 tracking-wide">Mood</span>
                            <div className="flex-1 flex gap-2">
                                <div className="bg-white/40 shadow-inner-sm p-3 rounded-2xl flex-1 flex items-center justify-center cursor-pointer hover:bg-white/60 transition-colors"><span className="text-xl">🌩️</span></div>
                                <div className="bg-pink-100/60 shadow-inner p-3 rounded-2xl flex-1 flex items-center justify-center cursor-pointer border border-pink-200/50"><span className="text-xl">🌸</span></div>
                                <div className="bg-white/40 shadow-inner-sm p-3 rounded-2xl flex-1 flex items-center justify-center cursor-pointer hover:bg-white/60 transition-colors"><span className="text-xl">☀️</span></div>
                            </div>
                        </div>
                    </div>

                    <button onClick={() => setShowModal(true)} className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white py-3.5 rounded-2xl font-semibold mt-4 shadow-md hover:shadow-lg transition-all active:scale-95">
                        Log Symptoms
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm z-50 flex items-end justify-center">
                    <div className="bg-white rounded-t-[2.5rem] w-full max-w-md p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-serif text-stone-900">How are you feeling?</h2>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-500">✕</button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Droplet className="w-5 h-5 text-stone-800" />
                                    <h3 className="font-serif text-lg text-stone-800">Flow</h3>
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-2 rounded-full border border-orange-200 text-orange-300 font-medium">Light</button>
                                    <button className="flex-1 py-2 rounded-full bg-orange-300 text-white font-medium">Medium</button>
                                    <button className="flex-1 py-2 rounded-full border border-orange-200 text-orange-300 font-medium">Heavy</button>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Zap className="w-5 h-5 text-stone-800" />
                                    <h3 className="font-serif text-lg text-stone-800">Pain</h3>
                                </div>
                                <div className="space-y-4">
                                    {['Cramps', 'Dor de cabeça', 'Backache'].map(p => (
                                        <div key={p} className="flex items-center gap-4">
                                            <span className="w-24 text-sm text-stone-600">{p}</span>
                                            <div className="flex-1 h-1 bg-pink-100 rounded-full relative">
                                                <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border border-pink-200 rounded-full shadow-sm"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button onClick={() => setShowModal(false)} className="w-full bg-orange-300 text-white py-4 rounded-full font-medium text-lg mt-8">
                                Save Logs
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
