// ---------------------------------------------------------------------------
// aiArticleService.ts
// Serviço de geração semiautomatizada de artigos com IA multimodal.
//
// Implementa a integração com o modelo configurado no projeto (Gemini / Google
// Gen AI) através do endpoint REST oficial, sem dependências adicionais de SDK.
// O payload aceita texto (diretrizes + referências) e imagens em Base64, e o
// modelo responde em JSON estruturado no formato AiArticleResponse.
// ---------------------------------------------------------------------------

export type ArticleTone = 'Técnico' | 'Analítico' | 'Didático';

export type ArticleLength = 'Curto' | 'Médio' | 'Longo';

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
// Tipos internos do contrato REST do Gemini (subset estritamente tipado).
// ---------------------------------------------------------------------------

interface GeminiInlineData {
    mimeType: string;
    data: string;
}

interface GeminiPart {
    text?: string;
    inlineData?: GeminiInlineData;
}

interface GeminiContent {
    role: 'user' | 'model';
    parts: GeminiPart[];
}

interface GeminiRequestBody {
    systemInstruction: { parts: { text: string }[] };
    contents: GeminiContent[];
    generationConfig: {
        temperature: number;
        maxOutputTokens: number;
        responseMimeType: string;
    };
}

interface GeminiResponseBody {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
}

// ---------------------------------------------------------------------------
// Configuração do modelo
// ---------------------------------------------------------------------------

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.0-flash';

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

function getApiKey(): string {
    const viteKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    const bareKey = import.meta.env.GEMINI_API_KEY as string | undefined;
    return (viteKey || bareKey || '').trim();
}

function getModelName(): string {
    const configured = import.meta.env.VITE_GEMINI_MODEL as string | undefined;
    return (configured || DEFAULT_MODEL).trim();
}

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

// A cerca de abertura pode ser ``` ou ```json (case-insensitive). Os tokens
// intermediários de whitespace (`[ \t]*`, `\r?\n?`) foram removidos porque
// sobrepunham o `[\s\S]*?` do grupo de captura, causando backtracking
// super-linear (sonar typescript:S8786). O `[\s\S]*?` já consome qualquer
// espaçamento/quebra de linha entre a cerca e o JSON, e o `.trim()` posterior
// remove o excesso capturado, mantendo o comportamento original.
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
// Chamada à API
// ---------------------------------------------------------------------------

async function callGeminiApi(payload: AiArticlePayload): Promise<AiArticleResponse> {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error(
            'Chave de API Gemini não configurada. Defina VITE_GEMINI_API_KEY (ou GEMINI_API_KEY) no ambiente.'
        );
    }

    const model = getModelName();
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

    const body: GeminiRequestBody = {
        systemInstruction: {
            parts: [{ text: buildSystemPrompt(payload) }]
        },
        contents: [{ role: 'user', parts }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json'
        }
    };

    let response: Response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    } catch (err) {
        throw new Error('Falha de rede ao contactar a API de IA. Verifique sua conexão.');
    }

    if (!response.ok) {
        let apiMessage = `HTTP ${response.status}`;
        try {
            const errorBody = (await response.json()) as GeminiResponseBody;
            if (errorBody.error?.message) {
                apiMessage = errorBody.error.message;
            }
        } catch {
            // Corpo de erro não-JSON: mantém a mensagem padrão.
        }
        throw new Error(`Erro na API de IA (${apiMessage}).`);
    }

    const data = (await response.json()) as GeminiResponseBody;
    const generatedText = data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || '')
        .join('') || '';

    if (!generatedText.trim()) {
        throw new Error('A API de IA não retornou conteúdo.');
    }

    const parsed = extractJsonFromText(generatedText);
    const normalized = normalizeResponse(parsed);

    if (!normalized.title || !normalized.content) {
        throw new Error('A resposta da IA está incompleta (título e conteúdo são obrigatórios).');
    }

    return normalized;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Gera um artigo estruturado a partir das diretrizes, referências e imagens
 * fornecidas, retornando um objeto tipado pronto para preencher o formulário
 * do CMS (título, slug, metaDescription, excerpt e conteúdo em Markdown).
 */
export async function generateAiArticle(payload: AiArticlePayload): Promise<AiArticleResponse> {
    if (!payload.theme.trim() && !payload.thesis.trim() && payload.references.length === 0) {
        throw new Error('Forneça ao menos um tema, uma tese ou uma referência antes de gerar.');
    }

    return callGeminiApi(payload);
}

/**
 * Converte um título em slug amigável (minúsculas, sem acentos, hifens).
 * Reutilizado pelo CMS para manter o slug consistente com o valor gerado.
 */
export function slugifyArticle(value: string): string {
    const slug = value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+/, '')
        .slice(0, 80);

    // Remove trailing hyphens without regex backtracking (SonarQube S8786).
    let end = slug.length;
    while (end > 0 && slug[end - 1] === '-') {
        end--;
    }

    return slug.slice(0, end);
}
