import React, { useState } from 'react';
import {
  FolderPlus,
  Bookmark,
  Layers,
  Plus,
  Check,
  X
} from 'lucide-react';
import { ProjectWorkspace, CollectionBoard, ProjectSlot } from '../types';

export type { ProjectSlot };

interface AddFavoriteToTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedColors: string[]; // Hex codes of colors to add
  projects: ProjectWorkspace[];
  collections: CollectionBoard[];
  onAddColorsToProject: (
    projectId: string,
    targetType: ProjectSlot,
    colors: string[],
    paletteName?: string
  ) => void;
  onAddColorsToCollection: (collectionId: string, colors: string[]) => void;
  onCreateProject?: (project: ProjectWorkspace) => void;
  onCreateCollection?: (collection: CollectionBoard) => void;
  showToast?: (msg: string) => void;
}

function buildNewProjectWorkspace(
  name: string,
  client: string,
  desc: string,
  slot: ProjectSlot,
  colors: string[],
  paletteName: string
): ProjectWorkspace {
  return {
    id: `proj-${Date.now()}`,
    name: name.trim(),
    clientOrBrand: client.trim() || 'Uso Interno',
    description: desc.trim() || 'Design system com cores selecionadas dos favoritos.',
    primaryColors: slot === 'primary' ? colors : ['#08BBD9'],
    secondaryColors: slot === 'secondary' ? colors : ['#3B82F6'],
    neutralGrays: slot === 'neutral' ? colors : ['#0B0F17', '#181C24', '#FFFFFF'],
    palettes: slot === 'palette' ? [
      {
        id: `pal-${Date.now()}`,
        name: paletteName || 'Paleta de Cores Favoritas',
        description: 'Paleta criada a partir de amostras favoritas.',
        colors: colors,
        role: 'Acentos',
        createdAt: 'Hoje',
        wcagLevel: 'WCAG AAA'
      }
    ] : [],
    semanticTokens: {
      primary: colors[0] || '#08BBD9',
      secondary: colors[1] || '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      surface: '#181C24',
      background: '#0B0F17'
    },
    updatedAt: 'Agora'
  };
}

export const AddFavoriteToTargetModal: React.FC<AddFavoriteToTargetModalProps> = ({
  isOpen,
  onClose,
  selectedColors,
  projects,
  collections,
  onAddColorsToProject,
  onAddColorsToCollection,
  onCreateProject,
  onCreateCollection,
  showToast
}) => {
  const [destType, setDestType] = useState<'project' | 'collection'>('project');

  // Project selection state
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '__new_project__');
  const [projectSlot, setProjectSlot] = useState<ProjectSlot>('primary');
  const [newPaletteName, setNewPaletteName] = useState<string>('Paleta de Cores Favoritas');

  // New Project Form state
  const [newProjName, setNewProjName] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  // Collection selection state
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collections[0]?.id || '__new_collection__');

  // New Collection Form state
  const [newColTitle, setNewColTitle] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColTags, setNewColTags] = useState('Favoritas, Moodboard');

  if (!isOpen || selectedColors.length === 0) return null;

  const handleProjectSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedProjectId === '__new_project__') {
      if (!newProjName.trim()) return;
      const createdProj = buildNewProjectWorkspace(
        newProjName,
        newProjClient,
        newProjDesc,
        projectSlot,
        selectedColors,
        newPaletteName
      );

      if (onCreateProject) {
        onCreateProject(createdProj);
      } else {
        onAddColorsToProject(createdProj.id, projectSlot, selectedColors, newPaletteName);
      }
      showToast?.(`${selectedColors.length} cor(es) adicionada(s) ao novo projeto "${createdProj.name}".`);
    } else {
      const targetProj = projects.find(p => p.id === selectedProjectId);
      onAddColorsToProject(selectedProjectId, projectSlot, selectedColors, newPaletteName);
      if (targetProj) {
        showToast?.(`${selectedColors.length} cor(es) adicionada(s) ao projeto "${targetProj.name}".`);
      }
    }

    onClose();
  };

  const handleCollectionSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedCollectionId === '__new_collection__') {
      if (!newColTitle.trim()) return;
      const createdCol: CollectionBoard = {
        id: `col-${Date.now()}`,
        title: newColTitle.trim(),
        description: newColDesc.trim() || 'Coleção temática criada com cores favoritas.',
        tags: newColTags.split(',').map(t => t.trim()).filter(Boolean),
        isPrivate: false,
        paletteIds: [],
        coverColors: selectedColors,
        createdAt: 'Hoje'
      };

      if (onCreateCollection) {
        onCreateCollection(createdCol);
      } else {
        onAddColorsToCollection(createdCol.id, selectedColors);
      }
      showToast?.(`${selectedColors.length} cor(es) adicionada(s) à nova coleção "${createdCol.title}".`);
    } else {
      const targetCol = collections.find(c => c.id === selectedCollectionId);
      onAddColorsToCollection(selectedCollectionId, selectedColors);
      if (targetCol) {
        showToast?.(`${selectedColors.length} cor(es) adicionada(s) à coleção "${targetCol.title}".`);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#181C24] border border-white/[0.12] rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20">
              <FolderPlus className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white font-['Geist'] tracking-tight">
                Adicionar Cores Favoritas
              </h3>
              <p className="text-xs text-[#94A3B8]">
                {selectedColors.length} cor(es) selecionada(s) para inclusão.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Swatches Preview */}
        <div className="p-3 bg-[#111827] rounded-xl border border-white/[0.06]">
          <span className="text-[11px] font-mono text-[#94A3B8] uppercase block mb-2 font-semibold">
            Amostras a serem adicionadas:
          </span>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
            {selectedColors.map((hex, i) => (
              <div
                key={`${hex}-${i}`}
                className="flex items-center gap-1.5 px-2 py-1 bg-[#181C24] border border-white/10 rounded-md text-xs font-mono text-white shadow-sm"
              >
                <div
                  className="w-3.5 h-3.5 rounded-sm border border-white/20"
                  style={{ backgroundColor: hex }}
                />
                <span>{hex}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Destination Type Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-[#111827] p-1 rounded-xl border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setDestType('project')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              destType === 'project'
                ? 'bg-[#6366F1] text-white shadow-md'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Projeto / Design System</span>
          </button>

          <button
            type="button"
            onClick={() => setDestType('collection')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              destType === 'collection'
                ? 'bg-[#06B6D4] text-black shadow-md font-bold'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Coleção / Moodboard</span>
          </button>
        </div>

        {/* Form: Add to Project */}
        {destType === 'project' && (
          <form onSubmit={handleProjectSubmit} className="space-y-4">
            <div>
              <label htmlFor="target-project-select" className="text-xs font-mono text-[#94A3B8] block mb-1">
                Selecione o Projeto de Destino:
              </label>
              <select
                id="target-project-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.clientOrBrand})
                  </option>
                ))}
                <option value="__new_project__" className="text-[#06B6D4] font-semibold">
                  + Criar Novo Projeto...
                </option>
              </select>
            </div>

            {selectedProjectId !== '__new_project__' ? (
              <div className="space-y-3">
                <div>
                  <label htmlFor="project-slot-select" className="text-xs font-mono text-[#94A3B8] block mb-1">
                    Local de Destino no Projeto:
                  </label>
                  <select
                    id="project-slot-select"
                    value={projectSlot}
                    onChange={(e) => setProjectSlot(e.target.value as any)}
                    className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                  >
                    <option value="primary">Tokens Primários de Marca (primaryColors)</option>
                    <option value="secondary">Tokens Secundários (secondaryColors)</option>
                    <option value="neutral">Superfícies e Escala Neutra (neutralGrays)</option>
                    <option value="palette">Criar Nova Paleta no Projeto</option>
                  </select>
                </div>

                {projectSlot === 'palette' && (
                  <div>
                    <label htmlFor="new-palette-name-input" className="text-xs font-mono text-[#94A3B8] block mb-1">
                      Nome da Nova Paleta:
                    </label>
                    <input
                      id="new-palette-name-input"
                      type="text"
                      required
                      placeholder="Ex: Paleta de Cores Destaque"
                      value={newPaletteName}
                      onChange={(e) => setNewPaletteName(e.target.value)}
                      className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                    />
                  </div>
                )}
              </div>
            ) : (
              /* New Project Inline Form */
              <div className="space-y-3 bg-[#111827] p-3.5 rounded-xl border border-white/[0.06]">
                <div className="text-xs font-mono text-[#06B6D4] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Dados do Novo Projeto</span>
                </div>

                <div>
                  <label htmlFor="inline-new-proj-name" className="text-[11px] font-mono text-[#94A3B8] block mb-1">Nome do Projeto:</label>
                  <input
                    id="inline-new-proj-name"
                    type="text"
                    required
                    placeholder="Ex: Novo Sistema Neon"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    className="w-full bg-[#181C24] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="inline-new-proj-client" className="text-[11px] font-mono text-[#94A3B8] block mb-1">Cliente / Marca:</label>
                    <input
                      id="inline-new-proj-client"
                      type="text"
                      placeholder="Ex: Marca X"
                      value={newProjClient}
                      onChange={(e) => setNewProjClient(e.target.value)}
                      className="w-full bg-[#181C24] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                    />
                  </div>
                  <div>
                    <label htmlFor="inline-proj-slot" className="text-[11px] font-mono text-[#94A3B8] block mb-1">Posição Inicial:</label>
                    <select
                      id="inline-proj-slot"
                      value={projectSlot}
                      onChange={(e) => setProjectSlot(e.target.value as any)}
                      className="w-full bg-[#181C24] border border-white/[0.1] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                    >
                      <option value="primary">Cores Primárias</option>
                      <option value="secondary">Cores Secundárias</option>
                      <option value="neutral">Escala Neutra</option>
                      <option value="palette">Paleta Completa</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="inline-new-proj-desc" className="text-[11px] font-mono text-[#94A3B8] block mb-1">Descrição:</label>
                  <input
                    id="inline-new-proj-desc"
                    type="text"
                    placeholder="Ex: Sistema com tokens de cores primárias"
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    className="w-full bg-[#181C24] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Adicionar ao Projeto</span>
              </button>
            </div>
          </form>
        )}

        {/* Form: Add to Collection */}
        {destType === 'collection' && (
          <form onSubmit={handleCollectionSubmit} className="space-y-4">
            <div>
              <label htmlFor="target-collection-select" className="text-xs font-mono text-[#94A3B8] block mb-1">
                Selecione a Coleção de Destino:
              </label>
              <select
                id="target-collection-select"
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
                className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
              >
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.isPrivate ? 'Privada' : 'Pública'})
                  </option>
                ))}
                <option value="__new_collection__" className="text-[#06B6D4] font-semibold">
                  + Criar Nova Coleção...
                </option>
              </select>
            </div>

            {selectedCollectionId === '__new_collection__' && (
              /* New Collection Inline Form */
              <div className="space-y-3 bg-[#111827] p-3.5 rounded-xl border border-white/[0.06]">
                <div className="text-xs font-mono text-[#06B6D4] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Dados da Nova Coleção</span>
                </div>

                <div>
                  <label htmlFor="inline-new-col-title" className="text-[11px] font-mono text-[#94A3B8] block mb-1">Título da Coleção:</label>
                  <input
                    id="inline-new-col-title"
                    type="text"
                    required
                    placeholder="Ex: Minhas Amostras Favoritas"
                    value={newColTitle}
                    onChange={(e) => setNewColTitle(e.target.value)}
                    className="w-full bg-[#181C24] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="inline-new-col-desc" className="text-[11px] font-mono text-[#94A3B8] block mb-1">Descrição Breve:</label>
                    <input
                      id="inline-new-col-desc"
                      type="text"
                      placeholder="Ex: Moodboard principal"
                      value={newColDesc}
                      onChange={(e) => setNewColDesc(e.target.value)}
                      className="w-full bg-[#181C24] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
                    />
                  </div>
                  <div>
                    <label htmlFor="inline-new-col-tags" className="text-[11px] font-mono text-[#94A3B8] block mb-1">Tags (separadas por vírgula):</label>
                    <input
                      id="inline-new-col-tags"
                      type="text"
                      placeholder="Favoritas, Moodboard"
                      value={newColTags}
                      onChange={(e) => setNewColTags(e.target.value)}
                      className="w-full bg-[#181C24] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#06B6D4] hover:bg-[#08BBD9] text-black text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Adicionar à Coleção</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
