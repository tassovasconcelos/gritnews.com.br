import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
import {createCouncilHandler} from './handler.mjs';
const url=Deno.env.get('SUPABASE_URL')!;
const db=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
Deno.serve(createCouncilHandler({db,createClient,url,anonKey:Deno.env.get('SUPABASE_ANON_KEY')!}));
