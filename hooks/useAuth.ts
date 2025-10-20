import { supabaseClient } from "@/lib/supabaseClient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from "react";

// Global state with persistence keys
const AUTH_STORAGE_KEY = 'auth_state';

interface AuthState {
  isLoggedIn: boolean;
  isGuest: boolean;
  user: User | null;
}

// Initial state
let authState: AuthState = {
  isLoggedIn: false,
  isGuest: false,
  user: null
};

const listeners = new Set<(state: AuthState) => void>();

export const useAuth = () => {
  const [loggedIn, setLoggedIn] = useState(authState.isLoggedIn);
  const [guest, setGuest] = useState(authState.isGuest);
  const [user, setUser] = useState<User | null>(authState.user);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted state on hook initialization
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsedState: AuthState = JSON.parse(stored);
          authState = parsedState;
          setLoggedIn(parsedState.isLoggedIn);
          setGuest(parsedState.isGuest);
          setUser(parsedState.user);
          console.log('Loaded persisted auth state:', parsedState);
        }
      } catch (error) {
        console.error('Error loading persisted auth state:', error);
      }
    };

    loadPersistedState();
  }, []);

  const updateLogin = async (value: boolean, guestMode = false, userData: User | null = null) => {
    authState = {
      isLoggedIn: value,
      isGuest: guestMode,
      user: userData
    };
    
    console.log('Auth state updated:', authState);
    
    // Persist to storage
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
    } catch (error) {
      console.error('Error persisting auth state:', error);
    }
    
    // Notify all listeners
    listeners.forEach((fn) => fn(authState));
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      await supabaseClient.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await updateLogin(false, false, null);
    }
  };

  const loginAsGuest = async () => {
    console.log('Setting guest mode');
    await updateLogin(true, true, null);
  };

  const setUserLoggedIn = async (userData: User) => {
    console.log('Setting user logged in:', userData.email);
    await updateLogin(true, false, userData);
  };

  useEffect(() => {
    let subscription: { unsubscribe: () => void };
    
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        console.log('Checking initial auth state...');
        
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) {
          console.error('Initial auth check error:', error);
          await updateLogin(false, false, null);
          return;
        }
        
        if (session?.user) {
          console.log('User already logged in:', session.user.email);
          await updateLogin(true, false, session.user);
        } else {
          console.log('No user logged in');
          // Only update if we're not in guest mode
          if (!authState.isGuest) {
            await updateLogin(false, false, null);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        await updateLogin(false, false, null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    try {
      const { data: { subscription: authSubscription } } = supabaseClient.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);
          
          switch (event) {
            case 'SIGNED_IN':
              if (session) {
                await updateLogin(true, false, session.user);
              }
              break;
            case 'SIGNED_OUT':
              await updateLogin(false, false, null);
              break;
            case 'USER_UPDATED':
              if (session) {
                await updateLogin(true, false, session.user);
              }
              break;
          }
          setIsLoading(false);
        }
      );
      
      subscription = authSubscription;
    } catch (error) {
      console.error('Error setting up auth listener:', error);
    }

    // Subscribe to login state changes
    const listener = (state: AuthState) => {
      setLoggedIn(state.isLoggedIn);
      setGuest(state.isGuest);
      setUser(state.user);
    };
    
    listeners.add(listener);

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      listeners.delete(listener);
    };
  }, []);

  return { 
    loggedIn, 
    guest, 
    user,
    isLoading,
    loginAsGuest,
    setUserLoggedIn,
    logout 
  };
};