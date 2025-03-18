import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, signIn, signUp, signOut, getCurrentUser, getSession } from '../services/supabaseService';
import { retryDatabaseSetup } from '../setupDatabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
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
          
          if (currentSession) {
            // Get user data if we have a session
            const { user: currentUser, error: userError } = await getCurrentUser();
            if (userError) {
              console.error('Error getting user:', userError);
            } else {
              setUser(currentUser);
              
              // When user is authenticated, try to set up database tables
              if (currentUser) {
                retryDatabaseSetup().catch(err => {
                  console.error('Error setting up database from auth context:', err);
                });
              }
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
        console.log('Auth state changed:', event, !!newSession);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Try to setup database when auth state changes to signed_in
        if (event === 'SIGNED_IN' && newSession?.user) {
          retryDatabaseSetup().catch(err => {
            console.error('Error setting up database on auth change:', err);
          });
        }
      }
    );

    // Clean up subscription on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Custom sign in handler
  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    
    // If sign in is successful, try to set up database tables
    if (!result.error && result.data?.user) {
      retryDatabaseSetup().catch(err => {
        console.error('Error setting up database after sign in:', err);
      });
    }
    
    return result;
  };

  const value = {
    user,
    session,
    loading,
    signIn: handleSignIn,
    signUp,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 