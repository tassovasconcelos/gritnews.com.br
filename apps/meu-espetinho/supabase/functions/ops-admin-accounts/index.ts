import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { accountHandler } from './handler.mjs';

const server = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
Deno.serve(accountHandler(server));
