import { createClient } from '@supabase/supabase-js';

// .trim() removes any invisible spaces causing the network error
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY.trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);