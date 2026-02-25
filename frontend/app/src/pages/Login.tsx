import { Eye, Lock, Mail } from 'lucide-react';

export const Login = ({ onNext }: { onNext: () => void }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-orange-50 via-pink-50 to-rose-100">
        <div className="w-full max-w-sm space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-serif text-stone-800">LifeOrganizer AI</h1>
                <p className="text-stone-600 text-sm">Your calm, curated digital wellness journal.</p>
            </div>

            <div className="space-y-4 pt-8">
                <button onClick={onNext} className="w-full bg-white/80 backdrop-blur-sm text-stone-800 py-3.5 rounded-full font-medium shadow-sm border border-white/50 flex items-center justify-center gap-2">
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                    Continue with Google
                </button>
                <button onClick={onNext} className="w-full bg-white/80 backdrop-blur-sm text-stone-800 py-3.5 rounded-full font-medium shadow-sm border border-white/50 flex items-center justify-center gap-2">
                    <img src="https://www.svgrepo.com/show/511330/apple-173.svg" alt="Apple" className="w-5 h-5" />
                    Continue with Apple
                </button>
            </div>

            <div className="flex items-center gap-4 py-4">
                <div className="flex-1 h-px bg-stone-300/50"></div>
                <span className="text-stone-400 text-sm">or</span>
                <div className="flex-1 h-px bg-stone-300/50"></div>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input type="email" placeholder="Email Address" className="w-full bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl py-3.5 pl-12 pr-4 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-200" />
                </div>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input type="password" placeholder="Password" className="w-full bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl py-3.5 pl-12 pr-12 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-200" />
                    <Eye className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                </div>
            </div>

            <div className="text-center space-y-4 pt-4">
                <button className="text-stone-600 text-sm underline decoration-stone-400 underline-offset-4">Forgot Password?</button>
                <p className="text-stone-600 text-sm">
                    Don't have an account? <button onClick={onNext} className="text-stone-800 underline decoration-stone-800 underline-offset-4 font-medium">Create Account</button>
                </p>
            </div>
        </div>
    </div>
);
