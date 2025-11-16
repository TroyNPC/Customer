import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router'; // ← Add this import

const AUTH_STORAGE_KEY = 'auth_state';

interface AuthState {
  isLoggedIn: boolean;
  isGuest: boolean;
  user: User | null;
}

interface AuthContextType {
  loggedIn: boolean;
  guest: boolean;
  user: User | null;
  isLoading: boolean;
  loginAsGuest: () => Promise<void>;
  setUserLoggedIn: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    isGuest: false,
    user: null
  });
  const [isLoading, setIsLoading] = useState(true);

  const updateLogin = async (value: boolean, guestMode = false, userData: User | null = null) => {
    const newState = {
      isLoggedIn: value,
      isGuest: guestMode,
      user: userData
    };
    
    setAuthState(newState);
    
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Error persisting auth state:', error);
    }

    // Navigate to map after login state changes
     setTimeout(() => {
    if (value && !isLoading) {
      router.replace('/(tabs)/map');
    }
  }, 100);
};

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await updateLogin(false, false, null);
      // Optionally navigate to login screen after logout
      router.replace('/(auth)/title');
    }
  };

  const loginAsGuest = async () => {
    await updateLogin(true, true, null);
  };

  const setUserLoggedIn = async (userData: User) => {
    await updateLogin(true, false, userData);
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.user) await setUserLoggedIn(data.user);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });
    if (error) throw error;
    if (data.user) await setUserLoggedIn(data.user);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Load persisted state
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsedState: AuthState = JSON.parse(stored);
          setAuthState(parsedState);
        }

        // Check current session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await setUserLoggedIn(session.user);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            switch (event) {
              case 'SIGNED_IN':
                if (session) await setUserLoggedIn(session.user);
                break;
              case 'SIGNED_OUT':
                await updateLogin(false, false, null);
                break;
            }
            setIsLoading(false);
          }
        );

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      loggedIn: authState.isLoggedIn,
      guest: authState.isGuest,
      user: authState.user,
      isLoading,
      loginAsGuest,
      setUserLoggedIn,
      logout,
      signIn,
      signUp
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};