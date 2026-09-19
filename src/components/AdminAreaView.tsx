import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Search, 
  Sliders, 
  Check, 
  X, 
  ArrowUpRight, 
  RefreshCw, 
  Lock, 
  Unlock, 
  UserCheck, 
  UserX, 
  Sparkles, 
  Award, 
  Activity, 
  Database,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { AuthUser, CommunitySubmission, CmsArticle, AuditLogItem, UserRole } from '../types';
import { 
  updateUserRole, 
  toggleUserStatus, 
  createNewUserFromAdmin, 
  switchDemoRole 
} from '../services/authService';

interface AdminAreaViewProps {
  currentUser: AuthUser;
  onUserChange: (user: AuthUser) => void;
  usersList: AuthUser[];
  onUpdateUsersList: (users: AuthUser[]) => void;
  submissions: CommunitySubmission[];
  onApproveSubmission: (id: string, asStaffPick: boolean) => void;
  onRejectSubmission: (id: string) => void;
  articles: CmsArticle[];
  onCreateArticle: (article: CmsArticle) => void;
  onDeleteArticle?: (id: string) => void;
  auditLogs: AuditLogItem[];
  onOpenInGenerator: (colors: string[]) => void;
  onNavigateToUserPortal: () => void;
  isSupabaseConnected: boolean;
  onOpenSupabaseModal: () => void;
}

export const AdminAreaView: React.FC<AdminAreaViewProps> = ({
  currentUser,
  onUserChange,
  usersList,
  onUpdateUsersList,
  submissions,
  onApproveSubmission,
  onRejectSubmission,
  articles,
  onCreateArticle,
  onDeleteArticle,
  auditLogs,
  onOpenInGenerator,
  onNavigateToUserPortal,
  isSupabaseConnected,
  onOpenSupabaseModal
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'moderation' | 'cms' | 'logs' | 'settings'>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'editor' | 'pro' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // New User Modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserHandle, setNewUserHandle] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('user');
  const [newUserBio, setNewUserBio] = useState('');

  // Article creation modal inside admin
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [newArticleTitle, setNewArticleTitle] = useState('');
  const [newArticleCategory, setNewArticleCategory] = useState<CmsArticle['category']>('Teoria da Cor');
  const [newArticleSummary, setNewArticleSummary] = useState('');
  const [newArticleContent, setNewArticleContent] = useState('');

  // Notification Toast state
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setLocalFeedback(msg);
    setTimeout(() => setLocalFeedback(null), 3500);
  };

  // Filtered users list (Hooks must run unconditionally before any early returns)
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const matchSearch = 
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.handle.toLowerCase().includes(userSearch.toLowerCase());
      
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [usersList, userSearch, roleFilter, statusFilter]);

  // If currently logged-in user is NOT an admin, render the permission restriction guard
  if (currentUser.role !== 'admin') {
    return (
      <div className="flex-1 bg-[#0B0F17] text-[#DFE2EE] p-6 sm:p-12 max-w-4xl mx-auto w-full flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-[#141822] border border-amber-500/30 rounded-2xl p-8 sm:p-10 shadow-2xl text-center max-w-xl w-full relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>

          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            Acesso Restrito
          </span>

          <h2 className="text-2xl font-bold text-white tracking-tight font-['Geist'] mt-4">
            Painel Administrativo Protegido
          </h2>

          <p className="text-xs sm:text-sm text-[#94A3B8] mt-2 leading-relaxed">
            Sua conta atual (<strong className="text-white">{currentUser.name}</strong> • {currentUser.email}) possui o perfil de <strong className="text-[#06B6D4]">Usuário Comum</strong>.
          </p>

          <p className="text-xs text-[#64748B] mt-2">
            Apenas administradores credenciados podem alterar cargos de usuários, aprovar submissões de curadoria e editar artigos do sistema.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                const adminUser = switchDemoRole('admin');
                onUserChange(adminUser);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Alternar para Perfil de Administrador</span>
            </button>

            <button
              onClick={onNavigateToUserPortal}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#1C2230] hover:bg-[#262E40] border border-white/[0.08] text-[#DFE2EE] rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Ir para Minha Área do Usuário</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Statistics
  const pendingSubmissionsCount = submissions.filter(s => s.status === 'Pendente').length;
  const adminCount = usersList.filter(u => u.role === 'admin').length;
  const editorCount = usersList.filter(u => u.role === 'editor').length;
  const proCount = usersList.filter(u => u.role === 'pro').length;
  const regularCount = usersList.filter(u => u.role === 'user' || u.role === 'guest').length;

  const handleRoleChange = (userId: string, nextRole: UserRole) => {
    const updated = updateUserRole(userId, nextRole, currentUser.name);
    onUpdateUsersList(updated);
    showFeedback(`Cargo atualizado para [${nextRole.toUpperCase()}].`);
  };

  const handleToggleStatus = (userId: string) => {
    const updated = toggleUserStatus(userId, currentUser.name);
    onUpdateUsersList(updated);
    showFeedback('Status do usuário atualizado.');
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const { users, newUser } = createNewUserFromAdmin({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      handle: newUserHandle.trim() || `@${newUserEmail.split('@')[0]}`,
      role: newUserRole,
      bio: newUserBio.trim()
    }, currentUser.name);

    onUpdateUsersList(users);
    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserHandle('');
    setNewUserBio('');
    showFeedback(`Usuário ${newUser.name} cadastrado com sucesso.`);
  };

  const handleCreateArticleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticleTitle.trim()) return;

    const article: CmsArticle = {
      id: `art-${Date.now()}`,
      title: newArticleTitle.trim(),
      slug: newArticleTitle.trim().toLowerCase().replace(/\s+/g, '-'),
      category: newArticleCategory,
      summary: newArticleSummary.trim(),
      content: newArticleContent.trim() || newArticleSummary.trim(),
      author: currentUser.name,
      readTime: '6 min de leitura',
      status: 'Publicado',
      featured: false,
      publishedAt: 'Hoje',
      views: 1
    };

    onCreateArticle(article);
    setShowArticleModal(false);
    setNewArticleTitle('');
    setNewArticleSummary('');
    setNewArticleContent('');
    showFeedback('Artigo editorial publicado com sucesso.');
  };

  return (
    <div className="flex-1 bg-[#0B0F17] text-[#DFE2EE] p-4 sm:p-8 max-w-[1720px] mx-auto w-full pb-24 select-none">
      {/* Local Action Feedback Toast */}
      {localFeedback && (
        <div className="fixed top-20 right-8 z-50 bg-[#141A24] border border-purple-500/40 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{localFeedback}</span>
        </div>
      )}

      {/* Top Admin Banner */}
      <div className="bg-[#141822] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-purple-300 uppercase bg-purple-500/20 border border-purple-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                Painel Administrativo Master
              </span>
              <span className="text-[10px] font-mono text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/20 px-2 py-0.5 rounded">
                Sessão Ativa: {currentUser.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Geist'] mt-2">
              Central de Governança & Moderação
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
              Gestão granular de usuários, controle de permissões (Admin / Usuário), moderação de paletas da comunidade, CMS editorial e auditoria de segurança.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenSupabaseModal}
              className={`h-9 px-3.5 rounded-lg border text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer ${
                isSupabaseConnected 
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
                  : 'bg-[#181C26] border-white/[0.08] text-[#94A3B8] hover:text-white'
              }`}
              title="Configurar Supabase Relational Database"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isSupabaseConnected ? 'Supabase Sincronizado' : 'Supabase Status'}</span>
            </button>

            <button
              onClick={onNavigateToUserPortal}
              className="h-9 px-3.5 bg-[#1C2230] hover:bg-[#262E40] border border-white/[0.08] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Acessar visão de criador comum"
            >
              <span>Minha Área do Usuário</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
            </button>
          </div>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/[0.06]">
          <div className="bg-[#10141D] border border-white/[0.04] p-3.5 rounded-xl">
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase block">Total de Usuários</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-white font-mono">{usersList.length}</span>
              <span className="text-[10px] font-mono text-purple-400">
                ({adminCount} Admins / {regularCount} Usuários)
              </span>
            </div>
          </div>

          <div className="bg-[#10141D] border border-white/[0.04] p-3.5 rounded-xl">
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase block">Fila de Moderação</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-amber-400 font-mono">{pendingSubmissionsCount}</span>
              <span className="text-[10px] font-mono text-[#64748B]">pendentes</span>
            </div>
          </div>

          <div className="bg-[#10141D] border border-white/[0.04] p-3.5 rounded-xl">
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase block">Artigos CMS</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-[#06B6D4] font-mono">{articles.length}</span>
              <span className="text-[10px] font-mono text-[#64748B]">publicados</span>
            </div>
          </div>

          <div className="bg-[#10141D] border border-white/[0.04] p-3.5 rounded-xl">
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase block">Logs de Auditoria</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-emerald-400 font-mono">{auditLogs.length}</span>
              <span className="text-[10px] font-mono text-[#64748B]">registrados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex items-center gap-1 border-b border-white/[0.08] mb-6 overflow-x-auto scrollbar-none pb-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Visão Geral & Métricas</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'users'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Gestão de Usuários</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px] font-mono text-white">
            {usersList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'moderation'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Moderação & Curadoria</span>
          {pendingSubmissionsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-[10px] font-mono text-black font-bold">
              {pendingSubmissionsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cms')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'cms'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>CMS Editorial</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Logs de Auditoria</span>
        </button>
      </div>

      {/* TAB 1: VISÃO GERAL & MÉTRICAS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions Panel */}
            <div className="bg-[#141822] border border-white/[0.08] rounded-xl p-6">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] font-semibold mb-4">
                Ações Rápidas de Administração
              </h3>
              <div className="space-y-2.5">
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="w-full p-3 bg-[#181C26] hover:bg-[#202534] border border-white/[0.06] hover:border-purple-500/30 rounded-lg text-xs text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span>Cadastrar Novo Usuário</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
                </button>

                <button
                  onClick={() => setActiveTab('moderation')}
                  className="w-full p-3 bg-[#181C26] hover:bg-[#202534] border border-white/[0.06] hover:border-amber-500/30 rounded-lg text-xs text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    <span>Moderar Paletas da Comunidade</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    {pendingSubmissionsCount} na fila
                  </span>
                </button>

                <button
                  onClick={() => setShowArticleModal(true)}
                  className="w-full p-3 bg-[#181C26] hover:bg-[#202534] border border-white/[0.06] hover:border-[#06B6D4]/30 rounded-lg text-xs text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[#06B6D4]/10 text-[#06B6D4] flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span>Publicar Novo Artigo Editorial</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
                </button>
              </div>
            </div>

            {/* User Distribution & Role Matrix */}
            <div className="bg-[#141822] border border-white/[0.08] rounded-xl p-6 lg:col-span-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] font-semibold mb-4">
                Matriz de Governança & Cargos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#181C26] border border-purple-500/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      Administradores Master
                    </span>
                    <span className="text-lg font-bold font-mono text-purple-400">{adminCount}</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] mt-2">
                    Privilégios totais: Gerenciam usuários, promovem e rebaixam cargos, publicam no CMS e aprovam paletas para o feed oficial.
                  </p>
                </div>

                <div className="p-4 bg-[#181C26] border border-[#06B6D4]/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#06B6D4]" />
                      Usuários Comuns (Criadores)
                    </span>
                    <span className="text-lg font-bold font-mono text-[#06B6D4]">{regularCount}</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] mt-2">
                    Privilégios de criação: Acesso ilimitado ao Gerador, Roda Harmônica, Extrator, Cofre e envio de paletas para curadoria.
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3.5 bg-[#10141D] border border-white/[0.04] rounded-lg flex items-center justify-between text-xs font-mono">
                <span className="text-[#94A3B8]">Taxa de Contas Ativas:</span>
                <span className="text-emerald-400 font-bold">
                  {Math.round((usersList.filter(u => u.status === 'active').length / usersList.length) * 100)}% de disponibilidade
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GESTÃO DE USUÁRIOS */}
      {activeTab === 'users' && (
        <div className="bg-[#141822] border border-white/[0.08] rounded-xl p-6 shadow-xl">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou @handle..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-[#10141D] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Role Filter */}
              <div className="flex items-center p-0.5 bg-[#10141D] border border-white/[0.08] rounded-lg text-xs font-mono overflow-x-auto">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-2.5 py-1 rounded ${roleFilter === 'all' ? 'bg-[#202534] text-white' : 'text-[#94A3B8] hover:text-white'}`}
                >
                  Todos ({usersList.length})
                </button>
                <button
                  onClick={() => setRoleFilter('admin')}
                  className={`px-2.5 py-1 rounded ${roleFilter === 'admin' ? 'bg-purple-600/30 text-purple-300' : 'text-[#94A3B8] hover:text-white'}`}
                >
                  Admins ({adminCount})
                </button>
                <button
                  onClick={() => setRoleFilter('editor')}
                  className={`px-2.5 py-1 rounded ${roleFilter === 'editor' ? 'bg-amber-600/30 text-amber-300' : 'text-[#94A3B8] hover:text-white'}`}
                >
                  Editores ({editorCount})
                </button>
                <button
                  onClick={() => setRoleFilter('pro')}
                  className={`px-2.5 py-1 rounded ${roleFilter === 'pro' ? 'bg-emerald-600/30 text-emerald-300' : 'text-[#94A3B8] hover:text-white'}`}
                >
                  Pro ({proCount})
                </button>
                <button
                  onClick={() => setRoleFilter('user')}
                  className={`px-2.5 py-1 rounded ${roleFilter === 'user' ? 'bg-cyan-600/30 text-cyan-300' : 'text-[#94A3B8] hover:text-white'}`}
                >
                  Usuários ({regularCount})
                </button>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="h-8 px-2.5 bg-[#10141D] border border-white/[0.08] rounded-lg text-xs font-mono text-[#94A3B8] focus:outline-none focus:border-purple-500"
              >
                <option value="all">Status: Todos</option>
                <option value="active">Apenas Ativos</option>
                <option value="suspended">Apenas Suspensos</option>
              </select>

              {/* Add User Button */}
              <button
                onClick={() => setShowAddUserModal(true)}
                className="h-8 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Usuário</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto border border-white/[0.06] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0E131E] border-b border-white/[0.06] font-mono text-[#94A3B8] uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Usuário</th>
                  <th className="p-3.5">E-mail</th>
                  <th className="p-3.5">Cargo / Papel</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Paletas</th>
                  <th className="p-3.5">Último Acesso</th>
                  <th className="p-3.5 text-right">Ações de Governança</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredUsers.map((user) => {
                  const isCurrentSession = user.id === currentUser.id;

                  return (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name + Avatar */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0" 
                          />
                          <div>
                            <span className="font-semibold text-white block">{user.name}</span>
                            <span className="text-[10px] font-mono text-[#64748B] block">{user.handle}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="p-3.5 font-mono text-[#94A3B8]">
                        {user.email}
                      </td>

                      {/* Role Pill */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                          user.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                          user.role === 'editor' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          user.role === 'pro' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          user.role === 'guest' ? 'bg-slate-500/20 text-slate-300 border-slate-500/40' :
                          'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4]/40'
                        }`}>
                          {user.role === 'admin' && <ShieldCheck className="w-3 h-3 text-purple-400" />}
                          {user.role === 'editor' && <FileText className="w-3 h-3 text-amber-400" />}
                          {user.role === 'pro' && <Sparkles className="w-3 h-3 text-emerald-400" />}
                          {(user.role === 'user' || user.role === 'guest') && <Users className="w-3 h-3 text-[#06B6D4]" />}
                          {user.role.toUpperCase()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono ${
                          user.status === 'active'
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-950/40 text-red-400 border border-red-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          {user.status === 'active' ? 'Ativo' : 'Suspenso'}
                        </span>
                      </td>

                      {/* Palettes */}
                      <td className="p-3.5 font-mono text-white">
                        {user.palettesCount}
                      </td>

                      {/* Last Login */}
                      <td className="p-3.5 font-mono text-[#94A3B8] text-[11px]">
                        {user.lastLoginAt}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Role Selector Select */}
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                            disabled={isCurrentSession}
                            className="px-2 py-1 bg-[#10141D] border border-white/10 rounded text-[11px] font-mono text-white focus:outline-none focus:border-purple-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title={isCurrentSession ? 'Você não pode alterar seu próprio cargo nesta sessão' : 'Alterar cargo do usuário'}
                          >
                            <option value="admin">ADMIN</option>
                            <option value="editor">EDITOR</option>
                            <option value="pro">PRO</option>
                            <option value="user">USER</option>
                            <option value="guest">GUEST</option>
                          </select>

                          {/* Toggle Status */}
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            disabled={isCurrentSession}
                            className={`p-1 rounded text-xs transition-colors border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                              user.status === 'active'
                                ? 'bg-red-950/20 hover:bg-red-950/40 border-red-500/30 text-red-400'
                                : 'bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                            }`}
                            title={user.status === 'active' ? 'Suspender Usuário' : 'Reativar Usuário'}
                          >
                            {user.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MODERAÇÃO & CURADORIA */}
      {activeTab === 'moderation' && (
        <div className="bg-[#141822] border border-white/[0.08] rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Fila de Submissões da Comunidade</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Revise as paletas submetidas por criadores e aprove para exibição no Feed Oficial ou como Staff Pick.
              </p>
            </div>
            <span className="text-xs font-mono text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-2.5 py-1 rounded">
              {pendingSubmissionsCount} Aguardando Revisão
            </span>
          </div>

          <div className="space-y-4">
            {submissions.map((sub) => (
              <div 
                key={sub.id} 
                className="p-4 bg-[#181C26] border border-white/[0.06] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{sub.title}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      sub.status === 'Aprovado' 
                        ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30'
                        : sub.status === 'Rejeitado'
                        ? 'bg-red-950/50 text-red-400 border-red-500/30'
                        : 'bg-amber-950/50 text-amber-400 border-amber-500/30'
                    }`}>
                      {sub.status}
                    </span>
                  </div>

                  {/* Swatches strip */}
                  <div className="flex items-center gap-1.5">
                    {sub.colors.map((hex, i) => (
                      <div 
                        key={i} 
                        className="w-10 h-8 rounded border border-white/10 shadow flex items-center justify-center text-[9px] font-mono text-white/90"
                        style={{ backgroundColor: hex }}
                      >
                        {hex.substring(1, 4)}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-[#94A3B8]">
                    <span>Por: <strong className="text-white">{sub.author}</strong> ({sub.authorHandle})</span>
                    <span>•</span>
                    <span>Gamut: {sub.suggestedGamut}</span>
                    <span>•</span>
                    <span className="text-emerald-400">{sub.contrastScore}</span>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenInGenerator(sub.colors)}
                    className="h-8 px-3 bg-[#10141D] hover:bg-[#202534] border border-white/[0.1] rounded text-xs text-[#94A3B8] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Inspecionar no Gerador Procedural"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspecionar</span>
                  </button>

                  <button
                    onClick={() => {
                      onApproveSubmission(sub.id, true);
                      showFeedback(`Paleta "${sub.title}" aprovada como Staff Pick!`);
                    }}
                    className="h-8 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                    title="Destacar como Escolha da Equipe Editorial"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Aprovar Staff Pick</span>
                  </button>

                  <button
                    onClick={() => {
                      onApproveSubmission(sub.id, false);
                      showFeedback(`Paleta "${sub.title}" aprovada.`);
                    }}
                    className="h-8 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aprovar</span>
                  </button>

                  <button
                    onClick={() => {
                      onRejectSubmission(sub.id);
                      showFeedback(`Paleta "${sub.title}" rejeitada.`);
                    }}
                    className="h-8 px-2.5 bg-red-950/30 hover:bg-red-950/50 border border-red-500/30 text-red-400 rounded text-xs transition-colors cursor-pointer"
                    title="Rejeitar submissão"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CMS EDITORIAL */}
      {activeTab === 'cms' && (
        <div className="bg-[#141822] border border-white/[0.08] rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Artigos e Teorias Publicadas</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Crie e edite conteúdos sobre física da cor, Oklch, conformidade WCAG e Design Systems.
              </p>
            </div>
            <button
              onClick={() => setShowArticleModal(true)}
              className="h-8 px-3 bg-[#06B6D4] hover:bg-[#08BBD9] text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Artigo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((art) => (
              <div key={art.id} className="p-4 bg-[#181C26] border border-white/[0.06] rounded-xl flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#06B6D4]">
                      {art.category}
                    </span>
                    <span className="text-[11px] font-mono text-[#64748B]">
                      {art.publishedAt} • {art.views} visualizações
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2">{art.title}</h4>
                  <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed">
                    {art.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-xs font-mono">
                  <span className="text-[#64748B]">Por {art.author}</span>
                  {onDeleteArticle && (
                    <button
                      onClick={() => onDeleteArticle(art.id)}
                      className="text-red-400 hover:text-red-300 text-[11px] cursor-pointer"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: LOGS DE AUDITORIA */}
      {activeTab === 'logs' && (
        <div className="bg-[#141822] border border-white/[0.08] rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Trilha de Auditoria do Sistema</h3>
            <span className="text-xs font-mono text-[#64748B]">
              Histórico das últimas operações administrativas e de sessão
            </span>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-3 bg-[#181C26] border border-white/[0.04] rounded-lg flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-[#64748B] w-24 shrink-0">{log.timestamp}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{log.actor}</span>
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                      log.actorRole === 'admin' 
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    }`}>
                      {log.actorRole}
                    </span>
                    <span className="text-white/40">•</span>
                    <span className="font-medium text-[#DFE2EE]">{log.action}:</span>
                    <span className="text-[#94A3B8]">{log.details}</span>
                  </div>
                </div>

                <span className="text-[10px] font-mono uppercase text-[#64748B] bg-white/[0.02] px-2 py-0.5 rounded border border-white/[0.06]">
                  {log.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CADASTRAR NOVO USUÁRIO */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141822] border border-white/[0.12] rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white">Cadastrar Novo Usuário</h3>
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="text-[#94A3B8] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Beatriz Lima"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-[#10141D] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  placeholder="beatriz@design.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-[#10141D] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1">Handle</label>
                <input
                  type="text"
                  placeholder="@beatriz_design"
                  value={newUserHandle}
                  onChange={(e) => setNewUserHandle(e.target.value)}
                  className="w-full bg-[#10141D] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1">Cargo</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full bg-[#10141D] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="user">Usuário Comum (Criador)</option>
                  <option value="pro">Assinante Pro (Recursos Avançados)</option>
                  <option value="editor">Editor de Conteúdo (CMS & Curadoria)</option>
                  <option value="admin">Administrador Master</option>
                  <option value="guest">Visitante (Convidado)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-[#181C26] hover:bg-[#202534] rounded-lg text-xs text-[#94A3B8]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOVO ARTIGO */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141822] border border-white/[0.12] rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white">Publicar Novo Artigo Editorial</h3>
              <button 
                onClick={() => setShowArticleModal(false)}
                className="text-[#94A3B8] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateArticleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1">Título do Artigo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Anatomia de um Design System com Oklch"
                  value={newArticleTitle}
                  onChange={(e) => setNewArticleTitle(e.target.value)}
                  className="w-full bg-[#10141D] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1">Categoria</label>
                <select
                  value={newArticleCategory}
                  onChange={(e) => setNewArticleCategory(e.target.value as any)}
                  className="w-full bg-[#10141D] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
                >
                  <option value="Teoria da Cor">Teoria da Cor</option>
                  <option value="Design Systems">Design Systems</option>
                  <option value="Acessibilidade">Acessibilidade</option>
                  <option value="Tendências">Tendências</option>
                  <option value="Estudos de Caso">Estudos de Caso</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1">Resumo Executivo</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Breve resumo para os leitores e feeds de novidades..."
                  value={newArticleSummary}
                  onChange={(e) => setNewArticleSummary(e.target.value)}
                  className="w-full bg-[#10141D] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowArticleModal(false)}
                  className="px-4 py-2 bg-[#181C26] hover:bg-[#202534] rounded-lg text-xs text-[#94A3B8]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#06B6D4] hover:bg-[#08BBD9] text-black font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Publicar Artigo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
