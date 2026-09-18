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
  Download,
  ShieldCheck,
  Palette as PaletteIcon,
  ArrowRight,
  PlusCircle,
  FileText,
  ExternalLink
} from 'lucide-react';
import { ProjectWorkspace, ProjectPalette, CollectionBoard, FavoriteColor, VaultPalette } from '../types';
import { exportCssTokens, getColorDetails } from '../utils/colorUtils';

interface ProjectsVaultViewProps {
  projects: ProjectWorkspace[];
  collections: CollectionBoard[];
  favoriteColors: FavoriteColor[];
  vaultPalettes: VaultPalette[];
  onOpenInGenerator: (colors: string[]) => void;
  onOpenExport: (colors: string[], title?: string) => void;
  onCreateProject: (project: ProjectWorkspace) => void;
  onDeleteProject?: (projectId: string) => void;
  onSavePaletteToProject: (projectId: string, palette: ProjectPalette) => void;
  onDeletePaletteFromProject?: (projectId: string, paletteId: string) => void;
  onSavePaletteToVault: (palette: VaultPalette) => void;
  onDeleteVaultPalette: (id: string) => void;
  onCreateCollection: (collection: CollectionBoard) => void;
  onDeleteFavoriteColor: (id: string) => void;
  onDeleteCollection: (id: string) => void;
}

export const ProjectsVaultView: React.FC<ProjectsVaultViewProps> = ({
  projects,
  collections,
  favoriteColors,
  vaultPalettes,
  onOpenInGenerator,
  onOpenExport,
  onCreateProject,
  onDeleteProject,
  onSavePaletteToProject,
  onDeletePaletteFromProject,
  onSavePaletteToVault,
  onDeleteVaultPalette,
  onCreateCollection,
  onDeleteFavoriteColor,
  onDeleteCollection
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'collections' | 'favorites'>('projects');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Vault sub-filter
  const [vaultFilter, setVaultFilter] = useState<'all' | 'palettes' | 'swatches'>('all');

  // Modals state
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectClient, setNewProjectClient] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColTags, setNewColTags] = useState('');
  const [newColPrivate, setNewColPrivate] = useState(false);

  // Add Palette to Project Modal State
  const [showAddPaletteToProjectModal, setShowAddPaletteToProjectModal] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState<string>(projects[0]?.id || '');
  const [newPaletteName, setNewPaletteName] = useState('');
  const [newPaletteRole, setNewPaletteRole] = useState<'Primária' | 'Secundária' | 'Acentos' | 'UI / Superfícies' | 'Semântica' | 'Dark Mode'>('Primária');
  const [newPaletteColorsInput, setNewPaletteColorsInput] = useState('#08BBD9, #3B82F6, #9354F5, #FF2A85, #10B981');
  const [newPaletteDesc, setNewPaletteDesc] = useState('');

  // Add New Vault Palette Modal State
  const [showNewVaultPaletteModal, setShowNewVaultPaletteModal] = useState(false);
  const [newVaultTitle, setNewVaultTitle] = useState('');
  const [newVaultDesc, setNewVaultDesc] = useState('');
  const [newVaultColorsInput, setNewVaultColorsInput] = useState('#0B0F17, #181C24, #08BBD9, #6366F1, #EC4899');
  const [newVaultTags, setNewVaultTags] = useState('Oklch, Dark Mode, Vault');
  const [newVaultNotes, setNewVaultNotes] = useState('');

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
      name: newProjectName.trim(),
      clientOrBrand: newProjectClient.trim() || 'Uso Interno',
      description: newProjectDesc.trim() || 'Design system de cores com tokens semânticos.',
      primaryColors: ['#08BBD9', '#3B82F6', '#9354F5'],
      secondaryColors: ['#10B981', '#F59E0B'],
      neutralGrays: ['#0B0F17', '#181C24', '#475569', '#E2E8F0', '#FFFFFF'],
      palettes: [
        {
          id: `pal-${Date.now()}`,
          name: 'Paleta Inicial',
          description: 'Cores fundamentais do sistema.',
          colors: ['#08BBD9', '#3B82F6', '#9354F5', '#10B981', '#0B0F17'],
          role: 'Primária',
          createdAt: 'Hoje',
          wcagLevel: 'WCAG AAA'
        }
      ],
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

  const handleAddPaletteToProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProjectId || !newPaletteName.trim()) return;

    // Parse colors from comma or space separated input
    const parsedColors = newPaletteColorsInput
      .split(/[,;\s]+/)
      .map(c => c.trim())
      .filter(c => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(c))
      .map(c => c.toUpperCase());

    const colorsToUse = parsedColors.length > 0 
      ? parsedColors 
      : ['#08BBD9', '#3B82F6', '#9354F5', '#FF2A85', '#10B981'];

    const newPal: ProjectPalette = {
      id: `pal-${Date.now()}`,
      name: newPaletteName.trim(),
      description: newPaletteDesc.trim(),
      colors: colorsToUse,
      role: newPaletteRole,
      createdAt: 'Agora',
      wcagLevel: 'WCAG AAA'
    };

    onSavePaletteToProject(targetProjectId, newPal);
    setShowAddPaletteToProjectModal(false);
    setNewPaletteName('');
    setNewPaletteDesc('');
    setNewPaletteColorsInput('#08BBD9, #3B82F6, #9354F5, #FF2A85, #10B981');
  };

  const handleSaveVaultPaletteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVaultTitle.trim()) return;

    const parsedColors = newVaultColorsInput
      .split(/[,;\s]+/)
      .map(c => c.trim())
      .filter(c => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(c))
      .map(c => c.toUpperCase());

    const colorsToUse = parsedColors.length > 0 
      ? parsedColors 
      : ['#0B0F17', '#181C24', '#08BBD9', '#6366F1', '#EC4899'];

    const newVaultPal: VaultPalette = {
      id: `vault-${Date.now()}`,
      title: newVaultTitle.trim(),
      description: newVaultDesc.trim() || 'Paleta completa salva no cofre privado.',
      colors: colorsToUse,
      tags: newVaultTags.split(',').map(t => t.trim()).filter(Boolean),
      notes: newVaultNotes.trim(),
      gamut: 'Display P3',
      wcagLevel: 'WCAG AAA (12.4:1)',
      createdAt: 'Agora'
    };

    onSavePaletteToVault(newVaultPal);
    setShowNewVaultPaletteModal(false);
    setNewVaultTitle('');
    setNewVaultDesc('');
    setNewVaultNotes('');
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
            Gerenciamento de Paletas & Tokens
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Geist'] mt-1">
            Projetos, Coleções & Cofre Privado
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Salve paletas completas e amostras em sistemas de design de marcas, coleções ou no cofre protegido.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'projects' && (
            <>
              <button
                onClick={() => {
                  if (projects.length > 0) {
                    setTargetProjectId(projects[0].id);
                  }
                  setShowAddPaletteToProjectModal(true);
                }}
                className="h-9 px-3.5 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-[#06B6D4]" />
                <span>Salvar Paleta em Projeto</span>
              </button>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="h-9 px-4 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Projeto</span>
              </button>
            </>
          )}

          {activeTab === 'collections' && (
            <button
              onClick={() => setShowNewCollectionModal(true)}
              className="h-9 px-4 bg-[#06B6D4] hover:bg-[#08BBD9] text-black rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Coleção</span>
            </button>
          )}

          {activeTab === 'favorites' && (
            <button
              onClick={() => setShowNewVaultPaletteModal(true)}
              className="h-9 px-4 bg-amber-400 hover:bg-amber-300 text-black rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Salvar Paleta no Cofre</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] mb-8 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'projects'
              ? 'bg-[#181C24] text-white border border-white/[0.12] shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Layers className="w-4 h-4 text-[#6366F1]" />
          <span>Projetos & Design Systems</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[10px] font-mono text-[#94A3B8]">
            {projects.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('collections')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'collections'
              ? 'bg-[#181C24] text-white border border-white/[0.12] shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Bookmark className="w-4 h-4 text-[#06B6D4]" />
          <span>Coleções & Moodboards</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[10px] font-mono text-[#94A3B8]">
            {collections.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'favorites'
              ? 'bg-[#181C24] text-white border border-white/[0.12] shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Cofre Privado (Vault)</span>
          <span className="px-1.5 py-0.5 rounded-full bg-amber-400/10 text-[10px] font-mono text-amber-300 font-bold">
            {vaultPalettes.length + favoriteColors.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Projects & Systems */}
      {activeTab === 'projects' && (
        <div className="space-y-8">
          {projects.map((proj) => {
            const projectPalettes = proj.palettes || [];
            return (
              <div
                key={proj.id}
                className="bg-[#181C24] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6"
              >
                {/* Project Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-white font-['Geist'] tracking-tight">
                        {proj.name}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20 text-[11px] font-mono font-medium">
                        {proj.clientOrBrand}
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
                      {proj.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setTargetProjectId(proj.id);
                        setShowAddPaletteToProjectModal(true);
                      }}
                      className="h-8 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#06B6D4]" />
                      <span>Adicionar Paleta</span>
                    </button>
                    <button
                      onClick={() => onOpenExport([...proj.primaryColors, ...proj.secondaryColors], proj.name)}
                      className="h-8 px-3 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar Tokens</span>
                    </button>
                    {onDeleteProject && (
                      <button
                        onClick={() => onDeleteProject(proj.id)}
                        className="p-2 text-[#94A3B8] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Projeto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* PALETAS SALVAS DO PROJETO */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-[#06B6D4] uppercase tracking-wider font-bold flex items-center gap-1.5">
                      <PaletteIcon className="w-3.5 h-3.5" />
                      Paletas Completas do Projeto ({projectPalettes.length})
                    </span>
                    <button
                      onClick={() => {
                        setTargetProjectId(proj.id);
                        setShowAddPaletteToProjectModal(true);
                      }}
                      className="text-xs text-[#6366F1] hover:text-[#5254E0] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Salvar Nova Paleta</span>
                    </button>
                  </div>

                  {projectPalettes.length === 0 ? (
                    <div className="p-6 rounded-xl border border-dashed border-white/10 bg-[#111827]/50 text-center">
                      <p className="text-xs text-[#94A3B8]">
                        Nenhuma paleta completa salva neste projeto ainda.
                      </p>
                      <button
                        onClick={() => {
                          setTargetProjectId(proj.id);
                          setShowAddPaletteToProjectModal(true);
                        }}
                        className="mt-2 text-xs text-[#6366F1] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Salvar a primeira paleta</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {projectPalettes.map((pal) => (
                        <div
                          key={pal.id}
                          className="bg-[#111827] border border-white/[0.08] rounded-xl p-4 space-y-3 hover:border-white/20 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white font-['Geist']">
                                {pal.name}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] text-[#06B6D4]">
                                {pal.role || 'Geral'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onOpenInGenerator(pal.colors)}
                                className="px-2 py-1 rounded bg-[#6366F1]/20 hover:bg-[#6366F1]/40 text-[#6366F1] text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Abrir no Gerador"
                              >
                                Abrir
                              </button>
                              <button
                                onClick={() => onOpenExport(pal.colors, `${proj.name} - ${pal.name}`)}
                                className="p-1 text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                                title="Exportar Tokens"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              {onDeletePaletteFromProject && (
                                <button
                                  onClick={() => onDeletePaletteFromProject(proj.id, pal.id)}
                                  className="p-1 text-[#64748B] hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Remover Paleta do Projeto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Palette color strip */}
                          <div className="h-10 rounded-lg overflow-hidden flex shadow-inner border border-white/10">
                            {pal.colors.map((hex, i) => (
                              <div
                                key={i}
                                onClick={() => handleCopy(hex, hex)}
                                className="flex-1 h-full cursor-pointer transition-transform hover:scale-105 relative group/color"
                                style={{ backgroundColor: hex }}
                                title={`${hex} - Clique para copiar`}
                              >
                                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold opacity-0 group-hover/color:opacity-100 bg-black/60 text-white transition-opacity">
                                  {copiedId === hex ? '✓' : hex}
                                </span>
                              </div>
                            ))}
                          </div>

                          {pal.description && (
                            <p className="text-[11px] text-[#94A3B8] leading-tight">
                              {pal.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-[#64748B] font-mono pt-1">
                            <span>{pal.colors.length} cores cadastradas</span>
                            <span>Criada em {pal.createdAt}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rampas de Marca */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-white/[0.06]">
                  <div>
                    <span className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider block mb-2 font-semibold">
                      Tokens Primários de Marca ({proj.primaryColors.length})
                    </span>
                    <div className="grid grid-cols-3 gap-2">
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

                  <div>
                    <span className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider block mb-2 font-semibold">
                      Superfícies & Escala Neutra ({proj.neutralGrays.length})
                    </span>
                    <div className="h-10 rounded-lg overflow-hidden flex shadow-inner border border-white/10">
                      {proj.neutralGrays.map((hex, i) => (
                        <div
                          key={i}
                          onClick={() => handleCopy(hex, hex)}
                          className="flex-1 h-full cursor-pointer transition-transform hover:scale-105 relative group/neu"
                          style={{ backgroundColor: hex }}
                          title={`${hex} - Clique para copiar`}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono opacity-0 group-hover/neu:opacity-100 bg-black/60 text-white transition-opacity">
                            {copiedId === hex ? '✓' : hex}
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
                      className="h-7 px-2.5 rounded bg-[#6366F1] hover:bg-[#5254E0] text-white text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      Abrir
                    </button>
                    <button
                      onClick={() => onDeleteCollection(col.id)}
                      className="p-1.5 text-[#94A3B8] hover:text-rose-400 transition-colors cursor-pointer"
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

      {/* Tab 3: Favorite Swatches & Entire Palettes Vault */}
      {activeTab === 'favorites' && (
        <div className="space-y-8">
          {/* Vault Header Controls */}
          <div className="bg-[#181C24] border border-white/[0.08] rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    <Lock className="w-4 h-4" />
                  </span>
                  <h2 className="text-lg font-bold text-white font-['Geist']">
                    Cofre de Paletas & Cores Privadas
                  </h2>
                </div>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Guarde paletas inteiras e amostras individuais exclusivas com notas técnicas de uso.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewVaultPaletteModal(true)}
                  className="h-8 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Salvar Nova Paleta no Cofre</span>
                </button>
                <button
                  onClick={() => {
                    const allVaultColors = [
                      ...vaultPalettes.flatMap(p => p.colors),
                      ...favoriteColors.map(c => c.hex)
                    ];
                    onOpenInGenerator(allVaultColors.slice(0, 5));
                  }}
                  className="h-8 px-3 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gerar Paleta com o Cofre</span>
                </button>
              </div>
            </div>

            {/* Sub-filter tabs */}
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 mb-6">
              <button
                onClick={() => setVaultFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  vaultFilter === 'all'
                    ? 'bg-amber-400/10 text-amber-300 font-semibold border border-amber-400/30'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Todas as Entradas ({vaultPalettes.length + favoriteColors.length})
              </button>
              <button
                onClick={() => setVaultFilter('palettes')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  vaultFilter === 'palettes'
                    ? 'bg-amber-400/10 text-amber-300 font-semibold border border-amber-400/30'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Paletas Inteiras ({vaultPalettes.length})
              </button>
              <button
                onClick={() => setVaultFilter('swatches')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  vaultFilter === 'swatches'
                    ? 'bg-amber-400/10 text-amber-300 font-semibold border border-amber-400/30'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Amostras Individuais ({favoriteColors.length})
              </button>
            </div>

            {/* SEÇÃO 1: PALETAS INTEIRAS SALVAS NO COFRE */}
            {(vaultFilter === 'all' || vaultFilter === 'palettes') && (
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase text-amber-400 font-bold tracking-wider flex items-center gap-1.5">
                    <PaletteIcon className="w-3.5 h-3.5" />
                    Paletas Inteiras Salvas no Cofre ({vaultPalettes.length})
                  </h3>
                </div>

                {vaultPalettes.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-white/10 bg-[#111827] text-center">
                    <p className="text-xs text-[#94A3B8]">
                      Nenhuma paleta completa salva no cofre ainda.
                    </p>
                    <button
                      onClick={() => setShowNewVaultPaletteModal(true)}
                      className="mt-2 text-xs text-amber-400 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Salvar sua primeira paleta no cofre</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {vaultPalettes.map((pal) => (
                      <div
                        key={pal.id}
                        className="p-5 bg-[#111827] border border-white/[0.08] rounded-xl flex flex-col justify-between gap-4 hover:border-amber-400/40 transition-all group shadow-lg"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white font-['Geist']">
                                  {pal.title}
                                </h4>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-400/10 text-amber-300 border border-amber-400/20">
                                  {pal.gamut || 'Display P3'}
                                </span>
                              </div>
                              {pal.description && (
                                <p className="text-xs text-[#94A3B8] mt-1 leading-snug">
                                  {pal.description}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => onDeleteVaultPalette(pal.id)}
                              className="p-1 text-[#64748B] hover:text-rose-400 transition-colors cursor-pointer"
                              title="Remover do Cofre"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Color strip */}
                          <div className="h-12 rounded-lg overflow-hidden flex border border-white/10 shadow-inner">
                            {pal.colors.map((hex, i) => (
                              <div
                                key={i}
                                onClick={() => handleCopy(hex, hex)}
                                className="flex-1 h-full cursor-pointer transition-transform hover:scale-105 relative group/c"
                                style={{ backgroundColor: hex }}
                                title={`${hex} - Clique para copiar`}
                              >
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold opacity-0 group-hover/c:opacity-100 bg-black/60 text-white transition-opacity">
                                  {copiedId === hex ? '✓' : hex}
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
                          <span className="text-[11px] font-mono text-[#64748B]">Salvo {pal.createdAt}</span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleCopy(`all-${pal.id}`, pal.colors.join(', '))}
                              className="px-2 py-1 rounded bg-[#181C24] hover:bg-white/[0.08] text-[#94A3B8] hover:text-white text-[11px] font-mono transition-colors cursor-pointer"
                            >
                              {copiedId === `all-${pal.id}` ? 'Copiado!' : 'Copiar HEXs'}
                            </button>
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
            )}

            {/* SEÇÃO 2: AMOSTRAS INDIVIDUAIS DO COFRE */}
            {(vaultFilter === 'all' || vaultFilter === 'swatches') && (
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase text-[#06B6D4] font-bold tracking-wider flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5" />
                  Amostras Individuais Salvas ({favoriteColors.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {favoriteColors.map((fav) => (
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
                          className="p-1.5 rounded-md bg-[#181C24] hover:bg-[#262A33] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                          title="Copiar Código Hex"
                        >
                          {copiedId === fav.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => onDeleteFavoriteColor(fav.id)}
                          className="p-1.5 text-[#64748B] hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remover do Cofre"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Adicionar Paleta ao Projeto */}
      {showAddPaletteToProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#181C24] border border-white/[0.12] rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white font-['Geist'] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#6366F1]" />
              <span>Salvar Paleta Completa no Projeto</span>
            </h3>

            <form onSubmit={handleAddPaletteToProjectSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Selecione o Projeto:</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.clientOrBrand})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Nome da Paleta:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Escala de Acentos & Gráficos"
                  value={newPaletteName}
                  onChange={(e) => setNewPaletteName(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-[#94A3B8] block mb-1">Função / Papel no Sistema:</label>
                  <select
                    value={newPaletteRole}
                    onChange={(e) => setNewPaletteRole(e.target.value as any)}
                    className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                  >
                    <option value="Primária">Paleta Primária</option>
                    <option value="Secundária">Paleta Secundária</option>
                    <option value="Acentos">Acentos & Highlights</option>
                    <option value="UI / Superfícies">UI & Superfícies</option>
                    <option value="Semântica">Semântica</option>
                    <option value="Dark Mode">Dark Mode</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-[#94A3B8] block mb-1">Descrição Breve:</label>
                  <input
                    type="text"
                    placeholder="Ex: Utilizada em relatórios e CTAs"
                    value={newPaletteDesc}
                    onChange={(e) => setNewPaletteDesc(e.target.value)}
                    className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">
                  Cores HEX da Paleta (separadas por vírgula):
                </label>
                <input
                  type="text"
                  required
                  placeholder="#08BBD9, #3B82F6, #9354F5, #FF2A85, #10B981"
                  value={newPaletteColorsInput}
                  onChange={(e) => setNewPaletteColorsInput(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowAddPaletteToProjectModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Salvar no Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Salvar Nova Paleta no Cofre */}
      {showNewVaultPaletteModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#181C24] border border-white/[0.12] rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white font-['Geist'] flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Salvar Nova Paleta Inteira no Cofre</span>
            </h3>

            <form onSubmit={handleSaveVaultPaletteSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Título da Paleta:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Obsidian Quantum High Contrast"
                  value={newVaultTitle}
                  onChange={(e) => setNewVaultTitle(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Descrição / Contexto:</label>
                <input
                  type="text"
                  placeholder="Ex: Paleta balanceada para interfaces escuras"
                  value={newVaultDesc}
                  onChange={(e) => setNewVaultDesc(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">
                  Cores HEX da Paleta (separadas por vírgula):
                </label>
                <input
                  type="text"
                  required
                  placeholder="#0B0F17, #181C24, #08BBD9, #6366F1, #EC4899"
                  value={newVaultColorsInput}
                  onChange={(e) => setNewVaultColorsInput(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Tags (separadas por vírgula):</label>
                <input
                  type="text"
                  placeholder="Dark Mode, Oklch, UI"
                  value={newVaultTags}
                  onChange={(e) => setNewVaultTags(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Notas Técnicas de Uso:</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Usar a cor 1 no fundo e a 3 para foco ativo..."
                  value={newVaultNotes}
                  onChange={(e) => setNewVaultNotes(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowNewVaultPaletteModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold shadow-md cursor-pointer"
                >
                  Salvar no Cofre
                </button>
              </div>
            </form>
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
                  className="px-3 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-semibold shadow-sm cursor-pointer"
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
                  className="px-3 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-semibold shadow-sm cursor-pointer"
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
