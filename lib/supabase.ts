import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import type { Database } from './database.types';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);