import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Layers,
  Compass,
  SlidersHorizontal,
  Download,
  ChevronDown,
  Check,
  Eye,
  User,
  FileText,
  Command,
  ShieldCheck,
  LogIn,
  LogOut
} from 'lucide-react';
import { ColorGamut, NavigationTab, AuthUser } from '../types';
import { Logo } from './Logo';

interface NavbarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  gamut: ColorGamut;
  onGamutChange: (gamut: ColorGamut) => void;
  authUser?: AuthUser;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onOpenCommandPalette: () => void;
  onOpenExportModal: () => void;
  favoritesCount: number;
  projectsCount: number;
  onQuickGenerate?: () => void;
}

const getRoleDotBgClass = (role?: string) => {
  switch (role) {
    case 'admin': return 'bg-purple-400';
    case 'moderator': return 'bg-rose-400';
    case 'editor': return 'bg-amber-400';
    case 'pro': return 'bg-emerald-400';
    default: return 'bg-[#06B6D4]';
  }
};

const getRoleBadgeClasses = (role?: string) => {
  switch (role) {
    case 'admin': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    case 'moderator': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    case 'editor': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'pro': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    default: return 'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4]/40';
  }
};

const getRoleTitle = (role?: string) => {
  switch (role) {
    case 'admin': return 'Administrador';
    case 'moderator': return 'Moderador';
    case 'editor': return 'Editor';
    case 'pro': return 'Pro';
    default: return 'Usuário Comum';
  }
};

const getRoleBadgeLabel = (role?: string) => {
  switch (role) {
    case 'admin': return 'ADMIN';
    case 'moderator': return 'MOD';
    case 'editor': return 'EDITOR';
    case 'pro': return 'PRO';
    default: return 'USUÁRIO';
  }
};

interface QuickActionsDropdownProps {
  onTabChange: (tab: NavigationTab) => void;
  onQuickGenerate?: () => void;
}

const QuickActionsDropdown: React.FC<QuickActionsDropdownProps> = ({ onTabChange, onQuickGenerate }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-2.5 bg-[#181C24] hover:bg-[#262A33] border border-white/[0.08] rounded text-xs text-[#DFE2EE] flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
        <span className="hidden sm:inline">Ações Rápidas</span>
        <ChevronDown className="w-3 h-3 text-[#64748B]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#181C24] border border-white/[0.12] rounded-lg shadow-2xl py-1 text-xs z-50 animate-in fade-in zoom-in-95">
          <button
            onClick={() => {
              onTabChange('generator');
              onQuickGenerate?.();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-[#DFE2EE] hover:bg-[#262A33] flex items-center justify-between cursor-pointer"
          >
            <span>Gerar Paleta Procedural</span>
            <span className="text-[10px] font-mono text-[#94A3B8]">Espaço</span>
          </button>
          <button
            onClick={() => {
              onTabChange('wheel');
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-[#DFE2EE] hover:bg-[#262A33] flex items-center justify-between cursor-pointer"
          >
            <span>Roda Harmônica</span>
            <span className="text-[10px] text-[#06B6D4]">Regras</span>
          </button>
          <button
            onClick={() => {
              onTabChange('extractor');
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-[#DFE2EE] hover:bg-[#262A33] flex items-center justify-between cursor-pointer"
          >
            <span>Extrair Cores de Imagem</span>
            <span className="text-[10px] text-[#A0B89C]">K-Means</span>
          </button>
          <button
            onClick={() => {
              onTabChange('accessibility');
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-[#DFE2EE] hover:bg-[#262A33] flex items-center justify-between cursor-pointer"
          >
            <span>Simular Daltonismo & WCAG</span>
            <span className="text-[10px] text-[#EC4899]">APCA</span>
          </button>
        </div>
      )}
    </div>
  );
};

interface SubNavProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  authUser?: AuthUser;
  projectsCount: number;
  favoritesCount: number;
}

const SubNav: React.FC<SubNavProps> = ({
  currentTab,
  onTabChange,
  authUser,
  projectsCount,
  favoritesCount
}) => (
  <div className="max-w-[1720px] mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto scrollbar-none border-t border-white/[0.04] text-xs">
    <nav className="flex items-center gap-1 sm:gap-1.5 py-1.5">
      <button
        onClick={() => onTabChange('generator')}
        className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          currentTab === 'generator'
            ? 'bg-[#6366F1] text-white shadow-sm'
            : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Gerador</span>
        <span className={`text-[10px] font-mono px-1 rounded ${currentTab === 'generator' ? 'bg-white/20 text-white' : 'bg-[#181C24] text-[#64748B]'}`}>
          Espaço
        </span>
      </button>

      <button
        onClick={() => onTabChange('projects')}
        className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          currentTab === 'projects'
            ? 'bg-[#6366F1] text-white shadow-sm'
            : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>Projetos & Cofre</span>
        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${currentTab === 'projects' ? 'bg-white/20 text-white' : 'bg-[#262A33] text-[#06B6D4]'}`}>
          {projectsCount + favoritesCount}
        </span>
      </button>

      <button
        onClick={() => onTabChange('explorer')}
        className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          currentTab === 'explorer'
            ? 'bg-[#6366F1] text-white shadow-sm'
            : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        <Compass className="w-3.5 h-3.5" />
        <span>Explorar</span>
      </button>

      <button
        onClick={() => onTabChange('wheel')}
        className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          currentTab === 'wheel'
            ? 'bg-[#6366F1] text-white shadow-sm'
            : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        <div className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-current" />
        </div>
        <span>Roda Harmônica</span>
      </button>

      <button
        onClick={() => onTabChange('extractor')}
        className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          currentTab === 'extractor'
            ? 'bg-[#6366F1] text-white shadow-sm'
            : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        <Eye className="w-3.5 h-3.5" />
        <span>Extrator de Imagem</span>
      </button>

      <button
        onClick={() => onTabChange('lab')}
        className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          currentTab === 'lab'
            ? 'bg-[#6366F1] text-white shadow-sm'
            : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Color Space Lab</span>
      </button>

      <button
        onClick={() => onTabChange('accessibility')}
        className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          currentTab === 'accessibility'
            ? 'bg-[#6366F1] text-white shadow-sm'
            : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        <Check className="w-3.5 h-3.5 text-emerald-400" />
        <span>Auditoria WCAG</span>
      </button>

      {authUser?.role === 'admin' && (
        <button
          onClick={() => onTabChange('admin')}
          className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            currentTab === 'admin'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>Painel Admin</span>
        </button>
      )}

      {authUser?.role === 'admin' && (
        <button
          onClick={() => onTabChange('cms')}
          className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            currentTab === 'cms'
              ? 'bg-[#6366F1] text-white shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>CMS Editorial</span>
        </button>
      )}

      <button
        onClick={() => onTabChange('profile')}
        className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          currentTab === 'profile' || currentTab === 'user_dashboard'
            ? 'bg-[#6366F1] text-white shadow-sm font-semibold'
            : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        {authUser?.avatar ? (
          <img src={authUser.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
        ) : (
          <User className="w-3.5 h-3.5" />
        )}
        <span>{authUser?.name ? authUser.name.split(' ')[0] : 'Meu Perfil'}</span>
      </button>
    </nav>

    {/* Sync indicators */}
    <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-[#94A3B8] py-1">
      <span className="flex items-center gap-1 text-[#06B6D4]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
        {'REC.2020 / OKLCH SYNCED'}
      </span>
      <span>{'ΔE<0.4 LAB TOLERANCE'}</span>
      <span>ICC: Display P3-D65</span>
    </div>
  </div>
);

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  gamut,
  onGamutChange,
  authUser,
  onOpenAuthModal,
  onLogout,
  onOpenCommandPalette,
  onOpenExportModal,
  favoritesCount,
  projectsCount,
  onQuickGenerate
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0F17]/95 backdrop-blur-md border-b border-white/[0.08]">
      {/* Top Bar */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand & Gamut Switcher */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button
            onClick={() => onTabChange('generator')}
            className="flex items-center gap-2.5 group focus:outline-none cursor-pointer"
            title="izycolors - Ir para o Gerador"
          >
            <Logo size="sm" showSubtitle={true} />
          </button>

          {/* Gamut Selector */}
          <div className="hidden lg:flex items-center p-0.5 bg-[#181C24] border border-white/[0.08] rounded-md text-xs font-mono">
            {(['sRGB', 'Display P3', 'Rec.2020'] as ColorGamut[]).map(g => (
              <button
                key={g}
                onClick={() => onGamutChange(g)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  gamut === g
                    ? 'bg-[#262A33] text-white font-medium shadow-sm'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Global Search Bar with Hotkeys */}
        <div className="flex-1 max-w-xl mx-2 hidden md:block">
          <button
            onClick={onOpenCommandPalette}
            className="w-full h-9 px-3 bg-[#181C24] hover:bg-[#1C2028] border border-white/[0.08] rounded-md flex items-center justify-between text-xs text-[#94A3B8] transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#06B6D4] transition-colors" />
              <span>Pesquisar gamuts, tokens hex/oklch, tags...</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-[#262A33] text-[10px] text-white/70 border border-white/[0.06]">Dark Mode</span>
              <span className="px-1.5 py-0.5 rounded bg-[#262A33] text-[10px] text-white/70 border border-white/[0.06]">WCAG AAA</span>
              <span className="px-1.5 py-0.5 rounded bg-[#06B6D4]/10 text-[10px] text-[#06B6D4] border border-[#06B6D4]/30 font-mono">OKLCH</span>
              <span className="px-1.5 py-0.5 rounded bg-[#262A33] text-[10px] font-mono text-white/80 border border-white/[0.08] flex items-center gap-1">
                <Command className="w-2.5 h-2.5" />
                <span>K</span>
              </span>
            </div>
          </button>
        </div>

        {/* Right Tools & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse" />
            <span>OKLCH v2.4</span>
          </span>

          <QuickActionsDropdown onTabChange={onTabChange} onQuickGenerate={onQuickGenerate} />

          {/* Export Button */}
          <button
            onClick={onOpenExportModal}
            className="h-8 px-3 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded text-xs font-medium flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-colors cursor-pointer"
            title="Exportar Amostras e Tokens de Cores"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar Amostras & Tokens</span>
          </button>

          {/* User Profile & Role Account Pill */}
          {authUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onTabChange(authUser.role === 'admin' ? 'admin' : 'user_dashboard')}
                className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition-all ${
                  currentTab === 'admin' || currentTab === 'user_dashboard'
                    ? 'bg-white/[0.08] border-white/30'
                    : 'bg-[#181C24] border-white/[0.08] hover:border-white/20'
                }`}
                title={`Logado como ${authUser.name} (${getRoleTitle(authUser.role)})`}
              >
                <div className="relative">
                  <img
                    src={authUser.avatar}
                    alt={authUser.name}
                    className="w-6 h-6 rounded-full object-cover border border-white/20"
                  />
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0B0F17] ${getRoleDotBgClass(authUser.role)}`} />
                </div>
                <span className="text-xs font-semibold text-white/90 hidden md:inline">
                  {authUser.name.split(' ')[0]}
                </span>
                <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${getRoleBadgeClasses(authUser.role)}`}>
                  {getRoleBadgeLabel(authUser.role)}
                </span>
              </button>

              {onOpenAuthModal && (
                <button
                  onClick={onOpenAuthModal}
                  className="px-2 py-1 text-[11px] font-mono text-[#94A3B8] hover:text-white bg-[#181C24] hover:bg-[#202534] border border-white/[0.08] rounded-md transition-colors cursor-pointer"
                  title="Trocar perfil ou entrar"
                >
                  Trocar
                </button>
              )}

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-2 py-1 text-[11px] font-mono text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                  title="Sair da conta e encerrar sessão"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sair</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="h-8 px-3 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>

      <SubNav
        currentTab={currentTab}
        onTabChange={onTabChange}
        authUser={authUser}
        projectsCount={projectsCount}
        favoritesCount={favoritesCount}
      />
    </header>
  );
};
