import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
// For write operations (upsert, insert, update), always use service_role key to bypass RLS
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);

// Write client always bypasses RLS via service_role key
export const supabaseWrite = createClient(supabaseUrl, supabaseServiceKey, clientOptions);
