import { Session, User } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabaseClient } from './supabaseClient';

// Define the auth context type
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; data: any }>;
  signUp: (email: string, password: string, userData: { full_name: string; phone: string }) => Promise<{ error: any; data: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any; data: any }>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle user creation/update in profiles table
        if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          await handleUserProfile(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Handle user profile creation/update
  const handleUserProfile = async (user: User) => {
    try {
      const { data: existingUser, error: fetchError } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user profile:', fetchError);
        return;
      }

      if (!existingUser) {
        // Create new user profile
        const { error: insertError } = await supabaseClient
          .from('users')
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || '',
            phone: user.user_metadata?.phone || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creating user profile:', insertError);
        }

        // Assign customer role
        const { data: customerRole } = await supabaseClient
          .from('roles')
          .select('id')
          .eq('name', 'customer')
          .single();

        if (customerRole) {
          await supabaseClient
            .from('user_roles')
            .insert({
              user_id: user.id,
              role_id: customerRole.id
            });
        }
      }
    } catch (error) {
      console.error('Error in handleUserProfile:', error);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, userData: { full_name: string; phone: string }) => {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            phone: userData.phone,
          },
        },
      });

      if (error) {
        return { data: null, error };
      }

      // User profile will be created automatically via the auth trigger
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: 'yourapp://reset-password', // Replace with your app's deep link
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  // ✅ ADD THIS RETURN STATEMENT
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}