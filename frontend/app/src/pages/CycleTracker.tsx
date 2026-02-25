import { useState } from 'react';
import { ChevronLeft, ChevronRight, Droplet, Edit2, Settings, User, Zap } from 'lucide-react';

export const CycleTracker = ({ navigate }: { navigate: (view: string) => void }) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-pink-100 pb-24 relative">
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center mt-4">
                    <h1 className="text-3xl font-serif text-stone-900">Period Day 5</h1>
                    <div className="flex gap-3">
                        <div className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center text-white cursor-pointer" onClick={() => navigate('profile')}>
                            <User className="w-5 h-5" />
                        </div>
                        <div className="w-10 h-10 bg-white/50 rounded-full flex items-center justify-center text-stone-800">
                            <Settings className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-white/50">
                    <h2 className="font-medium text-stone-800 mb-4">Cycle Overview</h2>
                    <div className="flex items-end justify-between h-24 gap-1">
                        {[40, 50, 60, 40, 80, 70, 60, 50, 40, 30].map((h, i) => (
                            <div key={i} className={`w-full rounded-t-md ${i === 4 ? 'bg-gradient-to-t from-pink-300 to-orange-200 shadow-lg scale-110 z-10' : i < 4 ? 'bg-purple-300/50' : 'bg-orange-200/50'}`} style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-stone-500 mt-2">
                        <span>Previous day</span>
                        <span>Upcoming</span>
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-white/50">
                    <div className="flex justify-between items-center mb-4">
                        <ChevronLeft className="w-5 h-5 text-stone-400" />
                        <h2 className="font-medium text-stone-800">November 2024</h2>
                        <ChevronRight className="w-5 h-5 text-stone-400" />
                    </div>
                    <div className="grid grid-cols-7 gap-y-4 text-center mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-xs text-stone-500">{d}</div>
                        ))}
                        {/* Empty slots */}
                        <div /><div /><div />
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-pink-300/50 text-stone-800">1</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-pink-300/50 text-stone-800">2</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-pink-300/50 text-stone-800">3</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-pink-300/50 text-stone-800">4</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-pink-300/50 text-stone-800">5</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-pink-300/50 text-stone-800">6</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-pink-300/50 text-stone-800">7</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-emerald-200 text-stone-800">8</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-emerald-200 text-stone-800">9</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-emerald-200 text-stone-800">10</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-emerald-200 text-stone-800">11</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-orange-200 text-stone-800">12</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-orange-200 text-stone-800">13</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-orange-200 text-stone-800">14</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full border border-stone-800 text-stone-800 font-medium">15</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-orange-200 text-stone-800">16</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-orange-200 text-stone-800">17</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-orange-200 text-stone-800">18</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-orange-200 text-stone-800">19</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-orange-200 text-stone-800">20</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-orange-200 text-stone-800">21</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-orange-200 text-stone-800">22</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-orange-200 text-stone-800">23</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-orange-200 text-stone-800">24</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-orange-200 text-stone-800">25</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-orange-200 text-stone-800">26</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-orange-200 text-stone-800">27</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-orange-200 text-stone-800">28</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-orange-200 text-stone-800">29</div>
                        <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-orange-200 text-stone-800">30</div>
                    </div>
                    <button className="w-full bg-orange-100/50 text-stone-800 py-3 rounded-2xl font-medium flex items-center justify-center gap-2">
                        Edit Dates <Edit2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="bg-white/60 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-white/50 space-y-6">
                    <h2 className="font-medium text-stone-800">Symptoms Tracker</h2>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <span className="w-24 text-sm text-stone-600">Flow Intensity</span>
                            <div className="flex-1 flex justify-between items-center">
                                <Droplet className="w-4 h-4 text-pink-400" />
                                <div className="flex-1 h-1 bg-pink-200 mx-2 rounded-full relative">
                                    <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-pink-300 rounded-full shadow-sm"></div>
                                </div>
                                <div className="flex gap-0.5"><Droplet className="w-4 h-4 text-pink-400" /><Droplet className="w-4 h-4 text-pink-400" /></div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="w-24 text-sm text-stone-600">Cramps</span>
                            <div className="flex-1 flex justify-between items-center">
                                <span className="text-xs text-stone-400">Mild</span>
                                <div className="flex-1 h-1 bg-pink-200 mx-2 rounded-full relative">
                                    <div className="absolute left-3/4 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-pink-300 rounded-full shadow-sm"></div>
                                </div>
                                <span className="text-xs text-stone-400">Severe</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="w-24 text-sm text-stone-600">Mood</span>
                            <div className="flex-1 flex gap-2">
                                <div className="bg-purple-200/50 p-2 rounded-xl flex-1 flex items-center justify-center"><span className="text-lg">🌩️</span></div>
                                <div className="bg-pink-200/50 p-2 rounded-xl flex-1 flex items-center justify-center"><span className="text-lg">🌸</span></div>
                                <div className="bg-orange-200/50 p-2 rounded-xl flex-1 flex items-center justify-center"><span className="text-lg">☀️</span></div>
                            </div>
                        </div>
                    </div>

                    <button onClick={() => setShowModal(true)} className="w-full bg-orange-300/80 text-white py-3 rounded-2xl font-medium mt-4">
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
                                    {['Cramps', 'Headaches', 'Backache'].map(p => (
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
