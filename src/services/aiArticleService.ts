// ---------------------------------------------------------------------------
// aiArticleService.ts
// ---------------------------------------------------------------------------
// Geração semiautomatizada de artigos com IA multimodal.
//
// Mudança de arquitetura: a geração NÃO acontece mais no navegador.
// Anteriormente as chaves dos provedores viviam em localStorage e eram usadas
// em `fetch` direto do cliente — qualquer pessoa com o DevTools aberto podia
// lê-las. Agora:
//
//   · a configuração fica em `ai_settings`, com RLS exclusiva de admin;
//   · a chamada ao provedor acontece na Edge Function `ai-generate-article`,
//     que usa a service role no servidor;
//   · a chave nunca é lida pelo código que roda na máquina do usuário comum.
// ---------------------------------------------------------------------------

import { getSupabaseClient } from './supabase';

export type ArticleTone =
  | 'Técnico & Engenharia'
  | 'Crítica de Design & Editorial'
  | 'Didático & Passo a Passo'
  | 'Estudo de Caso de Produto'
  | 'Manifesto Minimalista'
  | 'Personalizado';

export type ArticleLanguage =
  | 'Português (Brasil)'
  | 'Inglês (US)'
  | 'Espanhol'
  | 'Francês'
  | 'Alemão';

export type ArticleLength = 'Curto' | 'Médio' | 'Longo';

export type AiProvider = 'gemini' | 'openrouter' | 'openai' | 'claude';

export interface AiApiConfig {
  activeProvider: AiProvider;
  geminiApiKey: string;
  geminiModel: string;
  openrouterApiKey: string;
  openrouterModel: string;
  openaiApiKey: string;
  openaiModel: string;
  claudeApiKey: string;
  claudeModel: string;
}

export const DEFAULT_AI_CONFIG: AiApiConfig = {
  activeProvider: 'gemini',
  geminiApiKey: '',
  geminiModel: 'gemini-2.0-flash',
  openrouterApiKey: '',
  openrouterModel: 'google/gemini-2.0-flash-001',
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  claudeApiKey: '',
  claudeModel: 'claude-3-5-sonnet-20241022'
};

export const AI_FUNCTION_NAME = 'ai-generate-article';

export interface AiArticleReference {
  id: string;
  /** URL de referência ou transcrição/trecho colado pelo autor. */
  value: string;
}

export interface AiArticleImage {
  id: string;
  name: string;
  mimeType: string;
  /** Conteúdo da imagem em Base64, SEM o prefixo "data:...;base64,". */
  base64: string;
}

export interface AiArticlePayload {
  theme: string;
  thesis: string;
  references: AiArticleReference[];
  images: AiArticleImage[];
  tone: ArticleTone;
  customTone?: string;
  language: ArticleLanguage;
  length: ArticleLength;
}

export interface AiArticleResponse {
  title: string;
  slug: string;
  metaDescription: string;
  excerpt: string;
  content: string;
}

const AI_SETTINGS_COLUMNS =
  'active_provider, gemini_api_key, gemini_model, openrouter_api_key, openrouter_model, openai_api_key, openai_model, claude_api_key, claude_model';

// ---------------------------------------------------------------------------
// Configuração (somente administradores — garantido pela RLS do banco)
// ---------------------------------------------------------------------------

/**
 * Carrega a configuração de IA do banco.
 * Lança quando a RLS negar o acesso, sinalizando que o usuário não é admin.
 */
export async function loadAiConfig(): Promise<AiApiConfig> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('ai_settings')
    .select(AI_SETTINGS_COLUMNS)
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Acesso negado às configurações de IA: ${error.message}`
    );
  }
  if (!data) {
    return { ...DEFAULT_AI_CONFIG };
  }

  const row = data as Record<string, string>;
  return {
    activeProvider: (row.active_provider as AiProvider) ?? 'gemini',
    geminiApiKey: row.gemini_api_key ?? '',
    geminiModel: row.gemini_model ?? DEFAULT_AI_CONFIG.geminiModel,
    openrouterApiKey: row.openrouter_api_key ?? '',
    openrouterModel: row.openrouter_model ?? DEFAULT_AI_CONFIG.openrouterModel,
    openaiApiKey: row.openai_api_key ?? '',
    openaiModel: row.openai_model ?? DEFAULT_AI_CONFIG.openaiModel,
    claudeApiKey: row.claude_api_key ?? '',
    claudeModel: row.claude_model ?? DEFAULT_AI_CONFIG.claudeModel
  };
}

/**
 * Persiste a configuração de IA.
 *
 * Chaves em branco não sobrescrevem o valor existente: o campo vazio significa
 * "não altere", evitando apagar acidentalmente uma credencial já configurada.
 */
export async function saveAiConfig(config: AiApiConfig): Promise<void> {
  const supabase = getSupabaseClient();

  const payload: Record<string, string> = {
    active_provider: config.activeProvider
  };

  const optional: Array<[keyof AiApiConfig, string]> = [
    ['geminiApiKey', 'gemini_api_key'],
    ['geminiModel', 'gemini_model'],
    ['openrouterApiKey', 'openrouter_api_key'],
    ['openrouterModel', 'openrouter_model'],
    ['openaiApiKey', 'openai_api_key'],
    ['openaiModel', 'openai_model'],
    ['claudeApiKey', 'claude_api_key'],
    ['claudeModel', 'claude_model']
  ];

  for (const [field, column] of optional) {
    const value = (config[field] ?? '').toString();
    if (field.endsWith('ApiKey')) {
      if (value.trim()) payload[column] = value.trim();
    } else if (value.trim()) {
      payload[column] = value.trim();
    }
  }

  const { error } = await supabase.from('ai_settings').update(payload).eq('id', 1);
  if (error) {
    throw new Error(`Falha ao salvar a configuração de IA: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Invocação da Edge Function
// ---------------------------------------------------------------------------

function readFunctionError(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const value = (payload as { error?: unknown }).error;
    if (typeof value === 'string' && value.trim()) return value;
  }
  return fallback;
}

/**
 * Gera o artigo no servidor.
 * O provedor ativo e a chave são resolvidos pela Edge Function a partir de
 * `ai_settings` — o cliente não envia credenciais.
 */
export async function generateAiArticle(payload: AiArticlePayload): Promise<AiArticleResponse> {
  if (!payload.theme.trim() && !payload.thesis.trim() && payload.references.length === 0) {
    throw new Error('Forneça ao menos um tema, uma tese ou uma referência antes de gerar.');
  }

  const { data, error } = await getSupabaseClient().functions.invoke(AI_FUNCTION_NAME, {
    body: { mode: 'generate', payload }
  });

  if (error) {
    throw new Error(`Falha ao acionar a Edge Function: ${error.message}`);
  }

  const result = data as AiArticleResponse | { error?: string };
  if (!result || typeof result !== 'object') {
    throw new Error('A Edge Function não retornou conteúdo válido.');
  }
  if ('error' in result && result.error) {
    throw new Error(readFunctionError(result, 'Erro na geração do artigo.'));
  }
  if (!('content' in result)) {
    throw new Error('A Edge Function não retornou conteúdo válido.');
  }

  return result as AiArticleResponse;
}

/**
 * Testa a conectividade com um provedor.
 * A chave é enviada apenas para o servidor; ela nunca é persistida aqui.
 */
export async function testAiConnection(
  provider: AiProvider,
  apiKey: string,
  model: string
): Promise<{ success: boolean; message: string }> {
  const { data, error } = await getSupabaseClient().functions.invoke(AI_FUNCTION_NAME, {
    body: { mode: 'test', provider, apiKey: apiKey.trim(), model: model.trim() }
  });

  if (error) {
    return { success: false, message: `Falha ao acionar a Edge Function: ${error.message}` };
  }

  const result = data as { success?: boolean; message?: string; error?: string };
  if (!result || typeof result !== 'object') {
    return { success: false, message: 'Resposta inválida da Edge Function.' };
  }
  if (result.error) {
    return { success: false, message: result.error };
  }
  return {
    success: Boolean(result.success),
    message: result.message || (result.success ? 'Conexão bem-sucedida.' : 'Falha na conexão.')
  };
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Converte um título em slug amigável (minúsculas, sem acentos, hifens). */
export function slugifyArticle(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, 80);

  let end = slug.length;
  while (end > 0 && slug[end - 1] === '-') {
    end--;
  }

  return slug.slice(0, end);
}
