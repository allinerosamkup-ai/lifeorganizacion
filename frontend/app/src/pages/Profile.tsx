import { Bell, Brain, ChevronRight, Droplet, HelpCircle, Lock, Sparkles, User, LogOut } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export const Profile = () => {
    const { user, signOut } = useAuth();


    return (


        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-100 pb-24 relative overflow-hidden">
            {/* Ambient Backgrounds */}
            <div className="absolute top-[-5%] left-[-10%] w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[20%] right-[-10%] w-72 h-72 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse animation-delay-2000"></div>

            <div className="p-6 space-y-6 max-w-lg mx-auto relative z-10">
                <div className="text-center mt-8 mb-6 relative">
                    <Sparkles className="absolute -top-2 left-6 w-6 h-6 text-orange-400 opacity-60 animate-pulse" />
                    <Sparkles className="absolute top-8 right-6 w-4 h-4 text-pink-400 opacity-40 animate-pulse animation-delay-2000" />
                    <h1 className="text-2xl font-serif text-stone-900 drop-shadow-sm">Airia Flow</h1>
                    <h2 className="text-4xl font-serif text-stone-800 tracking-tight mt-1">Profile & Analytics</h2>
                </div>

                <div className="glass-card-chic rounded-[2rem] p-8 shadow-3d space-y-8 relative overflow-hidden">
                    {/* Decorative glow inside card */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 blur-3xl rounded-full"></div>

                    <div className="flex justify-center flex-col items-center gap-4 text-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full blur-md opacity-40"></div>
                            <img
                                src={user?.user_metadata?.avatar_url || "https://picsum.photos/seed/victoria/200/200"}
                                alt={user?.user_metadata?.full_name || "Profile"}
                                className="w-24 h-24 rounded-full object-cover border-[3px] border-white shadow-md relative z-10"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                        <h3 className="text-3xl font-serif text-stone-800 tracking-tight">{user?.user_metadata?.full_name || "Victoria"}</h3>
                        <p className="text-stone-500 text-sm font-medium">{user?.email}</p>
                    </div>
                </div>


                <div className="pt-2">
                    <h4 className="font-serif text-xl tracking-tight text-stone-800 mb-4 px-2">Weekly Summary</h4>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gradient-to-br from-emerald-100/80 to-teal-50/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 shadow-inner-sm border border-white/60 hover:shadow-md transition-shadow">
                            <Brain className="w-6 h-6 text-emerald-600" />
                            <span className="text-2xl font-serif text-stone-800">32</span>
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Hours Focused</span>
                        </div>
                        <div className="bg-gradient-to-br from-purple-100/80 to-pink-50/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 shadow-inner-sm border border-white/60 hover:shadow-md transition-shadow">
                            <span className="text-2xl">😊</span>
                            <span className="text-xl font-serif text-stone-800">Calm</span>
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Avg Mood</span>
                        </div>
                        <div className="bg-gradient-to-br from-orange-100/80 to-amber-50/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 shadow-inner-sm border border-white/60 hover:shadow-md transition-shadow">
                            <Droplet className="w-6 h-6 text-orange-500" />
                            <span className="text-xs font-bold text-stone-700 leading-tight">Day 18,<br />Follicular</span>
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mt-1">Cycle Phase</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-6 glass-card-chic rounded-3xl shadow-3d border border-white/40 relative">
                    <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl"></div>
                    <div className="relative w-36 h-36 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#f3e8ff" strokeWidth="8" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="url(#gradient)" strokeWidth="8" strokeDasharray="283" strokeDashoffset="150" strokeLinecap="round" />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#f472b6" />
                                    <stop offset="100%" stopColor="#d946ef" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-serif tracking-tight text-stone-800">45<span className="text-sm text-stone-400">/100</span></span>
                        </div>
                    </div>
                    <p className="text-sm font-semibold text-stone-600 mt-4 flex items-center gap-2 bg-white/50 px-4 py-1.5 rounded-full shadow-inner-sm">AI Messages Used <Sparkles className="w-4 h-4 text-orange-400" /></p>
                </div>

                <div className="bg-gradient-to-br from-pink-400 to-purple-500 rounded-3xl p-7 text-center relative overflow-hidden shadow-3d text-white group cursor-pointer hover:shadow-glow transition-all">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Sparkles className="absolute top-6 right-6 w-6 h-6 text-white/50 animate-pulse" />
                    <Sparkles className="absolute bottom-6 left-6 w-5 h-5 text-white/40 animate-pulse animation-delay-2000" />
                    <h4 className="font-serif text-2xl tracking-tight mb-2 relative z-10">Unlock Potential</h4>
                    <p className="text-sm text-white/80 font-medium mb-6 relative z-10">Unlimited AI & advanced insights</p>
                    <button className="glass-button !text-purple-900 !bg-white/90 hover:!bg-white px-8 py-3 rounded-full font-bold shadow-sm transition-transform active:scale-95 relative z-10 w-full sm:w-auto">Upgrade Now</button>
                </div>

                <div className="space-y-3 pt-2">
                    {[
                        { icon: <User className="w-5 h-5" />, label: 'Account' },
                        { icon: <Bell className="w-5 h-5" />, label: 'Notifications' },
                        { icon: <Lock className="w-5 h-5" />, label: 'Privacy' },
                        { icon: <HelpCircle className="w-5 h-5" />, label: 'Help & Support' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/40 hover:bg-white/70 rounded-2xl transition-all cursor-pointer shadow-sm border border-white/50 group">
                            <div className="flex items-center gap-4 text-stone-700">
                                <div className="bg-white/60 p-2 rounded-xl shadow-inner-sm text-stone-500 group-hover:text-purple-500 transition-colors">{item.icon}</div>
                                <span className="font-semibold">{item.label}</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-stone-400 border border-stone-200 rounded-full bg-white flex items-center justify-center p-0.5" />
                        </div>
                    ))}

                    <div
                        onClick={signOut}
                        className="flex items-center justify-between p-4 bg-red-50/50 hover:bg-red-100/80 rounded-2xl transition-all cursor-pointer text-red-600 mt-6 border border-red-100 group shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-white/80 p-2 rounded-xl shadow-inner-sm group-hover:bg-red-200 group-hover:text-red-700 transition-colors"><LogOut className="w-5 h-5" /></div>
                            <span className="font-bold">Log out</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

