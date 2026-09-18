import React, { useState } from 'react';
import { 
  Heart, 
  Bookmark, 
  Code, 
  Sliders, 
  Sparkles, 
  Trophy, 
  Filter, 
  ChevronDown, 
  ExternalLink,
  Flame,
  Clock,
  Award,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  GitFork
} from 'lucide-react';
import { Palette } from '../types';
import { exportCssTokens } from '../utils/colorUtils';

interface ExplorerViewProps {
  palettes: Palette[];
  onOpenInGenerator: (colors: string[]) => void;
  onSaveToCollection: (colors: string[]) => void;
  onLikePalette: (paletteId: string) => void;
  onForkPalette?: (palette: Palette) => void;
  onOpenSubmissionModal: () => void;
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({
  palettes,
  onOpenInGenerator,
  onSaveToCollection,
  onLikePalette,
  onForkPalette,
  onOpenSubmissionModal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'trending' | 'popular' | 'forks' | 'newest' | 'staff'>('trending');
  const [selectedTag, setSelectedTag] = useState<string>('Dark Mode');
  const [selectedHue, setSelectedHue] = useState<string>('all');
  const [sortOption, setSortOption] = useState('Mais Curtidas esta semana');
  const [copiedTokensId, setCopiedTokensId] = useState<string | null>(null);
  const [likedPalettes, setLikedPalettes] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(8);
  const [forkToast, setForkToast] = useState<string | null>(null);

  const hueDots = [
    { id: 'all', label: 'Todas', color: 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500', isInf: true },
    { id: 'red', label: 'Vermelho', color: 'bg-[#EF4444]' },
    { id: 'orange', label: 'Laranja', color: 'bg-[#F97316]' },
    { id: 'yellow', label: 'Amarelo', color: 'bg-[#EAB308]' },
    { id: 'green', label: 'Verde', color: 'bg-[#22C55E]' },
    { id: 'cyan', label: 'Ciano', color: 'bg-[#06B6D4]' },
    { id: 'blue', label: 'Azul', color: 'bg-[#3B82F6]' },
    { id: 'purple', label: 'Roxo', color: 'bg-[#A855F7]' },
    { id: 'neutral', label: 'Neutro', color: 'bg-[#64748B]' }
  ];

  const tags = [
    'Pastel',
    'Dark Mode',
    'Neon & Cyber',
    'Minimalista',
    'Outono & Terra',
    'Retrô Vintage',
    'Gradientes',
    'Gradiente Bicolor'
  ];

  const handleCopyTokens = (p: Palette) => {
    const css = exportCssTokens(p.colors, p.title.toLowerCase().replace(/\s+/g, '-'));
    navigator.clipboard.writeText(css);
    setCopiedTokensId(p.id);
    setTimeout(() => setCopiedTokensId(null), 2000);
  };

  const handleLike = (id: string) => {
    setLikedPalettes(prev => ({ ...prev, [id]: !prev[id] }));
    onLikePalette(id);
  };

  const handleFork = (p: Palette) => {
    if (onForkPalette) {
      onForkPalette(p);
      setForkToast(`Paleta "${p.title}" clonada com sucesso! Um novo fork independente foi criado.`);
      setTimeout(() => setForkToast(null), 3500);
    }
  };

  // Filter palettes based on subtab, tag, and search
  const filteredPalettes = palettes.filter(p => {
    if (activeSubTab === 'staff' && !p.staffPick) return false;
    if (activeSubTab === 'forks' && !p.isFork && (!p.forks || p.forks === 0)) return false;
    if (selectedTag && selectedTag !== 'all') {
      const matchTag = p.tags.some(t => t.toLowerCase().includes(selectedTag.toLowerCase())) ||
                       p.title.toLowerCase().includes(selectedTag.toLowerCase());
      if (!matchTag && selectedTag === 'Dark Mode') {
        // Allow dark mode palettes
        return p.tags.includes('Dark Mode') || p.tags.includes('Dark Mode Safe');
      }
      if (!matchTag && activeSubTab !== 'forks') return false;
    }
    return true;
  });

  return (
    <div className="flex-1 bg-[#0B0F17] text-[#DFE2EE] pb-24">
      {/* Toast Notification */}
      {forkToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181C24] border border-[#06B6D4]/50 shadow-2xl rounded-xl px-4 py-3 text-xs text-white flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <GitFork className="w-4 h-4 text-[#06B6D4] shrink-0" />
          <span>{forkToast}</span>
        </div>
      )}

      {/* Subnav Navigation / Filter Bar */}
      <div className="border-b border-white/[0.08] bg-[#0F131C]/60 backdrop-blur-sm sticky top-[65px] z-20">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Main Feed Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveSubTab('trending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'trending'
                  ? 'bg-[#6366F1] text-white shadow-sm font-semibold'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Tendências</span>
            </button>

            <button
              onClick={() => setActiveSubTab('popular')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'popular'
                  ? 'bg-[#6366F1] text-white shadow-sm font-semibold'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mais Populares</span>
            </button>

            <button
              onClick={() => setActiveSubTab('forks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'forks'
                  ? 'bg-[#6366F1] text-white shadow-sm font-semibold'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <GitFork className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Forks & Clones</span>
            </button>

            <button
              onClick={() => setActiveSubTab('newest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'newest'
                  ? 'bg-[#6366F1] text-white shadow-sm font-semibold'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Novas Adições</span>
            </button>

            <button
              onClick={() => setActiveSubTab('staff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'staff'
                  ? 'bg-[#6366F1] text-white shadow-sm font-semibold'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Staff Picks</span>
            </button>
          </div>

          {/* Counts & Sort Dropdown */}
          <div className="flex items-center gap-3 self-end md:self-auto text-xs">
            <span className="text-[#94A3B8] font-mono hidden sm:inline">
              <span className="w-2 h-2 rounded-full inline-block bg-[#06B6D4] mr-1.5" />
              1,842 Paletas Ativas
            </span>

            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-[#181C24] text-white border border-white/[0.08] rounded-md px-3 py-1.5 text-xs appearance-none pr-8 cursor-pointer focus:outline-none focus:border-[#6366F1]"
              >
                <option>Mais Curtidas esta semana</option>
                <option>Mais Curtidas de Todos os Tempos</option>
                <option>Recém Criadas</option>
                <option>Maior Contraste WCAG AAA</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Secondary Filter Row: Base Hue & Semantic Tags */}
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 py-2 border-t border-white/[0.04] flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Base Hue Rainbow Dots */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            <span className="text-[11px] font-mono uppercase text-[#64748B] font-semibold tracking-wider mr-1">
              Matiz Base
            </span>
            {hueDots.map(dot => (
              <button
                key={dot.id}
                onClick={() => setSelectedHue(dot.id)}
                className={`w-5 h-5 rounded-full transition-all flex items-center justify-center ${
                  selectedHue === dot.id
                    ? 'ring-2 ring-white scale-110'
                    : 'hover:scale-105 opacity-80 hover:opacity-100'
                } ${dot.color}`}
                title={`Filtrar por ${dot.label}`}
              >
                {dot.isInf && <span className="text-[10px] text-white font-bold leading-none">∞</span>}
              </button>
            ))}
          </div>

          {/* Semantic Category Tag Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedTag === tag
                    ? 'bg-[#06B6D4] text-[#003640] font-semibold'
                    : 'bg-[#181C24] text-[#94A3B8] hover:text-white border border-white/[0.06]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 pt-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#06B6D4] flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
              Exploração Global
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight font-['Geist'] mt-0.5">
              Paletas da Comunidade
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <Filter className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Filtro ativo: <strong className="text-white font-medium">{selectedTag || 'Todas'} + Alta Fidelidade</strong></span>
          </div>
        </div>

        {/* Palettes Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPalettes.slice(0, 4).map((palette) => (
            <PaletteCard
              key={palette.id}
              palette={palette}
              isLiked={!!likedPalettes[palette.id]}
              copiedTokensId={copiedTokensId}
              onLike={() => handleLike(palette.id)}
              onFork={() => handleFork(palette)}
              onOpenInGenerator={() => onOpenInGenerator(palette.colors)}
              onSaveToCollection={() => onSaveToCollection(palette.colors)}
              onCopyTokens={() => handleCopyTokens(palette)}
            />
          ))}
        </div>

        {/* Weekly Challenge Promo Banner (Exact from Image 1) */}
        <div className="my-8 rounded-xl bg-gradient-to-r from-[#181C24] via-[#1C2028] to-[#181C24] border border-white/[0.08] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#6366F1]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#262A33] border border-white/[0.08] flex items-center justify-center shrink-0 text-white shadow-inner">
              <Trophy className="w-6 h-6 text-[#06B6D4]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#6366F1] text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                  Edição #42
                </span>
                <span className="text-xs text-[#94A3B8]">Inscrições abertas até Domingo</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1 font-['Geist']">
                Desafio Semanal de Cores: Oklch & Gamuts P3
              </h3>
              <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 max-w-xl leading-relaxed">
                Envie sua paleta para a Curadoria Editorial Izy Colors e concorra a destaque exclusivo na Home, selo de criador verificado e exportação para a biblioteca Figma oficial.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto">
            <button
              onClick={() => alert('Edital #42: Os projetos devem submeter paletas de 5 cores com uniformidade delta-E em Oklch Luma > 0.35 e passar nos testes WCAG 2.1 AAA.')}
              className="flex-1 sm:flex-none h-10 px-4 rounded-lg bg-[#262A33] hover:bg-[#31353E] border border-white/[0.08] text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Ver Edital do Desafio
            </button>
            <button
              onClick={onOpenSubmissionModal}
              className="flex-1 sm:flex-none h-10 px-5 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Submeter Paleta</span>
            </button>
          </div>
        </div>

        {/* Second Row of Palettes Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPalettes.slice(4, visibleCount).map((palette) => (
            <PaletteCard
              key={palette.id}
              palette={palette}
              isLiked={!!likedPalettes[palette.id]}
              copiedTokensId={copiedTokensId}
              onLike={() => handleLike(palette.id)}
              onFork={() => handleFork(palette)}
              onOpenInGenerator={() => onOpenInGenerator(palette.colors)}
              onSaveToCollection={() => onSaveToCollection(palette.colors)}
              onCopyTokens={() => handleCopyTokens(palette)}
            />
          ))}
        </div>

        {/* Load More Button */}
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <button
            onClick={() => setVisibleCount(c => c + 4)}
            className="h-11 px-6 rounded-xl bg-[#181C24] hover:bg-[#262A33] border border-white/[0.1] text-white text-xs font-medium flex items-center gap-2 transition-all hover:scale-[1.02] shadow-lg cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#06B6D4]" />
            <span>Carregar Mais Paletas da Comunidade</span>
          </button>
          <span className="text-[11px] text-[#64748B] font-mono mt-3">
            Mostrando {Math.min(visibleCount, filteredPalettes.length)} de 1,842 paletas geradas proceduralmente
          </span>
        </div>
      </div>
    </div>
  );
};

// Extracted Palette Card Sub-component
interface PaletteCardProps {
  palette: Palette;
  isLiked: boolean;
  copiedTokensId: string | null;
  onLike: () => void;
  onFork: () => void;
  onOpenInGenerator: () => void;
  onSaveToCollection: () => void;
  onCopyTokens: () => void;
}

const PaletteCard: React.FC<PaletteCardProps> = ({
  palette,
  isLiked,
  copiedTokensId,
  onLike,
  onFork,
  onOpenInGenerator,
  onSaveToCollection,
  onCopyTokens
}) => {
  return (
    <div className="bg-[#181C24] border border-white/[0.08] rounded-xl overflow-hidden shadow-lg hover:border-white/[0.18] transition-all duration-200 flex flex-col group">
      {/* Color preview stripes (75% of card visual impact) */}
      <div 
        onClick={onOpenInGenerator}
        className="h-44 sm:h-48 w-full flex cursor-pointer relative overflow-hidden"
        title="Clique para abrir no Gerador"
      >
        {palette.colors.map((c, i) => (
          <div 
            key={i} 
            className="flex-1 h-full transition-transform hover:scale-105 duration-150 relative group/stripe" 
            style={{ backgroundColor: c }}
          >
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover/stripe:opacity-100 bg-black/60 text-white px-1 py-0.5 rounded transition-opacity">
              {c}
            </span>
          </div>
        ))}
      </div>

      {/* Card Content Footer */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Fork derivation lineage badge if palette is a fork */}
          {palette.forkedFrom && (
            <div className="flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded bg-[#111827] border border-cyan-500/20 text-[10px] font-mono text-cyan-300 truncate">
              <GitFork className="w-3 h-3 text-[#06B6D4] shrink-0" />
              <span className="truncate">
                Fork de <strong className="text-white">@{palette.forkedFrom.handle || palette.forkedFrom.author}</strong> ({palette.forkedFrom.title})
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mb-1.5">
            <h3 
              onClick={onOpenInGenerator}
              className="text-base font-semibold text-white tracking-tight cursor-pointer hover:text-[#06B6D4] transition-colors font-['Geist']"
            >
              {palette.title}
            </h3>

            {/* Like & Fork Counters */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={onFork}
                className="flex items-center gap-1 text-xs font-mono text-[#94A3B8] hover:text-[#06B6D4] transition-colors cursor-pointer"
                title="Clonar / Forkar paleta"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>{palette.forks || 0}</span>
              </button>

              <button
                onClick={onLike}
                className={`flex items-center gap-1 text-xs font-mono transition-colors cursor-pointer ${
                  isLiked ? 'text-[#EC4899]' : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#EC4899]' : ''}`} />
                <span>{isLiked ? (palette.likes + 1).toLocaleString() : palette.likes.toLocaleString()}</span>
              </button>
            </div>
          </div>

          {/* Author */}
          <div className="flex items-center gap-2 mb-3">
            <img 
              src={palette.author.avatar} 
              alt={palette.author.name}
              className="w-4 h-4 rounded-full object-cover" 
            />
            <span className="text-xs text-[#94A3B8] font-mono">{palette.author.handle}</span>
          </div>

          {/* Badges / Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <span className="px-2 py-0.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] text-[10px] font-mono flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              {palette.wcagLevel}
            </span>
            {palette.tags.map((t, idx) => (
              <span 
                key={idx} 
                className="px-2 py-0.5 rounded-full bg-[#262A33] text-[#94A3B8] text-[10px]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Card Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenInGenerator}
              className="h-8 px-3 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Gerador</span>
            </button>

            <button
              onClick={onFork}
              className="h-8 px-2.5 rounded-lg bg-[#181C24] hover:bg-[#262A33] text-[#06B6D4] hover:text-white text-xs font-medium flex items-center gap-1 transition-colors border border-[#06B6D4]/30 hover:border-[#06B6D4] cursor-pointer"
              title="Criar Fork / Clone desta paleta"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Fork</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onSaveToCollection}
              className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#262A33] transition-colors cursor-pointer"
              title="Salvar na Coleção"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onCopyTokens}
              className="p-2 rounded-lg text-[#94A3B8] hover:text-[#06B6D4] hover:bg-[#262A33] transition-colors relative cursor-pointer"
              title="Copiar Tokens CSS"
            >
              {copiedTokensId === palette.id ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Code className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

