import { getSupabaseClient } from './supabase';
import {
    AuthUser,
    AuditLogItem,
    CollectionBoard,
    CommunitySubmission,
    CuratedDemoImage,
    FavoriteColor,
    Palette,
    ProjectPalette,
    ProjectWorkspace,
    UserRole,
    VaultPalette,
    CmsArticle
} from '../types';
import {
    formatDateTimeWithDay,
    formatDayAndTime,
    formatRelative,
    formatShortDate
} from '../utils/dateFormat';

/**
 * Camada de acesso a dados do Izy Colors.
 *
 * Toda persistência passa por aqui. Não existe mais nenhum fallback em
 * localStorage: cada leitura/escrita é uma operação real no Postgres, com a
 * RLS do banco decidindo o que a sessão atual pode ver e fazer.
 */

const TABLES = {
    profiles: 'profiles',
    palettes: 'palettes',
    paletteLikes: 'palette_likes',
    paletteForks: 'palette_forks',
    projects: 'projects',
    projectPalettes: 'project_palettes',
    collections: 'collections',
    vaultPalettes: 'vault_palettes',
    favoriteColors: 'favorite_colors',
    workspaceState: 'user_workspace_state',
    articles: 'cms_articles',
    submissions: 'community_submissions',
    tags: 'taxonomy_tags',
    curatedImages: 'curated_images',
    auditLogs: 'audit_logs'
} as const;

// ---------------------------------------------------------------------------
// Utilidades internas
// ---------------------------------------------------------------------------

/** Extrai a mensagem de erro do PostgREST, com fallback legível. */
export function describeError(error: unknown, fallback = 'Erro inesperado ao acessar o Supabase.'): string {
    if (!error) return fallback;
    if (typeof error === 'string') return error;
    const candidate = error as { message?: string; details?: string; hint?: string; code?: string };
    return candidate.message || candidate.details || candidate.hint || fallback;
}

/**
 * Executa uma query e lança um erro legível em caso de falha.
 *
 * O `data` é tipado como `T | null` porque o PostgREST retorna uma união entre
 * a resposta com dados e a de falha (`data: null`); o narrow acontece aqui.
 */
async function run<T>(operation: PromiseLike<{ data: T | null; error: unknown }>, context: string): Promise<T> {
    const { data, error } = await operation;
    if (error) throw new Error(`${context}: ${describeError(error)}`);
    return data as T;
}

/** Id do usuário autenticado. Lança quando não há sessão válida. */
export async function getCurrentAuthUserId(): Promise<string> {
    const { data, error } = await getSupabaseClient().auth.getUser();
    if (error || !data.user) {
        throw new Error('Sessão expirada ou inexistente. Faça login novamente.');
    }
    return data.user.id;
}

/** Variedade para gerar ids de paletas sem colisão. */
function newId(prefix: string): string {
    if (typeof crypto !== 'undefined') {
        if (typeof crypto.randomUUID === 'function') {
            return `${prefix}-${crypto.randomUUID()}`;
        }
        if (typeof crypto.getRandomValues === 'function') {
            const buffer = new Uint32Array(2);
            crypto.getRandomValues(buffer);
            return `${prefix}-${Date.now()}-${buffer[0].toString(36)}${buffer[1].toString(36)}`;
        }
    }
    return `${prefix}-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Perfis
// ---------------------------------------------------------------------------

interface ProfileRow {
    id: string;
    email: string;
    name: string;
    handle: string;
    role: UserRole;
    avatar: string | null;
    bio: string | null;
    status: 'active' | 'suspended';
    title: string | null;
    is_pro: boolean;
    website: string | null;
    github: string | null;
    figma: string | null;
    behance: string | null;
    badges: string[] | null;
    export_preferences: Record<string, unknown> | null;
    created_at: string;
    last_login_at?: string | null;
}

export function mapAuthUser(row: ProfileRow): AuthUser {
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        handle: row.handle,
        role: row.role,
        avatar: row.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.email)}`,
        bio: row.bio ?? '',
        status: row.status,
        createdAt: formatShortDate(row.created_at),
        lastLoginAt: row.last_login_at ? formatDateTimeWithDay(row.last_login_at) : 'Nunca',
        palettesCount: 0,
        favoritesCount: 0,
        submissionsCount: 0
    };
}

/** Busca o perfil do usuário autenticado (criado automaticamente no cadastro). Retorna null se não houver sessão ativa. */
export async function fetchCurrentProfile(): Promise<AuthUser | null> {
    const supabase = getSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
        return null;
    }
    const { data, error } = await supabase
        .from(TABLES.profiles)
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();
    if (error) throw new Error(`Falha ao carregar o perfil: ${describeError(error)}`);
    return data ? mapAuthUser(data as ProfileRow) : null;
}

/** Lista perfis ativos — usado pela comunidade para exibir autores. */
export async function listActiveProfiles(): Promise<AuthUser[]> {
    const supabase = getSupabaseClient();
    const rows = await run<ProfileRow[]>(
        supabase.from(TABLES.profiles).select('*').eq('status', 'active').order('name'),
        'Falha ao carregar perfis'
    );
    return rows.map(mapAuthUser);
}

/** Lista completa de usuários — visível apenas para administradores (RLS). */
export async function listAllProfiles(): Promise<AuthUser[]> {
    const supabase = getSupabaseClient();
    const rows = await run<ProfileRow[]>(
        supabase.from(TABLES.profiles).select('*').order('created_at', { ascending: false }),
        'Falha ao carregar usuários'
    );
    return rows.map(mapAuthUser);
}

/** Perfil completo do criador, com os campos que alimentam a área de Perfil. */
export interface CreatorProfile {
    id: string;
    email: string;
    name: string;
    handle: string;
    role: UserRole;
    status: 'active' | 'suspended';
    avatar: string;
    bio: string;
    title: string;
    isPro: boolean;
    website: string;
    github: string;
    figma: string;
    behance: string;
    badges: string[];
    exportPreferences: Record<string, unknown>;
    createdAt: string;
}

function mapCreatorProfile(row: ProfileRow): CreatorProfile {
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        handle: row.handle,
        role: row.role,
        status: row.status,
        avatar: row.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.email)}`,
        bio: row.bio ?? '',
        title: row.title ?? '',
        isPro: row.is_pro,
        website: row.website ?? '',
        github: row.github ?? '',
        figma: row.figma ?? '',
        behance: row.behance ?? '',
        badges: row.badges ?? [],
        exportPreferences: row.export_preferences ?? {},
        createdAt: formatShortDate(row.created_at)
    };
}

/** Perfil completo do usuário autenticado. */
export async function fetchCreatorProfile(): Promise<CreatorProfile | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from(TABLES.profiles)
        .select('*')
        .eq('id', await getCurrentAuthUserId())
        .maybeSingle();
    if (error) throw new Error(`Falha ao carregar o perfil: ${describeError(error)}`);
    return data ? mapCreatorProfile(data as ProfileRow) : null;
}

export interface ProfilePatch {
    name?: string;
    handle?: string;
    bio?: string;
    avatar?: string | null;
    title?: string;
    website?: string;
    github?: string;
    figma?: string;
    behance?: string;
    badges?: string[];
    isPro?: boolean;
    exportPreferences?: Record<string, unknown>;
}

/**
 * Atualiza o perfil da sessão atual.
 * O trigger `guard_profile_privileged_columns` impede qualquer tentativa de
 * alterar `role`/`status` por este caminho.
 */
export async function updateCurrentProfile(patch: ProfilePatch): Promise<CreatorProfile> {
    const userId = await getCurrentAuthUserId();
    const supabase = getSupabaseClient();

    const payload: Record<string, unknown> = {};
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.handle !== undefined) payload.handle = patch.handle;
    if (patch.bio !== undefined) payload.bio = patch.bio;
    if (patch.avatar !== undefined) payload.avatar = patch.avatar;
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.website !== undefined) payload.website = patch.website;
    if (patch.github !== undefined) payload.github = patch.github;
    if (patch.figma !== undefined) payload.figma = patch.figma;
    if (patch.behance !== undefined) payload.behance = patch.behance;
    if (patch.badges !== undefined) payload.badges = patch.badges;
    if (patch.isPro !== undefined) payload.is_pro = patch.isPro;
    if (patch.exportPreferences !== undefined) payload.export_preferences = patch.exportPreferences;

    const row = await run<ProfileRow>(
        supabase.from(TABLES.profiles).update(payload).eq('id', userId).select().single(),
        'Falha ao atualizar o perfil'
    );
    return mapCreatorProfile(row);
}

/** Concede/altera cargo de um usuário — RPC restrita a administradores. */
export async function adminSetUserRole(email: string, role: UserRole): Promise<AuthUser> {
    const supabase = getSupabaseClient();
    const row = await run<ProfileRow>(
        supabase.rpc('admin_set_profile_role', { p_email: email, p_role: role }),
        'Falha ao alterar o cargo'
    );
    return mapAuthUser(row as ProfileRow);
}

/** Suspende/reativa uma conta — RPC restrita a administradores. */
export async function adminSetUserStatus(email: string, status: 'active' | 'suspended'): Promise<AuthUser> {
    const supabase = getSupabaseClient();
    const row = await run<ProfileRow>(
        supabase.rpc('admin_set_profile_status', { p_email: email, p_status: status }),
        'Falha ao alterar o status da conta'
    );
    return mapAuthUser(row as ProfileRow);
}

// ---------------------------------------------------------------------------
// Paletas da comunidade
// ---------------------------------------------------------------------------

interface PaletteRow {
    id: string;
    title: string;
    author_name: string;
    author_handle: string;
    author_avatar: string | null;
    author_pro: boolean;
    colors: string[];
    likes: number;
    forks: number;
    wcag_level: string | null;
    tags: string[];
    gamut: string | null;
    staff_pick: boolean;
    description: string | null;
    created_at: string;
    forked_from_id: string | null;
    forked_from_title: string | null;
    forked_from_author: string | null;
    forked_from_handle: string | null;
    is_fork: boolean;
}

function mapPalette(row: PaletteRow): Palette {
    return {
        id: row.id,
        title: row.title,
        author: {
            name: row.author_name,
            handle: row.author_handle,
            avatar: row.author_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.author_name)}`,
            pro: row.author_pro
        },
        colors: row.colors ?? [],
        likes: row.likes ?? 0,
        forks: row.forks ?? 0,
        wcagLevel: (row.wcag_level as Palette['wcagLevel']) ?? 'AA Standard',
        tags: row.tags ?? [],
        gamut: row.gamut ?? undefined,
        staffPick: row.staff_pick,
        createdAt: formatRelative(row.created_at),
        description: row.description ?? undefined,
        isFork: row.is_fork,
        ...(row.forked_from_id
            ? {
                forkedFrom: {
                    id: row.forked_from_id,
                    title: row.forked_from_title ?? '',
                    author: row.forked_from_author ?? '',
                    handle: row.forked_from_handle ?? undefined
                }
            }
            : {})
    };
}

/** Todas as paletas visíveis pela sessão atual, da mais recente para a mais antiga. */
export async function listPalettes(): Promise<Palette[]> {
    const supabase = getSupabaseClient();
    const rows = await run<PaletteRow[]>(
        supabase.from(TABLES.palettes).select('*').order('created_at', { ascending: false }),
        'Falha ao carregar as paletas'
    );
    return rows.map(mapPalette);
}

/** Alterna a curtida do usuário. O contador é recalculado no banco (RPC). */
export async function togglePaletteLike(paletteId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    return run<boolean>(
        supabase.rpc('toggle_palette_like', { p_palette_id: paletteId }),
        'Não foi possível registrar a curtida'
    );
}

export interface PaletteInput {
    title: string;
    colors: string[];
    wcagLevel?: Palette['wcagLevel'];
    tags?: string[];
    gamut?: string;
    description?: string;
    staffPick?: boolean;
    forkedFrom?: NonNullable<Palette['forkedFrom']>;
    /**
     * Autor alternativo. Usado pela curadoria ao aprovar uma submissão: a paleta
     * entra no feed em nome de quem a criou, não de quem aprovou. A RLS permite
     * porque a inserção é feita por um membro da equipe editorial.
     */
    author?: { id: string | null; name: string; handle: string; avatar?: string };
}

/** Publica uma nova paleta. */
export async function createPalette(input: PaletteInput): Promise<Palette> {
    const supabase = getSupabaseClient();

    let authorId: string | null = null;
    let authorName = '';
    let authorHandle = '';
    let authorAvatar = '';
    let authorPro = false;

    if (input.author) {
        authorId = input.author.id;
        authorName = input.author.name;
        authorHandle = input.author.handle;
        authorAvatar = input.author.avatar ?? '';
    } else {
        const userId = await getCurrentAuthUserId();
        const profile = await fetchCurrentProfile();
        if (!profile) throw new Error('Perfil não encontrado para publicar a paleta.');
        authorId = userId;
        authorName = profile.name;
        authorHandle = profile.handle;
        authorAvatar = profile.avatar;
        authorPro = profile.role === 'pro';
    }

    const row = await run<PaletteRow>(
        supabase
            .from(TABLES.palettes)
            .insert({
                id: newId('pal'),
                title: input.title,
                author_id: authorId,
                author_name: authorName,
                author_handle: authorHandle,
                author_avatar: authorAvatar,
                author_pro: authorPro,
                colors: input.colors,
                wcag_level: input.wcagLevel ?? null,
                tags: input.tags ?? [],
                gamut: input.gamut ?? null,
                description: input.description ?? null,
                staff_pick: input.staffPick ?? false,
                forked_from_id: input.forkedFrom?.id ?? null,
                forked_from_title: input.forkedFrom?.title ?? null,
                forked_from_author: input.forkedFrom?.author ?? null,
                forked_from_handle: input.forkedFrom?.handle ?? null,
                is_fork: Boolean(input.forkedFrom)
            })
            .select()
            .single(),
        'Falha ao publicar a paleta'
    );
    return mapPalette(row);
}

export async function updatePalette(id: string, patch: Partial<PaletteInput>): Promise<Palette> {
    const supabase = getSupabaseClient();
    const payload: Record<string, unknown> = {};
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.colors !== undefined) payload.colors = patch.colors;
    if (patch.wcagLevel !== undefined) payload.wcag_level = patch.wcagLevel;
    if (patch.tags !== undefined) payload.tags = patch.tags;
    if (patch.gamut !== undefined) payload.gamut = patch.gamut;
    if (patch.description !== undefined) payload.description = patch.description;
    if (patch.staffPick !== undefined) payload.staff_pick = patch.staffPick;

    const row = await run<PaletteRow>(
        supabase.from(TABLES.palettes).update(payload).eq('id', id).select().single(),
        'Falha ao atualizar a paleta'
    );
    return mapPalette(row);
}

export async function deletePalette(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    await run(supabase.from(TABLES.palettes).delete().eq('id', id), 'Falha ao remover a paleta');
}

/**
 * Registra um fork: cria a paleta derivada e a linha em `palette_forks`,
 * deixando o contador do original para a RPC de recount.
 */
export async function forkPalette(original: Palette): Promise<Palette> {
    const userId = await getCurrentAuthUserId();
    const created = await createPalette({
        title: `${original.title} (Fork)`,
        colors: [...original.colors],
        wcagLevel: original.wcagLevel,
        tags: Array.from(new Set([...original.tags, 'Fork da Comunidade'])),
        gamut: original.gamut,
        description: `Fork e derivação cromática originada de "${original.title}" por @${original.author.handle}.`,
        forkedFrom: {
            id: original.id,
            title: original.title,
            author: original.author.name,
            handle: original.author.handle
        }
    });

    const supabase = getSupabaseClient();
    await run(
        supabase.from(TABLES.paletteForks).insert({
            original_palette_id: original.id,
            original_title: original.title,
            original_author: original.author.name,
            colors: original.colors,
            forked_by: userId,
            forked_by_handle: created.author.handle
        }),
        'Falha ao registrar o fork'
    );
    await run(
        supabase.rpc('recount_palette_forks', { p_palette_id: original.id }),
        'Falha ao atualizar o contador de forks'
    );

    return { ...created, forks: 0 };
}

/** Paletas criadas ou clonadas pelo usuário autenticado. */
export async function listMyPalettes(): Promise<Palette[]> {
    const userId = await getCurrentAuthUserId();
    const supabase = getSupabaseClient();
    const rows = await run<PaletteRow[]>(
        supabase
            .from(TABLES.palettes)
            .select('*')
            .eq('author_id', userId)
            .order('created_at', { ascending: false }),
        'Falha ao carregar as suas paletas'
    );
    return rows.map(mapPalette);
}

// ---------------------------------------------------------------------------
// Projetos + paletas de projeto
// ---------------------------------------------------------------------------

interface ProjectRow {
    id: string;
    name: string;
    client_or_brand: string;
    description: string;
    primary_colors: string[];
    secondary_colors: string[];
    neutral_grays: string[];
    semantic_tokens: Record<string, string> | null;
    updated_at: string;
}

interface ProjectPaletteRow {
    id: string;
    project_id: string;
    name: string;
    description: string;
    colors: string[];
    role: string;
    wcag_level: string | null;
    created_at: string;
}

function mapProjectPalette(row: ProjectPaletteRow): ProjectPalette {
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        colors: row.colors ?? [],
        role: row.role,
        createdAt: formatShortDate(row.created_at),
        wcagLevel: row.wcag_level ?? undefined
    };
}

const EMPTY_SEMANTIC_TOKENS = {
    primary: '',
    secondary: '',
    success: '',
    warning: '',
    error: '',
    surface: '',
    background: ''
};

function mapProject(row: ProjectRow, palettes: ProjectPalette[]): ProjectWorkspace {
    return {
        id: row.id,
        name: row.name,
        clientOrBrand: row.client_or_brand,
        description: row.description,
        primaryColors: row.primary_colors ?? [],
        secondaryColors: row.secondary_colors ?? [],
        neutralGrays: row.neutral_grays ?? [],
        palettes,
        semanticTokens: { ...EMPTY_SEMANTIC_TOKENS, ...row.semantic_tokens },
        updatedAt: formatDateTimeWithDay(row.updated_at)
    };
}

export async function listProjects(): Promise<ProjectWorkspace[]> {
    const supabase = getSupabaseClient();
    const rows = await run<ProjectRow[]>(
        supabase.from(TABLES.projects).select('*').order('updated_at', { ascending: false }),
        'Falha ao carregar os projetos'
    );
    if (rows.length === 0) return [];

    const paletteRows = await run<ProjectPaletteRow[]>(
        supabase
            .from(TABLES.projectPalettes)
            .select('*')
            .in('project_id', rows.map((r) => r.id))
            .order('created_at', { ascending: false }),
        'Falha ao carregar as paletas dos projetos'
    );

    return rows.map((row) =>
        mapProject(
            row,
            paletteRows.filter((p) => p.project_id === row.id).map(mapProjectPalette)
        )
    );
}

export async function createProject(input: Partial<ProjectWorkspace> & { name: string }): Promise<ProjectWorkspace> {
    const userId = await getCurrentAuthUserId();
    const supabase = getSupabaseClient();
    const row = await run<ProjectRow>(
        supabase
            .from(TABLES.projects)
            .insert({
                user_id: userId,
                name: input.name,
                client_or_brand: input.clientOrBrand ?? '',
                description: input.description ?? '',
                primary_colors: input.primaryColors ?? [],
                secondary_colors: input.secondaryColors ?? [],
                neutral_grays: input.neutralGrays ?? [],
                semantic_tokens: input.semanticTokens ?? EMPTY_SEMANTIC_TOKENS
            })
            .select()
            .single(),
        'Falha ao criar o projeto'
    );
    return mapProject(row, []);
}

export async function updateProject(
    id: string,
    patch: Partial<ProjectWorkspace> & { name?: string }
): Promise<void> {
    const supabase = getSupabaseClient();
    const payload: Record<string, unknown> = {};
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.clientOrBrand !== undefined) payload.client_or_brand = patch.clientOrBrand;
    if (patch.description !== undefined) payload.description = patch.description;
    if (patch.primaryColors !== undefined) payload.primary_colors = patch.primaryColors;
    if (patch.secondaryColors !== undefined) payload.secondary_colors = patch.secondaryColors;
    if (patch.neutralGrays !== undefined) payload.neutral_grays = patch.neutralGrays;
    if (patch.semanticTokens !== undefined) payload.semantic_tokens = patch.semanticTokens;

    await run(supabase.from(TABLES.projects).update(payload).eq('id', id), 'Falha ao atualizar o projeto');
}

export async function deleteProject(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    await run(supabase.from(TABLES.projects).delete().eq('id', id), 'Falha ao remover o projeto');
}

export async function addProjectPalette(
    projectId: string,
    input: Omit<ProjectPalette, 'id' | 'createdAt'>
): Promise<ProjectPalette> {
    const supabase = getSupabaseClient();
    const row = await run<ProjectPaletteRow>(
        supabase
            .from(TABLES.projectPalettes)
            .insert({
                project_id: projectId,
                name: input.name,
                description: input.description ?? '',
                colors: input.colors,
                role: input.role,
                wcag_level: input.wcagLevel ?? null
            })
            .select()
            .single(),
        'Falha ao adicionar a paleta ao projeto'
    );
    return mapProjectPalette(row);
}

export async function deleteProjectPalette(projectId: string, paletteId: string): Promise<void> {
    const supabase = getSupabaseClient();
    await run(
        supabase.from(TABLES.projectPalettes).delete().eq('id', paletteId).eq('project_id', projectId),
        'Falha ao remover a paleta do projeto'
    );
}

// ---------------------------------------------------------------------------
// Coleções
// ---------------------------------------------------------------------------

interface CollectionRow {
    id: string;
    title: string;
    description: string;
    tags: string[];
    is_private: boolean;
    palette_ids: string[];
    cover_colors: string[];
    created_at: string;
}

function mapCollection(row: CollectionRow): CollectionBoard {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        tags: row.tags ?? [],
        isPrivate: row.is_private,
        paletteIds: row.palette_ids ?? [],
        coverColors: row.cover_colors ?? [],
        createdAt: formatShortDate(row.created_at)
    };
}

export async function listCollections(): Promise<CollectionBoard[]> {
    const supabase = getSupabaseClient();
    const rows = await run<CollectionRow[]>(
        supabase.from(TABLES.collections).select('*').order('created_at', { ascending: false }),
        'Falha ao carregar as coleções'
    );
    return rows.map(mapCollection);
}

export async function createCollection(input: Partial<CollectionBoard> & { title: string }): Promise<CollectionBoard> {
    const userId = await getCurrentAuthUserId();
    const supabase = getSupabaseClient();
    const row = await run<CollectionRow>(
        supabase
            .from(TABLES.collections)
            .insert({
                user_id: userId,
                title: input.title,
                description: input.description ?? '',
                tags: input.tags ?? [],
                is_private: input.isPrivate ?? true,
                palette_ids: input.paletteIds ?? [],
                cover_colors: input.coverColors ?? []
            })
            .select()
            .single(),
        'Falha ao criar a coleção'
    );
    return mapCollection(row);
}

export async function updateCollection(id: string, patch: Partial<CollectionBoard>): Promise<CollectionBoard> {
    const supabase = getSupabaseClient();
    const payload: Record<string, unknown> = {};
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.description !== undefined) payload.description = patch.description;
    if (patch.tags !== undefined) payload.tags = patch.tags;
    if (patch.isPrivate !== undefined) payload.is_private = patch.isPrivate;
    if (patch.paletteIds !== undefined) payload.palette_ids = patch.paletteIds;
    if (patch.coverColors !== undefined) payload.cover_colors = patch.coverColors;

    const row = await run<CollectionRow>(
        supabase.from(TABLES.collections).update(payload).eq('id', id).select().single(),
        'Falha ao atualizar a coleção'
    );
    return mapCollection(row);
}

export async function deleteCollection(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    await run(supabase.from(TABLES.collections).delete().eq('id', id), 'Falha ao remover a coleção');
}

// ---------------------------------------------------------------------------
// Cofre privado
// ---------------------------------------------------------------------------

interface VaultRow {
    id: string;
    title: string;
    description: string;
    colors: string[];
    tags: string[];
    notes: string | null;
    gamut: string | null;
    wcag_level: string | null;
    created_at: string;
}

function mapVault(row: VaultRow): VaultPalette {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        colors: row.colors ?? [],
        tags: row.tags ?? [],
        notes: row.notes ?? undefined,
        gamut: row.gamut ?? undefined,
        wcagLevel: row.wcag_level ?? undefined,
        createdAt: formatRelative(row.created_at)
    };
}

export async function listVaultPalettes(): Promise<VaultPalette[]> {
    const supabase = getSupabaseClient();
    const rows = await run<VaultRow[]>(
        supabase.from(TABLES.vaultPalettes).select('*').order('created_at', { ascending: false }),
        'Falha ao carregar o cofre'
    );
    return rows.map(mapVault);
}

export interface VaultPaletteInput {
    title: string;
    description?: string;
    colors: string[];
    tags?: string[];
    notes?: string | null;
    gamut?: string | null;
    wcagLevel?: string | null;
}

export async function createVaultPalette(input: VaultPaletteInput): Promise<VaultPalette> {
    const userId = await getCurrentAuthUserId();
    const supabase = getSupabaseClient();
    const row = await run<VaultRow>(
        supabase
            .from(TABLES.vaultPalettes)
            .insert({
                user_id: userId,
                title: input.title,
                description: input.description ?? '',
                colors: input.colors,
                tags: input.tags ?? [],
                notes: input.notes ?? null,
                gamut: input.gamut ?? null,
                wcag_level: input.wcagLevel ?? null
            })
            .select()
            .single(),
        'Falha ao salvar no cofre'
    );
    return mapVault(row);
}

export async function deleteVaultPalette(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    await run(supabase.from(TABLES.vaultPalettes).delete().eq('id', id), 'Falha ao remover do cofre');
}

// ---------------------------------------------------------------------------
// Cores favoritas
// ---------------------------------------------------------------------------

interface FavoriteRow {
    id: string;
    hex: string;
    name: string;
    note: string;
    tags: string[];
    created_at: string;
}

function mapFavorite(row: FavoriteRow): FavoriteColor {
    return {
        id: row.id,
        hex: row.hex,
        name: row.name,
        note: row.note,
        dateAdded: formatShortDate(row.created_at),
        tags: row.tags ?? []
    };
}

export async function listFavoriteColors(): Promise<FavoriteColor[]> {
    const supabase = getSupabaseClient();
    const rows = await run<FavoriteRow[]>(
        supabase.from(TABLES.favoriteColors).select('*').order('created_at', { ascending: false }),
        'Falha ao carregar as amostras favoritas'
    );
    return rows.map(mapFavorite);
}

/** Salva uma amostra. O índice único (user_id, lower(hex)) evita duplicatas. */
export async function addFavoriteColor(input: {
    hex: string;
    name: string;
    note?: string;
    tags?: string[];
}): Promise<FavoriteColor | null> {
    const userId = await getCurrentAuthUserId();
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from(TABLES.favoriteColors)
        .insert({
            user_id: userId,
            hex: input.hex.toUpperCase(),
            name: input.name,
            note: input.note ?? '',
            tags: input.tags ?? []
        })
        .select()
        .single();

    // Violação do índice único = a amostra já está salvo; não é um erro real.
    if (error && (error as { code?: string }).code === '23505') return null;
    if (error) throw new Error(`Falha ao salvar a amostra: ${describeError(error)}`);
    return mapFavorite(data as FavoriteRow);
}

export async function deleteFavoriteColorByHex(hex: string): Promise<void> {
    const supabase = getSupabaseClient();
    await run(
        supabase.from(TABLES.favoriteColors).delete().eq('hex', hex.toUpperCase()),
        'Falha ao remover a amostra'
    );
}

// ---------------------------------------------------------------------------
// Estado do Estúdio (paleta ativa / stage)
// ---------------------------------------------------------------------------

export interface WorkspaceState {
    activePalette: string[];
    activeStage: 'generate' | 'refine' | 'audit' | 'export';
}

const DEFAULT_WORKSPACE: WorkspaceState = {
    activePalette: ['#1A1A1A', '#2563EB', '#38BDF8', '#F1F5F9', '#FFFFFF'],
    activeStage: 'generate'
};

export async function loadWorkspaceState(): Promise<WorkspaceState> {
    const userId = await getCurrentAuthUserId();
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from(TABLES.workspaceState)
        .select('active_palette, active_stage')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) return DEFAULT_WORKSPACE;
    if (!data) return DEFAULT_WORKSPACE;

    const stage = (data as { active_stage: string }).active_stage;
    return {
        activePalette: (data as { active_palette: string[] }).active_palette ?? DEFAULT_WORKSPACE.activePalette,
        activeStage: (['generate', 'refine', 'audit', 'export'] as const).includes(stage as never)
            ? (stage as WorkspaceState['activeStage'])
            : 'generate'
    };
}

export async function saveWorkspaceState(state: Partial<WorkspaceState>): Promise<void> {
    const userId = await getCurrentAuthUserId();
    const supabase = getSupabaseClient();
    const payload: Record<string, unknown> = { user_id: userId };
    if (state.activePalette !== undefined) payload.active_palette = state.activePalette;
    if (state.activeStage !== undefined) payload.active_stage = state.activeStage;

    const { error } = await supabase.from(TABLES.workspaceState).upsert(payload);
    if (error) throw new Error(`Falha ao salvar o estado do estúdio: ${describeError(error)}`);
}

// ---------------------------------------------------------------------------
// CMS Editorial
// ---------------------------------------------------------------------------

interface ArticleRow {
    id: string;
    title: string;
    slug: string;
    category: string;
    summary: string;
    meta_description: string | null;
    content: string;
    author_name: string;
    read_time: string;
    status: string;
    featured: boolean;
    views: number;
    published_at: string | null;
}

function mapArticle(row: ArticleRow): CmsArticle {
    return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        category: row.category as CmsArticle['category'],
        summary: row.summary,
        metaDescription: row.meta_description ?? undefined,
        content: row.content,
        author: row.author_name,
        readTime: row.read_time,
        status: row.status as CmsArticle['status'],
        featured: row.featured,
        publishedAt: formatShortDate(row.published_at),
        views: row.views ?? 0
    };
}

export async function listArticles(): Promise<CmsArticle[]> {
    const supabase = getSupabaseClient();
    const rows = await run<ArticleRow[]>(
        supabase
            .from(TABLES.articles)
            .select('*')
            .order('published_at', { ascending: false, nullsFirst: false }),
        'Falha ao carregar os artigos'
    );
    return rows.map(mapArticle);
}

export async function createArticle(input: Omit<CmsArticle, 'id' | 'views' | 'publishedAt'>): Promise<CmsArticle> {
    const userId = await getCurrentAuthUserId();
    const profile = await fetchCurrentProfile();
    const supabase = getSupabaseClient();

    const row = await run<ArticleRow>(
        supabase
            .from(TABLES.articles)
            .insert({
                title: input.title,
                slug: input.slug,
                category: input.category,
                summary: input.summary,
                meta_description: input.metaDescription ?? null,
                content: input.content,
                author_id: userId,
                author_name: input.author || profile?.name || 'Redação Izy Colors',
                read_time: input.readTime || '5 min de leitura',
                status: input.status,
                featured: input.featured ?? false,
                published_at: input.status === 'Publicado' ? new Date().toISOString() : null
            })
            .select()
            .single(),
        'Falha ao publicar o artigo'
    );
    return mapArticle(row);
}

export async function updateArticle(id: string, patch: Partial<CmsArticle>): Promise<CmsArticle> {
    const supabase = getSupabaseClient();
    const payload: Record<string, unknown> = {};
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.slug !== undefined) payload.slug = patch.slug;
    if (patch.category !== undefined) payload.category = patch.category;
    if (patch.summary !== undefined) payload.summary = patch.summary;
    if (patch.metaDescription !== undefined) payload.meta_description = patch.metaDescription;
    if (patch.content !== undefined) payload.content = patch.content;
    if (patch.readTime !== undefined) payload.read_time = patch.readTime;
    if (patch.status !== undefined) {
        payload.status = patch.status;
        if (patch.status === 'Publicado') payload.published_at = new Date().toISOString();
    }
    if (patch.featured !== undefined) payload.featured = patch.featured;

    const row = await run<ArticleRow>(
        supabase.from(TABLES.articles).update(payload).eq('id', id).select().single(),
        'Falha ao atualizar o artigo'
    );
    return mapArticle(row);
}

export async function deleteArticle(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    await run(supabase.from(TABLES.articles).delete().eq('id', id), 'Falha ao remover o artigo');
}

// ---------------------------------------------------------------------------
// Submissões da comunidade
// ---------------------------------------------------------------------------

interface SubmissionRow {
    id: string;
    title: string;
    author_id: string | null;
    author_name: string;
    author_handle: string;
    author_avatar: string | null;
    colors: string[];
    tags: string[];
    status: string;
    suggested_gamut: string;
    contrast_score: string;
    submitted_at: string;
}

function mapSubmission(row: SubmissionRow): CommunitySubmission {
    return {
        id: row.id,
        title: row.title,
        author: row.author_name,
        authorHandle: row.author_handle,
        authorAvatar: row.author_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.author_name)}`,
        colors: row.colors ?? [],
        tags: row.tags ?? [],
        submittedAt: formatDayAndTime(row.submitted_at),
        status: row.status as CommunitySubmission['status'],
        suggestedGamut: row.suggested_gamut,
        contrastScore: row.contrast_score
    };
}

/** Submissões visíveis à sessão: as do autor ou todas, se for curadoria. */
export async function listSubmissions(): Promise<CommunitySubmission[]> {
    const supabase = getSupabaseClient();
    const rows = await run<SubmissionRow[]>(
        supabase
            .from(TABLES.submissions)
            .select('*')
            .order('submitted_at', { ascending: false }),
        'Falha ao carregar as submissões'
    );
    return rows.map(mapSubmission);
}

export async function createSubmission(input: Omit<CommunitySubmission, 'id' | 'submittedAt' | 'status'>): Promise<CommunitySubmission> {
    const userId = await getCurrentAuthUserId();
    const profile = await fetchCurrentProfile();
    if (!profile) throw new Error('Perfil não encontrado para enviar a submissão.');

    const supabase = getSupabaseClient();
    const row = await run<SubmissionRow>(
        supabase
            .from(TABLES.submissions)
            .insert({
                author_id: userId,
                title: input.title,
                author_name: profile.name,
                author_handle: profile.handle,
                author_avatar: profile.avatar,
                colors: input.colors,
                tags: input.tags ?? [],
                suggested_gamut: input.suggestedGamut,
                contrast_score: input.contrastScore
            })
            .select()
            .single(),
        'Falha ao enviar a submissão'
    );
    return mapSubmission(row);
}

export async function updateSubmissionStatus(
    id: string,
    status: CommunitySubmission['status']
): Promise<CommunitySubmission> {
    const userId = await getCurrentAuthUserId();
    const supabase = getSupabaseClient();
    const row = await run<SubmissionRow>(
        supabase
            .from(TABLES.submissions)
            .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: userId })
            .eq('id', id)
            .select()
            .single(),
        'Falha ao revisar a submissão'
    );
    return mapSubmission(row);
}

// ---------------------------------------------------------------------------
// Taxonomia
// ---------------------------------------------------------------------------

export interface TaxonomyTag {
    name: string;
    count: number;
    category: string;
}

export async function listTaxonomyTags(): Promise<TaxonomyTag[]> {
    const supabase = getSupabaseClient();
    const rows = await run<{ name: string; count: number; category: string }[]>(
        supabase.from(TABLES.tags).select('*').order('count', { ascending: false }),
        'Falha ao carregar a taxonomia'
    );
    return rows;
}

export async function createTaxonomyTag(name: string, category: string): Promise<TaxonomyTag> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from(TABLES.tags)
        .upsert({ name, category, count: 1 }, { onConflict: 'name' })
        .select()
        .single();
    if (error) throw new Error(`Falha ao criar a tag: ${describeError(error)}`);
    return data as TaxonomyTag;
}

// ---------------------------------------------------------------------------
// Imagens curadas
// ---------------------------------------------------------------------------

function mapCuratedImage(row: {
    id: string;
    name: string;
    url: string;
    tag: string;
    colors: string[] | null;
    is_custom: boolean;
    created_at: string;
}): CuratedDemoImage {
    return {
        id: row.id,
        name: row.name,
        url: row.url,
        tag: row.tag,
        colors: row.colors ?? [],
        isCustom: row.is_custom,
        createdAt: formatShortDate(row.created_at)
    };
}

export async function listCuratedImages(): Promise<CuratedDemoImage[]> {
    const supabase = getSupabaseClient();
    const rows = await run<Parameters<typeof mapCuratedImage>[0][]>(
        supabase.from(TABLES.curatedImages).select('*').order('created_at', { ascending: false }),
        'Falha ao carregar as imagens curadas'
    );
    return rows.map(mapCuratedImage);
}

export async function saveCuratedImage(image: Omit<CuratedDemoImage, 'createdAt'>): Promise<void> {
    const supabase = getSupabaseClient();
    await run(
        supabase.from(TABLES.curatedImages).upsert({
            id: image.id,
            name: image.name,
            url: image.url,
            tag: image.tag,
            colors: image.colors ?? [],
            is_custom: image.isCustom ?? true
        }),
        'Falha ao salvar a imagem curada'
    );
}

export async function deleteCuratedImage(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    await run(supabase.from(TABLES.curatedImages).delete().eq('id', id), 'Falha ao remover a imagem curada');
}

// ---------------------------------------------------------------------------
// Auditoria
// ---------------------------------------------------------------------------

interface AuditRow {
    id: string;
    actor_name: string;
    actor_role: UserRole;
    action: string;
    details: string;
    type: AuditLogItem['type'];
    created_at: string;
}

function mapAuditLog(row: AuditRow): AuditLogItem {
    return {
        id: row.id,
        timestamp: formatDateTimeWithDay(row.created_at),
        actor: row.actor_name,
        actorRole: row.actor_role,
        action: row.action,
        details: row.details,
        type: row.type
    };
}

/** Trilha de auditoria — visível apenas a administradores (RLS). */
export async function listAuditLogs(limit = 50): Promise<AuditLogItem[]> {
    const supabase = getSupabaseClient();
    const rows = await run<AuditRow[]>(
        supabase.from(TABLES.auditLogs).select('*').order('created_at', { ascending: false }).limit(limit),
        'Falha ao carregar a trilha de auditoria'
    );
    return rows.map(mapAuditLog);
}

/**
 * Registra um evento de auditoria.
 * O ator é sempre derivado de `auth.uid()` no servidor — o cliente não pode
 * se atribuir autoria de terceiros.
 */
export async function logAuditEvent(
    action: string,
    details: string,
    type: AuditLogItem['type'] = 'system'
): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('log_audit_event', {
        p_action: action,
        p_details: details,
        p_type: type
    });
    if (error) console.warn('Não foi possível registrar o evento de auditoria:', describeError(error));
}