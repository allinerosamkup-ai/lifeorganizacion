import { useState } from 'react';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { showToast } from '../components/ui/Toast';

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: 'R$ 0',
        period: '/mês',
        features: [
            '5 mensagens IA/mês',
            'Check-in diário',
            'Tarefas básicas',
            'Energy Score',
        ],
        icon: Zap,
        gradient: 'from-stone-100 to-stone-50',
        textColor: 'text-stone-600',
        buttonClass: 'bg-stone-200 text-stone-600 cursor-default',
    },
    {
        id: 'pro_monthly',
        name: 'Pro Mensal',
        price: 'R$ 19,90',
        period: '/mês',
        priceId: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID || '',
        features: [
            'IA ilimitada',
            'Sync Google Fit / Apple Health',
            'Insights avançados de energia',
            'Exercícios personalizados por IA',
            'Exportar dados',
        ],
        icon: Sparkles,
        gradient: 'from-violet-500 to-indigo-600',
        textColor: 'text-white',
        buttonClass: 'bg-white text-violet-700 hover:bg-violet-50',
        popular: true,
    },
    {
        id: 'pro_annual',
        name: 'Pro Anual',
        price: 'R$ 179,90',
        period: '/ano',
        priceId: import.meta.env.VITE_STRIPE_PRO_ANNUAL_PRICE_ID || '',
        features: [
            'Tudo do Pro Mensal',
            '25% de economia',
            'Acesso antecipado a novidades',
            'Suporte prioritário',
        ],
        icon: Crown,
        gradient: 'from-amber-400 to-orange-500',
        textColor: 'text-white',
        buttonClass: 'bg-white text-orange-700 hover:bg-orange-50',
    },
];

export function Plans({ navigate }: { navigate: (view: string) => void }) {
    const { user, profile } = useAuth();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleSubscribe = async (plan: typeof PLANS[0]) => {
        if (plan.id === 'free' || !plan.priceId) return;

        if (!user) {
            showToast('Faça login primeiro');
            return;
        }

        setLoadingPlan(plan.id);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');

            const resp = await supabase.functions.invoke('create-checkout-session', {
                body: { price_id: plan.priceId },
            });

            if (resp.error) throw resp.error;

            // Redirect to Stripe Checkout URL
            const checkoutUrl = resp.data?.url;
            if (!checkoutUrl) throw new Error('No checkout URL returned');
            window.location.href = checkoutUrl;
        } catch (error) {
            console.error('Checkout error:', error);
            showToast('Erro ao iniciar pagamento');
        } finally {
            setLoadingPlan(null);
        }
    };

    const currentPlan = profile?.plan || 'free';

    return (
        <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-stone-50">
            {/* Header */}
            <div className="px-6 pt-14 pb-6 text-center">
                <button
                    onClick={() => navigate('home')}
                    className="absolute left-4 top-12 text-stone-400 hover:text-stone-600 text-sm"
                >
                    ← Voltar
                </button>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-xs font-bold mb-4">
                    <Sparkles className="w-3.5 h-3.5" />
                    Airia Pro
                </div>
                <h1 className="text-2xl font-serif text-stone-800 mb-2">
                    Desbloqueie todo o potencial
                </h1>
                <p className="text-sm text-stone-500">
                    Organize sua vida com IA personalizada e dados reais de saúde.
                </p>
            </div>

            {/* Plans Grid */}
            <div className="px-4 pb-32 space-y-4">
                {PLANS.map((plan) => {
                    const Icon = plan.icon;
                    const isCurrent = plan.id === currentPlan || (currentPlan === 'pro' && plan.id.startsWith('pro'));
                    const isLoading = loadingPlan === plan.id;

                    return (
                        <div
                            key={plan.id}
                            className={`relative rounded-2xl p-5 bg-gradient-to-br ${plan.gradient} ${plan.popular ? 'ring-2 ring-violet-400 shadow-lg shadow-violet-100' : 'shadow-sm'}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider">
                                    Mais popular
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.id === 'free' ? 'bg-stone-200' : 'bg-white/20'}`}>
                                    <Icon className={`w-5 h-5 ${plan.id === 'free' ? 'text-stone-500' : 'text-white'}`} />
                                </div>
                                <div>
                                    <h3 className={`font-bold ${plan.textColor}`}>{plan.name}</h3>
                                    <p className={`text-sm ${plan.id === 'free' ? 'text-stone-500' : 'text-white/80'}`}>
                                        <span className="text-xl font-bold">{plan.price}</span>
                                        {plan.period}
                                    </p>
                                </div>
                            </div>

                            <ul className="space-y-2 mb-4">
                                {plan.features.map((f) => (
                                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.id === 'free' ? 'text-stone-600' : 'text-white/90'}`}>
                                        <Check className="w-4 h-4 flex-shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSubscribe(plan)}
                                disabled={isCurrent || isLoading || plan.id === 'free'}
                                className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${plan.buttonClass} ${isCurrent ? 'opacity-60' : ''}`}
                            >
                                {isCurrent ? 'Plano atual' : isLoading ? 'Redirecionando...' : plan.id === 'free' ? 'Grátis' : 'Assinar'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
