import React from 'react';
import {
  Sparkles,
  Layers,
  Compass,
  SlidersHorizontal,
  Download,
  CheckCircle2,
  User,
  FileText,
  Command,
  Eye,
  Disc3,
  PanelLeftClose,
  Search,
  ShieldCheck,
  LogOut,
  BarChart3
} from 'lucide-react';
import { ColorGamut, NavigationTab, AuthUser, UserRole } from '../types';
import { LogoIcon, Logo } from './Logo';

interface SidebarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  gamut: ColorGamut;
  onGamutChange: (gamut: ColorGamut) => void;
  authUser: AuthUser;
  onOpenAuthModal: () => void;
  onLogout?: () => void;
  onOpenCommandPalette: () => void;
  onOpenExportModal: () => void;
  favoritesCount: number;
  projectsCount: number;
  forksCount: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const GAMUT_LABELS: Record<ColorGamut, string> = {
  'sRGB': 'sRGB',
  'Display P3': 'P3',
  'Rec.2020': '2020',
};

const roleBadgeClasses: Record<UserRole, string> = {
  admin: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  moderator: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  editor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  pro: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  user: 'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4]/40',
};

const roleStatusDotClasses: Record<UserRole, string> = {
  admin: 'bg-purple-400',
  moderator: 'bg-rose-400',
  editor: 'bg-amber-400',
  pro: 'bg-emerald-400',
  user: 'bg-[#06B6D4]',
};

interface NavItem {
  id: NavigationTab;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badge?: string;
  description: string;
  count?: number | string;
}

const getNavItems = (
  authUser: AuthUser,
  projectsCount: number,
  favoritesCount: number,
  forksCount: number
): NavItem[] => {
  const canAccessCms =
    authUser.role === 'admin' ||
    authUser.role === 'moderator' ||
    authUser.role === 'editor';

  const cmsBadgeLabelByRole: Record<string, string> = {
    admin: 'Editorial',
    moderator: 'Moderador',
    editor: 'Curador'
  };
  const cmsBadgeLabel = cmsBadgeLabelByRole[authUser.role] ?? 'Curador';

  return [
    {
      id: 'generator',
      label: 'Gerador Procedural',
      shortLabel: 'Gerador',
      icon: Sparkles,
      badge: 'Espaço',
      description: 'Geração procedural Oklch'
    },
    {
      id: 'projects',
      label: 'Projetos & Cofre',
      shortLabel: 'Cofre',
      icon: Layers,
      count: projectsCount + favoritesCount,
      description: 'Workspaces e tokens salvos'
    },
    {
      id: 'explorer',
      label: 'Explorar & Forks',
      shortLabel: 'Explorar',
      icon: Compass,
      count: forksCount > 0 ? `${forksCount} forks` : undefined,
      badge: 'Comunidade',
      description: 'Feed e derivações de paletas'
    },
    {
      id: 'wheel',
      label: 'Roda Harmônica Adobe',
      shortLabel: 'Harmonia',
      icon: Disc3,
      badge: 'Adobe',
      description: 'Regras de harmonia cromática'
    },
    {
      id: 'extractor',
      label: 'Extrator de Imagem',
      shortLabel: 'Extrator',
      icon: Eye,
      badge: 'K-Means',
      description: 'Imagens curadas e upload'
    },
    {
      id: 'lab',
      label: 'Color Space Lab',
      shortLabel: 'Lab',
      icon: SlidersHorizontal,
      badge: 'OKLCH',
      description: 'Gamuts P3 & Rec.2020'
    },
    {
      id: 'accessibility',
      label: 'Auditoria WCAG / APCA',
      shortLabel: 'Acessibilidade',
      icon: CheckCircle2,
      badge: 'AAA',
      description: 'Simulador de daltonismo'
    },
    ...(authUser.role === 'admin' ? [
      {
        id: 'admin' as NavigationTab,
        label: 'Painel Admin',
        shortLabel: 'Admin',
        icon: ShieldCheck,
        badge: 'Admin',
        description: 'Gestão de usuários e auditoria'
      }
    ] : []),
    ...(canAccessCms ? [
      {
        id: 'cms' as NavigationTab,
        label: 'CMS Editorial',
        shortLabel: 'CMS',
        icon: FileText,
        badge: cmsBadgeLabel,
        description: authUser.role === 'moderator' ? 'Moderação & curadoria' : 'Artigos e curadoria'
      }
    ] : []),
    {
      id: 'user_dashboard',
      label: 'Dashboard de Cores',
      shortLabel: 'Dashboard',
      icon: BarChart3,
      badge: 'Analytics',
      description: 'Frequência, gamuts & evolução'
    },
    {
      id: 'profile',
      label: 'Meu Perfil & Espaço',
      shortLabel: 'Perfil',
      icon: User,
      badge: authUser.role.toUpperCase(),
      description: authUser.handle || authUser.name
    }
  ];
};

export const Sidebar: React.FC<SidebarProps> = ({
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
  forksCount,
  isExpanded,
  onToggleExpanded
}) => {
  const navItems = getNavItems(authUser, projectsCount, favoritesCount, forksCount);

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#0B0F17] border-r border-white/[0.08] flex flex-col justify-between transition-all duration-300 ease-in-out select-none shadow-2xl ${isExpanded ? 'w-64' : 'w-16'
        }`}
    >
      {/* Top Header: Brand & Collapse Toggle */}
      <div>
        {isExpanded ? (
          <div className="h-16 px-3 flex items-center justify-between border-b border-white/[0.06]">
            <button
              onClick={() => onTabChange('generator')}
              className="flex items-center gap-2.5 focus:outline-none overflow-hidden text-left cursor-pointer group min-w-0"
              title="izycolors - Smart Procedural Harmonies"
              aria-label="Ir para Gerador"
            >
              <Logo size="sm" showSubtitle={true} />
            </button>

            <button
              onClick={onToggleExpanded}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
              title="Retrair barra lateral (apenas ícones)"
              aria-label="Retrair menu"
            >
              <PanelLeftClose className="w-4 h-4 text-[#94A3B8] hover:text-[#06B6D4]" />
            </button>
          </div>
        ) : (
          <div className="h-16 flex items-center justify-center border-b border-white/[0.06]">
            <button
              onClick={() => onTabChange('generator')}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/[0.06] transition-colors focus:outline-none cursor-pointer group"
              title="izycolors - Ir para o Gerador"
              aria-label="izycolors logo"
            >
              <LogoIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}

        {/* Gamut indicator pill */}
        {isExpanded ? (
          <div className="px-3 pt-3 pb-1">
            <div className="p-1.5 bg-[#141822] border border-white/[0.06] rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse" />
                <span className="text-[10px] font-mono text-[#94A3B8] uppercase">Gamut Ativo</span>
              </div>
              <div className="flex items-center gap-1">
                {(['sRGB', 'Display P3', 'Rec.2020'] as ColorGamut[]).map(g => (
                  <button
                    key={g}
                    onClick={() => onGamutChange(g)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${gamut === g ? 'bg-[#6366F1] text-white font-bold' : 'text-[#64748B] hover:text-white'
                      }`}
                  >
                    {GAMUT_LABELS[g]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-2 flex justify-center">
            <div
              className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse cursor-pointer"
              title={`Gamut: ${gamut}`}
            />
          </div>
        )}

        {/* Nav Items List */}
        <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-290px)] scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center rounded-lg transition-all duration-150 cursor-pointer ${isExpanded ? 'px-3 py-2.5 gap-3' : 'h-10 w-10 mx-auto justify-center'
                    } ${isActive
                      ? 'bg-[#6366F1] text-white shadow-md shadow-indigo-600/30 font-semibold'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#181C24]'
                    }`}
                  aria-label={item.label}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-110 text-white' : 'text-[#94A3B8] group-hover:text-[#06B6D4]'
                    }`} />

                  {isExpanded && (
                    <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                      <span className="text-xs font-medium truncate">{item.label}</span>
                      <div className="flex items-center gap-1 shrink-0 ml-1.5">
                        {item.count !== undefined && (
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-white/25 text-white' : 'bg-[#262A33] text-[#06B6D4]'
                            }`}>
                            {item.count}
                          </span>
                        )}
                        {item.badge && (
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-[#181C24] text-[#94A3B8] border border-white/[0.06]'
                            }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>

                {/* Floating Tooltip when collapsed */}
                {!isExpanded && (
                  <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-[#181C24] border border-white/[0.12] rounded-md shadow-2xl text-xs text-[#DFE2EE] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 flex items-center gap-2">
                    <span className="font-semibold">{item.label}</span>
                    {item.badge && (
                      <span className="px-1 py-0.2 bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/30 rounded text-[9px] font-mono">
                        {item.badge}
                      </span>
                    )}
                    {item.count !== undefined && (
                      <span className="px-1.5 py-0.2 bg-[#262A33] text-[#DFE2EE] rounded-full text-[10px] font-mono">
                        {item.count}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions & User Profile */}
      <div className="p-2 border-t border-white/[0.06] space-y-1.5 bg-[#0D111A]">
        {/* Quick Export Button */}
        <button
          onClick={onOpenExportModal}
          className={`w-full rounded-lg bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#5254E0] hover:to-[#4338CA] text-white text-xs font-semibold flex items-center transition-all shadow-md shadow-indigo-600/20 cursor-pointer ${isExpanded ? 'px-3 py-2.5 justify-between' : 'h-10 w-10 mx-auto justify-center'
            }`}
          title="Exportar para Adobe Illustrator e Tokens"
        >
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-white shrink-0" />
            {isExpanded && <span>Exportar Amostras & Tokens</span>}
          </div>
          {isExpanded && (
            <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded text-white">
              .ASE / .JSX
            </span>
          )}
        </button>

        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className={`w-full rounded-lg bg-[#141822] hover:bg-[#1C2028] border border-white/[0.08] text-xs text-[#94A3B8] hover:text-white flex items-center transition-colors cursor-pointer ${isExpanded ? 'px-3 py-2 justify-between' : 'h-10 w-10 mx-auto justify-center'
            }`}
          title="Busca Global e Atalhos (⌘K)"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
            {isExpanded && <span>Comandos & Busca</span>}
          </div>
          {isExpanded && (
            <span className="text-[10px] font-mono bg-[#262A33] px-1.5 py-0.5 rounded text-white/70 border border-white/[0.06] flex items-center gap-0.5">
              <Command className="w-2.5 h-2.5" /> K
            </span>
          )}
        </button>

        {/* User Account / Role Badge & Auth Switcher */}
        <div
          className={`rounded-lg bg-[#141822] border border-white/[0.08] flex items-center transition-all ${isExpanded ? 'p-2.5 gap-2.5' : 'p-1.5 justify-center'
            }`}
        >
          <button
            type="button"
            onClick={() => onTabChange(authUser.role === 'admin' ? 'admin' : 'user_dashboard')}
            className="relative shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-full"
            title={`${authUser.name} (${authUser.role === 'admin' ? 'Administrador' : 'Usuário'})`}
            aria-label={`Perfil de ${authUser.name}`}
          >
            <img
              src={authUser.avatar}
              alt={authUser.name}
              className="w-8 h-8 rounded-full object-cover border border-white/20 hover:border-white/50 transition-colors"
            />
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#0B0F17] ${roleStatusDotClasses[authUser.role]}`} />
          </button>

          {isExpanded && (
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white block truncate">
                  {authUser.name}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={onOpenAuthModal}
                    className="text-[10px] font-mono text-[#06B6D4] hover:text-white px-1 py-0.5 rounded hover:bg-white/[0.06] transition-colors cursor-pointer"
                    title="Trocar conta ou autenticar"
                  >
                    Trocar
                  </button>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="text-[10px] font-mono text-rose-400 hover:text-rose-300 px-1 py-0.5 rounded hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center gap-0.5"
                      title="Sair da conta e encerrar sessão"
                    >
                      <LogOut className="w-2.5 h-2.5" />
                      <span>Sair</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] font-mono font-bold uppercase px-1 rounded border ${roleBadgeClasses[authUser.role]}`}>
                  {authUser.role.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono text-[#64748B] truncate">
                  {authUser.handle}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
