import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail-fast is handled at app startup via src/lib/config.ts.
  // eslint-disable-next-line no-console
  console.error('Supabase credentials are missing.');
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
