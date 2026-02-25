import { CheckCircle2, Clock, User } from 'lucide-react';

export const Home = ({ navigate }: { navigate: (view: string) => void }) => (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-emerald-50 to-orange-100 pb-24">
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center mt-4">
                <h1 className="text-3xl font-serif text-stone-900">My Day</h1>
                <div className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center text-white cursor-pointer" onClick={() => navigate('profile')}>
                    <User className="w-5 h-5" />
                </div>
            </div>

            <div className="bg-purple-200/50 rounded-3xl p-5 space-y-4">
                <h2 className="font-serif text-lg text-stone-800">Daily Check-in</h2>
                <div className="flex justify-between gap-2">
                    {['Happy', 'Okay', 'Sad', 'Angry'].map((mood, i) => (
                        <div key={mood} className="bg-white rounded-2xl p-3 flex flex-col items-center flex-1 shadow-sm gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl ${i === 0 ? 'bg-yellow-100' : i === 1 ? 'bg-orange-100' : i === 2 ? 'bg-orange-200' : 'bg-red-200'
                                }`}>
                                {i === 0 ? '😊' : i === 1 ? '😐' : i === 2 ? '☹️' : '😡'}
                            </div>
                            <span className="text-xs font-medium text-stone-700">{mood}</span>
                        </div>
                    ))}
                </div>
                <p className="text-center text-stone-600 text-sm pt-2">How are you feeling today?</p>
            </div>

            <div className="bg-emerald-600/60 rounded-3xl p-6 relative overflow-hidden text-white cursor-pointer" onClick={() => navigate('focus')}>
                <div className="relative z-10">
                    <h2 className="font-serif text-2xl mb-1">Focus Session</h2>
                    <p className="text-emerald-50 text-sm mb-6">Playfair Display</p>
                    <button className="bg-white/20 hover:bg-white/30 transition-colors text-white px-6 py-2 rounded-full font-medium text-sm backdrop-blur-sm">
                        Quick Start
                    </button>
                </div>
                <Clock className="absolute top-6 right-6 w-6 h-6 text-white/50" />
            </div>

            <div className="space-y-4">
                <h2 className="font-serif text-xl text-stone-900">AI-Generated Daily Tasks</h2>
                <p className="text-stone-500 text-sm -mt-3">Curated for you.</p>

                <div className="space-y-3">
                    {['Read 20 mins', 'Meditate', 'Water Intake (6/8 glasses)', 'Journal Entry'].map((task, i) => (
                        <div key={i} className="bg-orange-100/40 rounded-2xl p-4 flex justify-between items-center border border-white/40">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                <span className="text-stone-800 font-medium">{task}</span>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-emerald-400/20 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);
