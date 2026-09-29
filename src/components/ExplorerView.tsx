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
  Flame,
  Clock,
  Award,
  CheckCircle2,
  Check,
  GitFork,
  ShieldCheck,
  BookOpen,
  FileText,
  Eye,
  ChevronRight,
  X,
  Search
} from 'lucide-react';
import { Palette, CmsArticle } from '../types';
import { exportCssTokens } from '../utils/colorUtils';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ExplorerViewProps {
  palettes: Palette[];
  articles?: CmsArticle[];
  onOpenInGenerator: (colors: string[]) => void;
  onSaveToCollection: (colors: string[]) => void;
  onLikePalette: (paletteId: string) => void;
  onForkPalette?: (palette: Palette) => void;
  onOpenSubmissionModal: () => void;
  onSendToAudit: (colors: string[]) => void;
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({
  palettes,
  articles = [],
  onOpenInGenerator,
  onSaveToCollection,
  onLikePalette,
  onForkPalette,
  onOpenSubmissionModal,
  onSendToAudit
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'trending' | 'popular' | 'forks' | 'newest' | 'staff' | 'articles'>('trending');
  const [selectedTag, setSelectedTag] = useState<string>('Dark Mode');
  const [selectedHue, setSelectedHue] = useState<string>('all');
  const [sortOption, setSortOption] = useState('Mais Curtidas esta semana');
  const [copiedTokensId, setCopiedTokensId] = useState<string | null>(null);
  const [likedPalettes, setLikedPalettes] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(8);
  const [forkToast, setForkToast] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<CmsArticle | null>(null);
  const [articleCategoryFilter, setArticleCategoryFilter] = useState<string>('all');
  const [articleSearchQuery, setArticleSearchQuery] = useState<string>('');

  const publishedArticles = articles.filter(a => a.status === 'Publicado');

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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${activeSubTab === 'trending'
                ? 'bg-[#6366F1] text-white shadow-sm font-semibold'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
                }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Tendências</span>
            </button>

            <button
              onClick={() => setActiveSubTab('popular')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${activeSubTab === 'popular'
                ? 'bg-[#6366F1] text-white shadow-sm font-semibold'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
                }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mais Populares</span>
            </button>

            <button
              onClick={() => setActiveSubTab('forks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${activeSubTab === 'forks'
                ? 'bg-[#6366F1] text-white shadow-sm font-semibold'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
                }`}
            >
              <GitFork className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Forks & Clones</span>
            </button>

            <button
              onClick={() => setActiveSubTab('newest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${activeSubTab === 'newest'
                ? 'bg-[#6366F1] text-white shadow-sm font-semibold'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
                }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Novas Adições</span>
            </button>

            <button
              onClick={() => setActiveSubTab('staff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${activeSubTab === 'staff'
                ? 'bg-[#6366F1] text-white shadow-sm font-semibold'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
                }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Staff Picks</span>
            </button>

            <button
              onClick={() => setActiveSubTab('articles')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${activeSubTab === 'articles'
                ? 'bg-[#6366F1] text-white shadow-sm font-semibold'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
                }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Artigos & Publicações</span>
              {publishedArticles.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#06B6D4]/20 text-[#06B6D4] text-[10px] font-mono font-semibold">
                  {publishedArticles.length}
                </span>
              )}
            </button>
          </div>

          {/* Counts & Sort Dropdown */}
          <div className="flex items-center gap-3 self-end md:self-auto text-xs">
            <span className="text-[#94A3B8] font-mono hidden sm:inline">
              <span className="w-2 h-2 rounded-full inline-block bg-[#06B6D4] mr-1.5"></span>{' '}
              {activeSubTab === 'articles' ? `${publishedArticles.length} Artigos Publicados` : '1,842 Paletas Ativas'}
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
                className={`w-5 h-5 rounded-full transition-all flex items-center justify-center ${selectedHue === dot.id
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
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedTag === tag
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
        {activeSubTab === 'articles' ? (
          /* Dedicated CMS Articles Showcase Subtab View */
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/[0.08]">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#06B6D4] flex items-center gap-1.5 font-semibold">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Curadoria Editorial CMS</span>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight font-['Geist'] mt-0.5">
                  Artigos & Publicações da Comunidade
                </h1>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Estudos de caso, teoria da cor, acessibilidade e arquitetura de design systems produzidos no CMS.
                </p>
              </div>

              {/* Search Bar for Articles */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar artigos..."
                  value={articleSearchQuery}
                  onChange={(e) => setArticleSearchQuery(e.target.value)}
                  className="w-full bg-[#181C24] text-white placeholder-[#64748B] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#6366F1] transition-colors"
                />
                {articleSearchQuery && (
                  <button
                    onClick={() => setArticleSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Chips for Articles */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-6">
              <span className="text-xs font-mono text-[#64748B] uppercase tracking-wider mr-1">Categoria:</span>
              {[
                { id: 'all', label: 'Todas as Categorias' },
                { id: 'Teoria da Cor', label: 'Teoria da Cor' },
                { id: 'Design Systems', label: 'Design Systems' },
                { id: 'Acessibilidade', label: 'Acessibilidade' },
                { id: 'Tendências', label: 'Tendências' },
                { id: 'Estudos de Caso', label: 'Estudos de Caso' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setArticleCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${articleCategoryFilter === cat.id
                    ? 'bg-[#06B6D4] text-[#003640] font-bold shadow-md'
                    : 'bg-[#181C24] text-[#94A3B8] hover:text-white border border-white/[0.06]'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Articles Grid */}
            {publishedArticles.filter(a => {
              if (articleCategoryFilter !== 'all' && a.category !== articleCategoryFilter) return false;
              if (articleSearchQuery.trim()) {
                const q = articleSearchQuery.toLowerCase();
                return (
                  a.title.toLowerCase().includes(q) ||
                  a.summary.toLowerCase().includes(q) ||
                  a.author.toLowerCase().includes(q) ||
                  a.category.toLowerCase().includes(q)
                );
              }
              return true;
            }).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedArticles.filter(a => {
                  if (articleCategoryFilter !== 'all' && a.category !== articleCategoryFilter) return false;
                  if (articleSearchQuery.trim()) {
                    const q = articleSearchQuery.toLowerCase();
                    return (
                      a.title.toLowerCase().includes(q) ||
                      a.summary.toLowerCase().includes(q) ||
                      a.author.toLowerCase().includes(q) ||
                      a.category.toLowerCase().includes(q)
                    );
                  }
                  return true;
                }).map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onRead={(art) => setSelectedArticle(art)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-[#181C24] border border-white/[0.08] rounded-2xl max-w-md mx-auto my-8">
                <FileText className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Nenhum artigo encontrado</h3>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Tente alterar os termos de busca ou selecionar outra categoria.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Standard Palettes Feed with Embedded CMS Showcase Section */
          <>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#06B6D4] flex items-center gap-1.5 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
                  <span>Exploração Global</span>
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

            {/* Palettes Cards Grid Row 1 */}
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
                  onSendToAudit={onSendToAudit}
                />
              ))}
            </div>

            {/* Weekly Challenge Promo Banner */}
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

            {/* CMS Articles Exhibition Showcase Section in Community Feed */}
            {publishedArticles.length > 0 && (
              <div className="my-10 p-6 sm:p-8 bg-[#121622] border border-cyan-500/20 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#06B6D4] font-semibold">
                      <BookOpen className="w-4 h-4" />
                      <span>Exposição CMS Editorial</span>
                    </div>
                    <h2 className="text-xl font-bold text-white font-[#Geist] tracking-tight mt-1">
                      Artigos & Ensaios em Destaque
                    </h2>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Conteúdo técnico, guias e publicações criadas via Inteligência Artificial e especialistas.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveSubTab('articles')}
                    className="h-9 px-4 rounded-xl bg-[#181C24] hover:bg-[#262A33] border border-cyan-500/30 text-[#06B6D4] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                  >
                    <span>Ver Acervo Completo ({publishedArticles.length})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {publishedArticles.slice(0, 3).map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onRead={(art) => setSelectedArticle(art)}
                    />
                  ))}
                </div>
              </div>
            )}

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
                  onSendToAudit={onSendToAudit}
                />
              ))}
            </div>

            {/* Load More Button */}
            <div className="mt-12 flex flex-col items-center justify-center text-center">
              <button
                onClick={() => setVisibleCount(c => c + 4)}
                className="h-11 px-6 rounded-xl bg-[#181C24] hover:bg-[#262A33] border border-white/[0.1] text-[#DFE2EE] hover:text-white text-xs font-medium flex items-center gap-2 transition-all hover:scale-[1.02] shadow-lg cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#06B6D4]" />
                <span>Carregar Mais Paletas da Comunidade</span>
              </button>
              <span className="text-[11px] text-[#64748B] font-mono mt-3">
                Mostrando {Math.min(visibleCount, filteredPalettes.length)} de 1,842 paletas geradas proceduralmente
              </span>
            </div>
          </>
        )}
      </div>

      {/* Article Reader Modal */}
      <ArticleReaderModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
};

// Sub-component: CMS Article Card
interface ArticleCardProps {
  article: CmsArticle;
  onRead: (article: CmsArticle) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onRead }) => {
  const categoryColors: Record<string, string> = {
    'Teoria da Cor': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    'Design Systems': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    'Acessibilidade': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'Tendências': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    'Estudos de Caso': 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  };

  const badgeClass = categoryColors[article.category] || 'bg-blue-500/10 text-blue-400 border-blue-500/30';

  return (
    <div className="bg-[#181C24] border border-white/[0.08] rounded-xl p-5 shadow-lg hover:border-white/[0.18] transition-all duration-200 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${badgeClass}`}>
            {article.category}
          </span>
          <span className="text-[11px] text-[#64748B] font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#94A3B8]" />
            {article.readTime}
          </span>
        </div>

        <h3 className="text-base font-bold text-white group-hover:text-[#06B6D4] transition-colors font-['Geist'] leading-snug mb-2 line-clamp-2">
          {article.title}
        </h3>

        <p className="text-xs text-[#94A3B8] leading-relaxed mb-4 line-clamp-3">
          {article.summary}
        </p>
      </div>

      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#94A3B8]">
        <div className="flex items-center gap-2 truncate pr-2">
          <div className="w-5 h-5 rounded-full bg-[#6366F1]/20 border border-[#6366F1]/40 flex items-center justify-center text-[10px] font-bold text-[#6366F1] shrink-0">
            {article.author.charAt(0)}
          </div>
          <span className="font-medium text-white truncate">{article.author}</span>
          <span className="text-[10px] text-[#64748B] font-mono shrink-0">• {article.publishedAt}</span>
        </div>

        <button
          onClick={() => onRead(article)}
          className="h-8 px-3 rounded-lg bg-[#6366F1]/10 hover:bg-[#6366F1] text-[#6366F1] hover:text-white text-xs font-semibold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
        >
          <span>Ler</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// Sub-component: Article Reader Modal
interface ArticleReaderModalProps {
  article: CmsArticle | null;
  onClose: () => void;
}

const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({ article, onClose }) => {
  if (!article) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Backdrop Button Overlay */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar modal"
        className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-default border-0 w-full h-full"
      />

      <div className="bg-[#141824] border border-white/[0.12] rounded-2xl max-w-3xl w-full p-6 sm:p-8 text-white shadow-2xl relative my-8 z-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-[#1E2433] text-[#94A3B8] hover:text-white hover:bg-[#2A3246] transition-colors cursor-pointer"
          title="Fechar Artigo"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Article Category Badge & Read Time */}
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] text-xs font-mono font-semibold">
            {article.category}
          </span>
          <span className="text-xs text-[#94A3B8] font-mono flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
            {article.readTime}
          </span>
          <span className="text-xs text-[#94A3B8] font-mono flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            {article.views} leituras
          </span>
        </div>

        {/* Title */}
        <h1 id="article-modal-title" className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Geist'] leading-tight mb-4">
          {article.title}
        </h1>

        {/* Author Header Bar */}
        <div className="flex items-center gap-3 pb-6 mb-6 border-b border-white/[0.08] text-xs text-[#94A3B8]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] flex items-center justify-center text-white font-bold text-sm shadow-md">
            {article.author.charAt(0)}
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{article.author}</div>
            <div className="text-[11px] text-[#64748B] font-mono">Publicado em {article.publishedAt} no CMS IzyColors</div>
          </div>
        </div>

        {/* Article Summary Box */}
        <div className="p-4 rounded-xl bg-[#1E2433]/60 border border-white/[0.06] text-sm text-cyan-200 italic mb-6 leading-relaxed">
          "{article.summary}"
        </div>

        {/* Article Main Body Content (Rendered Markdown) */}
        <div className="prose prose-invert max-w-none text-sm font-['Geist']">
          <MarkdownRenderer content={article.content} />
        </div>

        {/* Footer actions */}
        <div className="mt-8 pt-6 border-t border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <BookOpen className="w-4 h-4 text-[#06B6D4]" />
            <span>Artigo mantido pela Curadoria Editorial IzyColors</span>
          </div>

          <button
            onClick={onClose}
            className="h-9 px-5 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
          >
            Fechar Leitura
          </button>
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
  onSendToAudit: (colors: string[]) => void;
}

const PaletteCard: React.FC<PaletteCardProps> = ({
  palette,
  isLiked,
  copiedTokensId,
  onLike,
  onFork,
  onOpenInGenerator,
  onSaveToCollection,
  onCopyTokens,
  onSendToAudit
}) => {
  return (
    <div className="bg-[#181C24] border border-white/[0.08] rounded-xl overflow-hidden shadow-lg hover:border-white/[0.18] transition-all duration-200 flex flex-col group">
      {/* Color preview stripes (75% of card visual impact) */}
      <div
        className="h-44 sm:h-48 w-full flex cursor-pointer relative overflow-hidden"
        title="Clique para Editar no Estúdio | Shift+clique para Auditar Contraste"
      >
        {palette.colors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={(e) => {
              if (e.shiftKey) {
                e.stopPropagation();
                onSendToAudit([c]);
              } else {
                onOpenInGenerator();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (e.shiftKey) {
                  e.stopPropagation();
                  onSendToAudit([c]);
                } else {
                  onOpenInGenerator();
                }
              }
            }}
            className="flex-1 h-full transition-transform hover:scale-105 duration-150 relative group/stripe cursor-pointer border-0 p-0 appearance-none"
            style={{ backgroundColor: c }}
            title={`${c} - Clique para Editar no Estúdio (Shift+clique para auditar apenas esta cor)`}
            aria-label={`${c} - Editar no Estúdio (Shift+clique para auditar apenas esta cor)`}
          >
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover/stripe:opacity-100 bg-black/60 text-white px-1 py-0.5 rounded transition-opacity pointer-events-none">
              {c}
            </span>
          </button>
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
            <h3 className="font-['Geist']">
              <button
                type="button"
                onClick={onOpenInGenerator}
                className="text-base font-semibold text-white tracking-tight cursor-pointer hover:text-[#06B6D4] transition-colors font-['Geist'] text-left"
              >
                {palette.title}
              </button>
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
                className={`flex items-center gap-1 text-xs font-mono transition-colors cursor-pointer ${isLiked ? 'text-[#EC4899]' : 'text-[#94A3B8] hover:text-white'
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
            {palette.tags.map((t) => (
              <span
                key={t}
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
              <span>Editar</span>
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
              onClick={() => onSendToAudit(palette.colors)}
              className="p-2 rounded-lg text-[#94A3B8] hover:text-[#06B6D4] hover:bg-[#262A33] transition-colors relative cursor-pointer"
              title="Auditar Contraste & Daltonismo"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </button>

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

