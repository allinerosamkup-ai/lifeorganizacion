import { Dumbbell, Brain, CheckCircle2, CircleDashed, Clock } from 'lucide-react';
import { useState } from 'react';

export interface TimelineBlock {
    id: string;
    label: string;
    start: string; // '09:00'
    end: string;
    type: "task" | "focus" | "exercise";
    title: string;
    is_completed?: boolean;
    onClick?: () => void;
    onToggle?: () => void;
    onTimeChange?: (id: string, newTime: string) => void;
}

export function DayTimeline({ blocks, onTimeChange }: { blocks: TimelineBlock[], onTimeChange?: (id: string, newTime: string) => void }) {
    // Sort blocks by start time
    const sortedBlocks = [...blocks].sort((a, b) => a.start.localeCompare(b.start));

    // Group blocks into morning, afternoon, evening
    const morning = sortedBlocks.filter(b => b.start < '12:00');
    const afternoon = sortedBlocks.filter(b => b.start >= '12:00' && b.start < '18:00');
    const evening = sortedBlocks.filter(b => b.start >= '18:00');

    const DraggableBlock = ({ b }: { b: TimelineBlock }) => {
        const [isDragging, setIsDragging] = useState(false);
        const [dragY, setDragY] = useState(0);

        const parseTime = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const formatTime = (min: number) => {
            let h = Math.floor(min / 60);
            let m = Math.floor(min % 60);
            if (h < 0) { h = 0; m = 0; }
            if (h > 23) { h = 23; m = 45; }
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        };

        const originalMins = parseTime(b.start);
        const displayMins = originalMins + Math.round(dragY / 10) * 15;
        const currentStart = isDragging ? formatTime(displayMins) : b.start;

        let currentEnd = b.end;
        if (isDragging && b.end) {
            const endMins = parseTime(b.end) + Math.round(dragY / 10) * 15;
            currentEnd = formatTime(endMins);
        }

        const handlePointerDown = (e: React.PointerEvent) => {
            if (!onTimeChange) return;
            e.stopPropagation();
            const startY = e.clientY;
            setIsDragging(true);

            const handlePointerMove = (ev: PointerEvent) => {
                setDragY(ev.clientY - startY);
            };

            const handlePointerUp = (ev: PointerEvent) => {
                setIsDragging(false);
                const finalY = ev.clientY - startY;
                const newMins = originalMins + Math.round(finalY / 10) * 15;
                const newTime = formatTime(newMins);
                setDragY(0);
                if (newTime !== b.start) {
                    onTimeChange(b.id, newTime);
                }
                window.removeEventListener('pointermove', handlePointerMove);
                window.removeEventListener('pointerup', handlePointerUp);
            };

            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
        };

        return (
            <div
                key={b.id}
                className={`relative flex items-start gap-4 group ${isDragging ? 'z-50' : 'z-10 transition-all'}`}
                style={{ transform: isDragging ? `translateY(${dragY}px)` : 'none' }}
                onClick={b.onClick}
            >
                <div
                    className={`w-12 shrink-0 pt-1.5 text-right flex flex-col ${onTimeChange ? 'cursor-ns-resize hover:text-indigo-500' : ''}`}
                    onPointerDown={handlePointerDown}
                    title="Arraste para mudar o horário"
                >
                    <span className={`text-xs font-bold ${isDragging ? 'text-indigo-600' : 'text-stone-600'}`}>{currentStart}</span>
                    {currentEnd && <span className="text-[9px] font-medium text-stone-400">{currentEnd}</span>}
                </div>

                <div className="w-4 h-4 rounded-full bg-white border-2 border-stone-200 mt-1.5 z-10 shrink-0 shadow-sm flex items-center justify-center group-hover:border-emerald-300 transition-colors">
                    {b.type === 'focus' && <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>}
                    {b.type === 'exercise' && <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>}
                </div>

                <div className={`flex-1 glass-card-chic rounded-2xl p-3 border shadow-sm transition-all hover:shadow-md cursor-pointer ${b.is_completed ? 'opacity-60 saturate-50' : 'bg-white/70'} ${isDragging ? 'shadow-xl scale-[1.02] border-indigo-200 bg-white' : ''}`}>
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                            <p className={`text-sm font-semibold text-stone-800 ${b.is_completed ? 'line-through text-stone-500' : ''}`}>{b.title}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                {b.type === "task" && <Clock className="w-3 h-3 text-stone-400" />}
                                {b.type === "exercise" && <Dumbbell className="w-3 h-3 text-orange-400" />}
                                {b.type === "focus" && <Brain className="w-3 h-3 text-purple-400" />}
                                <p className="text-[10px] font-medium text-stone-500 uppercase">
                                    {b.type === "task" ? "Tarefa" : b.type === "exercise" ? "Exercício" : "Foco Profundo"}
                                </p>
                            </div>
                        </div>
                        {b.type === 'task' && b.onToggle && (
                            <button
                                title="Concluir"
                                className="mt-0.5 shrink-0 transition-transform active:scale-90 p-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    b.onToggle?.();
                                }}
                            >
                                {b.is_completed ?
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                                    <CircleDashed className="w-4 h-4 text-stone-300 group-hover:text-emerald-400" />
                                }
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderBlocks = (group: TimelineBlock[], label: string) => {
        if (group.length === 0) return null;
        return (
            <div className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-px bg-stone-200/60 flex-1"></div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">{label}</span>
                    <div className="h-px bg-stone-200/60 flex-1"></div>
                </div>
                <div className="space-y-2 relative before:absolute before:inset-0 before:ml-[3.5rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-stone-200/50 before:to-transparent">
                    {group.map((b) => (
                        <DraggableBlock key={b.id} b={b} />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="mt-4 p-4 glass-card-chic rounded-3xl border border-white/80 shadow-sm relative overflow-hidden">
            <h2 className="font-serif text-lg text-stone-800 mb-4 flex items-center gap-2 relative z-10">
                Roteiro do Dia
            </h2>

            <div className="relative z-10">
                {blocks.length === 0 ? (
                    <div className="text-center py-6 text-stone-500 text-sm">Nenhum evento agendado para hoje.</div>
                ) : (
                    <>
                        {renderBlocks(morning, 'Manhã')}
                        {renderBlocks(afternoon, 'Tarde')}
                        {renderBlocks(evening, 'Noite')}
                    </>
                )}
            </div>
        </div>
    );
}
