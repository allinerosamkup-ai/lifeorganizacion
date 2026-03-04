import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Onboarding3 = ({ data, onComplete }: { data: any, onComplete: () => void }) => {
    const { user, refreshProfile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleEnter = async () => {
        if (!user) {
            alert("Sessão de usuário não encontrada. Por favor, faça login novamente.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    last_period_start: data.last_period_start,
                    cycle_length: data.cycle_length,
                    onboarding_completed: true,
                    cognitive_preferences: data.goals
                })
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile();
            onComplete();
        } catch (error) {
            const err = error as Error;
            console.error('Error completing onboarding:', error);
            alert(`Erro ao salvar perfil: ${err.message || 'Erro desconhecido'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-pink-100 to-purple-200 text-center">
            <div className="mb-8 relative">
                <div className="absolute inset-0 bg-white/40 blur-2xl rounded-full"></div>
                <Sparkles className="w-20 h-20 text-yellow-400 relative z-10" />
            </div>

            <h1 className="text-4xl font-serif text-white mb-6 drop-shadow-sm">Almost there...</h1>

            <div className="space-y-6 text-stone-800 text-lg leading-relaxed">
                <p>Airia Flow is finalizing your personalized plan.</p>
                <p>Your guide is ready to sync with your unique cycle and daily habits, creating a sanctuary just for you.</p>
            </div>

            <button
                onClick={handleEnter}
                disabled={isSubmitting}
                className="w-full bg-orange-400/80 text-white py-4 rounded-full font-medium text-lg shadow-lg mt-12 disabled:opacity-50"
            >
                {isSubmitting ? "Finalizando..." : "Enter My Sanctuary"}
            </button>
        </div>
    );
};

