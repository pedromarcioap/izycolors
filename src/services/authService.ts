import { AuthUser, UserRole } from '../types';
import { getSupabaseClient } from './supabase';
import {
  adminSetUserRole,
  adminSetUserStatus,
  describeError,
  fetchCurrentProfile,
  logAuditEvent
} from './db';

/**
 * Autenticação e RBAC do Izy Colors.
 *
 * Toda a identidade vive no Supabase Auth + tabela `profiles`. Não existe mais
 * registro local de usuários, senha em texto, nem fallback "modo local": cada
 * falha de rede é falha de verdade, com a mensagem do servidor.
 */

export const ALL_ROLES: UserRole[] = ['admin', 'moderator', 'editor', 'pro', 'user'];

/** Nível obrigatório e único para cadastros públicos: Usuário Comum. */
export const PUBLIC_SIGNUP_ROLE: UserRole = 'user';

/** Cargos com algum grau de privilégio na curadoria ou no painel. */
export const PRIVILEGED_ROLES: UserRole[] = ['admin', 'moderator', 'editor', 'pro'];

export function isPrivilegedRole(role: unknown): boolean {
  return typeof role === 'string' && PRIVILEGED_ROLES.includes(role as UserRole);
}

/**
 * Guarda de UI para ações de governança.
 *
 * Isto NÃO é uma barreira de segurança — a decisão real acontece na RPC
 * `admin_set_profile_role`/`admin_set_profile_status` e na RLS. Serve apenas
 * para esconder controles indevidos.
 */
export function canManageUserRoles(actor?: AuthUser | null): boolean {
  return actor?.role === 'admin';
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/** Resolve o AuthUser da sessão atual a partir do perfil no banco. */
async function loadSessionUser(): Promise<AuthUser | null> {
  return fetchCurrentProfile();
}

/** Garante que a conta não esteja suspensa antes de liberar a sessão. */
async function assertAccountUsable(profile: AuthUser): Promise<void> {
  if (profile.status === 'suspended') {
    await getSupabaseClient().auth.signOut();
    throw new Error('Esta conta está temporariamente suspensa pelo administrador.');
  }
}

// ---------------------------------------------------------------------------
// Autenticação
// ---------------------------------------------------------------------------

export async function authenticateUser(email: string, password: string): Promise<AuthResult> {
  if (!email.trim()) return { success: false, error: 'Informe o endereço de e-mail.' };
  if (!password) return { success: false, error: 'Informe a senha de acesso.' };

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (error) {
      return { success: false, error: error.message || 'Credenciais inválidas.' };
    }
    if (!data.user) {
      return { success: false, error: 'Não foi possível iniciar a sessão.' };
    }

    const profile = await loadSessionUser();
    if (!profile) {
      await getSupabaseClient().auth.signOut();
      return {
        success: false,
        error: 'Perfil não encontrado para esta conta. Verifique o cadastro no banco.'
      };
    }

    await assertAccountUsable(profile);

    await logAuditEvent(
      'Login no Sistema',
      `Sessão iniciada via Supabase Auth como [${profile.role.toUpperCase()}]`,
      'auth'
    );

    return { success: true, user: profile };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Falha inesperada ao autenticar.'
    };
  }
}

function normalizeHandle(handle: string): string {
  const trimmed = handle.trim();
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

export interface RegisterResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  message?: string;
  /** True quando o Supabase exige confirmação de e-mail antes do primeiro acesso. */
  requiresEmailConfirmation?: boolean;
}

/**
 * Cadastro público.
 *
 * O cargo NÃO é enviado em `user_metadata`: o trigger `handle_new_user` fixa
 * `role = 'user'` e ignora qualquer valor vindo do cliente, porque
 * `raw_user_meta_data` é editável por quem chama a API.
 */
export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
  handle?: string;
  bio?: string;
}): Promise<RegisterResult> {
  if (!params.name?.trim()) return { success: false, error: 'Informe o nome completo.' };
  if (!params.email?.trim()) return { success: false, error: 'Informe o e-mail.' };
  if (!params.password || params.password.length < 6) {
    return { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' };
  }

  const normalizedEmail = params.email.trim().toLowerCase();
  const cleanHandle = params.handle?.trim()
    ? normalizeHandle(params.handle)
    : `@${normalizedEmail.split('@')[0].replace(/\W/g, '')}`;

  try {
    const { data, error } = await getSupabaseClient().auth.signUp({
      email: normalizedEmail,
      password: params.password,
      options: {
        data: {
          name: params.name.trim(),
          handle: cleanHandle,
          bio: params.bio?.trim() || 'Criador Izy Colors'
        }
      }
    });

    if (error) {
      return { success: false, error: error.message || 'Falha ao criar a conta.' };
    }

    // Sem sessão ativa = o projeto exige confirmação de e-mail.
    if (!data.session) {
      return {
        success: true,
        requiresEmailConfirmation: true,
        message: 'Conta criada! Confirme o e-mail enviado para ativar o acesso.'
      };
    }

    const profile = await loadSessionUser();
    if (!profile) {
      return {
        success: false,
        error: 'A conta foi criada, mas o perfil não pôde ser lido. Tente novamente.'
      };
    }

    await logAuditEvent('Registro de Conta', 'Nova conta criada como [USER]', 'auth');

    return {
      success: true,
      user: profile,
      message: 'Conta criada e sincronizada com o Supabase Auth! Nível atribuído: Usuário Comum.'
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Falha inesperada no cadastro.'
    };
  }
}

export async function logoutAuthUser(): Promise<void> {
  try {
    await getSupabaseClient().auth.signOut();
    await logAuditEvent('Log Out', 'Sessão encerrada com sucesso', 'auth');
  } catch (err) {
    console.warn('Erro ao encerrar a sessão:', err);
  }
}

/** Sessão ativa, ou null quando o visitante está deslogado. */
export async function checkCurrentSession(): Promise<AuthUser | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) return null;

  const profile = await loadSessionUser();
  if (!profile) return null;
  return profile;
}

export async function resetPasswordForEmail(
  email: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { success: false, error: 'Informe o e-mail da conta.' };
  }

  try {
    const { error } = await getSupabaseClient().auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/`
    });
    if (error) return { success: false, error: error.message };

    return {
      success: true,
      message: `Instruções de redefinição de senha enviadas para ${normalizedEmail}.`
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao enviar o e-mail de recuperação.'
    };
  }
}

/**
 * Assina as mudanças de sessão do Supabase Auth.
 * Devolve a função de cancelamento da assinatura.
 */
export function initAuthListener(onUserChange: (user: AuthUser | null) => void): () => void {
  const {
    data: { subscription }
  } = getSupabaseClient().auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      onUserChange(null);
      return;
    }
    if (event !== 'SIGNED_IN' && event !== 'TOKEN_REFRESHED' && event !== 'INITIAL_SESSION') {
      return;
    }
    void loadSessionUser().then((profile) => onUserChange(profile));
  });

  return () => {
    subscription.unsubscribe();
  };
}

// ---------------------------------------------------------------------------
// Governança de contas (exclusiva de administradores)
// ---------------------------------------------------------------------------

/**
 * Altera o cargo de um usuário via RPC `admin_set_profile_role`.
 * A autorização é verificada no servidor; o retorno é a lista atualizada.
 */
export async function updateUserRole(
  users: AuthUser[],
  userId: string,
  newRole: UserRole,
  adminActor: AuthUser
): Promise<AuthUser[]> {
  if (!canManageUserRoles(adminActor)) {
    throw new Error('Acesso negado: somente administradores podem alterar cargos.');
  }
  if (!ALL_ROLES.includes(newRole)) {
    throw new Error('Cargo inválido.');
  }

  const target = users.find((u) => u.id === userId);
  if (!target) throw new Error('Usuário não encontrado na lista atual.');

  const updatedProfile = await adminSetUserRole(target.email, newRole);

  await logAuditEvent(
    'Alteração de Cargo',
    `Cargo de ${target.name} alterado para [${newRole.toUpperCase()}]`,
    'user'
  );

  return users.map((u) => (u.id === updatedProfile.id ? updatedProfile : u));
}

/** Suspende/reativa uma conta via RPC `admin_set_profile_status`. */
export async function toggleUserStatus(
  users: AuthUser[],
  userId: string,
  adminActor: AuthUser
): Promise<AuthUser[]> {
  if (!canManageUserRoles(adminActor)) {
    throw new Error('Acesso negado: somente administradores podem alterar status.');
  }

  const target = users.find((u) => u.id === userId);
  if (!target) throw new Error('Usuário não encontrado na lista atual.');

  const nextStatus = target.status === 'active' ? 'suspended' : 'active';
  const updatedProfile = await adminSetUserStatus(target.email, nextStatus);

  await logAuditEvent(
    nextStatus === 'suspended' ? 'Conta Suspensa' : 'Conta Reativada',
    `Status de ${target.name} alterado para [${nextStatus}]`,
    'user'
  );

  return users.map((u) => (u.id === updatedProfile.id ? updatedProfile : u));
}

/**
 * Cria uma conta a partir do Painel Administrativo.
 *
 * Exige a Edge Function `admin-create-user`: só ela possui a `service_role`
 * necessária para gravar em `auth.users`. O cliente com a anon key não tem —
 * e não deve ter — esse poder.
 */
export async function createNewUserFromAdmin(
  userData: {
    name: string;
    email: string;
    handle: string;
    role?: UserRole;
    bio?: string;
    password?: string;
  },
  adminActor: AuthUser
): Promise<{ user: AuthUser }> {
  if (!canManageUserRoles(adminActor)) {
    throw new Error('Acesso negado: somente administradores podem criar usuários.');
  }

  const safeRole: UserRole =
    userData.role && ALL_ROLES.includes(userData.role) ? userData.role : PUBLIC_SIGNUP_ROLE;

  const { data, error } = await getSupabaseClient().functions.invoke('admin-create-user', {
    body: {
      email: userData.email.trim().toLowerCase(),
      name: userData.name.trim(),
      handle: normalizeHandle(userData.handle),
      role: safeRole,
      bio: userData.bio,
      password: userData.password
    }
  });

  if (error) {
    throw new Error(`Falha ao criar a conta: ${describeError(error)}`);
  }
  if (!data?.profile) {
    throw new Error('A Edge Function não retornou o perfil criado.');
  }

  await logAuditEvent(
    safeRole === 'admin' ? 'Novo Administrador Criado' : 'Novo Usuário Criado',
    `Administrador criou a conta ${userData.email} como [${safeRole.toUpperCase()}]`,
    'user'
  );

  return { user: data.profile as AuthUser };
}

/** Recarrega a trilha de auditoria (admin). Reexportado por conveniência. */
export type { AuditLogItem } from '../types';
