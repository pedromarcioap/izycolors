import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Layers, 
  Compass, 
  BookOpen, 
  SlidersHorizontal, 
  Download, 
  Bell, 
  ChevronDown, 
  Check, 
  Eye, 
  User, 
  FileText, 
  Command,
  Maximize2
} from 'lucide-react';
import { ColorGamut, NavigationTab, UserProfile } from '../types';

interface NavbarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  gamut: ColorGamut;
  onGamutChange: (gamut: ColorGamut) => void;
  userProfile: UserProfile;
  onOpenCommandPalette: () => void;
  onOpenExportModal: () => void;
  favoritesCount: number;
  projectsCount: number;
  onQuickGenerate?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  gamut,
  onGamutChange,
  userProfile,
  onOpenCommandPalette,
  onOpenExportModal,
  favoritesCount,
  projectsCount,
  onQuickGenerate
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showGamutDropdown, setShowGamutDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0F17]/95 backdrop-blur-md border-b border-white/[0.08]">
      {/* Top Bar */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand & Gamut Switcher */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button 
            onClick={() => onTabChange('generator')}
            className="flex items-center gap-2.5 group focus:outline-none"
            title="Izy Colors - Ir para o Gerador"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6366F1] via-[#EC4899] to-[#06B6D4] p-[1.5px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0B0F17] rounded-[7px] flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#06B6D4] via-[#6366F1] to-[#EC4899]" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-semibold tracking-tight text-white font-['Geist']">Izy Colors</span>
              <span className="text-[10px] font-bold tracking-widest text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-1.5 py-0.5 rounded uppercase">PRO</span>
            </div>
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
              <span className="px-1.5 py-0.5 rounded bg-[#262A33] text-[10px] font-mono text-white/80 border border-white/[0.08] flex items-center gap-0.5">
                <Command className="w-2.5 h-2.5" /> K
              </span>
            </div>
          </button>
        </div>

        {/* Right Tools & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse" />
            OKLCH v2.4
          </span>

          {/* Quick Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="h-8 px-2.5 bg-[#181C24] hover:bg-[#262A33] border border-white/[0.08] rounded text-xs text-[#DFE2EE] flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span className="hidden sm:inline">Ações Rápidas</span>
              <ChevronDown className="w-3 h-3 text-[#64748B]" />
            </button>

            {showQuickActions && (
              <div className="absolute right-0 mt-2 w-56 bg-[#181C24] border border-white/[0.12] rounded-lg shadow-2xl py-1 text-xs z-50 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    onTabChange('generator');
                    onQuickGenerate?.();
                    setShowQuickActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-[#DFE2EE] hover:bg-[#262A33] flex items-center justify-between"
                >
                  <span>Gerar Paleta Procedural</span>
                  <span className="text-[10px] font-mono text-[#94A3B8]">Espaço</span>
                </button>
                <button
                  onClick={() => {
                    onTabChange('wheel');
                    setShowQuickActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-[#DFE2EE] hover:bg-[#262A33] flex items-center justify-between"
                >
                  <span>Roda Harmônica Adobe</span>
                  <span className="text-[10px] text-[#06B6D4]">Regras</span>
                </button>
                <button
                  onClick={() => {
                    onTabChange('extractor');
                    setShowQuickActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-[#DFE2EE] hover:bg-[#262A33] flex items-center justify-between"
                >
                  <span>Extrair Cores de Imagem</span>
                  <span className="text-[10px] text-[#A0B89C]">K-Means</span>
                </button>
                <button
                  onClick={() => {
                    onTabChange('accessibility');
                    setShowQuickActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-[#DFE2EE] hover:bg-[#262A33] flex items-center justify-between"
                >
                  <span>Simular Daltonismo & WCAG</span>
                  <span className="text-[10px] text-[#EC4899]">APCA</span>
                </button>
              </div>
            )}
          </div>

          {/* Export Tokens Button */}
          <button
            onClick={onOpenExportModal}
            className="h-8 px-3 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded text-xs font-medium flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar Tokens</span>
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={() => onTabChange('profile')}
            className={`flex items-center gap-2 p-0.5 rounded-full transition-all ${
              currentTab === 'profile' 
                ? 'ring-2 ring-[#6366F1] ring-offset-2 ring-offset-[#0B0F17]' 
                : 'hover:opacity-90'
            }`}
            title="Ver Perfil de Helena Vance"
          >
            <div className="relative">
              <img 
                src={userProfile.avatar} 
                alt={userProfile.name}
                className="w-8 h-8 rounded-full object-cover border border-white/20"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0B0F17] rounded-full" />
            </div>
            <span className="text-xs font-medium text-white/90 hidden md:inline font-mono">
              {userProfile.handle}
            </span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Bar (Matching Image 1 & 5) */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto scrollbar-none border-t border-white/[0.04] text-xs">
        <nav className="flex items-center gap-1 sm:gap-1.5 py-1.5">
          <button
            onClick={() => onTabChange('generator')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
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
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              currentTab === 'projects'
                ? 'bg-[#6366F1] text-white shadow-sm'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Projetos & Cofre</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              currentTab === 'projects' ? 'bg-white/20 text-white' : 'bg-[#262A33] text-[#06B6D4]'
            }`}>
              {projectsCount + favoritesCount}
            </span>
          </button>

          <button
            onClick={() => onTabChange('explorer')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
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
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
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
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
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
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
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
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              currentTab === 'accessibility'
                ? 'bg-[#6366F1] text-white shadow-sm'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auditoria WCAG</span>
          </button>

          <button
            onClick={() => onTabChange('cms')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              currentTab === 'cms'
                ? 'bg-[#6366F1] text-white shadow-sm'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>CMS Editorial</span>
          </button>

          <button
            onClick={() => onTabChange('profile')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              currentTab === 'profile'
                ? 'bg-[#6366F1] text-white shadow-sm'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Perfil</span>
          </button>
        </nav>

        {/* Sync indicators from Image 5 */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-[#94A3B8] py-1">
          <span className="flex items-center gap-1 text-[#06B6D4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
            REC.2020 / OKLCH SYNCED
          </span>
          <span>ΔE&lt;0.4 LAB TOLERANCE</span>
          <span>ICC: Display P3-D65</span>
        </div>
      </div>
    </header>
  );
};
