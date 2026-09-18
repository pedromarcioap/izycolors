import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Tag, 
  BarChart3, 
  Plus, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Eye, 
  Award, 
  X, 
  Check, 
  TrendingUp, 
  Globe,
  Sliders
} from 'lucide-react';
import { CmsArticle, CommunitySubmission } from '../types';

interface CmsAdminViewProps {
  articles: CmsArticle[];
  submissions: CommunitySubmission[];
  tags: { name: string; count: number; category: string }[];
  onCreateArticle: (article: CmsArticle) => void;
  onApproveSubmission: (id: string, asStaffPick: boolean) => void;
  onRejectSubmission: (id: string) => void;
  onAddTag: (name: string, category: string) => void;
  onOpenInGenerator: (colors: string[]) => void;
}

export const CmsAdminView: React.FC<CmsAdminViewProps> = ({
  articles,
  submissions,
  tags,
  onCreateArticle,
  onApproveSubmission,
  onRejectSubmission,
  onAddTag,
  onOpenInGenerator
}) => {
  const [cmsTab, setCmsTab] = useState<'articles' | 'curation' | 'taxonomy' | 'analytics'>('articles');

  // Article Modal State
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Teoria da Cor');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');

  // New Tag State
  const [newTagName, setNewTagName] = useState('');
  const [newTagCategory, setNewTagCategory] = useState('Estilo');

  const handleCreateArticleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const article: CmsArticle = {
      id: `art-${Date.now()}`,
      title: newTitle,
      slug: newTitle.toLowerCase().replace(/\s+/g, '-'),
      category: newCategory as CmsArticle['category'],
      summary: newSummary,
      content: newContent || newSummary,
      author: 'Helena Vance',
      readTime: '5 min de leitura',
      status: 'Publicado',
      featured: false,
      publishedAt: 'Hoje',
      views: 1
    };
    onCreateArticle(article);
    setShowArticleModal(false);
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
  };

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    onAddTag(newTagName.trim(), newTagCategory);
    setNewTagName('');
  };

  return (
    <div className="flex-1 bg-[#0B0F17] text-[#DFE2EE] p-4 sm:p-8 max-w-[1500px] mx-auto w-full pb-24">
      {/* CMS Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/[0.08] pb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#06B6D4] flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
            Sistema de Gestão de Conteúdo (CMS)
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Geist'] mt-1">
            Painel Editorial & Curadoria Comunitária
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Gestão completa de artigos técnicos, fila de moderação de paletas, taxonomia e métricas.
          </p>
        </div>

        {cmsTab === 'articles' && (
          <button
            onClick={() => setShowArticleModal(true)}
            className="h-9 px-4 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Publicar Artigo Técnico</span>
          </button>
        )}
      </div>

      {/* CMS Subtabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] mb-8">
        <button
          onClick={() => setCmsTab('articles')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
            cmsTab === 'articles'
              ? 'border-[#6366F1] text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-[#6366F1]" />
          <span>Gestão Editorial ({articles.length})</span>
        </button>

        <button
          onClick={() => setCmsTab('curation')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
            cmsTab === 'curation'
              ? 'border-[#6366F1] text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <Award className="w-4 h-4 text-[#06B6D4]" />
          <span>Fila de Curadoria ({submissions.filter(s => s.status === 'Pendente').length} Pendentes)</span>
        </button>

        <button
          onClick={() => setCmsTab('taxonomy')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
            cmsTab === 'taxonomy'
              ? 'border-[#6366F1] text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4 text-[#EC4899]" />
          <span>Taxonomia & Tags ({tags.length})</span>
        </button>

        <button
          onClick={() => setCmsTab('analytics')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
            cmsTab === 'analytics'
              ? 'border-[#6366F1] text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>Analytics do Studio</span>
        </button>
      </div>

      {/* Tab 1: Editorial Articles */}
      {cmsTab === 'articles' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {articles.map((art) => (
              <div
                key={art.id}
                className="bg-[#181C24] border border-white/[0.08] rounded-xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/20 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-[#6366F1]/10 border border-[#6366F1]/30 text-[#6366F1] text-[10px] font-mono font-bold">
                      {art.category}
                    </span>
                    {art.featured && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono">
                        Destaque Editorial
                      </span>
                    )}
                    <span className="text-xs text-[#64748B] font-mono">• {art.readTime}</span>
                    <span className="text-xs text-[#64748B] font-mono">• {art.publishedAt}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight font-['Geist'] mb-1">
                    {art.title}
                  </h3>

                  <p className="text-xs text-[#94A3B8] leading-relaxed max-w-3xl line-clamp-2">
                    {art.summary}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right font-mono text-xs">
                    <span className="text-white font-bold block">{art.views.toLocaleString()}</span>
                    <span className="text-[#64748B] text-[10px]">Leituras</span>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
                    {art.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Community Submissions Curation Queue */}
      {cmsTab === 'curation' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#181C24] rounded-xl border border-white/[0.08] mb-4 text-xs text-[#94A3B8] flex items-center justify-between">
            <span>Revise paletas enviadas por criadores para o Desafio Semanal #42 e Feed Global.</span>
            <span className="font-mono text-[#06B6D4]">Filtro de Qualidade: WCAG AAA + P3</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-[#181C24] border border-white/[0.08] rounded-xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Author & Palette Visual */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <img 
                        src={sub.authorAvatar} 
                        alt={sub.author} 
                        className="w-6 h-6 rounded-full object-cover" 
                      />
                      <span className="text-xs font-medium text-white">{sub.author}</span>
                      <span className="text-xs text-[#64748B] font-mono">{sub.authorHandle}</span>
                    </div>

                    <span className="text-xs font-mono text-[#64748B]">Enviado {sub.submittedAt}</span>
                  </div>

                  <h3 className="text-base font-bold text-white font-['Geist'] mb-3">
                    {sub.title}
                  </h3>

                  {/* Swatch stripe */}
                  <div 
                    onClick={() => onOpenInGenerator(sub.colors)}
                    className="h-16 rounded-lg overflow-hidden flex shadow-inner border border-white/10 cursor-pointer"
                    title="Testar paleta no Gerador"
                  >
                    {sub.colors.map((c, i) => (
                      <div key={i} className="flex-1 h-full flex items-end p-1 text-[10px] font-mono text-white/90 bg-black/20" style={{ backgroundColor: c }}>
                        {c}
                      </div>
                    ))}
                  </div>

                  {/* Meta tags */}
                  <div className="flex items-center gap-2 mt-3 text-[11px] font-mono">
                    <span className="text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded border border-[#06B6D4]/20">
                      Gamut {sub.suggestedGamut}
                    </span>
                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {sub.contrastScore}
                    </span>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  <button
                    onClick={() => onOpenInGenerator(sub.colors)}
                    className="h-9 px-3 rounded-lg bg-[#262A33] hover:bg-[#31353E] border border-white/[0.08] text-white text-xs font-medium transition-colors"
                  >
                    Auditar no Studio
                  </button>

                  {sub.status === 'Pendente' ? (
                    <>
                      <button
                        onClick={() => onApproveSubmission(sub.id, false)}
                        className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aprovar</span>
                      </button>

                      <button
                        onClick={() => onApproveSubmission(sub.id, true)}
                        className="h-9 px-3.5 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Staff Pick</span>
                      </button>

                      <button
                        onClick={() => onRejectSubmission(sub.id)}
                        className="p-2 rounded-lg bg-[#111827] hover:bg-rose-950/30 text-[#94A3B8] hover:text-rose-400 border border-white/[0.06] transition-colors"
                        title="Rejeitar submissão"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono">
                      ✓ Aprovado e Publicado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Dynamic Taxonomy & Tags */}
      {cmsTab === 'taxonomy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tag List */}
          <div className="lg:col-span-8 bg-[#181C24] border border-white/[0.08] rounded-xl p-6">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] font-semibold mb-4">
              Tags Oficiais do Sistema ({tags.length})
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {tags.map((t) => (
                <div
                  key={t.name}
                  className="p-3 bg-[#111827] border border-white/[0.06] rounded-lg flex items-center justify-between group hover:border-white/20 transition-all"
                >
                  <div>
                    <span className="text-xs font-medium text-white block">
                      #{t.name}
                    </span>
                    <span className="text-[10px] text-[#64748B] font-mono">
                      {t.category}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded">
                    {t.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Add Tag Form */}
          <div className="lg:col-span-4 bg-[#181C24] border border-white/[0.08] rounded-xl p-6">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] font-semibold mb-4">
              Cadastrar Nova Tag
            </h3>

            <form onSubmit={handleAddTagSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Nome da Tag:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Futurismo Brutalista"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Categoria:</label>
                <select
                  value={newTagCategory}
                  onChange={(e) => setNewTagCategory(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                >
                  <option>Estilo</option>
                  <option>Humor</option>
                  <option>Tema</option>
                  <option>Harmonia</option>
                  <option>Hardware</option>
                  <option>Ciência</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full h-9 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Adicionar Tag à Taxonomia
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 4: Studio Analytics */}
      {cmsTab === 'analytics' && (
        <div className="space-y-6">
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-[#181C24] border border-white/[0.08] rounded-xl">
              <span className="text-xs font-mono text-[#94A3B8]">Total de Tokens Exportados</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">1.48M</div>
              <span className="text-[11px] text-emerald-400 font-mono mt-1 block">↑ 24% este mês</span>
            </div>

            <div className="p-5 bg-[#181C24] border border-white/[0.08] rounded-xl">
              <span className="text-xs font-mono text-[#94A3B8]">Paletas em Display P3</span>
              <div className="text-2xl font-bold font-mono text-[#06B6D4] mt-1">68.2%</div>
              <span className="text-[11px] text-[#64748B] font-mono mt-1 block">Adoção ampla em OLED</span>
            </div>

            <div className="p-5 bg-[#181C24] border border-white/[0.08] rounded-xl">
              <span className="text-xs font-mono text-[#94A3B8]">Aprovação WCAG AAA Média</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">94.8%</div>
              <span className="text-[11px] text-emerald-400 font-mono mt-1 block">Conforme standard W3C</span>
            </div>

            <div className="p-5 bg-[#181C24] border border-white/[0.08] rounded-xl">
              <span className="text-xs font-mono text-[#94A3B8]">Criadores Ativos</span>
              <div className="text-2xl font-bold font-mono text-[#EC4899] mt-1">28,410</div>
              <span className="text-[11px] text-[#64748B] font-mono mt-1 block">Comunidade global</span>
            </div>
          </div>

          {/* Formats distribution */}
          <div className="p-6 bg-[#181C24] border border-white/[0.08] rounded-xl">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] font-semibold mb-4">
              Formatos de Exportação Mais Solicitados
            </h3>
            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-white mb-1">
                  <span>CSS Custom Properties (oklch)</span>
                  <span>42%</span>
                </div>
                <div className="w-full h-2 bg-[#111827] rounded-full overflow-hidden">
                  <div className="w-[42%] h-full bg-[#6366F1]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-white mb-1">
                  <span>Tailwind CSS Config</span>
                  <span>34%</span>
                </div>
                <div className="w-full h-2 bg-[#111827] rounded-full overflow-hidden">
                  <div className="w-[34%] h-full bg-[#06B6D4]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-white mb-1">
                  <span>W3C Design Tokens JSON</span>
                  <span>18%</span>
                </div>
                <div className="w-full h-2 bg-[#111827] rounded-full overflow-hidden">
                  <div className="w-[18%] h-full bg-emerald-400" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-white mb-1">
                  <span>SVG Swatches & SCSS</span>
                  <span>6%</span>
                </div>
                <div className="w-full h-2 bg-[#111827] rounded-full overflow-hidden">
                  <div className="w-[6%] h-full bg-amber-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Article Modal */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#181C24] border border-white/[0.12] rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-white mb-4 font-['Geist']">
              Publicar Novo Artigo Técnico no CMS
            </h3>
            <form onSubmit={handleCreateArticleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Título do Artigo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Como calibrar matrizes de contraste no Figma"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Categoria:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                >
                  <option>Teoria da Cor</option>
                  <option>Acessibilidade</option>
                  <option>Design Systems</option>
                  <option>Engenharia de Software</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Resumo Executivo:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Resumo em 2 a 3 frases para listagens e cartões..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Conteúdo Completo (Markdown):</label>
                <textarea
                  rows={6}
                  placeholder="Escreva a análise técnica completa..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowArticleModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-semibold shadow-sm"
                >
                  Publicar Imediatamente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
