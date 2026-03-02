import { useState, useEffect, useRef } from 'react';
import { Bot, ChevronLeft, Mic, Send, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    structured?: {
        summary?: string;
        task_suggestions?: Array<{ title: string; energy_level: string; reason: string }>;
        exercise_suggestion?: { name: string; reason: string };
    };
    timestamp: Date;
}

export const AIChat = ({ navigate }: { navigate: (view: string) => void }) => {
    const { user, profile } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Initial Greeting
    useEffect(() => {
        const sendGreeting = async () => {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            let greeting = "Olá!";
            if (profile?.full_name) {
                const firstName = profile.full_name.split(' ')[0];
                greeting = `Olá, ${firstName}!`;
            }

            const welcomeMsg: Message = {
                id: 'greeting-1',
                role: 'assistant',
                content: `${greeting} Como você está se sentindo nas últimas semanas? Conta um pouquinho como tem sido a sua rotina e como eu posso te ajudar a organizar seu dia hoje.`,
                timestamp: new Date()
            };

            setMessages([welcomeMsg]);
            setIsTyping(false);
        };

        sendGreeting();
    }, [profile]);

    const handleSend = async () => {
        if (!input.trim() || !user) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const { data, error } = await supabase.functions.invoke('chat-ai', {
                body: {
                    message: userMsg.content,
                    history: messages.map(m => ({
                        role: m.role,
                        content: m.role === 'assistant' && m.structured ? JSON.stringify(m.structured) : m.content
                    }))
                }
            });

            if (data?.analysis) {
                const analysis = data.analysis;
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: typeof analysis === 'string' ? analysis : (analysis.summary || 'Aqui estão algumas sugestões.'),
                    structured: typeof analysis === 'object' ? analysis : undefined,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, aiMsg]);
            } else {
                const errorDetail = data?.error || error?.message || 'Falha ao conectar com a IA';
                throw new Error(errorDetail);
            }
        } catch (err) {
            const errMessage = err instanceof Error ? err.message : String(err);
            console.error('[AIChat] Erro:', errMessage);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Erro: ${errMessage}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-orange-50">
            <div className="bg-orange-200/50 p-4 pt-8 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md shadow-sm">
                <button onClick={() => navigate('home')} className="w-10 h-10 flex items-center justify-center text-stone-800 hover:bg-white/40 rounded-full transition-colors" title="Voltar">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-xl font-serif text-stone-900 flex items-center gap-2">
                        Airia Flow <span className="text-lg">✨</span>
                    </h1>
                    <span className="text-xs text-stone-500 font-medium tracking-wider uppercase">Sua Assistente</span>
                </div>
                <div className="w-10 h-10 flex items-center justify-center text-stone-800 hover:bg-white/40 rounded-full transition-colors cursor-pointer" title="Configurações">
                    <Settings className="w-5 h-5" />
                </div>
            </div>

            <div className="flex-1 p-4 space-y-6 overflow-y-auto pb-6">
                {messages.length === 0 && !isTyping && (
                    <div className="flex flex-col items-center justify-center h-full text-stone-400 opacity-50 space-y-4">
                        <Bot className="w-16 h-16" />
                        <p>Inicie uma conversa...</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-3'} max-w-[95%] sm:max-w-[85%] ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center shrink-0 mt-auto shadow-sm border border-white/50">
                                <Bot className="w-5 h-5 text-indigo-700" />
                            </div>
                        )}
                        <div className={`p-4 rounded-[1.5rem] shadow-sm text-sm sm:text-base leading-relaxed ${msg.role === 'user'
                            ? 'bg-gradient-to-br from-orange-300 to-orange-200 text-stone-800 rounded-br-md text-right'
                            : 'bg-white/80 border border-white/60 text-stone-700 rounded-bl-md glass-card-chic'}`}>

                            {/* Text Content */}
                            {msg.role === 'assistant' && msg.structured?.summary ? (
                                <p className="whitespace-pre-wrap">{msg.structured.summary}</p>
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}

                            {/* Structured Cards */}
                            {msg.role === 'assistant' && msg.structured && (
                                <div className="mt-4 space-y-3">
                                    {(msg.structured.task_suggestions?.length ?? 0) > 0 && (
                                        <div className="bg-stone-50/80 rounded-xl p-3 border border-stone-100">
                                            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Sugestões de Tarefas</p>
                                            <div className="space-y-2">
                                                {msg.structured.task_suggestions!.map((task, idx) => (
                                                    <div key={idx} className="bg-white rounded-lg p-2.5 shadow-sm border border-stone-50 flex flex-col gap-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-semibold text-stone-700 text-sm">{task.title}</span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${task.energy_level === 'high' ? 'bg-emerald-100 text-emerald-700' :
                                                                    task.energy_level === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                                        'bg-rose-100 text-rose-700'
                                                                }`}>
                                                                {task.energy_level === 'high' ? 'Alta Energia' :
                                                                    task.energy_level === 'medium' ? 'Média Energia' : 'Baixa Energia'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-stone-500 italic">{task.reason}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {msg.structured.exercise_suggestion && Object.keys(msg.structured.exercise_suggestion).length > 0 && msg.structured.exercise_suggestion.name && (
                                        <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/50">
                                            <p className="text-xs font-bold text-blue-600/80 uppercase tracking-wider mb-2">Movimento</p>
                                            <div className="bg-white/80 rounded-lg p-2.5 shadow-sm border border-blue-50">
                                                <span className="font-semibold text-stone-700 text-sm block mb-1">{msg.structured.exercise_suggestion.name}</span>
                                                <p className="text-xs text-stone-500 italic">{msg.structured.exercise_suggestion.reason}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex gap-3 max-w-[85%] animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center shrink-0 mt-auto shadow-sm border border-white/50">
                            <Bot className="w-5 h-5 text-indigo-700" />
                        </div>
                        <div className="bg-white/60 text-stone-400 p-4 rounded-[1.5rem] rounded-bl-md italic text-sm border border-white/40 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-stone-400/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-stone-400/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-stone-400/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            <div className="p-4 bg-white/90 backdrop-blur-xl border-t border-stone-200/50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] relative z-20 shrink-0">
                <div className="flex items-center gap-2 max-w-lg mx-auto bg-stone-100 p-2 pl-4 rounded-full border border-white shadow-inner-sm transition-all focus-within:ring-2 focus-within:ring-orange-200 focus-within:bg-white">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Mensagem ou gravação..."
                        className="flex-1 bg-transparent border-none focus:outline-none text-stone-700 placeholder:text-stone-400 text-sm sm:text-base"
                    />

                    {input.trim() ? (
                        <button
                            onClick={handleSend}
                            className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 shadow-md bg-gradient-to-br from-orange-400 to-orange-500 hover:scale-105 transition-all"
                            title="Enviar"
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    ) : (
                        <button
                            className="w-11 h-11 flex items-center justify-center text-stone-500 bg-stone-200/80 hover:bg-stone-200 rounded-full shrink-0 transition-colors"
                            title="Gravar Áudio"
                        >
                            <Mic className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

