import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useState } from 'react';

export const Login = () => {
    const { signInWithEmail, signUpWithEmail } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isLogin) {
                const { error } = await signInWithEmail(email, password);
                if (error) throw error;
            } else {
                if (password !== confirmPassword) {
                    alert("Passwords do not match. Please try again.");
                    setIsLoading(false);
                    return;
                }
                const { error } = await signUpWithEmail(email, password);
                if (error) throw error;
                alert("Account created! If required, please verify your email, then sign in with your new credentials.");
                setIsLogin(true);
                setPassword('');
                setConfirmPassword('');
            }
        } catch (error: any) {
            alert(`Authentication Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (

        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-100 relative overflow-hidden">
            {/* Background floating elements for depth */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
            <div className="absolute top-[20%] right-[-10%] w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-80 h-80 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-4000"></div>

            <div className="w-full max-w-sm space-y-8 relative z-10">
                <div className="text-center space-y-3">
                    <div className="inline-block p-4 rounded-3xl bg-white/40 shadow-glass-inset backdrop-blur-md mb-2 border border-white/50">
                        <img src="https://www.svgrepo.com/show/511119/star.svg" alt="Logo" className="w-8 h-8 opacity-80" />
                    </div>
                    <h1 className="text-4xl font-serif text-stone-800 tracking-tight">LifeOrganizer AI</h1>
                    <p className="text-stone-500 text-sm font-medium">Your calm, curated digital wellness journal.</p>
                </div>

                <div className="glass-card-chic rounded-3xl p-6 sm:p-8 space-y-6">
                    {/* Social login temporarily disabled as per user request */}

                    <form onSubmit={handleAuthSubmit} className="space-y-4 relative">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-white/20 rounded-2xl shadow-inner-sm transition-opacity group-focus-within:opacity-100 opacity-0"></div>
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 transition-colors group-focus-within:text-purple-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Email Address"
                                className="w-full bg-white/40 backdrop-blur-sm border border-white/60 rounded-2xl py-3.5 pl-12 pr-4 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-300/50 shadow-sm transition-all"
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-white/20 rounded-2xl shadow-inner-sm transition-opacity group-focus-within:opacity-100 opacity-0"></div>
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 transition-colors group-focus-within:text-purple-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Password"
                                className="w-full bg-white/40 backdrop-blur-sm border border-white/60 rounded-2xl py-3.5 pl-12 pr-12 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-300/50 shadow-sm transition-all"
                            />
                            <div
                                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-stone-400 hover:text-stone-600 transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </div>
                        </div>

                        {!isLogin && (
                            <div className="relative group animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="absolute inset-0 bg-white/20 rounded-2xl shadow-inner-sm transition-opacity group-focus-within:opacity-100 opacity-0"></div>
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 transition-colors group-focus-within:text-purple-400" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required={!isLogin}
                                    placeholder="Confirm Password"
                                    className="w-full bg-white/40 backdrop-blur-sm border border-white/60 rounded-2xl py-3.5 pl-12 pr-12 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-300/50 shadow-sm transition-all"
                                />
                                <div
                                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-stone-400 hover:text-stone-600 transition-colors"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3.5 rounded-2xl font-semibold transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>
                </div>

                <div className="text-center space-y-4 pt-2">
                    {isLogin && <button className="text-stone-500 text-sm hover:text-stone-800 transition-colors font-medium">Forgot Password?</button>}
                    <p className="text-stone-500 text-sm">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button onClick={() => setIsLogin(!isLogin)} className="text-purple-600 hover:text-purple-800 font-bold transition-colors">
                            {isLogin ? 'Create Account' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
