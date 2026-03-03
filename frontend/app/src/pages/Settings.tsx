import { useState } from "react";
import { usePushNotifications } from "../lib/usePushNotifications";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";
import { ChevronLeft, ChevronRight, User, CreditCard, Calendar, Bell, BellOff, LogOut, Sparkles, BrainCircuit, Activity } from "lucide-react";
import { showToast } from "../components/Toast";

interface SettingItem {
    icon: React.ReactNode;
    label: string;
    sub?: string;
    onPress?: () => void;
    arrow?: boolean;
    danger?: boolean;
    badge?: { text: string; color: string; bg: string };
    control?: React.ReactNode;
}

interface SettingSection {
    title: string;
    items: SettingItem[];
}

export const Settings = ({ navigate }: { navigate?: (view: string) => void }) => {
    const { user, profile, signOut } = useAuth();
    const { status: pushStatus, loading: pushLoading, requestPermission, sendTestNotification } = usePushNotifications(user?.id);
    const [calConnected, setCalConnected] = useState(true);
    const [, setCalConnecting] = useState(false);
    const [section, setSection] = useState<string | null>(null);

    // Profile Settings State
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const aiPersona = profile?.ai_persona || 'empatica';
    const cycleLength = profile?.cycle_length || 28;

    const handleConnect = async () => {
        setCalConnecting(true);
        await new Promise(r => setTimeout(r, 1800));
        setCalConnected(true);
        setCalConnecting(false);
    };

    const updateProfile = async (field: string, value: string | number | boolean) => {
        if (!user) return;
        setUpdatingProfile(true);
        const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', user.id);
        if (!error) {
            showToast('Configuração atualizada com sucesso!');
            // It might require a reload if we don't have global state sync for these yet, but toast is enough UX feedback
        } else {
            showToast('Erro ao atualizar. Tente novamente.');
        }
        setUpdatingProfile(false);
    };

    if (section === "calendar") return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50 to-pink-50 pb-24 relative overflow-hidden">
            <div className="p-6 pt-14 space-y-6 max-w-lg mx-auto relative z-10">
                <div className="flex items-center gap-4 mb-6">
                    <button type="button" onClick={() => setSection(null)} className="w-10 h-10 flex items-center justify-center bg-white/60 hover:bg-white rounded-full shadow-sm text-stone-700 transition-all active:scale-95" title="Voltar">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h2 className="font-serif text-2xl text-stone-800 tracking-tight">Google Calendar</h2>
                </div>

                <div className="glass-card-chic rounded-[2rem] p-6 shadow-3d border border-white/60">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-100/50 flex items-center justify-center text-3xl shadow-inner-sm">
                            📅
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-lg text-stone-800">{calConnected ? "Conectado" : "Desconectado"}</p>
                            <p className="text-sm font-medium text-stone-500">
                                {calConnected ? "Sincronizando perfeitamente" : "Clique para conectar sua conta"}
                            </p>
                        </div>
                        <button
                            type="button"
                            title={calConnected ? "Desconectar" : "Conectar"}
                            onClick={() => { if (!calConnected) handleConnect(); else setCalConnected(false); }}
                            className={`relative w-14 h-8 rounded-full transition-all duration-300 ease-spring ${calConnected ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-stone-300'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-300 ease-spring ${calConnected ? 'left-[calc(100%-1.625rem)]' : 'left-1'}`} />
                        </button>
                    </div>
                    {calConnected && (
                        <div className="space-y-4 pt-4 border-t border-stone-200/50">
                            {[
                                { label: "Cor por fase do ciclo", desc: "Eventos coloridos automaticamente" },
                                { label: "Sincronizar tarefas", desc: "Tarefas com data viram eventos" },
                                { label: "Importar eventos", desc: "Eventos do Calendar viram tarefas" },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center bg-white/40 p-4 rounded-xl border border-white/40 hover:bg-white/60 transition-colors">
                                    <div>
                                        <p className="text-sm font-semibold text-stone-800">{item.label}</p>
                                        <p className="text-xs text-stone-500">{item.desc}</p>
                                    </div>
                                    <div className="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center text-white">
                                        <span className="text-xs font-bold">✓</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const sections: SettingSection[] = [
        {
            title: "CONTA",
            items: [
                { icon: <User className="w-5 h-5" />, label: "Meu perfil", sub: profile?.full_name || "Usuária Airia Flow", onPress: () => navigate?.("profile"), arrow: true },
                {
                    icon: <CreditCard className="w-5 h-5" />, label: "Plano Pro", sub: "Gerenciar assinatura", onPress: () => { }, arrow: true,
                    badge: { text: "Pro ⭐", color: "text-purple-600", bg: "bg-purple-100" }
                },
            ]
        },
        {
            title: "INTELIGÊNCIA ARTIFICIAL",
            items: [
                {
                    icon: <BrainCircuit className="w-5 h-5" />,
                    label: "Personalidade da IA",
                    control: (
                        <select
                            className="bg-transparent text-sm text-stone-600 outline-none cursor-pointer max-w-[120px]"
                            title="Personalidade da IA"
                            value={aiPersona}
                            onChange={(e) => updateProfile('ai_persona', e.target.value)}
                            disabled={updatingProfile}
                        >
                            <option value="empatica">Empática & Leve</option>
                            <option value="direta">Direta & Focada</option>
                        </select>
                    )
                }
            ]
        },
        {
            title: "CICLO & ENERGIA",
            items: [
                {
                    icon: <Activity className="w-5 h-5" />,
                    label: "Duração do Ciclo (dias)",
                    control: (
                        <input
                            type="number"
                            className="w-16 bg-white/50 border border-stone-200 rounded-lg p-1 text-center text-sm font-semibold outline-none"
                            defaultValue={cycleLength}
                            onBlur={(e) => updateProfile('cycle_length', parseInt(e.target.value, 10))}
                            disabled={updatingProfile}
                            min={20}
                            max={45}
                        />
                    )
                }
            ]
        },
        {
            title: "INTEGRAÇÃO",
            items: [
                {
                    icon: <Calendar className="w-5 h-5" />, label: "Google Calendar", sub: calConnected ? "Conectado ✓" : "Não conectado",
                    onPress: () => setSection("calendar"), arrow: true
                },
            ]
        },
        {
            title: "NOTIFICAÇÕES",
            items: [
                {
                    icon: pushStatus === "granted" ? <Bell className="w-5 h-5 text-emerald-600" /> : <BellOff className="w-5 h-5 text-stone-400" />,
                    label: "Notificações push",
                    sub: pushStatus === "granted"
                        ? "Ativadas ✓ — toque para testar"
                        : pushStatus === "denied"
                            ? "Bloqueadas — ative nas"
                            : pushStatus === "unsupported"
                                ? "Não suportado neste navegador"
                                : pushLoading ? "Solicitando..." : "Toque para ativar",
                    onPress: pushStatus === "granted"
                        ? sendTestNotification
                        : () => requestPermission(),
                    arrow: pushStatus !== "denied" && pushStatus !== "unsupported",
                },
            ]
        },
        {
            title: "SESSÃO",
            items: [
                { icon: <LogOut className="w-5 h-5 text-rose-500" />, label: "Sair da conta", onPress: () => signOut?.(), danger: true },
            ]
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50 to-pink-50 pb-24 relative overflow-hidden">
            <div className="absolute top-[-5%] right-[-10%] w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>

            <div className="p-6 pt-12 relative z-10 max-w-lg mx-auto space-y-6">
                <div className="relative mb-8">
                    <Sparkles className="absolute -top-4 -left-2 w-6 h-6 text-orange-400/80 animate-pulse" />
                    <Sparkles className="absolute top-4 right-0 w-4 h-4 text-pink-400/80 animate-pulse" style={{ animationDelay: '1s' }} />
                    <h1 className="font-serif text-4xl font-bold text-stone-800 tracking-tight flex items-center gap-3">
                        Configurações <span className="text-3xl drop-shadow-sm">⚙️</span>
                    </h1>
                </div>

                <div className="space-y-6">
                    {sections.map((sec, si) => (
                        <div key={si} className="space-y-2">
                            <p className="text-xs font-bold text-stone-400 tracking-widest pl-4 uppercase">{sec.title}</p>
                            <div className="glass-card-chic rounded-3xl overflow-hidden shadow-sm border border-white/60">
                                {sec.items.map((item, ii) => (
                                    <div key={ii} className={`w-full flex items-center justify-between p-4 bg-white/40 transition-colors text-left group ${ii < sec.items.length - 1 ? 'border-b border-stone-200/50' : ''} ${item.onPress ? 'hover:bg-white/70 cursor-pointer' : ''}`} onClick={item.onPress}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner-sm transition-colors shrink-0 ${item.danger ? 'bg-rose-100/50 text-rose-600' : 'bg-white/60 text-stone-500 group-[.cursor-pointer]:group-hover:text-purple-500'}`}>
                                                {item.icon}
                                            </div>
                                            <div>
                                                <p className={`text-base font-semibold ${item.danger ? 'text-rose-600' : 'text-stone-800'}`}>
                                                    {item.label}
                                                </p>
                                                {item.sub && <p className="text-xs font-medium text-stone-500 mt-0.5">{item.sub}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {item.control && (
                                                <div onClick={e => e.stopPropagation()}>
                                                    {item.control}
                                                </div>
                                            )}
                                            {item.badge && (
                                                <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full ${item.badge.bg} ${item.badge.color}`}>
                                                    {item.badge.text}
                                                </span>
                                            )}
                                            {item.arrow && <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-stone-600 transition-colors" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
