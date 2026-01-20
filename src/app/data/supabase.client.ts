import { createClient } from '@supabase/supabase-js';

import { environment } from '../../environments/environment';

export const supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
  auth: {
    // This app is read-only; avoid auth side effects in the URL/storage.
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

