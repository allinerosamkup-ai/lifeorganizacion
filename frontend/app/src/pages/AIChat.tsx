import { Bot, ChevronLeft, Mic, Send, Settings } from 'lucide-react';

export const AIChat = ({ navigate }: { navigate: (view: string) => void }) => (
    <div className="min-h-screen flex flex-col bg-orange-50">
        <div className="bg-orange-200/50 p-4 pt-8 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
            <button onClick={() => navigate('home')} className="w-10 h-10 flex items-center justify-center text-stone-800">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-serif text-stone-900 flex items-center gap-2">
                LifeOrganizer AI <span className="text-lg">🌸</span>
            </h1>
            <button className="w-10 h-10 flex items-center justify-center text-stone-800">
                <Settings className="w-5 h-5" />
            </button>
        </div>

        <div className="flex-1 p-4 space-y-6 overflow-y-auto pb-24">
            <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-auto">
                    <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div className="bg-indigo-100/60 text-stone-800 p-4 rounded-2xl rounded-bl-none shadow-sm">
                    Good morning, Sarah! How are you feeling today? I've noticed your schedule is a bit busy. Remember to take small breaks. 😊
                </div>
            </div>

            <div className="flex justify-end">
                <div className="bg-orange-200/60 text-stone-800 p-4 rounded-2xl rounded-br-none shadow-sm max-w-[80%]">
                    Hi! I'm feeling a bit overwhelmed, actually. Maybe I need to adjust my to-do list for today.
                </div>
            </div>

            <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-auto">
                    <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div className="bg-indigo-100/60 text-stone-800 p-4 rounded-2xl rounded-bl-none shadow-sm">
                    I understand. Let's look at your tasks. We can prioritize together. Would you like to start with your most important goal or something smaller?
                </div>
            </div>
        </div>

        <div className="p-4 bg-white/80 backdrop-blur-md border-t border-white/50 sticky bottom-0">
            <div className="flex items-center gap-3 bg-stone-100/80 rounded-full p-2 pr-3">
                <button className="w-10 h-10 flex items-center justify-center text-stone-500 shrink-0">
                    <Mic className="w-5 h-5" />
                </button>
                <input type="text" placeholder="Type your message..." className="flex-1 bg-transparent border-none focus:outline-none text-stone-800 placeholder:text-stone-400" />
                <button className="w-10 h-10 rounded-full bg-orange-300 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Send className="w-4 h-4 ml-1" />
                </button>
            </div>
        </div>
    </div>
);
