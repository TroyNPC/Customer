// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const SUPABASE_URL =
  Constants.expoConfig?.extra?.supabaseUrl ||
  process.env.EXPO_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  Constants.expoConfig?.extra?.supabaseServiceRoleKey ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
