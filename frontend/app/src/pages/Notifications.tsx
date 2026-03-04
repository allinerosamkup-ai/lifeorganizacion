import { useState, useEffect } from "react";
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const T = {
    peach: "#F2A58E", rose: "#E891A8", lavender: "#C4A8E0", mint: "#8FCFB8",
    text: "#4A2E26", textMid: "#9B6E62", textLight: "#C4A090",
    menstrual: "#E8606A", folicular: "#5FBF8A", ovulatoria: "#F0C04A", luteal: "#9B7DE0",
};

interface Notification {
    id: string;
    type: string;
    read: boolean;
    icon: string;
    title: string;
    body: string;
    created_at: string;
    source: string;
    color: string;
}

export const Notifications = ({ navigate }: { navigate?: (view: string) => void }) => {
    if (navigate) { /* skip */ }
    const { user } = useAuth();
    const [filter, setFilter] = useState("todas");
    const [notifs, setNotifs] = useState<Notification[]>([]);

    const fetchNotifications = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data && !error) {
            setNotifs(data);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line
        fetchNotifications();
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    const markRead = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (!error) {
            setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
        }
    };

    const filters = [
        { id: "todas", label: "Todas" },
        { id: "nao_lidas", label: "Não lidas" },
        { id: "ciclo", label: "🌙 Ciclo" },
        { id: "ia", label: "✨ IA" },
    ];

    const filtered = notifs.filter(n => {
        if (filter === "todas") return true;
        if (filter === "nao_lidas") return !n.read;
        return n.type === filter;
    });

    const unreadCount = notifs.filter(n => !n.read).length;
    const isEmpty = filtered.length === 0;

    return (
        <div className="scroll-area page-enter" style={{ minHeight: "100vh", paddingBottom: 100 }}>
            {/* ── Header ── */}
            <div style={{ padding: "56px 24px 0", background: "rgba(253,232,220,0.7)", backdropFilter: "blur(20px)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: T.text }}>Notificações</h1>
                            {unreadCount > 0 && (
                                <div style={{
                                    width: 22, height: 22, borderRadius: "50%",
                                    background: `linear-gradient(135deg, ${T.peach}, ${T.rose})`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 11, fontWeight: 700, color: "white"
                                }}>{unreadCount}</div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16 }}>
                    {filters.map(f => (
                        <button key={f.id} onClick={() => setFilter(f.id)} style={{
                            display: "flex", gap: 5, alignItems: "center", padding: "7px 14px", borderRadius: 99,
                            border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                            background: filter === f.id ? `linear-gradient(135deg, ${T.peach}, ${T.rose})` : "rgba(255,255,255,0.65)",
                            color: filter === f.id ? "white" : T.textMid, fontWeight: filter === f.id ? 700 : 500, fontSize: 13
                        }}>{f.label}</button>
                    ))}
                </div>
            </div>

            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                {isEmpty ? (
                    <div className="flex justify-center flex-col items-center py-20 text-center">
                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl opacity-50">📭</span>
                        </div>
                        <h3 className="font-serif text-lg text-stone-800">Tudo limpo por aqui</h3>
                        <p className="text-stone-500 text-sm mt-1 max-w-[200px]">Você não tem novas notificações no momento.</p>
                    </div>
                ) : (
                    filtered.map(n => (
                        <div key={n.id} onClick={() => markRead(n.id)} style={{
                            background: n.read ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.72)",
                            backdropFilter: "blur(20px)", border: n.read ? "1px solid rgba(255,255,255,0.6)" : `1.5px solid ${n.color}40`,
                            borderRadius: 20, padding: 18, cursor: "pointer", position: "relative", overflow: "hidden"
                        }}>
                            {!n.read && (
                                <div style={{
                                    position: "absolute", top: 16, right: 18, width: 8, height: 8, borderRadius: "50%",
                                    background: `linear-gradient(135deg, ${T.peach}, ${T.rose})`
                                }} />
                            )}
                            <div style={{
                                width: 44, height: 44, borderRadius: 14, background: `${n.color}20`,
                                display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0
                            }}>{n.icon}</div>
                            <div style={{ flex: 1, minWidth: 0, marginTop: 8 }}>
                                <p style={{ fontSize: 15, fontWeight: n.read ? 500 : 700, color: T.text, marginBottom: 4 }}>{n.title}</p>
                                <p style={{ fontSize: 14, color: T.textMid, lineHeight: 1.5, marginBottom: 8 }}>{n.body}</p>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 99, background: `${n.color}15`, color: n.color }}>{n.source || 'Sistema'}</span>
                                    <span style={{ fontSize: 11, color: T.textLight }}>
                                        {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true, locale: ptBR })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
