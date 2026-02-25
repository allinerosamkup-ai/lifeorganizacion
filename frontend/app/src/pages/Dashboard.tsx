import { useState } from 'react';

export default function Dashboard() {
    const [isCheckedIn, setIsCheckedIn] = useState(false);

    return (
        <div className="max-w-md mx-auto min-h-screen relative pb-24 shadow-2xl overflow-hidden bg-background-light dark:bg-background-dark">

            {/* Dynamic Background */}
            <div className="fixed top-[-10%] right-[-20%] w-[300px] h-[300px] bg-accent-purple/20 dark:bg-accent-purple/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
            <div className="fixed bottom-[10%] left-[-10%] w-[250px] h-[250px] bg-primary/20 dark:bg-primary/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

            {isCheckedIn ? (
                <header className="sticky top-0 z-50 gradient-header pb-8 pt-12 px-6 rounded-b-3xl shadow-soft dark:shadow-none transition-colors duration-300">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-white/90 text-sm font-semibold tracking-wide uppercase mb-1">Fase Folicular</p>
                            <h1 className="text-3xl font-display text-white drop-shadow-sm flex items-center gap-2">
                                Dia 5 <span className="text-xl opacity-80 font-sans font-normal">de 28</span>
                                <span className="ml-2 bg-white/20 p-1.5 rounded-full backdrop-blur-sm text-lg">🌱</span>
                            </h1>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <button className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition shadow-sm border border-white/30">
                                <span className="material-icons-round text-white">notifications_none</span>
                            </button>
                            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 flex items-center gap-1">
                                <span className="material-icons-round text-white text-sm">favorite</span>
                                <span className="text-white text-xs font-bold">HRV 65</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-white/90 text-xs font-bold uppercase tracking-wider">Energia</span>
                                <span className="material-icons-round text-yellow-300 text-base">bolt</span>
                            </div>
                            <div className="text-2xl font-display text-white">Alta</div>
                            <div className="w-full h-1.5 bg-white/30 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-white w-4/5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.6)]"></div>
                            </div>
                        </div>
                    </div>
                </header>
            ) : (
                <header className="px-6 pt-12 pb-4 flex justify-between items-center z-10">
                    <div>
                        <p className="text-sm font-light text-text-sub-light dark:text-text-sub-dark mb-1">Bom dia, Victoria</p>
                        <h1 className="font-display text-2xl font-semibold">Seu Ciclo & Ritmo</h1>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-card flex items-center justify-center text-primary dark:text-primary transition-transform active:scale-95">
                        <span className="material-icons-round text-xl">notifications_none</span>
                    </button>
                </header>
            )}

            <main className="flex-1 overflow-y-auto px-6 pb-24 space-y-8 mt-4 scroll-smooth">
                {!isCheckedIn ? (
                    <section className="relative">
                        <div className="glass-panel rounded-3xl p-6 shadow-soft relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-green/20 rounded-full blur-[40px] -z-10"></div>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="font-display text-xl mb-1">Como você está hoje?</h2>
                                    <p className="text-xs text-text-sub-light dark:text-text-sub-dark font-light">Registre para alinhar sua rotina.</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="material-icons-round text-primary text-sm">edit_calendar</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 mb-4">
                                <button
                                    onClick={() => setIsCheckedIn(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-surface-dark border border-transparent active:border-primary/30 shadow-sm transition-all active:scale-95 hover:shadow-md group">
                                    <span className="text-lg">😴</span>
                                    <span className="text-sm font-medium text-text-main-light dark:text-text-main-dark group-hover:text-primary transition-colors">Cansada</span>
                                </button>
                                <button
                                    onClick={() => setIsCheckedIn(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-surface-dark border border-transparent active:border-primary/30 shadow-sm transition-all active:scale-95 hover:shadow-md group">
                                    <span className="text-lg">⚡</span>
                                    <span className="text-sm font-medium text-text-main-light dark:text-text-main-dark group-hover:text-primary transition-colors">Com energia</span>
                                </button>
                            </div>
                        </div>
                    </section>
                ) : (
                    <section className="glass-card rounded-2xl p-5 shadow-sm flex items-center justify-between animate-fade-in-up">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Check-in Matinal</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-300">Concluído</p>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-full border border-green-200 dark:border-green-800">
                            <span className="material-icons-round text-green-600 dark:text-green-400">check</span>
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex justify-between items-end mb-4 px-1">
                        <h3 className="font-display text-lg text-text-main-light dark:text-text-main-dark">Sugestões Alinhadas</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="group bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-card border border-transparent hover:border-accent-purple/30 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-accent-purple/20 text-accent-purple flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-icons-round">psychology</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-text-main-light dark:text-text-main-dark mb-1">Trabalho Profundo</h4>
                                    <p className="text-xs text-text-sub-light dark:text-text-sub-dark leading-relaxed">Sua energia está propícia para foco.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Navigation */}
            <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none dark:border dark:border-gray-700/50 p-2 z-50">
                <ul className="flex justify-between items-center px-2">
                    <li>
                        <a className="flex flex-col items-center justify-center w-12 h-12 text-primary">
                            <span className="material-icons-round">dashboard</span>
                        </a>
                    </li>
                    <li className="relative -top-6">
                        <a className="flex items-center justify-center w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors ring-4 ring-background-light dark:ring-background-dark">
                            <span className="material-icons-round text-2xl">add</span>
                        </a>
                    </li>
                    <li>
                        <a className="flex flex-col items-center justify-center w-12 h-12 text-gray-400 dark:text-gray-500 hover:text-primary transition-colors">
                            <span className="material-icons-round">menu_book</span>
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
    );
}
