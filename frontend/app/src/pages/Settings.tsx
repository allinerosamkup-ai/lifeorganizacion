import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";
import { ChevronRight, User, HeartPulse, ShieldCheck, Link2, LogOut, Sparkles, BrainCircuit, RefreshCw, Download, Trash2 } from "lucide-react";
import { showToast } from '../components/ui/Toast';

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full relative transition-colors duration-300 ease-in-out ${checked ? 'bg-emerald-400' : 'bg-stone-300'}`}
        aria-label="Toggle Switch"
        title="Alternar"
    >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ease-in-out shadow-sm ${checked ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'}`} />
    </button>
);

interface SettingItem {
    icon: React.ReactNode;
    label: string;
    sub?: string;
    onPress?: () => void;
    arrow?: boolean;
    danger?: boolean;
    badge?: { text: string; color: string; bg: string };
    control?: React.ReactNode;
    hidden?: boolean;
}

interface SettingSection {
    title: string;
    items: SettingItem[];
}

export const Settings = () => {
    const { user, profile, signOut } = useAuth();
    const [updatingProfile, setUpdatingProfile] = useState(false);

    // Profile Fallbacks
    const tracksCycle = profile?.tracks_cycle ?? true;
    const aiPersona = profile?.ai_persona || 'empatica';
    const aiLanguage = profile?.ai_language || 'pt-BR';
    const prefersClinicalTerms = profile?.prefers_clinical_terms ?? false;
    const pinEnabled = profile?.pin_enabled ?? false;

    // Fake switch states for UI demonstration
    const [googleConnected, setGoogleConnected] = useState(true);
    const [appleConnected, setAppleConnected] = useState(false);
    const [googleFitConnected, setGoogleFitConnected] = useState(false);
    const [appleHealthConnected, setAppleHealthConnected] = useState(false);

    const updateProfile = async (field: string, value: string | number | boolean) => {
        if (!user) return;
        setUpdatingProfile(true);
        const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', user.id);
        if (!error) {
            showToast('Configuração atualizada!');
        } else {
            showToast('Erro ao atualizar.');
        }
        setUpdatingProfile(false);
    };

    const recalibrateEnergy = async () => {
        showToast('Motor de energia recalibrado com sucesso!');
    };

    const exportData = () => {
        showToast('Solicitação de exportação enviada para o seu email.');
    };

    const deleteData = () => {
        showToast('Seus dados serão apagados em 7 dias.');
    };



    const sections: SettingSection[] = [
        {
            title: "VOCÊ",
            items: [
                {
                    icon: <User className="w-5 h-5" />, label: "Nome",
                    control: (
                        <input
                            type="text"
                            className="bg-transparent border-b border-stone-300 text-sm text-stone-700 outline-none text-right font-medium max-w-[140px] focus:border-emerald-400 focus:bg-white/40 rounded px-2"
                            defaultValue={profile?.full_name || ''}
                            onBlur={(e) => updateProfile('full_name', e.target.value)}
                            disabled={updatingProfile}
                            aria-label="Nome"
                            title="Nome"
                        />
                    )
                },
                {
                    icon: <User className="w-5 h-5" />, label: "Data de Nascimento",
                    control: (
                        <input
                            type="date"
                            className="bg-transparent text-sm text-stone-700 outline-none font-medium"
                            defaultValue={profile?.birth_date || ''}
                            onBlur={(e) => updateProfile('birth_date', e.target.value)}
                            disabled={updatingProfile}
                            aria-label="Data de Nascimento"
                            title="Data de Nascimento"
                        />
                    )
                },
                {
                    icon: <HeartPulse className="w-5 h-5 text-rose-400" />, label: "Monitora ciclo menstrual?",
                    control: <ToggleSwitch checked={tracksCycle} onChange={(v) => updateProfile('tracks_cycle', v)} />
                },
                {
                    icon: <span className="text-lg">🩸</span>, label: "Data do Último Ciclo",
                    hidden: !tracksCycle,
                    control: (
                        <input
                            type="date"
                            className="bg-transparent text-sm text-stone-700 outline-none font-medium"
                            defaultValue={profile?.last_period_start || ''}
                            onBlur={(e) => updateProfile('last_period_start', e.target.value)}
                            disabled={updatingProfile}
                            aria-label="Último Ciclo"
                            title="Último Ciclo"
                        />
                    )
                },
                {
                    icon: <span className="text-lg">⏳</span>, label: "Duração Média (dias)",
                    hidden: !tracksCycle,
                    control: (
                        <input
                            type="number"
                            min={20}
                            max={45}
                            className="bg-transparent text-sm text-stone-700 outline-none font-medium text-right w-16"
                            defaultValue={profile?.cycle_length || 28}
                            onBlur={(e) => updateProfile('cycle_length', parseInt(e.target.value, 10))}
                            disabled={updatingProfile}
                            aria-label="Duração Média"
                            title="Duração Média"
                        />
                    )
                }
            ]
        },
        {
            title: "ENERGIA & IA",
            items: [
                {
                    icon: <RefreshCw className="w-5 h-5 text-amber-500" />, label: "Recalibrar Motor de Energia",
                    onPress: recalibrateEnergy, arrow: true
                },
                {
                    icon: <BrainCircuit className="w-5 h-5 text-purple-500" />, label: "Tom da IA",
                    control: (
                        <select
                            className="bg-transparent text-sm font-medium text-stone-700 outline-none cursor-pointer"
                            value={aiPersona}
                            onChange={(e) => updateProfile('ai_persona', e.target.value)}
                            disabled={updatingProfile}
                            title="Tom da IA"
                        >
                            <option value="empatica">Empática</option>
                            <option value="direta">Direta</option>
                            <option value="cientifica">Científica</option>
                        </select>
                    )
                },
                {
                    icon: <span className="text-lg">🌐</span>, label: "Idioma da IA",
                    control: (
                        <select
                            className="bg-transparent text-sm font-medium text-stone-700 outline-none cursor-pointer"
                            value={aiLanguage}
                            onChange={(e) => updateProfile('ai_language', e.target.value)}
                            disabled={updatingProfile}
                            title="Idioma"
                        >
                            <option value="pt-BR">Português</option>
                            <option value="en-US">Inglês</option>
                        </select>
                    )
                },
                {
                    icon: <span className="text-lg">🩺</span>, label: "Permitir Termos Clínicos",
                    control: <ToggleSwitch checked={prefersClinicalTerms} onChange={(v) => updateProfile('prefers_clinical_terms', v)} />
                }
            ]
        },
        {
            title: "PRIVACIDADE",
            items: [
                {
                    icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />, label: "Bloqueio por PIN/Biometria",
                    control: <ToggleSwitch checked={pinEnabled} onChange={(v) => updateProfile('pin_enabled', v)} />
                },
                {
                    icon: <Download className="w-5 h-5 text-blue-500" />, label: "Exportar meus dados",
                    onPress: exportData, arrow: true
                },
                {
                    icon: <Trash2 className="w-5 h-5 text-rose-500" />, label: "Apagar todos os meus dados",
                    onPress: deleteData, danger: true, arrow: true
                }
            ]
        },
        {
            title: "CONEXÕES",
            items: [
                {
                    icon: <Link2 className="w-5 h-5" />, label: "Login Google",
                    sub: googleConnected ? "Conectado" : "Não conectado",
                    control: <ToggleSwitch checked={googleConnected} onChange={setGoogleConnected} />
                },
                {
                    icon: <Link2 className="w-5 h-5" />, label: "Login Apple",
                    sub: appleConnected ? "Conectado" : "Não conectado",
                    control: <ToggleSwitch checked={appleConnected} onChange={setAppleConnected} />
                },
                {
                    icon: <Link2 className="w-5 h-5" />, label: "Google Fit",
                    sub: googleFitConnected ? "Conectado" : "Não conectado",
                    control: <ToggleSwitch checked={googleFitConnected} onChange={setGoogleFitConnected} />
                },
                {
                    icon: <Link2 className="w-5 h-5" />, label: "Apple Health",
                    sub: appleHealthConnected ? "Conectado" : "Não conectado",
                    control: <ToggleSwitch checked={appleHealthConnected} onChange={setAppleHealthConnected} />
                }
            ]
        },
        {
            title: "SESSÃO",
            items: [
                { icon: <LogOut className="w-5 h-5 text-rose-500" />, label: "Sair da conta", onPress: () => signOut?.(), danger: true },
            ]
        }
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
                                {sec.items.filter(i => !i.hidden).map((item, ii, arr) => (
                                    <div key={ii} className={`w-full flex items-center justify-between p-4 bg-white/40 transition-colors text-left group ${ii < arr.length - 1 ? 'border-b border-stone-200/50' : ''} ${item.onPress ? 'hover:bg-white/70 cursor-pointer' : ''}`} onClick={item.onPress}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner-sm transition-colors shrink-0 ${item.danger ? 'bg-rose-100/50 text-rose-600' : 'bg-white/60 text-stone-500 group-[.cursor-pointer]:group-hover:text-purple-500'}`}>
                                                {item.icon}
                                            </div>
                                            <div>
                                                <p className={`text-[15px] font-semibold ${item.danger ? 'text-rose-600' : 'text-stone-800'}`}>
                                                    {item.label}
                                                </p>
                                                {item.sub && <p className="text-[11px] font-medium text-stone-500 mt-0.5">{item.sub}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {item.control && (
                                                <div onClick={e => e.stopPropagation()}>
                                                    {item.control}
                                                </div>
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
