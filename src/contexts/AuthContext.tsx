import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/database';

interface Rep {
  id: string;
  name: string;
  surname: string;
  email: string;
  region: string;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  currentRep: Rep | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentRep, setCurrentRep] = useState<Rep | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCurrentRep(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchCurrentRep(session.user.id);
      } else {
        setCurrentRep(null);
      }
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

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
    currentRep,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
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