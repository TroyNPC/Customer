import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import type { Database } from './database.types';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ← Add this import

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // ← Add this
    autoRefreshToken: true, // ← Add this
    persistSession: true, // ← Add this
    detectSessionInUrl: false, // ← Add this
  },
});