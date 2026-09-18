import React, { useState } from 'react';
import { 
  Layers, 
  Bookmark, 
  Heart, 
  Plus, 
  Code, 
  Trash2, 
  Sparkles, 
  Lock, 
  Globe, 
  Sliders, 
  Copy, 
  Check, 
  FolderPlus,
  Tag,
  Download
} from 'lucide-react';
import { ProjectWorkspace, CollectionBoard, FavoriteColor } from '../types';
import { exportCssTokens, getColorDetails } from '../utils/colorUtils';

interface ProjectsVaultViewProps {
  projects: ProjectWorkspace[];
  collections: CollectionBoard[];
  favoriteColors: FavoriteColor[];
  onOpenInGenerator: (colors: string[]) => void;
  onOpenExport: (colors: string[]) => void;
  onCreateProject: (project: ProjectWorkspace) => void;
  onCreateCollection: (collection: CollectionBoard) => void;
  onDeleteFavoriteColor: (id: string) => void;
  onDeleteCollection: (id: string) => void;
}

export const ProjectsVaultView: React.FC<ProjectsVaultViewProps> = ({
  projects,
  collections,
  favoriteColors,
  onOpenInGenerator,
  onOpenExport,
  onCreateProject,
  onCreateCollection,
  onDeleteFavoriteColor,
  onDeleteCollection
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'collections' | 'favorites'>('projects');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Project Modal State
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectClient, setNewProjectClient] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // New Collection Modal State
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColTags, setNewColTags] = useState('');
  const [newColPrivate, setNewColPrivate] = useState(false);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const newProj: ProjectWorkspace = {
      id: `proj-${Date.now()}`,
      name: newProjectName,
      clientOrBrand: newProjectClient || 'Uso Interno',
      description: newProjectDesc || 'Design system de cores com tokens semânticos.',
      primaryColors: ['#08BBD9', '#3B82F6', '#9354F5'],
      secondaryColors: ['#10B981', '#F59E0B'],
      neutralGrays: ['#0B0F17', '#181C24', '#475569', '#E2E8F0', '#FFFFFF'],
      semanticTokens: {
        primary: '#08BBD9',
        secondary: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        surface: '#181C24',
        background: '#0B0F17'
      },
      updatedAt: 'Agora'
    };
    onCreateProject(newProj);
    setShowNewProjectModal(false);
    setNewProjectName('');
    setNewProjectClient('');
    setNewProjectDesc('');
  };

  const handleCreateCollectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    const newCol: CollectionBoard = {
      id: `col-${Date.now()}`,
      title: newColTitle,
      description: newColDesc || 'Coleção temática de paletas curadas.',
      tags: newColTags.split(',').map(t => t.trim()).filter(Boolean),
      isPrivate: newColPrivate,
      paletteIds: [],
      coverColors: ['#0E1726', '#08BBD9', '#3B82F6', '#9354F5', '#FF2A85'],
      createdAt: 'Hoje'
    };
    onCreateCollection(newCol);
    setShowNewCollectionModal(false);
    setNewColTitle('');
    setNewColDesc('');
    setNewColTags('');
  };

  return (
    <div className="flex-1 bg-[#0B0F17] text-[#DFE2EE] p-4 sm:p-8 max-w-[1500px] mx-auto w-full pb-24">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/[0.08] pb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#06B6D4] flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
            Gerenciamento & Arquitetura de Tokens
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Geist'] mt-1">
            Projetos, Coleções & Cofre de Cores
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Organize sistemas de marcas, crie coleções temáticas e guarde seus swatches favoritos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'projects' && (
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="h-9 px-4 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Projeto de Marca</span>
            </button>
          )}

          {activeTab === 'collections' && (
            <button
              onClick={() => setShowNewCollectionModal(true)}
              className="h-9 px-4 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Nova Coleção</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Switcher Tabs (Projects / Collections / Swatches) */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] mb-8">
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'projects'
              ? 'border-[#6366F1] text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-[#6366F1]" />
          <span>Projetos de Design System</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#181C24] text-[11px] font-mono text-[#06B6D4]">
            {projects.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('collections')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'collections'
              ? 'border-[#6366F1] text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4 text-[#06B6D4]" />
          <span>Coleções & Moodboards</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#181C24] text-[11px] font-mono text-[#06B6D4]">
            {collections.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'favorites'
              ? 'border-[#6366F1] text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4 text-[#EC4899]" />
          <span>Cofre de Cores Favoritas</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#181C24] text-[11px] font-mono text-[#EC4899]">
            {favoriteColors.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Design System Projects */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {projects.map((proj) => {
            const allColors = [...proj.primaryColors, ...proj.secondaryColors, ...proj.neutralGrays];
            return (
              <div
                key={proj.id}
                className="bg-[#181C24] border border-white/[0.08] rounded-xl p-6 shadow-xl hover:border-white/[0.16] transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] text-[10px] font-mono font-bold uppercase">
                        {proj.clientOrBrand}
                      </span>
                      <span className="text-xs text-[#64748B] font-mono">Atualizado {proj.updatedAt}</span>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight font-['Geist'] mt-1">
                      {proj.name}
                    </h2>
                    <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
                      {proj.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onOpenInGenerator(proj.primaryColors)}
                      className="h-8 px-3 rounded-lg bg-[#262A33] hover:bg-[#31353E] border border-white/[0.06] text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Abrir no Gerador</span>
                    </button>

                    <button
                      onClick={() => onOpenExport(allColors)}
                      className="h-8 px-3 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar Tokens</span>
                    </button>
                  </div>
                </div>

                {/* Primary Ramp */}
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider block mb-2 font-semibold">
                      Tokens Primários de Marca ({proj.primaryColors.length})
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {proj.primaryColors.map((hex, i) => (
                        <div
                          key={i}
                          onClick={() => handleCopy(hex, hex)}
                          className="p-2.5 rounded-lg border border-white/[0.06] bg-[#111827] flex items-center gap-2.5 cursor-pointer hover:border-white/20 transition-all group"
                        >
                          <div className="w-6 h-6 rounded-md shrink-0 border border-white/10" style={{ backgroundColor: hex }} />
                          <div className="truncate">
                            <span className="text-xs font-mono font-bold text-white block group-hover:text-[#06B6D4]">
                              {copiedId === hex ? 'Copiado!' : hex}
                            </span>
                            <span className="text-[10px] text-[#64748B] font-mono">primary-{i + 1}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Neutrals Ramp */}
                  <div>
                    <span className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider block mb-2 font-semibold">
                      Superfícies & Escala Neutra ({proj.neutralGrays.length})
                    </span>
                    <div className="h-10 rounded-lg overflow-hidden flex shadow-inner border border-white/10">
                      {proj.neutralGrays.map((hex, i) => (
                        <div
                          key={i}
                          onClick={() => handleCopy(hex, hex)}
                          className="flex-1 h-full cursor-pointer transition-transform hover:scale-105 relative group"
                          style={{ backgroundColor: hex }}
                          title={`${hex} - Clique para copiar`}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono opacity-0 group-hover:opacity-100 bg-black/50 text-white transition-opacity">
                            {copiedId === hex ? 'Copiado!' : hex}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Collections & Moodboards */}
      {activeTab === 'collections' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {collections.map((col) => (
            <div
              key={col.id}
              className="bg-[#181C24] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl flex flex-col justify-between group hover:border-white/20 transition-all"
            >
              {/* Color Stripes Header */}
              <div 
                onClick={() => onOpenInGenerator(col.coverColors)}
                className="h-32 w-full flex cursor-pointer"
                title="Clique para abrir no Gerador"
              >
                {col.coverColors.map((c, i) => (
                  <div key={i} className="flex-1 h-full transition-transform hover:scale-105" style={{ backgroundColor: c }} />
                ))}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 
                      onClick={() => onOpenInGenerator(col.coverColors)}
                      className="text-base font-semibold text-white tracking-tight cursor-pointer hover:text-[#06B6D4] font-['Geist']"
                    >
                      {col.title}
                    </h3>
                    {col.isPrivate ? (
                      <span className="text-[#94A3B8] p-1 bg-white/[0.04] rounded" title="Coleção Privada">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-[#06B6D4] p-1 bg-[#06B6D4]/10 rounded" title="Coleção Pública">
                        <Globe className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#94A3B8] leading-relaxed mb-3">
                    {col.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {col.tags.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-full bg-[#111827] text-[#94A3B8] text-[10px] font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs">
                  <span className="text-[#64748B] font-mono">Criado em {col.createdAt}</span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenInGenerator(col.coverColors)}
                      className="h-7 px-2.5 rounded bg-[#6366F1] hover:bg-[#5254E0] text-white text-[11px] font-medium transition-colors"
                    >
                      Abrir
                    </button>
                    <button
                      onClick={() => onDeleteCollection(col.id)}
                      className="p-1.5 text-[#94A3B8] hover:text-rose-400 transition-colors"
                      title="Excluir Coleção"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Favorite Swatches Vault */}
      {activeTab === 'favorites' && (
        <div className="bg-[#181C24] border border-white/[0.08] rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white font-['Geist']">
                Cofre de Swatches Favoritos
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Cores salvas diretamente do Gerador, Roda Harmônica e Comunidade com notas de uso técnico.
              </p>
            </div>
            <button
              onClick={() => onOpenInGenerator(favoriteColors.map(c => c.hex))}
              className="h-8 px-3 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gerar Paleta com Meus Favoritos</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {favoriteColors.map((fav) => {
              const details = getColorDetails(fav.hex);
              return (
                <div
                  key={fav.id}
                  className="p-4 bg-[#111827] border border-white/[0.06] rounded-xl flex items-start justify-between gap-4 group hover:border-white/20 transition-all"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 rounded-lg shrink-0 shadow-lg border border-white/10"
                      style={{ backgroundColor: fav.hex }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold font-mono text-white">
                          {fav.hex}
                        </span>
                        <span className="text-xs text-[#94A3B8] truncate">{fav.name}</span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-1 leading-snug line-clamp-2">
                        {fav.note}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {fav.tags.map((t, idx) => (
                          <span key={idx} className="px-1.5 py-0.2 rounded bg-white/[0.06] text-[10px] text-[#06B6D4] font-mono">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => handleCopy(fav.id, fav.hex)}
                      className="p-1.5 rounded-md bg-[#181C24] hover:bg-[#262A33] text-[#94A3B8] hover:text-white transition-colors"
                      title="Copiar Código Hex"
                    >
                      {copiedId === fav.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onDeleteFavoriteColor(fav.id)}
                      className="p-1.5 text-[#64748B] hover:text-rose-400 transition-colors"
                      title="Remover do Cofre"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#181C24] border border-white/[0.12] rounded-xl p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-4 font-['Geist']">
              Criar Novo Projeto de Design System
            </h3>
            <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Nome do Projeto:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Banco Neon Mobile System"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Cliente ou Marca:</label>
                <input
                  type="text"
                  placeholder="Ex: Fintech Alpha"
                  value={newProjectClient}
                  onChange={(e) => setNewProjectClient(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Descrição do Sistema:</label>
                <textarea
                  rows={3}
                  placeholder="Objetivos de acessibilidade, público-alvo e regras cromáticas..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-semibold shadow-sm"
                >
                  Salvar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Collection Modal */}
      {showNewCollectionModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#181C24] border border-white/[0.12] rounded-xl p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-4 font-['Geist']">
              Criar Nova Coleção Temática
            </h3>
            <form onSubmit={handleCreateCollectionSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Título da Coleção:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Gráficos de Dados Biológicos"
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Descrição:</label>
                <textarea
                  rows={2}
                  placeholder="Contexto ou humor das paletas..."
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Tags (separadas por vírgula):</label>
                <input
                  type="text"
                  placeholder="Bio, Oklch, Dark Mode, Dados"
                  value={newColTags}
                  onChange={(e) => setNewColTags(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="priv"
                  checked={newColPrivate}
                  onChange={(e) => setNewColPrivate(e.target.checked)}
                  className="rounded bg-[#111827] border-white/20 text-[#6366F1]"
                />
                <label htmlFor="priv" className="text-xs text-[#DFE2EE] cursor-pointer">
                  Manter coleção privada (apenas você poderá ver)
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCollectionModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-semibold shadow-sm"
                >
                  Criar Coleção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
