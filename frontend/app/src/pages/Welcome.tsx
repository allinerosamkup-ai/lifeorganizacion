import { useNavigate } from 'react-router-dom';

export default function Welcome() {
    const navigate = useNavigate();

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center justify-between relative overflow-hidden transition-colors duration-300">

            {/* Background Decorators */}
            <div className="absolute top-[-10%] left-[-20%] w-[80vw] h-[80vw] bg-[#E8A2B8]/15 dark:bg-[#E8A2B8]/10 blur-3xl rounded-full pointer-events-none z-0"></div>
            <div className="absolute bottom-[10%] right-[-10%] w-[60vw] h-[60vw] bg-[#D8BFD8]/20 dark:bg-[#D8BFD8]/10 blur-3xl rounded-full pointer-events-none z-0"></div>

            {/* Main Illustration & Logo */}
            <div className="relative w-full flex-1 flex flex-col items-center justify-center pt-16 px-6 z-10">
                <div className="relative w-64 h-64 mb-10 flex items-center justify-center">
                    <div className="absolute w-56 h-56 bg-accent dark:bg-card-dark organic-shape shadow-lg opacity-80"></div>
                    <div className="absolute w-48 h-48 bg-primary/20 dark:bg-primary/10 organic-shape-2 rotate-45"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-[#D68CA0] rounded-full flex items-center justify-center shadow-xl mb-4 text-white">
                            <span className="material-icons-round text-5xl">spa</span>
                        </div>
                        {/* Using arbitrary CSS for pulse/bounce delays to avoid complex setups inline */}
                        <span className="absolute -top-4 -right-2 text-[#D68CA0] material-icons-round text-2xl animate-pulse">auto_awesome</span>
                        <span className="absolute bottom-4 -left-6 text-primary material-icons-round text-xl animate-bounce" style={{ animationDuration: '3s' }}>star</span>
                    </div>
                </div>

                <div className="text-center space-y-3">
                    <h1 className="font-display text-5xl text-text-dark dark:text-text-light tracking-tight">
                        Life<span className="text-action">Organizer</span>
                    </h1>
                    <p className="font-body text-lg text-text-dark/70 dark:text-text-light/70 max-w-[280px] mx-auto leading-relaxed">
                        Produtividade que respeita seu ritmo
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full px-6 pb-12 z-10 space-y-4 max-w-sm mx-auto">
                <button
                    onClick={() => navigate('/auth')}
                    className="w-full group relative overflow-hidden bg-action hover:bg-action-hover text-white font-body font-bold text-lg py-4 px-6 rounded-2xl shadow-lg shadow-[#D68CA0]/30 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative flex items-center justify-center gap-2">
                        Criar minha conta
                        <span className="material-icons-round text-xl">arrow_forward</span>
                    </span>
                </button>
                <button
                    onClick={() => navigate('/auth')}
                    className="w-full bg-transparent border-2 border-action/40 dark:border-white/20 text-action dark:text-text-light font-body font-semibold text-lg py-4 px-6 rounded-2xl hover:bg-action/5 dark:hover:bg-white/5 transition-colors active:scale-95"
                >
                    Já tenho conta
                </button>

                <p className="text-center text-xs text-text-dark/40 dark:text-text-light/30 font-body mt-6">
                    Ao continuar, você concorda com nossos <br />
                    <a className="underline hover:text-action cursor-pointer">Termos</a> e <a className="underline hover:text-action cursor-pointer">Política</a>.
                </p>
            </div>

            {/* Decorative Icons */}
            <div className="absolute top-20 right-8 transform rotate-12 opacity-60 pointer-events-none">
                <span className="material-icons-round text-primary/40 text-3xl">wb_sunny</span>
            </div>
            <div className="absolute top-1/3 left-6 transform -rotate-12 opacity-40 pointer-events-none">
                <span className="material-icons-round text-[#DDA0DD]/50 text-4xl">water_drop</span>
            </div>
        </div>
    );
}
