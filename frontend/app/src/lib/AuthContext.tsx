import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

/** Shape of a row from the `profiles` table. Extend as columns are added. */
export interface UserProfile {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  last_period_start?: string | null;
  cycle_length?: number | null;
  period_duration?: number | null;
  tracks_cycle?: boolean | null;
  onboarding_completed?: boolean | null;
  cognitive_preferences?: string[] | null;
  // Settings fields
  birth_date?: string | null;
  ai_persona?: string | null;
  ai_language?: string | null;
  prefers_clinical_terms?: boolean | null;
  pin_enabled?: boolean | null;
  // Check-in / energy fields
  current_cycle_day?: number | null;
  [key: string]: unknown; // allow extra columns without breaking TS
}

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data as UserProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const signUpWithEmail = async (email: string, password: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: email.split('@')[0] } }
    });
    return { error: error as Error | null };
  };

  const signInWithEmail = async (email: string, password: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{
      session, user, profile, loading,
      signInWithGoogle, signOut, refreshProfile,
      signUpWithEmail, signInWithEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
