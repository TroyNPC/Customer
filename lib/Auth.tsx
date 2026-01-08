import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

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

  // Single function to update auth state and handle navigation
  const updateAuthState = async (newState: AuthState) => {
    console.log('LOG Updating auth state:', newState);
    setAuthState(newState);
    
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Error persisting auth state:', error);
    }

    // Handle navigation based on new state
    if (newState.isLoggedIn && !isLoading) {
      console.log('Navigating to map screen');
      router.replace('/(tabs)/map');
    }
  };

  const clearAuthStorage = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing auth storage:', error);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await clearAuthStorage();
      setAuthState({ isLoggedIn: false, isGuest: false, user: null });
      router.replace('/(auth)/title');
    }
  };

  const loginAsGuest = async () => {
    await updateAuthState({ isLoggedIn: true, isGuest: true, user: null });
  };

  const setUserLoggedIn = async (userData: User) => {
    await updateAuthState({ isLoggedIn: true, isGuest: false, user: userData });
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (error) throw error;
      
      // IMPORTANT: Update auth state immediately
      if (data.user) {
        await updateAuthState({ 
          isLoggedIn: true, 
          isGuest: false, 
          user: data.user 
        });
      }
      
      console.log('Sign in successful, user logged in');
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });
      
      if (error) throw error;
      
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        if (!mounted) return;
        
        console.log('Initializing auth...');
        
        // Check for guest session first (simpler)
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored && mounted) {
          const parsedState: AuthState = JSON.parse(stored);
          if (parsedState.isGuest && parsedState.isLoggedIn) {
            console.log('Restoring guest session from storage');
            setAuthState(parsedState);
            setIsLoading(false);
            return;
          }
        }

        // Check for Supabase session
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session check error:', error);
          }

          if (session?.user && mounted) {
            console.log('Found valid Supabase session, logging in user');
            await updateAuthState({ 
              isLoggedIn: true, 
              isGuest: false, 
              user: session.user 
            });
          } else {
            // No valid session found
            console.log('No valid session found');
            setAuthState({ isLoggedIn: false, isGuest: false, user: null });
          }
        } catch (sessionError) {
          console.error('Supabase session error:', sessionError);
          setAuthState({ isLoggedIn: false, isGuest: false, user: null });
        }
        
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setAuthState({ isLoggedIn: false, isGuest: false, user: null });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Set up auth state change listener (for syncing across tabs/devices)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event, 'Session:', session);
        
        try {
          switch (event) {
            case 'SIGNED_IN':
              // Already handled in signIn function, but keep for external logins
              if (session?.user && !authState.isLoggedIn) {
                console.log('External sign in detected');
                await updateAuthState({ 
                  isLoggedIn: true, 
                  isGuest: false, 
                  user: session.user 
                });
              }
              break;
            case 'SIGNED_OUT':
              console.log('User signed out');
              await clearAuthStorage();
              setAuthState({ isLoggedIn: false, isGuest: false, user: null });
              router.replace('/(auth)/title');
              break;
            case 'TOKEN_REFRESHED':
              if (session?.user) {
                console.log('Token refreshed');
                await updateAuthState({ 
                  isLoggedIn: true, 
                  isGuest: false, 
                  user: session.user 
                });
              }
              break;
            case 'USER_UPDATED':
              if (session?.user) {
                console.log('User updated');
                await updateAuthState({ 
                  isLoggedIn: true, 
                  isGuest: false, 
                  user: session.user 
                });
              }
              break;
          }
        } catch (error) {
          console.error('Error in auth state change handler:', error);
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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