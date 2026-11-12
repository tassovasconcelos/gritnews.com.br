import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
import {createFaroWorker} from './handler.mjs';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
Deno.serve(createFaroWorker({db}));
