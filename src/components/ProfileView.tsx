import React, { useState, useEffect } from 'react';
import { 
  User, 
  Award, 
  Heart, 
  Layers, 
  Code, 
  Bookmark, 
  Lock, 
  Globe, 
  Sliders, 
  Check, 
  Copy, 
  Download, 
  Share2, 
  ExternalLink, 
  FileText, 
  Sparkles,
  CheckCircle2,
  Settings,
  ChevronRight,
  Plus,
  Palette as PaletteIcon,
  Trash2,
  SlidersHorizontal,
  Cloud,
  LogOut,
  ShieldCheck,
  Send,
  Eye
} from 'lucide-react';
import { 
  UserProfile, 
  Palette, 
  ProjectWorkspace, 
  CollectionBoard, 
  FavoriteColor, 
  VaultPalette,
  CommunitySubmission, 
  AuthUser 
} from '../types';
import { exportCssTokens } from '../utils/colorUtils';

interface ProfileViewProps {
  authUser: AuthUser;
  userProfile: UserProfile;
  palettes: Palette[];
  projects: ProjectWorkspace[];
  collections: CollectionBoard[];
  favoriteColors: FavoriteColor[];
  vaultPalettes?: VaultPalette[];
  submissions: CommunitySubmission[];
  onOpenInGenerator: (colors: string[]) => void;
  onSaveToCollection: (colors: string[]) => void;
  onOpenExport: (colors: string[], title?: string) => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onDeleteFavoriteColor?: (hex: string) => void;
  onDeleteVaultPalette?: (id: string) => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onOpenSubmissionModal?: () => void;
  isSupabaseConnected?: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  authUser,
  userProfile,
  palettes,
  projects,
  collections,
  favoriteColors,
  vaultPalettes = [],
  submissions,
  onOpenInGenerator,
  onSaveToCollection,
  onOpenExport,
  onUpdateProfile,
  onDeleteFavoriteColor,
  onDeleteVaultPalette,
  onOpenAuthModal,
  onLogout,
  onOpenSubmissionModal,
  isSupabaseConnected
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'palettes' | 'submissions' | 'swatches' | 'showcase' | 'collections' | 'vault' | 'settings'>('palettes');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  
  // Edit Profile Form State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(authUser.name || userProfile.name);
  const [editHandle, setEditHandle] = useState(authUser.handle || userProfile.handle);
  const [editTitle, setEditTitle] = useState(userProfile.title || 'Criador & Especialista em Cores');
  const [editBio, setEditBio] = useState(authUser.bio || userProfile.bio || '');
  const [editWebsite, setEditWebsite] = useState(userProfile.website || '');
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Sync edit state whenever authUser changes
  useEffect(() => {
    setEditName(authUser.name || userProfile.name);
    setEditHandle(authUser.handle || userProfile.handle);
    setEditBio(authUser.bio || userProfile.bio || '');
  }, [authUser, userProfile]);

  const handleCopyTokens = (p: Palette) => {
    const css = exportCssTokens(p.colors, p.title.toLowerCase().replace(/\s+/g, '-'));
    navigator.clipboard.writeText(css);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyColorHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1800);
  };

  const handleEditProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: editName.trim(),
      handle: editHandle.startsWith('@') ? editHandle.trim() : `@${editHandle.trim()}`,
      title: editTitle.trim(),
      bio: editBio.trim(),
      website: editWebsite.trim()
    });
    setShowEditModal(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  // Submissions filtered for current user
  const mySubmissions = submissions.filter(s => 
    (s.authorHandle && s.authorHandle.toLowerCase() === authUser.handle.toLowerCase()) ||
    (s.author && s.author.toLowerCase() === authUser.name.toLowerCase())
  );

  return (
    <div className="flex-1 bg-[#0B0F17] text-[#DFE2EE] p-4 sm:p-8 max-w-[1720px] mx-auto w-full pb-24">
      
      {/* Top Banner: Synchronized Identity Header */}
      <div className="bg-[#181C24] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl mb-8 relative overflow-hidden">
        {/* Ambient lighting */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#6366F1]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#06B6D4]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative z-10">
          {/* Avatar + Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <img 
                src={authUser.avatar || userProfile.avatar} 
                alt={authUser.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-white/20 shadow-2xl" 
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-3 border-[#181C24] rounded-full shadow-lg" title="Usuário Ativo" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Geist']">
                  {authUser.name}
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider font-mono ${
                  authUser.role === 'admin' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-[#6366F1] text-white'
                }`}>
                  {authUser.role === 'admin' ? 'ADMIN' : 'PRO'}
                </span>
                <span className="text-xs font-mono text-[#94A3B8]">
                  {authUser.handle}
                </span>
                <span className="text-[10px] font-mono text-[#64748B]">
                  • {authUser.email}
                </span>
              </div>

              <p className="text-sm font-medium text-[#06B6D4] mt-1 font-['Geist']">
                {userProfile.title || (authUser.role === 'admin' ? 'Administrador do Sistema & Curador' : 'Criador & Especialista em Cores')}
              </p>

              <p className="text-xs sm:text-sm text-[#94A3B8] mt-2 max-w-2xl leading-relaxed">
                {authUser.bio || userProfile.bio || 'Criador e explorador de paletas cromáticas no ecossistema Izy Colors.'}
              </p>

              {/* Status and External Links */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-mono text-[#94A3B8]">
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                  isSupabaseConnected ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                }`}>
                  <Cloud className="w-3.5 h-3.5" />
                  {isSupabaseConnected ? 'Nuvem Supabase Ativa' : 'Armazenamento Local'}
                </span>

                {userProfile.website && (
                  <span className="flex items-center gap-1 hover:text-white transition-colors">
                    <Globe className="w-3.5 h-3.5 text-[#06B6D4]" />
                    {userProfile.website}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start">
            <button
              onClick={() => onOpenInGenerator(['#0E1726', '#08BBD9', '#3B82F6', '#9354F5', '#FF2A85'])}
              className="h-9 px-3.5 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gerar Nova Paleta</span>
            </button>

            <button
              onClick={() => setShowEditModal(true)}
              className="h-9 px-3.5 bg-[#262A33] hover:bg-[#31353E] border border-white/[0.08] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Editar Perfil</span>
            </button>

            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="h-9 px-3 bg-[#1B212D] hover:bg-[#252C3B] border border-white/[0.08] text-[#94A3B8] hover:text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Trocar conta ou autenticar"
              >
                <User className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Conta</span>
              </button>
            )}
          </div>
        </div>

        {/* Badges Strip */}
        <div className="mt-6 pt-6 border-t border-white/[0.08] flex flex-wrap items-center gap-2">
          {(userProfile.badges || ['Curador Ativo', 'WCAG AAA Master', 'OKLCH Pioneer']).map((badge, idx) => (
            <span
              key={idx}
              className="px-3 py-1 rounded-full bg-[#111827] border border-white/[0.08] text-xs font-mono text-[#DFE2EE] flex items-center gap-1.5 shadow-inner"
            >
              <Award className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>{badge}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 4 Unified Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-[#181C24] border border-white/[0.08] rounded-xl shadow-lg">
          <span className="text-xs font-mono text-[#94A3B8]">Minhas Paletas</span>
          <div className="text-3xl font-bold font-mono text-white tracking-tight mt-1">
            {palettes.length}
          </div>
          <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
            Prontas para exportação
          </span>
        </div>

        <div className="p-5 bg-[#181C24] border border-white/[0.08] rounded-xl shadow-lg">
          <span className="text-xs font-mono text-[#94A3B8]">Cores Salvas</span>
          <div className="text-3xl font-bold font-mono text-[#EC4899] tracking-tight mt-1">
            {favoriteColors.length}
          </div>
          <span className="text-[11px] text-[#94A3B8] font-mono mt-1 block">
            Amostras no cofre rápido
          </span>
        </div>

        <div className="p-5 bg-[#181C24] border border-white/[0.08] rounded-xl shadow-lg">
          <span className="text-xs font-mono text-[#94A3B8]">Submissões Editoriais</span>
          <div className="text-3xl font-bold font-mono text-[#06B6D4] tracking-tight mt-1">
            {mySubmissions.length || submissions.length}
          </div>
          <span className="text-[11px] text-[#94A3B8] font-mono mt-1 block">
            Para revisão da comunidade
          </span>
        </div>

        <div className="p-5 bg-[#181C24] border border-white/[0.08] rounded-xl shadow-lg">
          <span className="text-xs font-mono text-[#94A3B8]">Coleções & Projetos</span>
          <div className="text-3xl font-bold font-mono text-purple-400 tracking-tight mt-1">
            {collections.length + projects.length}
          </div>
          <span className="text-[11px] text-[#06B6D4] font-mono mt-1 block">
            Workspaces organizados
          </span>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] mb-8 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('palettes')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'palettes'
              ? 'border-[#06B6D4] text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <PaletteIcon className="w-4 h-4 text-[#06B6D4]" />
          <span>Minhas Paletas & Forks ({palettes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('submissions')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'submissions'
              ? 'border-[#6366F1] text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <Send className="w-4 h-4 text-[#6366F1]" />
          <span>Submissões & Curadoria ({mySubmissions.length || submissions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('swatches')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'swatches'
              ? 'border-[#EC4899] text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4 text-[#EC4899]" />
          <span>Cores Favoritas ({favoriteColors.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('showcase')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'showcase'
              ? 'border-[#6366F1] text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <Eye className="w-4 h-4 text-purple-400" />
          <span>Vitrine Pública & Badges</span>
        </button>

        <button
          onClick={() => setActiveSubTab('collections')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'collections'
              ? 'border-[#6366F1] text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4 text-[#06B6D4]" />
          <span>Coleções & Boards ({collections.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('vault')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'vault'
              ? 'border-amber-400 text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Cofre Privado</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'settings'
              ? 'border-[#6366F1] text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 text-[#94A3B8]" />
          <span>Configurações & Exportação</span>
        </button>
      </div>

      {/* FEEDBACK TOAST */}
      {savedFeedback && (
        <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Perfil e preferências atualizados com sucesso!</span>
        </div>
      )}

      {/* SUB-TAB 1: PALETTES GRID */}
      {activeSubTab === 'palettes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white font-['Geist']">Minhas Paletas Cromáticas</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">Paletas criadas, calibradas ou clonadas no seu espaço de trabalho.</p>
            </div>
            {onOpenSubmissionModal && (
              <button
                onClick={onOpenSubmissionModal}
                className="h-8 px-3 bg-[#181C26] hover:bg-[#222838] border border-white/[0.1] rounded text-xs text-white flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Send className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Submeter à Curadoria</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {palettes.map((p) => (
              <div
                key={p.id}
                className="bg-[#181C24] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl hover:border-white/[0.18] transition-all flex flex-col justify-between group"
              >
                {/* Color Stripes Header */}
                <div 
                  onClick={() => onOpenInGenerator(p.colors)}
                  className="h-40 sm:h-44 w-full flex cursor-pointer relative overflow-hidden"
                  title="Abrir no Gerador"
                >
                  {p.colors.map((c, i) => (
                    <div key={i} className="flex-1 h-full transition-transform hover:scale-105 duration-150 relative group/stripe" style={{ backgroundColor: c }}>
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover/stripe:opacity-100 bg-black/60 text-white px-1 py-0.5 rounded transition-opacity">
                        {c}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 
                        onClick={() => onOpenInGenerator(p.colors)}
                        className="text-base font-semibold text-white tracking-tight cursor-pointer hover:text-[#06B6D4] transition-colors font-['Geist']"
                      >
                        {p.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs font-mono text-[#94A3B8]">
                        <Heart className="w-3.5 h-3.5 text-[#EC4899] fill-[#EC4899]" />
                        <span>{p.likes ? p.likes.toLocaleString() : '12'}</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#94A3B8] line-clamp-2 mb-3">
                      {p.description || 'Paleta harmônica calibrada com uniformidade perceptual.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 mb-4">
                      <span className="px-2 py-0.5 rounded bg-[#10141D] border border-white/[0.06] text-[10px] font-mono text-[#06B6D4]">
                        {p.gamut || 'Display P3'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
                        {p.wcagLevel || 'WCAG AAA'}
                      </span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center gap-2 pt-4 border-t border-white/[0.06]">
                    <button
                      onClick={() => onOpenInGenerator(p.colors)}
                      className="flex-1 h-8 bg-[#202532] hover:bg-[#2C3345] text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Gerador</span>
                    </button>

                    <button
                      onClick={() => handleCopyTokens(p)}
                      className="h-8 px-2.5 bg-[#202532] hover:bg-[#2C3345] text-[#94A3B8] hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                      title="Copiar CSS Tokens"
                    >
                      {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => onOpenExport(p.colors, p.title)}
                      className="h-8 px-2.5 bg-[#202532] hover:bg-[#2C3345] text-[#94A3B8] hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                      title="Exportar Amostras Illustrator (.jsx/.ase)"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SUBMISSIONS & CURATION */}
      {activeSubTab === 'submissions' && (
        <div className="bg-[#141822] border border-white/[0.08] rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
            <div>
              <h3 className="text-base font-semibold text-white font-['Geist']">Minhas Submissões para Curadoria Editorial</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Acompanhe o status de avaliação das suas criações para o Feed Oficial da Comunidade e selo Staff Pick.
              </p>
            </div>
            {onOpenSubmissionModal && (
              <button
                onClick={onOpenSubmissionModal}
                className="h-8 px-3 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Enviar Nova Paleta</span>
              </button>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {(mySubmissions.length > 0 ? mySubmissions : submissions).map((sub) => (
              <div 
                key={sub.id} 
                className="p-4 bg-[#181C26] border border-white/[0.06] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
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
                    {sub.contrastScore && (
                      <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        {sub.contrastScore}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-2.5">
                    {sub.colors.map((hex, i) => (
                      <div 
                        key={i} 
                        className="w-8 h-6 rounded border border-white/10"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenInGenerator(sub.colors)}
                    className="h-8 px-3 bg-[#10141D] hover:bg-[#202534] border border-white/[0.1] rounded text-xs text-[#94A3B8] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Abrir no Gerador</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SAVED SWATCHES */}
      {activeSubTab === 'swatches' && (
        <div className="bg-[#141822] border border-white/[0.08] rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white font-['Geist']">Cores & Amostras Favoritas</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">Clique em qualquer amostra para copiar o código hexadecimal instantaneamente.</p>
            </div>
            <span className="text-xs font-mono text-[#64748B]">{favoriteColors.length} amostras</span>
          </div>

          {favoriteColors.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#94A3B8] bg-[#10141D] rounded-xl border border-white/[0.04]">
              <Heart className="w-8 h-8 text-[#EC4899]/40 mx-auto mb-2" />
              <p>Nenhuma cor individual favoritada ainda.</p>
              <p className="text-[#64748B] mt-1">No gerador de cores ou na roda harmônica, clique no ícone de coração para guardar cores aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {favoriteColors.map((fav, idx) => {
                const hexVal = typeof fav === 'string' ? fav : fav.hex;
                const nameVal = typeof fav === 'string' ? fav : fav.name;
                return (
                  <div
                    key={idx}
                    onClick={() => handleCopyColorHex(hexVal)}
                    className="bg-[#181C26] border border-white/[0.08] hover:border-[#06B6D4]/40 rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer transition-all hover:scale-105 group relative"
                  >
                    <div 
                      className="w-full h-16 rounded-lg border border-white/10 shadow-inner flex items-center justify-center"
                      style={{ backgroundColor: hexVal }}
                    >
                      {copiedColor === hexVal && (
                        <span className="bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                          Copiado!
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-white group-hover:text-[#06B6D4] font-semibold">
                      {hexVal}
                    </span>
                    {nameVal && nameVal !== hexVal && (
                      <span className="text-[10px] text-[#94A3B8] truncate max-w-full">
                        {nameVal}
                      </span>
                    )}

                    {onDeleteFavoriteColor && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFavoriteColor(hexVal);
                        }}
                        className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 hover:bg-red-500 text-white/70 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remover dos favoritos"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: PUBLIC SHOWCASE & BADGES */}
      {activeSubTab === 'showcase' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#181C24] border border-white/[0.08] rounded-xl space-y-4">
            <h3 className="text-base font-bold text-white font-['Geist']">Vitrine do Criador & Métricas de Impacto</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Esta é a visualização pública que outros membros e designers veem ao navegar pelas suas coleções públicas no ecossistema Izy Colors.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-[#10141D] rounded-lg border border-white/[0.04]">
                <span className="text-xs font-mono text-[#94A3B8] block">Taxa de Aceite na Curadoria</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">99.2%</span>
                <span className="text-[11px] text-[#64748B] mt-0.5 block">Alto rigor técnico e contraste WCAG</span>
              </div>

              <div className="p-4 bg-[#10141D] rounded-lg border border-white/[0.04]">
                <span className="text-xs font-mono text-[#94A3B8] block">Exportações Realizadas</span>
                <span className="text-2xl font-bold font-mono text-[#06B6D4] mt-1 block">14.8k</span>
                <span className="text-[11px] text-[#64748B] mt-0.5 block">Formatos Tailwind v4, CSS e Illustrator</span>
              </div>

              <div className="p-4 bg-[#10141D] rounded-lg border border-white/[0.04]">
                <span className="text-xs font-mono text-[#94A3B8] block">Gamut de Preferência</span>
                <span className="text-2xl font-bold font-mono text-purple-400 mt-1 block">Display P3</span>
                <span className="text-[11px] text-[#64748B] mt-0.5 block">Calibração para telas Apple & OLED</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: COLLECTIONS & BOARDS */}
      {activeSubTab === 'collections' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {collections.map((col) => (
            <div key={col.id} className="bg-[#181C24] border border-white/[0.08] rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-white font-['Geist']">{col.title}</h3>
                <span className="text-xs font-mono text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-2 py-0.5 rounded">
                  {(col.paletteIds || []).length} Paletas
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mb-4">{col.description || 'Board temático de design system.'}</p>

              <div className="flex items-center gap-1.5 p-3 bg-[#10141D] rounded-lg border border-white/[0.04]">
                {(col.coverColors || ['#0E1726', '#08BBD9', '#3B82F6']).map((c, i) => (
                  <div key={i} className="h-6 flex-1 rounded border border-white/10" style={{ backgroundColor: c }} title={c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 6: VAULT PRO */}
      {activeSubTab === 'vault' && (
        <div className="space-y-6">
          <div className="bg-[#181C24] border border-amber-500/20 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Geist']">
                    Cofre Privado de Paletas & Tokens
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {vaultPalettes.length} paletas completas salvas com criptografia e calibradas para produção.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const allColors = vaultPalettes.flatMap(p => p.colors);
                    onOpenInGenerator(allColors.length > 0 ? allColors.slice(0, 5) : ['#0B0F17', '#181C24', '#08BBD9', '#6366F1', '#EC4899']);
                  }}
                  className="h-8 px-3.5 bg-amber-400 hover:bg-amber-300 text-black rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Carregar no Gerador</span>
                </button>
              </div>
            </div>

            {vaultPalettes.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#94A3B8] bg-[#10141D] rounded-xl border border-white/[0.04]">
                <Lock className="w-8 h-8 text-amber-400/40 mx-auto mb-2" />
                <p>Nenhuma paleta completa salva no cofre ainda.</p>
                <p className="text-[#64748B] mt-1">No gerador, roda cromática ou projetos, use a opção de salvar paleta completa no cofre.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vaultPalettes.map((pal) => (
                  <div
                    key={pal.id}
                    className="p-5 bg-[#111827] border border-white/[0.08] rounded-xl flex flex-col justify-between gap-4 hover:border-amber-400/40 transition-all shadow-md group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white font-['Geist']">{pal.title}</h4>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-400/10 text-amber-300 border border-amber-400/20">
                              {pal.gamut || 'Display P3'}
                            </span>
                          </div>
                          {pal.description && (
                            <p className="text-xs text-[#94A3B8] mt-1 leading-snug">{pal.description}</p>
                          )}
                        </div>

                        {onDeleteVaultPalette && (
                          <button
                            onClick={() => onDeleteVaultPalette(pal.id)}
                            className="p-1 text-[#64748B] hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remover do Cofre"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Color strip */}
                      <div className="h-10 rounded-lg overflow-hidden flex border border-white/10 shadow-inner">
                        {pal.colors.map((hex, i) => (
                          <div
                            key={i}
                            onClick={() => handleCopyColorHex(hex)}
                            className="flex-1 h-full cursor-pointer transition-transform hover:scale-105 relative group/c"
                            style={{ backgroundColor: hex }}
                            title={`${hex} - Clique para copiar`}
                          >
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold opacity-0 group-hover/c:opacity-100 bg-black/60 text-white transition-opacity">
                              {copiedColor === hex ? '✓' : hex}
                            </span>
                          </div>
                        ))}
                      </div>

                      {pal.notes && (
                        <div className="p-2.5 rounded-lg bg-[#181C24] border border-white/[0.04] text-[11px] text-[#DFE2EE] flex items-start gap-2">
                          <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{pal.notes}</span>
                        </div>
                      )}

                      {pal.tags && pal.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {pal.tags.map((t, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[10px] text-[#94A3B8] font-mono">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs">
                      <span className="text-[11px] font-mono text-[#64748B]">{pal.createdAt}</span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenExport(pal.colors, pal.title)}
                          className="px-2 py-1 rounded bg-[#181C24] hover:bg-white/[0.08] text-[#94A3B8] hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Exportar
                        </button>
                        <button
                          onClick={() => onOpenInGenerator(pal.colors)}
                          className="px-3 py-1 rounded bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Abrir no Gerador
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 7: SETTINGS & EXPORT PREFERENCES */}
      {activeSubTab === 'settings' && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-[#181C24] border border-white/[0.08] rounded-xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white font-['Geist'] mb-1">
              Preferências de Exportação de Tokens
            </h3>
            <p className="text-xs text-[#94A3B8] mb-6">
              Configure as regras globais para geração de arquivos CSS, Tailwind v4 e scripts de automação.
            </p>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-[#94A3B8] block mb-1">Formato Padrão de Representação:</label>
                <select className="w-full bg-[#111827] border border-white/[0.1] rounded-lg p-2.5 text-white">
                  <option>OKLCH (CSS Color 4) - Uniforme Perceptual</option>
                  <option>HEX (#RRGGBB) - Clássico Web</option>
                  <option>RGB (rgb(r, g, b))</option>
                  <option>HSL (hsl(h, s, l))</option>
                </select>
              </div>

              <div>
                <label className="text-[#94A3B8] block mb-1">Prefixo de Variável CSS:</label>
                <input
                  type="text"
                  defaultValue="sys-color"
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-[#94A3B8] block mb-1">Convenção de Nomes:</label>
                <select className="w-full bg-[#111827] border border-white/[0.1] rounded-lg p-2.5 text-white">
                  <option>kebab-case (--sys-color-primary-500)</option>
                  <option>camelCase (sysColorPrimary500)</option>
                  <option>snake_case (sys_color_primary_500)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-[#181C24] border border-white/[0.08] rounded-xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">Sessão e Identidade</h4>
              <p className="text-xs text-[#94A3B8] mt-0.5">Conectado como {authUser.email} ({authUser.role === 'admin' ? 'Administrador' : 'Usuário Comum'})</p>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Desconectar Sessão</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#181C24] border border-white/[0.12] rounded-xl p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-4 font-['Geist']">
              Editar Perfil do Criador
            </h3>
            <form onSubmit={handleEditProfileSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">Nome Completo:</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">Handle / Usuário (@):</label>
                <input
                  type="text"
                  required
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">Especialidade / Título:</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">Biografia:</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">Website / Link:</label>
                <input
                  type="text"
                  placeholder="https://meusite.design"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#06B6D4] hover:bg-[#08BBD9] text-black text-xs font-semibold shadow-sm cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
