import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
let supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Fallback cerdas jika terjadi Next.js dev server caching issue (dimana Webpack meng-cache nilai undefined)
if (!supabaseUrl || !supabaseAnonKey) {
  const isBrowser = typeof window !== 'undefined';
  const isDev = process.env.NODE_ENV === 'development' || (isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
  
  if (isDev) {
    console.log('Supabase: Mengaktifkan local fallback credentials karena cache env kosong.');
    supabaseUrl = 'http://127.0.0.1:54321';
    supabaseAnonKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
    
    // Server-side dev fallback untuk service role key
    if (!isBrowser && !supabaseServiceRoleKey) {
      supabaseServiceRoleKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
    }
  }
}

console.log('Supabase Init Info:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  hasServiceRoleKey: !!supabaseServiceRoleKey,
  isServer: typeof window === 'undefined'
});

// Client standard untuk operasi normal (mengikuti aturan RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client admin untuk operasi backend khusus bypass RLS (misalnya sync data)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
