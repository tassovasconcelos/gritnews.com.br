// Módulo de conexão direta Supabase para Node.js / Hostinger
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection(tableName = 'site_settings') {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
      console.log(`[Supabase DB Test] Tabela '${tableName}':`, error.message);
      return { success: false, error: error.message };
    }
    console.log(`[Supabase DB Test] Conexão e consulta na tabela '${tableName}' bem-sucedidas!`, data);
    return { success: true, data };
  } catch (err) {
    console.error('[Supabase DB Test Error]:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { supabase, testConnection };
