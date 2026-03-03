import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";

export function EnergyHistoryStrip() {
    const { user } = useAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [points, setPoints] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            const today = new Date();
            const start = new Date();
            start.setDate(today.getDate() - 6);
            const startStr = start.toISOString().split("T")[0];

            const [{ data: energy }, { data: checkIns }] = await Promise.all([
                supabase.from("daily_energy").select("date, total_score, energy_level").eq("user_id", user.id).gte("date", startStr).order("date", { ascending: true }),
                supabase.from("check_ins").select("checked_at").eq("user_id", user.id).gte("checked_at", `${startStr}T00:00:00`),
            ]);

            const checkinCountByDate: Record<string, number> = {};
            checkIns?.forEach((c: any) => {
                const d = c.checked_at.split("T")[0];
                checkinCountByDate[d] = (checkinCountByDate[d] || 0) + 1;
            });

            // Ensure we have 7 days
            const days = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                days.push(d.toISOString().split("T")[0]);
            }

            const map = days.map((dateStr) => {
                const e = energy?.find((en: any) => en.date === dateStr);
                return {
                    date: dateStr,
                    score: e?.total_score || 50,
                    energy_level: e?.energy_level || 'medium',
                    checkins_count: checkinCountByDate[dateStr] || 0,
                };
            });

            setPoints(map);
        };
        load();
    }, [user]);

    if (points.length === 0) return null;

    return (
        <div className="glass-card-chic rounded-[1.5rem] p-4 space-y-3">
            <div className="flex items-center justify-between pointer-events-none">
                <h2 className="font-serif text-base tracking-tight text-stone-800 flex items-center gap-2">
                    Histórico de Energia
                </h2>
                <span className="text-[10px] text-stone-400 font-medium">Últimos 7 dias</span>
            </div>
            <div className="flex items-end gap-2 justify-between h-20 mt-2 p-1">
                {points.map((p) => {
                    const height = Math.max(15, (p.score / 100) * 100);
                    const color = p.energy_level === "high" ? "bg-emerald-400/80" : p.energy_level === "medium" ? "bg-amber-400/80" : "bg-rose-400/80";
                    return (
                        <div key={p.date} className="flex flex-col items-center justify-end gap-1.5 flex-1 relative group cursor-default h-full">
                            <div className={`w-full max-w-[24px] rounded-t-xl rounded-b-md ${color} transition-all duration-700 ease-out border border-white/50 shadow-inner-sm`} style={{ height: `${height}%` }}></div>
                            <p className="text-[9px] text-stone-500 font-semibold">{p.date.substring(8, 10)}</p>

                            {/* Tooltip on hover */}
                            <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-800 text-white text-[10px] px-2 py-1 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-20 font-medium">
                                Score: {p.score} • Checks: {p.checkins_count}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
