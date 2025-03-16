import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, signIn, signUp, signOut, getCurrentUser, getSession, signInWithFigma } from '../services/supabaseService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signInWithFigma: () => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  isFigmaConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFigmaConnected, setIsFigmaConnected] = useState(false);

  useEffect(() => {
    // Check for active session on mount
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const { session: currentSession, error: sessionError } = await getSession();
        if (sessionError) {
          console.error('Error getting session:', sessionError);
        } else {
          setSession(currentSession);
          
          // Check if the user is connected to Figma
          setIsFigmaConnected(!!currentSession?.provider_token);
          
          if (currentSession) {
            // Get user data if we have a session
            const { user: currentUser, error: userError } = await getCurrentUser();
            if (userError) {
              console.error('Error getting user:', userError);
            } else {
              setUser(currentUser);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsFigmaConnected(!!newSession?.provider_token);
      }
    );

    // Clean up subscription on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithFigma,
    signOut,
    isFigmaConnected
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 