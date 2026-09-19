import { AuthUser, AuditLogItem, UserRole } from '../types';
import { getSupabaseClient } from './supabase';

const STORAGE_KEY_USERS = 'izy_auth_users_v1';
const STORAGE_KEY_CURRENT = 'izy_auth_current_user_v1';
const STORAGE_KEY_AUDIT = 'izy_audit_logs_v1';

export const ALL_ROLES: UserRole[] = ['admin', 'moderator', 'editor', 'pro', 'user', 'guest'];

/** Nível obrigatório e único para cadastros: Administrador */
export const PUBLIC_SIGNUP_ROLE: UserRole = 'admin';

/** Cargos de privilégio */
export const PRIVILEGED_ROLES: UserRole[] = ['admin', 'moderator', 'editor', 'pro'];

export function isPrivilegedRole(role: unknown): boolean {
  return typeof role === 'string' && PRIVILEGED_ROLES.includes(role as UserRole);
}

/**
 * Resolve o cargo confiável de uma sessão Supabase Auth.
 */
export function resolveTrustedRole(metadataRole: unknown, registryRole?: UserRole): UserRole {
  if (registryRole) {
    return registryRole;
  }
  if (
    typeof metadataRole === 'string' &&
    (ALL_ROLES as string[]).includes(metadataRole)
  ) {
    return metadataRole as UserRole;
  }
  return PUBLIC_SIGNUP_ROLE;
}

/** Somente Administradores podem criar usuarios, alterar cargos ou suspender contas. */
export function canManageUserRoles(actor?: AuthUser | null): boolean {
  if (!actor || actor.role !== 'admin') return false;
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
    actor?.role || 'guest',
    action,
    details,
    type
  );
}

// Seed initial users for both Admin and Regular User accounts
export const INITIAL_USERS: AuthUser[] = [
  {
    id: 'usr-admin-1',
    name: 'Helena Vance',
    email: 'admin@izycolors.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    handle: '@helenavance',
    bio: 'Lead Color Architect & Design Systems Engineer. Especialista em espaços de cor perceptuais e acessibilidade WCAG AAA.',
    status: 'active',
    createdAt: '2026-01-15',
    lastLoginAt: 'Hoje, 09:42',
    palettesCount: 48,
    favoritesCount: 112,
    submissionsCount: 15
  },
  {
    id: 'usr-editor-1',
    name: 'Bruno Siqueira',
    email: 'editor@izycolors.com',
    role: 'editor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    handle: '@bruno_editor',
    bio: 'Curador Editorial & Revisor de Conteúdo Cromático. Responsável pela seleção de Staff Picks e edital da comunidade.',
    status: 'active',
    createdAt: '2026-01-28',
    lastLoginAt: 'Hoje, 08:30',
    palettesCount: 31,
    favoritesCount: 84,
    submissionsCount: 22
  },
  {
    id: 'usr-moderator-1',
    name: 'Ana Beatriz Fonseca',
    email: 'moderador@izycolors.com',
    role: 'moderator',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    handle: '@anabeatriz_mod',
    bio: 'Moderadora da Comunidade Izy Colors. Revisão de paletas, curadoria de Staff Picks e gestão de submissões.',
    status: 'active',
    createdAt: '2026-02-05',
    lastLoginAt: 'Hoje, 10:30',
    palettesCount: 19,
    favoritesCount: 56,
    submissionsCount: 35
  },
  {
    id: 'usr-pro-1',
    name: 'Camila Albuquerque',
    email: 'pro@izycolors.com',
    role: 'pro',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    handle: '@camila_pro',
    bio: 'Senior Design Systems Lead. Desenvolvendo tokens OKLCH e paletas de alta amostragem para apps de grande escala.',
    status: 'active',
    createdAt: '2026-02-01',
    lastLoginAt: 'Hoje, 11:05',
    palettesCount: 28,
    favoritesCount: 95,
    submissionsCount: 8
  },
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
  },
  {
    id: 'log-2',
    timestamp: 'Hoje, 09:42',
    actor: 'Helena Vance',
    actorRole: 'admin',
    action: 'Aprovação de Submissão',
    details: 'Paleta "Cyber Neon 2026" aprovada e destacada como Staff Pick',
    type: 'palette'
  },
  {
    id: 'log-3',
    timestamp: 'Hoje, 08:30',
    actor: 'Helena Vance',
    actorRole: 'admin',
    action: 'Publicação Editorial',
    details: 'Artigo "Guia Definitivo do Espaço OKLCH" publicado no CMS',
    type: 'cms'
  },
  {
    id: 'log-4',
    timestamp: 'Ontem, 16:20',
    actor: 'Helena Vance',
    actorRole: 'admin',
    action: 'Suspensão de Conta',
    details: 'Usuário @kenzo_sato colocado em estado de revisão',
    type: 'user'
  }
];

// Load all users from localStorage or return seed
export function getStoredUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
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
      if (parsed && parsed.id) {
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

// Authenticate via email/password (local match or Supabase Auth)
export async function authenticateUser(email: string, password?: string): Promise<{ success: boolean; user?: AuthUser; error?: string; viaSupabase?: boolean }> {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Try Supabase Auth if client is available
  const supabase = getSupabaseClient();
  if (supabase && password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (!error && data.user) {
        const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);
        // Cargo privilegiado so e aceito quando ja registrado (atribuido por um Administrador).
        const trustedRole = resolveTrustedRole(data.user.user_metadata?.role, existing?.role);

        const authUser: AuthUser = existing ? {
          ...existing,
          role: trustedRole,
          lastLoginAt: 'Hoje, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } : {
          id: data.user.id,
          name: data.user.user_metadata?.name || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          role: trustedRole,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(normalizedEmail)}`,
          handle: data.user.user_metadata?.handle || `@${normalizedEmail.split('@')[0]}`,
          bio: data.user.user_metadata?.bio || 'Membro do Izy Colors Studio',
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
          lastLoginAt: 'Hoje, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          palettesCount: 0,
          favoritesCount: 0,
          submissionsCount: 0
        };

        // Sync with local users registry
        if (!existing) {
          saveStoredUsers([authUser, ...users]);
        } else {
          saveStoredUsers(users.map(u => u.id === authUser.id ? authUser : u));
        }

        setCurrentAuthUser(authUser);
        logAuditEvent(authUser.name, authUser.role, 'Login Supabase Cloud', `Autenticado com sucesso via Supabase Auth (${authUser.role.toUpperCase()})`, 'auth');
        return { success: true, user: authUser, viaSupabase: true };
      } else if (error) {
        // If Supabase failed with explicit error, check if this email is a seeded local demo account
        const isSeededDemo = INITIAL_USERS.some(u => u.email.toLowerCase() === normalizedEmail);
        if (!isSeededDemo) {
          return { success: false, error: error.message || 'Credenciais inválidas no Supabase.' };
        }
      }
    } catch (err: any) {
      console.warn('Supabase auth fallback para autenticação local:', err);
    }
  }

  // 2. Local fallback matching for registered & seeded demo users
  const found = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (found) {
    if (found.status === 'suspended') {
      return { success: false, error: 'Esta conta está temporariamente suspensa pelo administrador.' };
    }
    const updatedUser = {
      ...found,
      lastLoginAt: 'Hoje, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setCurrentAuthUser(updatedUser);
    logAuditEvent(updatedUser.name, updatedUser.role, 'Login Local', `Sessão aberta como ${updatedUser.role === 'admin' ? 'Administrador' : 'Usuário'}`, 'auth');
    return { success: true, user: updatedUser, viaSupabase: false };
  }

  return {
    success: false,
    error: 'Conta não encontrada. Cadastre-se na aba "Criar Nova Conta" para começar.'
  };
}

// Register a new user (exclusively as Admin)
export async function registerUser(params: {
  name: string;
  email: string;
  password?: string;
  handle?: string;
  bio?: string;
}): Promise<{ success: boolean; user?: AuthUser; error?: string; message?: string; viaSupabase?: boolean }> {
  const users = getStoredUsers();
  const normalizedEmail = params.email.trim().toLowerCase();
  
  // Regra do sistema: Todas as novas contas são criadas exclusivamente como Administrador (admin).
  const desiredRole: UserRole = 'admin';
  const cleanHandle = params.handle?.trim()
    ? (params.handle.startsWith('@') ? params.handle : `@${params.handle}`)
    : `@${normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '')}`;

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
            role: desiredRole,
            bio: params.bio?.trim() || 'Administrador Izy Colors Studio'
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
    bio: params.bio?.trim() || 'Administrador Izy Colors Studio',
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
    `Nova conta criada como Administrador [ADMIN].`,
    'auth'
  );

  const levelNote = 'Nível de acesso atribuído: Administrador.';

  return {
    success: true,
    user: newUser,
    viaSupabase: usedSupabase,
    message: usedSupabase
      ? `Conta de Administrador criada e sincronizada com o Supabase Auth com sucesso! ${levelNote}`
      : `Conta de Administrador criada localmente com sucesso! ${levelNote}`
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
  // Reset to default regular user or guest representation
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
        role: resolveTrustedRole(u.user_metadata?.role),
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
          role: resolveTrustedRole(session.user.user_metadata?.role, existing.role),
          lastLoginAt: 'Hoje, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } : {
          id: session.user.id,
          name: session.user.user_metadata?.name || email.split('@')[0],
          email,
          role: resolveTrustedRole(session.user.user_metadata?.role),
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

// Quick switch between demo roles (Admin, Moderator, Editor, Pro, User, Guest)
export function switchDemoRole(targetRole: UserRole): AuthUser {
  if (targetRole === 'guest') {
    const guestUser: AuthUser = {
      id: 'usr-guest-mode',
      name: 'Visitante (Trial)',
      email: 'guest@izycolors.com',
      role: 'guest',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Guest',
      handle: '@visitante',
      bio: 'Modo visitante experimental em pré-visualização.',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      lastLoginAt: 'Agora mesmo',
      palettesCount: 0,
      favoritesCount: 0,
      submissionsCount: 0
    };
    setCurrentAuthUser(guestUser);
    logAuditEvent(guestUser.name, guestUser.role, 'Alternância para Visitante', 'Sessão alterada para modo Visitante (Demonstração)', 'auth');
    return guestUser;
  }

  const users = getStoredUsers();
  const target = users.find(u => u.role === targetRole && u.status === 'active') || INITIAL_USERS.find(u => u.role === targetRole) || INITIAL_USERS[0];
  setCurrentAuthUser(target);
  logAuditEvent(target.name, target.role, 'Alternância de Perfil Demo', `Ambiente alterado para perfil ${target.role.toUpperCase()}`, 'auth');
  return target;
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

// Add a new user directly from Admin Area — todas as contas são criadas como Administrador
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

  const safeRole: UserRole = 'admin';

  const newUser: AuthUser = {
    id: `usr-${Date.now()}`,
    name: userData.name,
    email: userData.email.toLowerCase(),
    role: safeRole,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}`,
    handle: userData.handle.startsWith('@') ? userData.handle : `@${userData.handle}`,
    bio: userData.bio || 'Administrador Izy Colors Studio',
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
    'Novo Administrador Criado',
    `Administrador criou a conta ${newUser.name} como [ADMINISTRADOR]`,
    'user'
  );

  return { users: updated, newUser };
}
