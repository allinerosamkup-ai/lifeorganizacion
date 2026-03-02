import { useState } from "react";
import { usePushNotifications } from "../lib/usePushNotifications";
import { useAuth } from "../lib/AuthContext";

const SectionHeader = ({ title, back }: { title: string; back: () => void }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={back} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#4A2E26" }}>←</button>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#4A2E26", fontWeight: 700 }}>{title}</h2>
    </div>
);

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const T = {
    peach: "#F2A58E", rose: "#E891A8", lavender: "#C4A8E0", mint: "#8FCFB8",
    text: "#4A2E26", textMid: "#9B6E62", textLight: "#C4A090",
    menstrual: "#E8606A", folicular: "#5FBF8A", ovulatoria: "#F0C04A", luteal: "#9B7DE0",
};

const Toggle = ({ value, onChange, color = T.rose }: { value: boolean, onChange: (v: boolean) => void, color?: string }) => (
    <button onClick={() => onChange(!value)} style={{
        width: 52, height: 28, borderRadius: 99, border: "none", cursor: "pointer",
        background: value ? `linear-gradient(135deg, ${T.peach}, ${color})` : "rgba(155,110,98,0.2)",
        position: "relative", transition: "background 0.3s", flexShrink: 0
    }}>
        <div style={{
            position: "absolute", top: 3, width: 22, height: 22, borderRadius: "50%", background: "white",
            transition: "left 0.3s cubic-bezier(0.34,1.56,0.64,1)", left: value ? 27 : 3,
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
        }} />
    </button>
);

const Sparkles = () => (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {["✦", "✧", "⋆"].map((s, i) => (
            <span key={i} style={{
                position: "absolute", fontSize: `${10 + (i % 3) * 4}px`, opacity: 0.18,
                left: `${8 + i * 30}%`, top: `${10 + i * 20}%`, color: [T.peach, T.rose, T.lavender][i % 3],
                animation: `float ${3 + i * 0.5}s ease-in-out infinite`
            }}>{s}</span>
        ))}
    </div>
);

interface SettingItem {
    icon: string;
    label: string;
    sub: string;
    onPress: () => void;
    arrow?: boolean;
    danger?: boolean;
    badge?: { text: string; color: string };
}

interface SettingSection {
    title: string;
    items: SettingItem[];
}

export const Settings = ({ navigate }: { navigate?: (view: string) => void }) => {
    const { user } = useAuth();
    const { status: pushStatus, loading: pushLoading, requestPermission, sendTestNotification } = usePushNotifications(user?.id);
    const [calConnected, setCalConnected] = useState(true);
    const [, setCalConnecting] = useState(false);
    const [section, setSection] = useState<string | null>(null);

    const handleConnect = async () => {
        setCalConnecting(true);
        await new Promise(r => setTimeout(r, 1800));
        setCalConnected(true);
        setCalConnecting(false);
    };

    if (section === "calendar") return (
        <div className="scroll-area page-enter" style={{ minHeight: "100vh", padding: "56px 24px 40px", paddingBottom: 100 }}>
            <SectionHeader title="📅 Google Calendar" back={() => setSection(null)} />
            <div className="glass" style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14, background: "rgba(95,191,138,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24
                    }}>📅</div>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{calConnected ? "Conectado" : "Desconectado"}</p>
                        <p style={{ fontSize: 13, color: calConnected ? T.folicular : T.textLight }}>
                            {calConnected ? "✓ Sincronizando automaticamente" : "Clique para conectar"}
                        </p>
                    </div>
                    <Toggle value={calConnected} onChange={v => { if (!v) setCalConnected(false); else handleConnect(); }} color={T.folicular} />
                </div>
                {calConnected && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[
                            { label: "Cor por fase do ciclo", desc: "Eventos coloridos automaticamente" },
                            { label: "Sincronizar tarefas", desc: "Tarefas com data viram eventos" },
                            { label: "Importar eventos", desc: "Eventos do Calendar viram tarefas" },
                        ].map((item, i) => (
                            <div key={i} style={{
                                display: "flex", justifyContent: "space-between", padding: "10px 0",
                                borderTop: "1px solid rgba(155,110,98,0.08)", alignItems: "center"
                            }}>
                                <div>
                                    <p style={{ fontSize: 14, color: T.text }}>{item.label}</p>
                                    <p style={{ fontSize: 12, color: T.textLight }}>{item.desc}</p>
                                </div>
                                <span style={{ color: T.folicular, fontSize: 16 }}>✓</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const sections: SettingSection[] = [
        {
            title: "CONTA",
            items: [
                { icon: "👤", label: "Meu perfil", sub: "Usuária Airia Flow", onPress: () => navigate?.("profile"), arrow: true },
                {
                    icon: "💳", label: "Plano Pro", sub: "Gerenciar assinatura", onPress: () => { }, arrow: true,
                    badge: { text: "Pro ⭐", color: T.rose }
                },
            ]
        },
        {
            title: "INTEGRAÇÃO",
            items: [
                {
                    icon: "📅", label: "Google Calendar", sub: calConnected ? "Conectado ✓" : "Não conectado",
                    onPress: () => setSection("calendar"), arrow: true
                },
            ]
        },
        {
            title: "NOTIFICAÇÕES",
            items: [
                {
                    icon: pushStatus === "granted" ? "🔔" : "🔕",
                    label: "Notificações push",
                    sub: pushStatus === "granted"
                        ? "Ativadas ✓ — toque para testar"
                        : pushStatus === "denied"
                            ? "Bloqueadas — ative nas configurações do celular"
                            : pushStatus === "unsupported"
                                ? "Não suportado neste navegador"
                                : pushLoading ? "Solicitando permissão…" : "Toque para ativar lembretes",
                    onPress: pushStatus === "granted"
                        ? sendTestNotification
                        : () => requestPermission(),
                    arrow: pushStatus !== "denied" && pushStatus !== "unsupported",
                },
            ]
        },
        {
            title: "SOBRE",
            items: [
                { icon: "🚪", label: "Sair da conta", sub: "", onPress: () => navigate?.("login"), danger: true },
            ]
        },
    ];

    return (
        <div className="scroll-area page-enter" style={{ minHeight: "100vh", paddingBottom: 100 }}>
            <div style={{ padding: "56px 24px 20px", position: "relative" }}>
                <Sparkles />
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: T.text }}>Configurações ⚙️</h1>
            </div>
            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 20 }}>
                {sections.map((sec, si) => (
                    <div key={si}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: T.textLight, letterSpacing: 1, marginBottom: 8, paddingLeft: 4 }}>{sec.title}</p>
                        <div className="glass" style={{ padding: "4px 16px" }}>
                            {sec.items.map((item, ii) => (
                                <button key={ii} onClick={item.onPress}
                                    style={{
                                        display: "flex", gap: 14, alignItems: "center", padding: "14px 0", width: "100%",
                                        borderBottom: ii < sec.items.length - 1 ? "1px solid rgba(155,110,98,0.08)" : "none",
                                        background: "none", border: "none", cursor: "pointer", textAlign: "left"
                                    }}>
                                    <span style={{ fontSize: 22, width: 32, textAlign: "center" }}>{item.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 15, fontWeight: 500, color: item.danger ? "#E05050" : T.text }}>{item.label}</p>
                                        {item.sub && <p style={{ fontSize: 12, color: T.textLight, marginTop: 2 }}>{item.sub}</p>}
                                    </div>
                                    {item.badge && (
                                        <span style={{
                                            fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 700,
                                            background: `${item.badge.color}20`, color: item.badge.color
                                        }}>{item.badge.text}</span>
                                    )}
                                    {item.arrow && <span style={{ color: T.textLight, fontSize: 18 }}>›</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
