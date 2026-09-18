import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Layers, 
  Compass, 
  Eye, 
  SlidersHorizontal, 
  Check, 
  FileText, 
  User, 
  Download, 
  X,
  Palette as PaletteIcon,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import { NavigationTab, ColorGamut, AuthUser } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab) => void;
  onQuickGenerate: () => void;
  onGamutChange: (gamut: ColorGamut) => void;
  onOpenExport: () => void;
  authUser?: AuthUser;
}

interface CommandItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  hint?: string;
  action: () => void;
}

interface CommandCategory {
  category: string;
  items: CommandItem[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onQuickGenerate,
  onGamutChange,
  onOpenExport,
  authUser
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : void 0;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands: CommandCategory[] = [
    {
      category: 'Ações Imediatas',
      items: [
        { id: 'gen', label: 'Gerar Nova Paleta Aleatória', icon: Sparkles, hint: 'Espaço', action: () => { onQuickGenerate(); onNavigate('generator'); onClose(); } },
        { id: 'exp', label: 'Exportar Amostras & Tokens (Illustrator, ASE, CSS, JSON)', icon: Download, hint: 'Ctrl+E', action: () => { onOpenExport(); onClose(); } },
      ]
    },
    {
      category: 'Módulos do Studio',
      items: [
        { id: 'tab-gen', label: 'Gerador Procedural com Locks', icon: Sparkles, action: () => { onNavigate('generator'); onClose(); } },
        { id: 'tab-exp', label: 'Explorar Paletas da Comunidade', icon: Compass, action: () => { onNavigate('explorer'); onClose(); } },
        { id: 'tab-wheel', label: 'Roda Cromática Harmônica (Adobe Color)', icon: PaletteIcon, action: () => { onNavigate('wheel'); onClose(); } },
        { id: 'tab-extr', label: 'Extrator de Paleta de Imagem (K-Means)', icon: Eye, action: () => { onNavigate('extractor'); onClose(); } },
        { id: 'tab-lab', label: 'Color Space Lab & Gradientes Perceptuais', icon: SlidersHorizontal, action: () => { onNavigate('lab'); onClose(); } },
        { id: 'tab-acc', label: 'Auditoria de Acessibilidade & Daltonismo', icon: Check, action: () => { onNavigate('accessibility'); onClose(); } },
        { id: 'tab-proj', label: 'Projetos, Coleções & Cofre de Cores', icon: Layers, action: () => { onNavigate('projects'); onClose(); } },
        ...(authUser?.role === 'admin' ? [
          { id: 'tab-admin', label: 'Painel Administrativo & Governança de Usuários', icon: ShieldCheck, hint: 'Admin', action: () => { onNavigate('admin'); onClose(); } },
          { id: 'tab-cms', label: 'Painel CMS Editorial & Curadoria', icon: FileText, hint: 'CMS', action: () => { onNavigate('cms'); onClose(); } },
        ] : []),
        { id: 'tab-prof', label: 'Meu Perfil & Painel do Criador', icon: User, hint: 'Espaço', action: () => { onNavigate('profile'); onClose(); } },
      ]
    },
    {
      category: 'Espaços de Cor e Gamut',
      items: [
        { id: 'gamut-p3', label: 'Alternar Gamut para Display P3 (Apple Wide)', hint: 'P3 Wide', action: () => { onGamutChange('Display P3'); onClose(); } },
        { id: 'gamut-rec', label: 'Alternar Gamut para Rec.2020 (Ultra HD)', hint: 'Rec.2020', action: () => { onGamutChange('Rec.2020'); onClose(); } },
        { id: 'gamut-srgb', label: 'Alternar Gamut para sRGB Padrão Web', hint: 'sRGB', action: () => { onGamutChange('sRGB'); onClose(); } },
      ]
    }
  ];

  const filtered = commands.map(cat => ({
    ...cat,
    items: cat.items.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div 
        className="w-full max-w-2xl bg-[#111827] border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative border-b border-white/[0.08] flex items-center px-4 h-14">
          <Search className="w-5 h-5 text-[#64748B] shrink-0" />
          <input
            type="text"
            placeholder="Digite um comando, ferramenta ou espaço de cor..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent px-3 text-sm text-white placeholder-[#64748B] focus:outline-none font-['Geist']"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-white/[0.04]">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B]">
              Nenhum comando encontrado para "{query}".
            </div>
          ) : (
            filtered.map((cat, idx) => (
              <div key={idx} className="py-2 first:pt-0 last:pb-0">
                <div className="px-3 py-1 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider font-mono">
                  {cat.category}
                </div>
                <div className="space-y-0.5 mt-1">
                  {cat.items.map(item => {
                    const Icon = item.icon || Sparkles;
                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        className="w-full px-3 py-2 rounded-lg text-left text-xs text-[#DFE2EE] hover:bg-[#181C24] hover:text-white flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-[#94A3B8] group-hover:text-[#6366F1] transition-colors" />
                          <span>{item.label}</span>
                        </div>
                        {item.hint && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-[#94A3B8] group-hover:text-white">
                            {item.hint}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="h-9 bg-[#0B0F17] border-t border-white/[0.06] px-4 flex items-center justify-between text-[11px] text-[#64748B] font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navegar</span>
            <span>↵ Selecionar</span>
            <span>ESC Fechar</span>
          </div>
          <span className="text-[#06B6D4]">Izy Colors Fast Jump</span>
        </div>
      </div>
    </div>
  );
};
