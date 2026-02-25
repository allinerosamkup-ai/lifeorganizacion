import { Bell, Brain, ChevronRight, Droplet, HelpCircle, Lock, Sparkles, User } from 'lucide-react';

export const Profile = () => (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-pink-100 pb-24">
        <div className="p-6 space-y-6">
            <div className="text-center mt-8 mb-6 relative">
                <Sparkles className="absolute top-0 left-4 w-6 h-6 text-orange-300" />
                <h1 className="text-2xl font-serif text-stone-900">LifeOrganizer AI</h1>
                <h2 className="text-3xl font-serif text-stone-900 mt-1">Profile & Analytics</h2>
            </div>

            <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-6 shadow-sm border border-white/50 space-y-8">
                <div className="flex items-center gap-4">
                    <img src="https://picsum.photos/seed/victoria/200/200" alt="Victoria" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                    <div>
                        <h3 className="text-2xl font-serif text-stone-900">Victoria</h3>
                        <p className="text-stone-500 text-sm">LifeOrganizer AI Member</p>
                    </div>
                </div>

                <div>
                    <h4 className="font-serif text-xl text-stone-900 mb-4">Weekly Summary</h4>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-emerald-100/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2">
                            <Brain className="w-6 h-6 text-stone-700" />
                            <span className="text-2xl font-serif text-stone-900">32</span>
                            <span className="text-[10px] text-stone-600 uppercase tracking-wider">Hours Focused</span>
                        </div>
                        <div className="bg-purple-200/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2">
                            <span className="text-2xl">😊</span>
                            <span className="text-xl font-serif text-stone-900">Calm</span>
                            <span className="text-[10px] text-stone-600 uppercase tracking-wider">Average Mood</span>
                        </div>
                        <div className="bg-orange-200/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2">
                            <Droplet className="w-6 h-6 text-stone-700" />
                            <span className="text-xs font-medium text-stone-900 leading-tight">Day 18,<br />Follicular</span>
                            <span className="text-[10px] text-stone-600 uppercase tracking-wider mt-1">Cycle Progress</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#f3e8ff" strokeWidth="8" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="url(#gradient)" strokeWidth="8" strokeDasharray="283" strokeDashoffset="150" strokeLinecap="round" />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#f472b6" />
                                    <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-serif text-stone-900">45<span className="text-sm text-stone-500">/100</span></span>
                        </div>
                    </div>
                    <p className="text-sm text-stone-600 mt-2 flex items-center gap-1">AI Messages Used <Sparkles className="w-3 h-3 text-yellow-500" /></p>
                </div>

                <div className="bg-gradient-to-r from-pink-200 to-purple-200 rounded-3xl p-6 text-center relative overflow-hidden">
                    <Sparkles className="absolute top-4 right-4 w-5 h-5 text-white/50" />
                    <Sparkles className="absolute bottom-4 left-4 w-4 h-4 text-white/50" />
                    <h4 className="font-serif text-lg text-stone-900 mb-1">Unlock Unlimited Potential</h4>
                    <p className="text-xs text-stone-700 mb-4">Get unlimited AI, advanced insights & more</p>
                    <button className="bg-white/80 backdrop-blur-sm text-stone-900 px-6 py-2 rounded-full font-medium text-sm shadow-sm">Go Premium</button>
                </div>

                <div className="space-y-2 pt-2">
                    {[
                        { icon: <User className="w-5 h-5" />, label: 'Account' },
                        { icon: <Bell className="w-5 h-5" />, label: 'Notifications' },
                        { icon: <Lock className="w-5 h-5" />, label: 'Privacy' },
                        { icon: <HelpCircle className="w-5 h-5" />, label: 'Help & Support' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 hover:bg-white/40 rounded-xl transition-colors cursor-pointer">
                            <div className="flex items-center gap-3 text-stone-800">
                                {item.icon}
                                <span className="font-medium">{item.label}</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-stone-400" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);
