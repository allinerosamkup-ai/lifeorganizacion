import { useState, useEffect, useRef } from 'react';
import { Bot, BookOpen, ChevronLeft, MessageCircle, Mic, Send, Settings } from 'lucide-react';
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

interface JournalEntry {
    id: string;
    date: string;
    free_text: string | null;
    ai_analysis: string | null;
    humor_emoji: string | null;
}

export const AIChat = ({ navigate }: { navigate: (view: string) => void }) => {
    const { user, profile } = useAuth();
    const [activeTab, setActiveTab] = useState<'chat' | 'journal'>('chat');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [journalLoading, setJournalLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Initial greeting
    useEffect(() => {
        const sendGreeting = async () => {
            await new Promise(resolve => setTimeout(resolve, 1200));
            const firstName = profile?.full_name?.split(' ')[0] || '';
            const greeting = firstName ? `Olá, ${firstName}!` : 'Olá!';
            setMessages([{
                id: 'greeting-1',
                role: 'assistant',
                content: `${greeting} Como você está se sentindo? Conta como tem sido sua rotina e como posso te ajudar a organizar seu dia. 🌸`,
                timestamp: new Date()
            }]);
            setIsTyping(false);
        };
        sendGreeting();
    }, [profile]);

    // Load journal entries when switching to journal tab
    useEffect(() => {
        if (activeTab !== 'journal' || !user) return;
        const fetchJournal = async () => {
            setJournalLoading(true);
            const { data } = await supabase
                .from('check_ins')
                .select('id, date, free_text, ai_analysis, humor_emoji')
                .eq('user_id', user.id)
                .eq('check_in_type', 'evening')
                .order('date', { ascending: false })
                .limit(20);
            setJournalEntries((data || []) as JournalEntry[]);
            setJournalLoading(false);
        };
        fetchJournal();
    }, [activeTab, user]);

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
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: typeof analysis === 'string' ? analysis : (analysis.summary || 'Aqui estão algumas sugestões.'),
                    structured: typeof analysis === 'object' ? analysis : undefined,
                    timestamp: new Date()
                }]);
            } else {
                throw new Error(data?.error || error?.message || 'Falha ao conectar com a IA');
            }
        } catch (err) {
            const errMessage = err instanceof Error ? err.message : String(err);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Erro: ${errMessage}`,
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const moodEmojis: Record<string, string> = {
        great: '😊', good: '💪', neutral: '😐', low: '☹️', bad: '😡', tired: '🥱', anxious: '😰', calm: '🧘', creative: '🎨'
    };

    return (
        <div className="h-full flex flex-col bg-orange-50">
            {/* Header */}
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
                <button type="button" onClick={() => navigate('settings')} className="w-10 h-10 flex items-center justify-center text-stone-800 hover:bg-white/40 rounded-full transition-colors" title="Configurações">
                    <Settings className="w-5 h-5" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-white/60 border-b border-stone-200/50 backdrop-blur-sm shrink-0">
                <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all ${activeTab === 'chat' ? 'text-orange-600 border-b-2 border-orange-500 bg-white/40' : 'text-stone-500 hover:text-stone-700'}`}
                >
                    <MessageCircle className="w-4 h-4" /> Chat
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('journal')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all ${activeTab === 'journal' ? 'text-indigo-600 border-b-2 border-indigo-500 bg-white/40' : 'text-stone-500 hover:text-stone-700'}`}
                >
                    <BookOpen className="w-4 h-4" /> Diário
                </button>
            </div>

            {/* Chat Tab */}
            {activeTab === 'chat' && (
                <>
                    <div className="flex-1 p-4 space-y-6 overflow-y-auto pb-6">
                        {messages.length === 0 && !isTyping && (
                            <div className="flex flex-col items-center justify-center h-full text-stone-500 space-y-5">
                                <div className="w-20 h-20 bg-white/60 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white">
                                    <Bot className="w-10 h-10 text-orange-500" />
                                </div>
                                <p className="font-serif text-lg tracking-tight">Como posso ajudar hoje?</p>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-3'} max-w-[95%] sm:max-w-[85%] ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center shrink-0 mt-auto shadow-sm border border-white/50">
                                        <Bot className="w-5 h-5 text-indigo-700" />
                                    </div>
                                )}
                                <div className={`p-4 rounded-[1.5rem] shadow-sm text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-orange-300 to-orange-200 text-stone-800 rounded-br-md'
                                    : 'bg-white/80 border border-white/60 text-stone-700 rounded-bl-md'}`}>

                                    {msg.role === 'assistant' && msg.structured?.summary ? (
                                        <p className="whitespace-pre-wrap">{msg.structured.summary}</p>
                                    ) : (
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    )}

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
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${task.energy_level === 'high' ? 'bg-emerald-100 text-emerald-700' : task.energy_level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                                                        {task.energy_level === 'high' ? 'Alta' : task.energy_level === 'medium' ? 'Média' : 'Baixa'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-stone-500 italic">{task.reason}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {msg.structured.exercise_suggestion?.name && (
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
                                <div className="bg-white/60 p-4 rounded-[1.5rem] rounded-bl-md flex items-center gap-1 border border-white/40">
                                    <span className="w-1.5 h-1.5 bg-stone-400/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 bg-stone-400/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 bg-stone-400/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white/90 backdrop-blur-xl border-t border-stone-200/50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] relative z-20 shrink-0">
                        <div className="flex items-center gap-2 max-w-lg mx-auto bg-stone-100 p-2 pl-4 rounded-full border border-white shadow-inner-sm focus-within:ring-2 focus-within:ring-orange-200 focus-within:bg-white transition-all">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Mensagem…"
                                className="flex-1 bg-transparent border-none focus:outline-none text-stone-700 placeholder:text-stone-400 text-sm"
                            />
                            {input.trim() ? (
                                <button onClick={handleSend} title="Enviar"
                                    className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 shadow-md bg-gradient-to-br from-orange-400 to-orange-500 hover:scale-105 transition-all">
                                    <Send className="w-4 h-4 ml-0.5" />
                                </button>
                            ) : (
                                <button title="Gravar Áudio"
                                    className="w-11 h-11 flex items-center justify-center text-stone-500 bg-stone-200/80 hover:bg-stone-200 rounded-full shrink-0 transition-colors">
                                    <Mic className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Journal Tab */}
            {activeTab === 'journal' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-5 h-5 text-indigo-500" />
                        <h2 className="font-serif text-xl text-stone-800">Reflexões Noturnas</h2>
                    </div>
                    <p className="text-stone-400 text-xs -mt-2">Seus check-ins da noite, analisados pela IA.</p>

                    {journalLoading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-24 bg-white/40 rounded-2xl animate-pulse" />)
                    ) : journalEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center text-4xl mb-4">📓</div>
                            <p className="font-serif text-xl text-stone-800 mb-1">Diário vazio</p>
                            <p className="text-stone-400 text-sm">Faça um check-in noturno em Casa para começar seu diário.</p>
                        </div>
                    ) : (
                        journalEntries.map(entry => (
                            <div key={entry.id} className="bg-white/70 border border-white/80 rounded-2xl p-5 shadow-sm backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                                        {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </span>
                                    {entry.humor_emoji && (
                                        <span className="text-xl">{moodEmojis[entry.humor_emoji] || entry.humor_emoji}</span>
                                    )}
                                </div>
                                {entry.free_text && (
                                    <p className="text-stone-600 text-sm mb-3 leading-relaxed italic">"{entry.free_text}"</p>
                                )}
                                {entry.ai_analysis && (
                                    <div className="bg-indigo-50/80 rounded-xl p-3 border border-indigo-100/60">
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Análise da IA</p>
                                        <p className="text-indigo-800 text-xs leading-relaxed">{entry.ai_analysis}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
