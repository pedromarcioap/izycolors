import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Bootstrap do cliente Supabase.
 *
 * A configuração vem exclusivamente das variáveis de ambiente do Vite.
 * Anteriormente existia um override persistido em localStorage
 * (`chromatica_supabase_custom_credentials_v1`) que permitia trocar de projeto
 * em tempo de execução; isso foi removido junto com o restante do mock.
 */

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

/** Indica se as credenciais públicas do projeto foram configuradas no ambiente. */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY);
}

/**
 * URL e chave anon do projeto, para exibição em interfaces de status.
 * Nunca exponha a `service_role` aqui: ela pertence ao servidor.
 */
export function getSupabaseCredentials(): { url: string; key: string; isConfigured: boolean } {
  const isConfigured = isSupabaseConfigured();
  return { url: SUPABASE_URL, key: SUPABASE_ANON_KEY, isConfigured };
}

let cachedClient: SupabaseClient | null = null;

/**
 * Retorna o cliente Supabase compartilhado.
 *
 * Lança quando o projeto não está configurado: a aplicação deixa de ter um
 * caminho de fallback local, portanto silenciar a falha produziria um estado
 * inconsistente (dados exibidos que não foram realmente persistidos).
 */
export function getSupabaseClient(): SupabaseClient {
  if (!cachedClient) {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local.'
      );
    }
    cachedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return cachedClient;
}
