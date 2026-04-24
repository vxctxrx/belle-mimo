import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testando conexão com Supabase...');
  const { data, error } = await supabase.from('products').select('*');
  
  if (error) {
    console.error('ERRO AO BUSCAR PRODUTOS:', error.message);
    if (error.code === '42501') {
      console.error('DIAGNÓSTICO: O erro de Permissão Negada (RLS) está bloqueando o acesso.');
    }
  } else {
    console.log(`SUCESSO! ${data.length} produtos encontrados.`);
  }
}

testConnection();
