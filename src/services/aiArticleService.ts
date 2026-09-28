// ---------------------------------------------------------------------------
// aiArticleService.ts
// Serviço de geração semiautomatizada de artigos com IA multimodal.
//
// Suporta múltiplos provedores configuráveis pelo administrador:
// - Google Gemini (nativo)
// - OpenRouter (roteador multi-modelo)
// - OpenAI (GPT-4o / GPT-4o-mini)
// - Anthropic Claude (Claude 3.5 Sonnet / Haiku)
// ---------------------------------------------------------------------------

export type ArticleTone = 'Técnico' | 'Analítico' | 'Didático';

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

const STORAGE_KEY = 'izycolors_ai_api_config';

/** Carrega as configurações de IA salvas ou retorna os padrões. */
export function getAiConfig(): AiApiConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AiApiConfig>;
      return { ...DEFAULT_AI_CONFIG, ...parsed };
    }
  } catch {
    // Fallback silencioso
  }
  return DEFAULT_AI_CONFIG;
}

/** Salva as configurações de IA no localStorage. */
export function saveAiConfig(config: AiApiConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export interface AiArticleReference {
  id: string;
  /** URL de referência ou transcrição/trecho colado pelo autor. */
  value: string;
}

export interface AiArticleImage {
  id: string;
  name: string;
  mimeType: string;
  /** Conteúdo da imagem codificado em Base64 (sem o prefixo "data:...;base64,"). */
  base64: string;
}

export interface AiArticlePayload {
  theme: string;
  thesis: string;
  references: AiArticleReference[];
  images: AiArticleImage[];
  tone: ArticleTone;
  length: ArticleLength;
}

export interface AiArticleResponse {
  title: string;
  slug: string;
  metaDescription: string;
  excerpt: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Configuração do modelo e orientações
// ---------------------------------------------------------------------------

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

const TONE_GUIDANCE: Record<ArticleTone, string> = {
  'Técnico': 'tom técnico e preciso, com vocabulário especializado em cor, design e acessibilidade',
  'Analítico': 'tom analítico e crítico, comparando abordagens, evidenciando trade-offs e extraindo conclusões próprias',
  'Didático': 'tom didático e acessível, explicando conceitos passo a passo para quem está começando'
};

const LENGTH_GUIDANCE: Record<ArticleLength, string> = {
  'Curto': 'artigo curto, entre 600 e 900 palavras',
  'Médio': 'artigo de extensão média, entre 1.100 e 1.500 palavras',
  'Longo': 'artigo longo e aprofundado, entre 1.800 e 2.600 palavras'
};

// ---------------------------------------------------------------------------
// Construção dos prompts
// ---------------------------------------------------------------------------

function buildSystemPrompt(payload: AiArticlePayload): string {
  return [
    'Você é um editor sênior de conteúdo técnico do blog IzyColors, especializado em teoria da cor, design systems, acessibilidade (WCAG) e engenharia de software.',
    'Sua missão é transformar as diretrizes, referências e imagens fornecidas pelo autor em um artigo original, estruturado e pronto para publicação.',
    '',
    'REGRAS DE ANÁLISE:',
    '- Analise profundamente todas as imagens fornecidas (capturas de tela, gráficos, diagramas, tabelas). Extraia dados visuais, valores, tendências e correlações e cite-os organicamente no texto (ex.: "como mostra o gráfico de contraste na imagem de referência").',
    '- Sintetize as ideias dos links e transcrições fornecidos sem copiar trechos literais. Evite clichês corporativos vazios e jargão genérico.',
    '- Produza conteúdo original, com argumentação própria e dados concretos.',
    '',
    'REGRAS DE FORMATO DA RESPOSTA:',
    '- Responda APENAS com um JSON válido (sem markdown, sem comentários) contendo exatamente estas chaves:',
    '  - "title": título otimizado para SEO e CTR (claro, específico, com palavra-chave).',
    '  - "slug": URL amigável derivada do título (minúsculas, sem acentos, palavras separadas por hifens).',
    '  - "metaDescription": descrição para mecanismos de busca com até 160 caracteres.',
    '  - "excerpt": resumo introdutório de 2 a 3 frases para cartões e listagens.',
    '  - "content": conteúdo completo em Markdown.',
    '- O "content" deve:',
    '  - Usar títulos H2 (##) e H3 (###) para estruturar as seções.',
    '  - Incluir pelo menos uma tabela Markdown quando houver dados comparáveis.',
    '  - Usar APENAS hifens (-) para itens de lista, nunca asteriscos ou números.',
    '  - Ser escrito em português do Brasil.',
    '',
    'REGRAS DE ESTILO:',
    `- Tom de voz: ${TONE_GUIDANCE[payload.tone]}.`,
    `- Extensão: ${LENGTH_GUIDANCE[payload.length]}.`,
    '- Título, slug, metaDescription, excerpt e content devem ser coerentes entre si.'
  ].join('\n');
}

function buildUserPrompt(payload: AiArticlePayload): string {
  const referencesBlock = payload.references.length > 0
    ? payload.references.map((ref, index) => `${index + 1}. ${ref.value}`).join('\n')
    : 'Nenhuma referência fornecida.';

  const imageNote = payload.images.length > 0
    ? `Foram anexadas ${payload.images.length} imagem(ns). Analise os dados visuais presentes e incorpore-os naturalmente ao artigo.`
    : 'Nenhuma imagem anexada.';

  return [
    'DIRETRIZES DO AUTOR',
    `Tema central: ${payload.theme || 'Não informado'}`,
    `Tese e ideias principais: ${payload.thesis || 'Não informado'}`,
    '',
    'REFERÊNCIAS FORNECIDAS',
    referencesBlock,
    '',
    'OBSERVAÇÕES',
    imageNote
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Extração e validação da resposta JSON
// ---------------------------------------------------------------------------

const FENCED_JSON_PATTERN = /```(?:json)?([\s\S]*?)```/i;

function extractJsonFromText(rawText: string): unknown {
  const trimmed = rawText.trim();
  const fenced = FENCED_JSON_PATTERN.exec(trimmed);
  const candidate = fenced ? fenced[1].trim() : trimmed;

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('A IA retornou uma resposta sem JSON estruturado.');
  }

  return JSON.parse(candidate.slice(start, end + 1));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeResponse(value: unknown): AiArticleResponse {
  if (!isRecord(value)) {
    throw new Error('A resposta da IA não está no formato esperado.');
  }

  const content = asString(value.content, '');
  const fallbackTitle = asString(value.title, 'Artigo gerado por IA');

  return {
    title: fallbackTitle,
    slug: asString(value.slug, ''),
    metaDescription: asString(value.metaDescription, '').slice(0, 160),
    excerpt: asString(value.excerpt, ''),
    content
  };
}

// ---------------------------------------------------------------------------
// Chamadas aos Provedores de IA
// ---------------------------------------------------------------------------

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiResponseBody {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  error?: { message?: string };
}

async function callGeminiApi(payload: AiArticlePayload, apiKey: string, model: string): Promise<AiArticleResponse> {
  const url = `${GEMINI_ENDPOINT}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const parts: GeminiPart[] = [{ text: buildUserPrompt(payload) }];
  for (const image of payload.images) {
    parts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.base64
      }
    });
  }

  const body = {
    systemInstruction: { parts: [{ text: buildSystemPrompt(payload) }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json'
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let apiMessage = `HTTP ${response.status}`;
    try {
      const errorBody = (await response.json()) as GeminiResponseBody;
      if (errorBody.error?.message) {
        apiMessage = errorBody.error.message;
      }
    } catch {
      // Ignora falha de parse
    }
    throw new Error(`Erro na API Gemini (${apiMessage}).`);
  }

  const data = (await response.json()) as GeminiResponseBody;
  const generatedText = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';

  if (!generatedText.trim()) {
    throw new Error('A API Gemini não retornou conteúdo.');
  }

  const parsed = extractJsonFromText(generatedText);
  return normalizeResponse(parsed);
}

async function callOpenRouterApi(payload: AiArticlePayload, apiKey: string, model: string): Promise<AiArticleResponse> {
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const userContent: unknown[] = [{ type: 'text', text: buildUserPrompt(payload) }];
  for (const image of payload.images) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:${image.mimeType};base64,${image.base64}` }
    });
  }

  const body = {
    model: model || 'google/gemini-2.0-flash-001',
    messages: [
      { role: 'system', content: buildSystemPrompt(payload) },
      { role: 'user', content: userContent }
    ],
    response_format: { type: 'json_object' }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://izycolors.com',
      'X-Title': 'IzyColors Studio'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      if (err.error?.message) msg = err.error.message;
    } catch {
      // ignore
    }
    throw new Error(`Erro na API OpenRouter (${msg}).`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  if (!text.trim()) {
    throw new Error('OpenRouter não retornou conteúdo.');
  }

  const parsed = extractJsonFromText(text);
  return normalizeResponse(parsed);
}

async function callOpenAiApi(payload: AiArticlePayload, apiKey: string, model: string): Promise<AiArticleResponse> {
  const url = 'https://api.openai.com/v1/chat/completions';

  const userContent: unknown[] = [{ type: 'text', text: buildUserPrompt(payload) }];
  for (const image of payload.images) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:${image.mimeType};base64,${image.base64}` }
    });
  }

  const body = {
    model: model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: buildSystemPrompt(payload) },
      { role: 'user', content: userContent }
    ],
    response_format: { type: 'json_object' }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      if (err.error?.message) msg = err.error.message;
    } catch {
      // ignore
    }
    throw new Error(`Erro na API OpenAI (${msg}).`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  if (!text.trim()) {
    throw new Error('OpenAI não retornou conteúdo.');
  }

  const parsed = extractJsonFromText(text);
  return normalizeResponse(parsed);
}

async function callClaudeApi(payload: AiArticlePayload, apiKey: string, model: string): Promise<AiArticleResponse> {
  const url = 'https://api.anthropic.com/v1/messages';

  const userContent: unknown[] = [{ type: 'text', text: buildUserPrompt(payload) }];
  for (const image of payload.images) {
    userContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: image.mimeType,
        data: image.base64
      }
    });
  }

  const body = {
    model: model || 'claude-3-5-sonnet-20241022',
    max_tokens: 8192,
    system: buildSystemPrompt(payload),
    messages: [{ role: 'user', content: userContent }]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      if (err.error?.message) msg = err.error.message;
    } catch {
      // ignore
    }
    throw new Error(`Erro na API Anthropic Claude (${msg}).`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  if (!text.trim()) {
    throw new Error('Claude não retornou conteúdo.');
  }

  const parsed = extractJsonFromText(text);
  return normalizeResponse(parsed);
}

// ---------------------------------------------------------------------------
// Teste de Conexão com os Provedores
// ---------------------------------------------------------------------------

export async function testAiConnection(
  provider: AiProvider,
  apiKey: string,
  model: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (provider === 'gemini') {
      const url = `${GEMINI_ENDPOINT}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Responda exatamente: CONEXAO_OK' }] }]
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return { success: true, message: `Conexão bem-sucedida com Gemini (${model})` };
    }

    if (provider === 'openrouter') {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Responda OK' }],
          max_tokens: 10
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return { success: true, message: `Conexão bem-sucedida com OpenRouter (${model})` };
    }

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Responda OK' }],
          max_tokens: 10
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return { success: true, message: `Conexão bem-sucedida com OpenAI (${model})` };
    }

    if (provider === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Responda OK' }]
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return { success: true, message: `Conexão bem-sucedida com Claude (${model})` };
    }

    return { success: false, message: 'Provedor desconhecido.' };
  } catch (err) {
    return {
      success: false,
      message: `Falha na conexão: ${err instanceof Error ? err.message : 'Erro de rede.'}`
    };
  }
}

// ---------------------------------------------------------------------------
// API pública de geração
// ---------------------------------------------------------------------------

export async function generateAiArticle(payload: AiArticlePayload): Promise<AiArticleResponse> {
  if (!payload.theme.trim() && !payload.thesis.trim() && payload.references.length === 0) {
    throw new Error('Forneça ao menos um tema, uma tese ou uma referência antes de gerar.');
  }

  const config = getAiConfig();
  const provider = config.activeProvider;

  if (provider === 'openrouter') {
    const key = config.openrouterApiKey.trim();
    if (!key) {
      throw new Error('Chave de API OpenRouter não configurada. Configure em Perfil -> Configurações (Admin).');
    }
    return callOpenRouterApi(payload, key, config.openrouterModel.trim());
  }

  if (provider === 'openai') {
    const key = config.openaiApiKey.trim();
    if (!key) {
      throw new Error('Chave de API OpenAI não configurada. Configure em Perfil -> Configurações (Admin).');
    }
    return callOpenAiApi(payload, key, config.openaiModel.trim());
  }

  if (provider === 'claude') {
    const key = config.claudeApiKey.trim();
    if (!key) {
      throw new Error('Chave de API Claude (Anthropic) não configurada. Configure em Perfil -> Configurações (Admin).');
    }
    return callClaudeApi(payload, key, config.claudeModel.trim());
  }

  // Padrão: Gemini
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || (import.meta.env.GEMINI_API_KEY as string) || '';
  const key = (config.geminiApiKey || envKey).trim();
  if (!key) {
    throw new Error(
      'Chave de API Gemini não configurada. Defina VITE_GEMINI_API_KEY no ambiente ou configure em Perfil -> Configurações (Admin).'
    );
  }

  const model = (config.geminiModel || DEFAULT_AI_CONFIG.geminiModel).trim();
  return callGeminiApi(payload, key, model);
}

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
