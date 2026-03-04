import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useState } from 'react';

export const Login = () => {
    const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
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
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            alert(`Authentication Error: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            alert(`Google Login Error: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setIsLoading(true);
        try {
            const { supabase } = await import('../../lib/supabase');
            await supabase.auth.signInWithOAuth({
                provider: 'apple',
                options: { redirectTo: window.location.origin }
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            alert(`Apple Login Error: ${message}`);
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
                    <h1 className="text-4xl font-serif text-stone-800 tracking-tight">Airia Flow</h1>
                    <p className="text-stone-500 text-sm font-medium">Your calm, curated digital wellness journal.</p>
                </div>

                <div className="glass-card-chic rounded-3xl p-6 sm:p-8 space-y-6">
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
                            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3.5 rounded-2xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-stone-300/40"></div>
                        <span className="text-stone-400 text-xs font-medium">or continue with</span>
                        <div className="flex-1 h-px bg-stone-300/40"></div>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 bg-white/70 hover:bg-white/90 border border-stone-200/60 rounded-2xl py-3 font-medium text-stone-700 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        <button
                            onClick={handleAppleLogin}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl py-3 font-medium transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                            </svg>
                            Continue with Apple
                        </button>
                    </div>
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
