/// <reference path="../deno.d.ts" />

// ---------------------------------------------------------------------------
// admin-create-user
// ---------------------------------------------------------------------------
// Cria contas de usuário a partir do Painel Administrativo.
//
// Por que uma Edge Function: inserir linhas em `auth.users` exige a
// `service_role`. O navegador nunca deve possuí-la, então o cliente com a
// anon key não consegue criar contas sozinho.
//
// Autorização: exige JWT válido (verify_jwt = true) E que o perfil do
// chamador tenha `role = 'admin'` no banco. A checagem é feita aqui com a
// service role, que ignora a RLS — por isso a verificação explícita é
// obrigatória e não pode ser removida.
// ---------------------------------------------------------------------------

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Method": "POST, OPTIONS",
};

const VALID_ROLES = ["admin", "moderator", "editor", "pro", "user"] as const;

type ValidRole = (typeof VALID_ROLES)[number];

interface CreateUserPayload {
    email: string;
    name: string;
    handle: string;
    role: ValidRole;
    password: string;
    bio: string;
}

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
}

function safeString(val: unknown, fallback = ""): string {
    return typeof val === "string" ? val : fallback;
}

function initialsAvatar(seed: string): string {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
}

function normalizeHandle(rawHandle: string, email: string): string {
    const trimmed = rawHandle.trim();
    if (trimmed) return trimmed;
    return `@${email.split("@")[0] ?? "user"}`;
}

function normalizeRole(rawRole: unknown): ValidRole {
    return VALID_ROLES.includes(rawRole as ValidRole) ? (rawRole as ValidRole) : "user";
}

function parsePayload(body: Record<string, unknown> | null | undefined): CreateUserPayload {
    const email = safeString(body?.email).trim().toLowerCase();
    const name = safeString(body?.name).trim();
    const handle = normalizeHandle(safeString(body?.handle), email);
    const role = normalizeRole(body?.role);
    const password = safeString(body?.password).trim();
    const bio = safeString(body?.bio, "Criador Izy Colors").trim() || "Criador Izy Colors";
    return { email, name, handle, role, password, bio };
}

function validatePayload(payload: CreateUserPayload): Response | null {
    if (!payload.email?.includes("@")) {
        return json({ error: "E-mail inválido." }, 400);
    }
    if (!payload.name) {
        return json({ error: "Informe o nome do usuário." }, 400);
    }
    if (!payload.password || payload.password.length < 6) {
        return json({ error: "Defina uma senha temporária com no mínimo 6 caracteres." }, 400);
    }
    return null;
}

function buildProfileResponse(profile: Record<string, unknown>): Record<string, unknown> {
    const name = safeString(profile.name);
    const createdAt = safeString(profile.created_at);
    return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        handle: profile.handle,
        role: profile.role,
        avatar: profile.avatar ?? initialsAvatar(name),
        bio: profile.bio ?? "",
        status: profile.status,
        createdAt: createdAt.slice(0, 10),
        lastLoginAt: "Nunca",
        palettesCount: 0,
        favoritesCount: 0,
        submissionsCount: 0,
    };
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

    try {
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        if (!serviceRoleKey || !supabaseUrl) {
            return json({ error: "Variáveis de ambiente da Edge Function ausentes." }, 500);
        }

        // Identidade do chamador, validada pela assinatura do JWT (verify_jwt).
        const authHeader = req.headers.get("Authorization") ?? "";
        const caller = createClient(supabaseUrl, serviceRoleKey, {
            global: { headers: { Authorization: authHeader } },
            auth: { persistSession: false },
        });

        const { data: userData, error: userError } = await caller.auth.getUser();
        if (userError || !userData?.user) {
            return json({ error: "Sessão inválida ou expirada." }, 401);
        }

        const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

        // Autorização real: o papel vem do banco, nunca do token do cliente.
        const { data: callerProfile, error: profileError } = await admin
            .from("profiles")
            .select("role")
            .eq("id", userData.user.id)
            .single();

        if (profileError || !callerProfile) {
            return json({ error: "Perfil do solicitante não encontrado." }, 403);
        }
        if (callerProfile.role !== "admin") {
            return json({ error: "Acesso negado: somente administradores podem criar contas." }, 403);
        }

        const body = await req.json();
        const payload = parsePayload(body);

        const validationError = validatePayload(payload);
        if (validationError) return validationError;

        // Cria o registro em auth.users. O trigger `handle_new_user` provisiona o
        // perfil com role = 'user'; aplicamos o cargo solicitado em seguida,
        // já dentro desta função privilegiado.
        const { data: created, error: createError } = await admin.auth.admin.createUser({
            email: payload.email,
            password: payload.password,
            email_confirm: true,
            user_metadata: { name: payload.name, handle: payload.handle },
        });

        if (createError) {
            return json({ error: createError.message }, 400);
        }
        if (!created?.user) {
            return json({ error: "O Auth não retornou o usuário criado." }, 500);
        }

        const { data: profile, error: updateError } = await admin
            .from("profiles")
            .update({
                role: payload.role,
                name: payload.name,
                handle: payload.handle.startsWith("@") ? payload.handle : `@${payload.handle}`,
                avatar: initialsAvatar(payload.name),
                bio: payload.bio,
            })
            .eq("id", created.user.id)
            .select("*")
            .single();

        if (updateError) {
            return json({ error: `Conta criada, mas o perfil não pôde ser atualizado: ${updateError.message}` }, 500);
        }

        return json({ profile: buildProfileResponse(profile) });
    } catch (err) {
        return json(
            { error: err instanceof Error ? err.message : "Erro inesperado na Edge Function." },
            500,
        );
    }
});
