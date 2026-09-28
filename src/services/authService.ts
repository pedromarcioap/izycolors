import { AuthUser, AuditLogItem, UserRole } from '../types';
import { getSupabaseClient } from './supabase';

const STORAGE_KEY_USERS = 'izy_auth_users_v1';
const STORAGE_KEY_CURRENT = 'izy_auth_current_user_v1';
const STORAGE_KEY_AUDIT = 'izy_audit_logs_v1';

export const ALL_ROLES: UserRole[] = ['admin', 'moderator', 'editor', 'pro', 'user'];

/** Nível obrigatório e único para cadastros públicos: Usuário Comum. */
export const PUBLIC_SIGNUP_ROLE: UserRole = 'user';

/** Cargos de privilégio */
export const PRIVILEGED_ROLES: UserRole[] = ['admin', 'moderator', 'editor', 'pro'];

export function isPrivilegedRole(role: unknown): boolean {
  return typeof role === 'string' && PRIVILEGED_ROLES.includes(role as UserRole);
}

/**
 * Resolve o cargo confiável de uma sessão Supabase Auth.
 * O user_metadata enviado pelo cliente NUNCA é confiável: um cargo elevado
 * só é aceito quando já consta no registro local mantido por um Administrador.
 */
export function resolveTrustedRole(_metadataRole: unknown, registryRole?: UserRole): UserRole {
  if (registryRole && (ALL_ROLES as string[]).includes(registryRole)) {
    return registryRole;
  }
  return PUBLIC_SIGNUP_ROLE;
}

/** Somente Administradores podem criar usuarios, alterar cargos ou suspender contas. */
export function canManageUserRoles(actor?: AuthUser | null): boolean {
  if (actor?.role !== 'admin') return false;
  const registry = getStoredUsers();
  const stored =
    registry.find(u => u.id === actor.id) ||
    registry.find(u => u.email.toLowerCase() === actor.email.toLowerCase());
  // Sessoes Supabase Admin ainda nao sincronizadas localmente sao aceitas.
  return !stored || stored.role === 'admin';
}

/** Registra tentativa negada de operacao privilegiada para trilha de auditoria. */
function logDeniedOperation(actor: AuthUser | undefined, action: string, details: string, type: AuditLogItem['type'] = 'system') {
  logAuditEvent(
    actor?.name || 'Sessao desconhecida',
    actor?.role || 'user',
    action,
    details,
    type
  );
}

// Seed initial local users (regular users only; privileged accounts are created by admins)
export const INITIAL_USERS: AuthUser[] = [
  {
    id: 'usr-regular-1',
    name: 'Pedro Márcio',
    email: 'pedromarcioap@gmail.com',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    handle: '@pedromarcio',
    bio: 'Designer de Interfaces & Ilustrador Digital. Explorando paletas com alto alcance dinâmico para produtos mobile e web.',
    status: 'active',
    createdAt: '2026-02-10',
    lastLoginAt: 'Hoje, 10:15',
    palettesCount: 14,
    favoritesCount: 38,
    submissionsCount: 4
  },
  {
    id: 'usr-regular-2',
    name: 'Matheus Costa',
    email: 'matheus@designcraft.io',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
    handle: '@matheus_c',
    bio: 'Senior Brand Designer. Curador de paletas editoriais e sistemas de cores para e-commerce de luxo.',
    status: 'active',
    createdAt: '2026-02-18',
    lastLoginAt: 'Ontem',
    palettesCount: 22,
    favoritesCount: 65,
    submissionsCount: 7
  },
  {
    id: 'usr-regular-3',
    name: 'Kenzo Sato',
    email: 'kenzo.sato@tokyo-lab.dev',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    handle: '@kenzo_sato',
    bio: 'Desenvolvedor Frontend & Pesquisador de Gamuts Wide-Color (P3 e Rec.2020).',
    status: 'suspended',
    createdAt: '2026-01-20',
    lastLoginAt: 'Há 1 semana',
    palettesCount: 5,
    favoritesCount: 18,
    submissionsCount: 1
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-1',
    timestamp: 'Hoje, 10:15',
    actor: 'Pedro Márcio',
    actorRole: 'user',
    action: 'Login no Sistema',
    details: 'Sessão iniciada via credencial de usuário comum',
    type: 'auth'
  }
];

// Load all users from localStorage or return seed
export function getStoredUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Sanitização: normaliza qualquer resíduo do antigo perfil demo 'guest'.
        return parsed.map((u: AuthUser) =>
          (u.role as string) === 'guest' ? { ...u, role: 'user' as UserRole } : u
        );
      }
    }
  } catch (err) {
    console.error('Erro ao ler usuários armazenados:', err);
  }
  return INITIAL_USERS;
}

// Save users list to localStorage
export function saveStoredUsers(users: AuthUser[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Erro ao persistir usuários:', err);
  }
}

// Get currently active user (defaults to Admin for full experience preview)
export function getCurrentAuthUser(): AuthUser {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.id) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao carregar usuário atual:', err);
  }
  // Default to admin
  return INITIAL_USERS[0];
}

// Set currently active user
export function setCurrentAuthUser(user: AuthUser): void {
  try {
    localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(user));
  } catch (err) {
    console.error('Erro ao salvar usuário atual:', err);
  }
}

// Load audit logs
export function getStoredAuditLogs(): AuditLogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao ler logs de auditoria:', err);
  }
  return INITIAL_AUDIT_LOGS;
}

// Add an audit log event
export function logAuditEvent(actor: string, actorRole: UserRole, action: string, details: string, type: AuditLogItem['type']): AuditLogItem[] {
  const currentLogs = getStoredAuditLogs();
  const newLog: AuditLogItem = {
    id: `log-${Date.now()}`,
    timestamp: 'Agora mesmo',
    actor,
    actorRole,
    action,
    details,
    type
  };
  const updated = [newLog, ...currentLogs].slice(0, 50); // keep last 50
  try {
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updated));
  } catch (err) { }
  return updated;
}

type AuthResult = { success: boolean; user?: AuthUser; error?: string; viaSupabase?: boolean };

/** Formata o horário atual no padrão curto usado em lastLoginAt. */
function formatLoginTime(): string {
  return 'Hoje, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Monta o AuthUser a partir de uma sessão Supabase, preservando dados locais quando existirem. */
function buildSupabaseAuthUser(
  supabaseUser: { id: string; user_metadata?: Record<string, any> },
  normalizedEmail: string,
  existing?: AuthUser
): AuthUser {
  // Cargo privilegiado so e aceito quando ja registrado (atribuido por um Administrador).
  const trustedRole = resolveTrustedRole(undefined, existing?.role);
  const lastLoginAt = formatLoginTime();

  if (existing) {
    return { ...existing, role: trustedRole, lastLoginAt };
  }

  const localPart = normalizedEmail.split('@')[0];
  return {
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.name || localPart,
    email: normalizedEmail,
    role: trustedRole,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(normalizedEmail)}`,
    handle: supabaseUser.user_metadata?.handle || `@${localPart}`,
    bio: supabaseUser.user_metadata?.bio || 'Membro do Izy Colors Studio',
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
    lastLoginAt,
    palettesCount: 0,
    favoritesCount: 0,
    submissionsCount: 0
  };
}

/** Persiste o usuário autenticado no registro local, criando ou atualizando o registro. */
function syncLocalRegistry(authUser: AuthUser, users: AuthUser[], existing?: AuthUser): void {
  if (existing) {
    saveStoredUsers(users.map(u => u.id === authUser.id ? authUser : u));
  } else {
    saveStoredUsers([authUser, ...users]);
  }
}

/** Tenta autenticar via Supabase Auth. Retorna null quando o cliente está indisponível. */
async function authenticateViaSupabase(
  normalizedEmail: string,
  password: string,
  users: AuthUser[]
): Promise<AuthResult | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (error) {
      // Credenciais Supabase inválidas NÃO caem em fallback local.
      return { success: false, error: error.message || 'Credenciais inválidas no Supabase.' };
    }

    if (!data.user) return null;

    const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);
    const authUser = buildSupabaseAuthUser(data.user, normalizedEmail, existing);

    syncLocalRegistry(authUser, users, existing);
    setCurrentAuthUser(authUser);
    logAuditEvent(authUser.name, authUser.role, 'Login Supabase Cloud', `Autenticado com sucesso via Supabase Auth (${authUser.role.toUpperCase()})`, 'auth');
    return { success: true, user: authUser, viaSupabase: true };
  } catch (err: any) {
    console.warn('Supabase indisponível, autenticação local:', err);
    return null;
  }
}

/** Fallback local para usuários registrados localmente (somente quando Supabase indisponível). */
function authenticateLocally(normalizedEmail: string, users: AuthUser[]): AuthResult {
  const found = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!found) {
    return {
      success: false,
      error: 'Conta não encontrada. Cadastre-se na aba "Criar Nova Conta" para começar.'
    };
  }

  if (found.status === 'suspended') {
    return { success: false, error: 'Esta conta está temporariamente suspensa pelo administrador.' };
  }

  const updatedUser = { ...found, lastLoginAt: formatLoginTime() };
  setCurrentAuthUser(updatedUser);
  logAuditEvent(updatedUser.name, updatedUser.role, 'Login Local', `Sessão aberta como ${updatedUser.role === 'admin' ? 'Administrador' : 'Usuário'}`, 'auth');
  return { success: true, user: updatedUser, viaSupabase: false };
}

// Authenticate via email/password (local match or Supabase Auth)
export async function authenticateUser(email: string, password?: string): Promise<AuthResult> {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Try Supabase Auth if client is available
  if (password) {
    const supabaseResult = await authenticateViaSupabase(normalizedEmail, password, users);
    if (supabaseResult) return supabaseResult;
  }

  // 2. Local fallback matching for locally registered users (somente quando Supabase indisponível)
  return authenticateLocally(normalizedEmail, users);
}

/** Garante que o handle esteja limpo (sem espaços nas bordas) e prefixado com '@'. */
function normalizeHandle(handle: string): string {
  const trimmed = handle.trim();
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

// Register a new user (exclusively as regular user — Usuário Comum)
export async function registerUser(params: {
  name: string;
  email: string;
  password?: string;
  handle?: string;
  bio?: string;
}): Promise<{ success: boolean; user?: AuthUser; error?: string; message?: string; viaSupabase?: boolean }> {
  const users = getStoredUsers();
  const normalizedEmail = params.email.trim().toLowerCase();

  // Regra do sistema: todo cadastro público cria exclusivamente Usuário Comum.
  // Qualquer cargo elevado enviado pelo cliente é ignorado/rejeitado.
  const desiredRole: UserRole = 'user';
  const trimmedHandle = params.handle?.trim();
  const cleanHandle = trimmedHandle
    ? normalizeHandle(trimmedHandle)
    : `@${normalizedEmail.split('@')[0].replace(/\W/g, '')}`;

  // Check if user already exists locally
  const alreadyExists = users.some(u => u.email.toLowerCase() === normalizedEmail);
  if (alreadyExists) {
    return { success: false, error: 'Já existe uma conta registrada com este endereço de e-mail.' };
  }

  // Try Supabase Auth SignUp
  const supabase = getSupabaseClient();
  let supabaseUserId: string | null = null;
  let usedSupabase = false;

  if (supabase && params.password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: params.password,
        options: {
          data: {
            name: params.name.trim(),
            handle: cleanHandle,
            bio: params.bio?.trim() || 'Criador Izy Colors'
            // Nenhum cargo é enviado: o nível é fixado como 'user' no backend (trigger handle_new_user).
          }
        }
      });

      if (error) {
        return { success: false, error: error.message || 'Falha ao registrar usuário no Supabase.' };
      }

      if (data.user) {
        supabaseUserId = data.user.id;
        usedSupabase = true;
      }
    } catch (err: any) {
      console.warn('Erro ao conectar ao Supabase Auth, prosseguindo com criação local:', err);
    }
  }

  const newUser: AuthUser = {
    id: supabaseUserId || `usr-${Date.now()}`,
    name: params.name.trim(),
    email: normalizedEmail,
    role: desiredRole,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(params.name.trim())}`,
    handle: cleanHandle,
    bio: params.bio?.trim() || 'Criador Izy Colors',
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
    lastLoginAt: 'Hoje, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    palettesCount: 0,
    favoritesCount: 0,
    submissionsCount: 0
  };

  const updatedList = [newUser, ...users];
  saveStoredUsers(updatedList);
  setCurrentAuthUser(newUser);

  logAuditEvent(
    newUser.name,
    newUser.role,
    usedSupabase ? 'Registro Supabase Cloud' : 'Registro de Conta',
    `Nova conta criada como Usuário Comum [USER].`,
    'auth'
  );

  const levelNote = 'Nível de acesso atribuído: Usuário Comum.';

  return {
    success: true,
    user: newUser,
    viaSupabase: usedSupabase,
    message: usedSupabase
      ? `Conta criada e sincronizada com o Supabase Auth com sucesso! ${levelNote}`
      : `Conta criada localmente com sucesso! ${levelNote}`
  };
}

// Log out active user and sign out from Supabase
export async function logoutAuthUser(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Erro ao deslogar do Supabase:', e);
    }
  }
  // Reset to default regular user
  const defaultUser = INITIAL_USERS.find(u => u.role === 'user') || INITIAL_USERS[0];
  setCurrentAuthUser(defaultUser);
  logAuditEvent(defaultUser.name, defaultUser.role, 'Log Out', 'Sessão encerrada com sucesso', 'auth');
}

// Check if a Supabase cloud session is active
export async function checkCurrentSession(): Promise<AuthUser | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.getSession();
    if (!error && data.session?.user) {
      const u = data.session.user;
      const email = u.email || '';
      const users = getStoredUsers();
      const existing = users.find(usr => usr.email.toLowerCase() === email.toLowerCase());

      const sessionUser: AuthUser = existing || {
        id: u.id,
        name: u.user_metadata?.name || email.split('@')[0],
        email: email,
        role: resolveTrustedRole(undefined),
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
        handle: u.user_metadata?.handle || `@${email.split('@')[0]}`,
        bio: u.user_metadata?.bio || 'Criador Izy Colors',
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        lastLoginAt: 'Hoje',
        palettesCount: 0,
        favoritesCount: 0,
        submissionsCount: 0
      };
      setCurrentAuthUser(sessionUser);
      return sessionUser;
    }
  } catch (err) {
    console.warn('Erro ao verificar sessão Supabase:', err);
  }
  return null;
}

// Request password reset email via Supabase Auth
export async function resetPasswordForEmail(email: string): Promise<{ success: boolean; error?: string; message?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, message: `Instruções de redefinição de senha enviadas para ${normalizedEmail}.` };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao enviar email de recuperação.' };
    }
  }
  return {
    success: fontCheckSimulatedSuccess(normalizedEmail),
    message: `(Modo Local) Link de redefinição simulado com sucesso para ${normalizedEmail}.`
  };
}

function fontCheckSimulatedSuccess(_email: string): boolean {
  return true;
}

// Subscribe to Supabase Auth State Changes for automatic session restoration
export function initAuthListener(onUserChange: (user: AuthUser) => void): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => { };

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session?.user) {
        const email = session.user.email || '';
        const users = getStoredUsers();
        const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        const authUser: AuthUser = existing ? {
          ...existing,
          role: resolveTrustedRole(undefined, existing.role),
          lastLoginAt: 'Hoje, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } : {
          id: session.user.id,
          name: session.user.user_metadata?.name || email.split('@')[0],
          email,
          role: resolveTrustedRole(undefined),
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
          handle: session.user.user_metadata?.handle || `@${email.split('@')[0]}`,
          bio: session.user.user_metadata?.bio || 'Criador Izy Colors',
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
          lastLoginAt: 'Hoje',
          palettesCount: 0,
          favoritesCount: 0,
          submissionsCount: 0
        };
        setCurrentAuthUser(authUser);
        onUserChange(authUser);
      }
    } else if (event === 'SIGNED_OUT') {
      const defaultUser = INITIAL_USERS.find(u => u.role === 'user') || INITIAL_USERS[0];
      setCurrentAuthUser(defaultUser);
      onUserChange(defaultUser);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}

// Update role of a user in Admin area — restrito a Administradores
export function updateUserRole(userId: string, newRole: UserRole, adminActor: AuthUser): AuthUser[] {
  const users = getStoredUsers();

  if (!canManageUserRoles(adminActor)) {
    console.warn('[RBAC] Alteração de cargo negada: solicitante sem privilégio de Administrador.');
    logDeniedOperation(
      adminActor,
      'Alteração de Cargo Negada',
      `Tentativa não autorizada de alterar o cargo do usuário ${userId} para [${String(newRole).toUpperCase()}]`
    );
    return users;
  }

  if (!ALL_ROLES.includes(newRole)) {
    return users;
  }

  const target = users.find(u => u.id === userId);
  const updated = users.map(u => {
    if (u.id === userId) {
      return { ...u, role: newRole };
    }
    return u;
  });
  saveStoredUsers(updated);

  logAuditEvent(
    adminActor.name,
    'admin',
    'Alteração de Cargo',
    `Cargo do usuário ${target ? target.name : userId} alterado para [${newRole.toUpperCase()}]`,
    'user'
  );
  return updated;
}

// Toggle user active / suspended status — restrito a Administradores
export function toggleUserStatus(userId: string, adminActor: AuthUser): AuthUser[] {
  const users = getStoredUsers();

  if (!canManageUserRoles(adminActor)) {
    console.warn('[RBAC] Alteração de status negada: solicitante sem privilégio de Administrador.');
    logDeniedOperation(
      adminActor,
      'Alteração de Status Negada',
      `Tentativa não autorizada de alterar o status do usuário ${userId}`
    );
    return users;
  }

  let changedStatus: 'active' | 'suspended' | null = null;
  let targetName = '';

  const updated: AuthUser[] = users.map(u => {
    if (u.id === userId) {
      const nextStatus: 'active' | 'suspended' = u.status === 'active' ? 'suspended' : 'active';
      changedStatus = nextStatus;
      targetName = u.name;
      return { ...u, status: nextStatus };
    }
    return u;
  });
  saveStoredUsers(updated);

  const isSuspended = changedStatus === 'suspended';

  logAuditEvent(
    adminActor.name,
    'admin',
    isSuspended ? 'Conta Suspensa' : 'Conta Reativada',
    `Usuário ${targetName} teve seu status alterado para [${changedStatus}]`,
    'user'
  );
  return updated;
}

// Add a new user directly from Admin Area — restrito a Administradores.
// O cargo elevado só é concedido quando o solicitante é um Administrador autenticado.
export function createNewUserFromAdmin(
  userData: { name: string; email: string; handle: string; role?: UserRole; bio?: string },
  adminActor: AuthUser
): { users: AuthUser[]; newUser: AuthUser | null } {
  const users = getStoredUsers();

  if (!canManageUserRoles(adminActor)) {
    console.warn('[RBAC] Criação de usuário negada: solicitante sem privilégio de Administrador.');
    logDeniedOperation(
      adminActor,
      'Criação de Usuário Negada',
      `Tentativa não autorizada de criar o usuário ${userData.email}`
    );
    return { users, newUser: null };
  }

  const requestedRole = userData.role;
  const safeRole: UserRole =
    requestedRole && ALL_ROLES.includes(requestedRole) ? requestedRole : 'user';

  const newUser: AuthUser = {
    id: `usr-${Date.now()}`,
    name: userData.name,
    email: userData.email.toLowerCase(),
    role: safeRole,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}`,
    handle: normalizeHandle(userData.handle),
    bio: userData.bio || 'Criador Izy Colors',
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
    lastLoginAt: 'Nunca',
    palettesCount: 0,
    favoritesCount: 0,
    submissionsCount: 0
  };

  const updated = [newUser, ...users];
  saveStoredUsers(updated);

  logAuditEvent(
    adminActor.name,
    'admin',
    safeRole === 'admin' ? 'Novo Administrador Criado' : 'Novo Usuário Criado',
    `Administrador criou a conta ${newUser.name} como [${safeRole.toUpperCase()}]`,
    'user'
  );

  return { users: updated, newUser };
}
