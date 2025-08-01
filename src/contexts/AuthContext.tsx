import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/database';
import { Rep } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  currentRep: Rep | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentRep, setCurrentRep] = useState<Rep | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchCurrentRep(session.user.id);
      }

      setLoading(false); // Always stop loading
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchCurrentRep(session.user.id);
      } else {
        setCurrentRep(null);
      }

      setLoading(false); // Always stop loading
    });

    return () => subscription?.unsubscribe();
  }, []);

  const fetchCurrentRep = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('reps')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching current rep:', error);
        setCurrentRep(null);
      } else {
        setCurrentRep(data);
      }
    } catch (error) {
      console.error('Error fetching current rep:', error);
      setCurrentRep(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentRep(null);
  };

  const value = {
    user,
    session,
    currentRep,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
