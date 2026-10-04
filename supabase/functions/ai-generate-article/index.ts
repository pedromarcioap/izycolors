/// <reference path="../deno.d.ts" />

// ---------------------------------------------------------------------------
// ai-generate-article
// ---------------------------------------------------------------------------
// Executa a geração de artigos no SERVIDOR.
//
// Motivo: as chaves dos provedores de IA não podem viver no navegador.
// A função lê `ai_settings` com a service role, monta o prompt e chama o
// provedor ativo. O cliente recebe apenas o artigo gerado.
//
// Autorização: exige JWT válido (verify_jwt = true). A configuração é lida
// com service role, contornando a RLS de `ai_settings` que é exclusiva de
// admin — o provider ativo é uma escolha da redação, não do visitante.
// ---------------------------------------------------------------------------

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ArticleTone =
    | "Técnico & Engenharia"
    | "Crítica de Design & Editorial"
    | "Didático & Passo a Passo"
    | "Estudo de Caso de Produto"
    | "Manifesto Minimalista"
    | "Personalizado";

type ArticleLanguage =
    | "Português (Brasil)"
    | "Inglês (US)"
    | "Espanhol"
    | "Francês"
    | "Alemão";

type ArticleLength = "Curto" | "Médio" | "Longo";
type AiProvider = "gemini" | "openrouter" | "openai" | "claude";

interface ArticlePayload {
    theme: string;
    thesis: string;
    references: { id: string; value: string }[];
    images: { id: string; name: string; mimeType: string; base64: string }[];
    tone: ArticleTone;
    customTone?: string;
    language: ArticleLanguage;
    length: ArticleLength;
}

interface AiSettings {
    active_provider: AiProvider;
    gemini_api_key: string;
    gemini_model: string;
    openrouter_api_key: string;
    openrouter_model: string;
    openai_api_key: string;
    openai_model: string;
    claude_api_key: string;
    claude_model: string;
}

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

const TONE_GUIDANCE: Record<ArticleTone, string> = {
    "Técnico & Engenharia":
        "tom técnico, rigoroso e de engenharia de software, com vocabulário especializado em teoria e sintaxe de cor (oklch, hex, p3), arquitetura de design systems, performance e normas WCAG",
    "Crítica de Design & Editorial":
        "tom analítico, provocativo e editorial de crítica de design, discutindo escolhas estéticas, harmonia cromática, hierarquia visual e trade-offs de experiência do usuário",
    "Didático & Passo a Passo":
        "tom didático, estruturado e instrutivo, explicando conceitos complexos passo a passo com analogias claras, roteiros práticos e foco no aprendizado",
    "Estudo de Caso de Produto":
        "tom de estudo de caso corporativo e de produto, focando em resolução de problemas reais, métricas de impacto, decisões de design centradas no usuário e resultados mensuráveis",
    "Manifesto Minimalista":
        "tom de manifesto direto, conciso e minimalista, priorizando frases curtas, declarações de alto impacto e eliminação de redundências ou rodeios verbais",
    "Personalizado":
        "tom de voz estritamente personalizado conforme as diretrizes do autor",
};

const LANGUAGE_GUIDANCE: Record<ArticleLanguage, string> = {
    "Português (Brasil)": "português do Brasil (pt-BR)",
    "Inglês (US)": "inglês americano (en-US)",
    "Espanhol": "espanhol (es)",
    "Francês": "francês (fr)",
    "Alemão": "alemão (de)",
};

const LENGTH_GUIDANCE: Record<ArticleLength, string> = {
    "Curto": "artigo curto, entre 600 e 900 palavras",
    "Médio": "artigo de extensão média, entre 1.100 e 1.500 palavras",
    "Longo": "artigo longo e aprofundado, entre 1.800 e 2.600 palavras",
};

function resolveToneGuidance(payload: ArticlePayload): string {
    if (payload.tone === "Personalizado") {
        const custom = payload.customTone?.trim();
        if (custom) return `tom personalizado (siga rigorosamente esta instrução do autor): "${custom}"`;
        return "tom personalizado (redija com originalidade, clareza e tom provocativo/direto)";
    }
    return TONE_GUIDANCE[payload.tone] ?? TONE_GUIDANCE["Técnico & Engenharia"];
}

function buildSystemPrompt(payload: ArticlePayload): string {
    const targetLanguage = LANGUAGE_GUIDANCE[payload.language ?? "Português (Brasil)"];

    return [
        "Você é um editor sênior de conteúdo técnico do blog IzyColors, especializado em teoria da cor, design systems, acessibilidade (WCAG) e engenharia de software.",
        "Sua missão é transformar as diretrizes, referências e imagens fornecidas pelo autor em um artigo original, estruturado e pronto para publicação.",
        "",
        "REGRAS DE IDIOMA E REDAÇÃO UNIFORME:",
        `- O artigo INTEIRO (título, slug, metaDescription, excerpt e todo o conteúdo em Markdown) DEVE ser escrito EXCLUSIVAMENTE em ${targetLanguage}.`,
        "- É ESTRITAMENTE PROIBIDO misturar idiomas no mesmo artigo ou gerar respostas bilíngues.",
        "- Mantenha nomes de propriedades CSS, termos técnicos de código (como oklch, hex, WCAG, TypeScript) intactos, mas todo o texto explicativo, títulos e introduções DEVEM seguir 100% o idioma selecionado.",
        "",
        "REGRAS DE ANÁLISE:",
        "- Analise profundamente todas as imagens fornecidas (capturas de tela, gráficos, diagramas, tabelas). Extraia dados visuais, valores, tendências e correlações e cite-os organicamente no texto.",
        "- Sintetize as ideias dos links e transcrições fornecidos sem copiar trechos literais. Evite clichês corporativos vazios e jargão genérico.",
        "- Produza conteúdo original, com argumentação própria e dados concretos.",
        "",
        "REGRAS DE FORMATO DA RESPOSTA:",
        "- Responda APENAS com um JSON válido (sem markdown, sem comentários) contendo exatamente estas chaves:",
        '  - "title": título otimizado para SEO e CTR (claro, específico, com palavra-chave).',
        '  - "slug": URL amigável derivada do título (minúsculas, sem acentos, palavras separadas por hifens).',
        '  - "metaDescription": descrição para mecanismos de busca com até 160 caracteres.',
        '  - "excerpt": resumo introdutório de 2 a 3 frases para cartões e listagens.',
        '  - "content": conteúdo completo em Markdown.',
        '- O "content" deve:',
        "  - Usar títulos H2 (##) e H3 (###) para estruturar as seções.",
        "  - Incluir pelo menos uma tabela Markdown quando houver dados comparáveis.",
        "  - Usar APENAS hifens (-) para itens de lista, nunca asteriscos ou números.",
        "  - Respeitar 100% o idioma configurado.",
        "",
        "REGRAS DE ESTILO E TOM DE VOZ:",
        `- Tom de voz: ${resolveToneGuidance(payload)}.`,
        `- Extensão: ${LENGTH_GUIDANCE[payload.length]}.`,
        "- Título, slug, metaDescription, excerpt e content devem ser totalmente coerentes entre si.",
    ].join("\n");
}

function buildUserPrompt(payload: ArticlePayload): string {
    const referencesBlock =
        payload.references.length > 0
            ? payload.references.map((ref, index) => `${index + 1}. ${ref.value}`).join("\n")
            : "Nenhuma referência fornecida.";

    const imageNote =
        payload.images.length > 0
            ? `Foram anexadas ${payload.images.length} imagem(ns). Analise os dados visuais presentes e incorpore-os naturalmente ao artigo.`
            : "Nenhuma imagem anexada.";

    const customToneBlock =
        payload.tone === "Personalizado" && payload.customTone?.trim()
            ? `\nDIRETRIZ DE TOM CUSTOMIZADO DO AUTOR:\n"${payload.customTone.trim()}"`
            : "";

    return [
        "DIRETRIZES DO AUTOR",
        `Tema central: ${payload.theme || "Não informado"}`,
        `Tese e ideias principais: ${payload.thesis || "Não informado"}`,
        `Idioma de saída obrigatório: ${payload.language || "Português (Brasil)"}`,
        `Preset de Tom de Voz: ${payload.tone}`,
        customToneBlock,
        "",
        "REFERÊNCIAS FORNECIDAS",
        referencesBlock,
        "",
        "OBSERVAÇÕES",
        imageNote,
    ]
        .filter(Boolean)
        .join("\n");
}

// ---------------------------------------------------------------------------
// Chamadas aos provedores
// ---------------------------------------------------------------------------

const FENCED_JSON = /```(?:json)?([\s\S]*?)```/i;

function extractJson(rawText: string): unknown {
    const trimmed = rawText.trim();
    const fenced = FENCED_JSON.exec(trimmed);
    const candidate = fenced ? fenced[1].trim() : trimmed;
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
        throw new Error("A IA retornou uma resposta sem JSON estruturado.");
    }
    return JSON.parse(candidate.slice(start, end + 1));
}

function normalizeResponse(value: unknown) {
    const record = value as Record<string, unknown>;
    const asString = (input: unknown, fallback: string) =>
        typeof input === "string" && input.trim() ? input.trim() : fallback;

    return {
        title: asString(record?.title, "Artigo gerado por IA"),
        slug: asString(record?.slug, ""),
        metaDescription: asString(record?.metaDescription, "").slice(0, 160),
        excerpt: asString(record?.excerpt, ""),
        content: asString(record?.content, ""),
    };
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
    try {
        const body = await response.json();
        return body?.error?.message ?? body?.message ?? fallback;
    } catch {
        return fallback;
    }
}

async function callGemini(payload: ArticlePayload, apiKey: string, model: string) {
    const url = `${GEMINI_ENDPOINT}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const parts: Record<string, unknown>[] = [{ text: buildUserPrompt(payload) }];
    for (const image of payload.images) {
        parts.push({ inlineData: { mimeType: image.mimeType, data: image.base64 } });
    }

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: buildSystemPrompt(payload) }] },
            contents: [{ role: "user", parts }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
            },
        }),
    });

    if (!response.ok) {
        const errorMsg = await readErrorMessage(response, "HTTP " + response.status);
        throw new Error("Erro na API Gemini (" + errorMsg + ").");
    }

    const body = await response.json();
    const text =
        body?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    if (!text.trim()) throw new Error("A API Gemini não retornou conteúdo.");
    return normalizeResponse(extractJson(text));
}

async function callOpenRouter(payload: ArticlePayload, apiKey: string, model: string) {
    const userContent: unknown[] = [{ type: "text", text: buildUserPrompt(payload) }];
    for (const image of payload.images) {
        userContent.push({
            type: "image_url",
            image_url: { url: "data:" + image.mimeType + ";base64," + image.base64 },
        });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + apiKey,
            "HTTP-Referer": "https://izycolors.com",
            "X-Title": "IzyColors Studio",
        },
        body: JSON.stringify({
            model: model || "google/gemini-2.0-flash-001",
            messages: [
                { role: "system", content: buildSystemPrompt(payload) },
                { role: "user", content: userContent },
            ],
            response_format: { type: "json_object" },
        }),
    });

    if (!response.ok) {
        const errorMsg = await readErrorMessage(response, "HTTP " + response.status);
        throw new Error("Erro na API OpenRouter (" + errorMsg + ").");
    }
    const body = await response.json();
    const text = body?.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) throw new Error("OpenRouter não retornou conteúdo.");
    return normalizeResponse(extractJson(text));
}

async function callOpenAi(payload: ArticlePayload, apiKey: string, model: string) {
    const userContent: unknown[] = [{ type: "text", text: buildUserPrompt(payload) }];
    for (const image of payload.images) {
        userContent.push({
            type: "image_url",
            image_url: { url: "data:" + image.mimeType + ";base64," + image.base64 },
        });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
        body: JSON.stringify({
            model: model || "gpt-4o-mini",
            messages: [
                { role: "system", content: buildSystemPrompt(payload) },
                { role: "user", content: userContent },
            ],
            response_format: { type: "json_object" },
        }),
    });

    if (!response.ok) {
        const errorMsg = await readErrorMessage(response, "HTTP " + response.status);
        throw new Error("Erro na API OpenAI (" + errorMsg + ").");
    }
    const body = await response.json();
    const text = body?.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) throw new Error("OpenAI não retornou conteúdo.");
    return normalizeResponse(extractJson(text));
}

async function callClaude(payload: ArticlePayload, apiKey: string, model: string) {
    const userContent: unknown[] = [{ type: "text", text: buildUserPrompt(payload) }];
    for (const image of payload.images) {
        userContent.push({
            type: "image",
            source: { type: "base64", media_type: image.mimeType, data: image.base64 },
        });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: model || "claude-3-5-sonnet-20241022",
            max_tokens: 8192,
            system: buildSystemPrompt(payload),
            messages: [{ role: "user", content: userContent }],
        }),
    });

    if (!response.ok) {
        const errorMsg = await readErrorMessage(response, "HTTP " + response.status);
        throw new Error("Erro na API Anthropic Claude (" + errorMsg + ").");
    }
    const body = await response.json();
    const text = body?.content?.[0]?.text ?? "";
    if (!text.trim()) throw new Error("Claude não retornou conteúdo.");
    return normalizeResponse(extractJson(text));
}

// ---------------------------------------------------------------------------
// Teste de conexão
// ---------------------------------------------------------------------------

async function testGemini(apiKey: string, model: string): Promise<string> {
    const response = await fetch(
        `${GEMINI_ENDPOINT}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: "Responda exatamente: CONEXAO_OK" }] }],
            }),
        },
    );
    if (!response.ok) {
        throw new Error(await readErrorMessage(response, "HTTP " + response.status));
    }
    return "Conexão bem-sucedida com Gemini (" + model + ")";
}

async function testOpenRouter(apiKey: string, model: string): Promise<string> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
        body: JSON.stringify({
            model,
            messages: [{ role: "user", content: "Responda OK" }],
            max_tokens: 10,
        }),
    });
    if (!response.ok) {
        throw new Error(await readErrorMessage(response, "HTTP " + response.status));
    }
    return "Conexão bem-sucedida com OpenRouter (" + model + ")";
}

async function testOpenAi(apiKey: string, model: string): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
        body: JSON.stringify({
            model,
            messages: [{ role: "user", content: "Responda OK" }],
            max_tokens: 10,
        }),
    });
    if (!response.ok) {
        throw new Error(await readErrorMessage(response, "HTTP " + response.status));
    }
    return "Conexão bem-sucedida com OpenAI (" + model + ")";
}

async function testClaude(apiKey: string, model: string): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model,
            max_tokens: 10,
            messages: [{ role: "user", content: "Responda OK" }],
        }),
    });
    if (!response.ok) {
        throw new Error(await readErrorMessage(response, "HTTP " + response.status));
    }
    return "Conexão bem-sucedida com Claude (" + model + ")";
}

async function testProvider(provider: AiProvider, apiKey: string, model: string): Promise<string> {
    switch (provider) {
        case "gemini":
            return await testGemini(apiKey, model);
        case "openrouter":
            return await testOpenRouter(apiKey, model);
        case "openai":
            return await testOpenAi(apiKey, model);
        case "claude":
            return await testClaude(apiKey, model);
        default:
            throw new Error("Provedor desconhecido.");
    }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
}

async function handleTestMode(
    config: AiSettings,
    body: { provider: AiProvider; apiKey?: string; model: string },
): Promise<Response> {
    const apiKey = body.apiKey?.trim() || providerKey(config, body.provider);
    if (!apiKey) {
        return json({
            success: false,
            message: "Informe uma chave de API ou salve-a antes de testar.",
        });
    }
    try {
        const message = await testProvider(body.provider, apiKey, body.model);
        return json({ success: true, message });
    } catch (err) {
        const detail = err instanceof Error ? err.message : "erro de rede.";
        return json({
            success: false,
            message: `Falha na conexão: ${detail}`,
        });
    }
}

async function handleGenerateMode(
    config: AiSettings,
    payload: ArticlePayload | undefined,
): Promise<Response> {
    if (!payload) return json({ error: "Payload de geração ausente." }, 400);

    const provider = config.active_provider;
    const apiKey = providerKey(config, provider);
    if (!apiKey) {
        return json(
            { error: `Nenhuma chave configurada para o provedor ativo (${provider}).` },
            400,
        );
    }

    let result;
    switch (provider) {
        case "openrouter":
            result = await callOpenRouter(payload, apiKey, config.openrouter_model);
            break;
        case "openai":
            result = await callOpenAi(payload, apiKey, config.openai_model);
            break;
        case "claude":
            result = await callClaude(payload, apiKey, config.claude_model);
            break;
        default:
            result = await callGemini(payload, apiKey, config.gemini_model);
    }

    return json(result);
}

async function loadAiSettings(supabaseUrl: string, serviceRoleKey: string): Promise<AiSettings | null> {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
    });
    const { data: settings, error: settingsError } = await admin
        .from("ai_settings")
        .select("*")
        .eq("id", 1)
        .single();

    if (settingsError || !settings) {
        return null;
    }
    return settings as AiSettings;
}

async function handleRequest(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

    try {
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        if (!serviceRoleKey || !supabaseUrl) {
            return json({ error: "Variáveis de ambiente da Edge Function ausentes." }, 500);
        }

        const config = await loadAiSettings(supabaseUrl, serviceRoleKey);
        if (!config) {
            return json({ error: "Configuração de IA não encontrada." }, 500);
        }

        const body = (await req.json()) as
            | { mode: "test"; provider: AiProvider; apiKey?: string; model: string }
            | { mode: "generate"; payload?: ArticlePayload };

        if (body?.mode === "test") {
            return await handleTestMode(config, body);
        }

        return await handleGenerateMode(config, body?.payload);
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro inesperado na Edge Function.";
        return json({ error: errorMsg }, 500);
    }
}

Deno.serve(handleRequest);

function providerKey(config: AiSettings, provider: AiProvider): string {
    switch (provider) {
        case "gemini":
            return config.gemini_api_key?.trim() ?? "";
        case "openrouter":
            return config.openrouter_api_key?.trim() ?? "";
        case "openai":
            return config.openai_api_key?.trim() ?? "";
        case "claude":
            return config.claude_api_key?.trim() ?? "";
        default:
            return "";
    }
}