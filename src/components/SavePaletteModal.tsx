import React, { useState, useEffect } from 'react';
import {
  Lock,
  Layers,
  Bookmark,
  Check,
  X,
  Sparkles,
  Plus,
  ShieldCheck,
  FolderPlus
} from 'lucide-react';
import { ProjectWorkspace, ProjectPalette, CollectionBoard, VaultPalette } from '../types';

type PaletteRole = 'Primária' | 'Secundária' | 'Acentos' | 'UI / Superfícies' | 'Semântica' | 'Dark Mode';

type SaveTarget = 'vault' | 'project' | 'collection';

interface SavePaletteModalProps {
  isOpen: boolean;
  colors: string[];
  initialTitle?: string;
  projects?: ProjectWorkspace[];
  collections?: CollectionBoard[];
  onClose: () => void;
  onSaveToVault: (vaultPalette: VaultPalette) => void;
  onSaveToProject: (projectId: string, projectPalette: ProjectPalette) => void;
  onCreateProjectWithPalette?: (newProject: ProjectWorkspace) => void;
  onSaveToCollection: (collectionId: string, colors: string[]) => void;
  onCreateCollection?: (newCollection: CollectionBoard) => void;
}

const DEFAULT_TITLE = 'Nova Paleta Harmônica';

const parseTags = (value: string): string[] =>
  value.split(',').map(t => t.trim()).filter(Boolean);

const buildVaultPalette = (
  title: string,
  description: string,
  tags: string,
  notes: string,
  gamut: string,
  colors: string[]
): VaultPalette => ({
  id: `vault-${Date.now()}`,
  title: title.trim(),
  description: description.trim(),
  colors: [...colors],
  tags: parseTags(tags),
  notes: notes.trim(),
  gamut,
  wcagLevel: 'WCAG AAA (12.4:1)',
  createdAt: 'Agora'
});

const buildProjectPalette = (
  name: string,
  description: string,
  role: PaletteRole,
  colors: string[]
): ProjectPalette => ({
  id: `pal-${Date.now()}`,
  name: name.trim() || 'Paleta do Projeto',
  description: description.trim() || 'Paleta adicionada ao workspace.',
  colors: [...colors],
  role,
  createdAt: 'Agora',
  wcagLevel: 'WCAG AAA'
});

const buildNewProject = (
  name: string,
  client: string,
  description: string,
  paletteName: string,
  paletteDescription: string,
  role: PaletteRole,
  colors: string[]
): ProjectWorkspace => {
  const secondary = colors.slice(3, 5);
  return {
    id: `proj-${Date.now()}`,
    name: name.trim(),
    clientOrBrand: client.trim() || 'Interno',
    description: description.trim() || 'Design System cromático.',
    primaryColors: colors.slice(0, 3),
    secondaryColors: secondary.length > 0 ? secondary : ['#10B981', '#F59E0B'],
    neutralGrays: ['#0B0F17', '#181C24', '#262A33', '#94A3B8', '#F8FAFC'],
    palettes: [
      {
        id: `pal-${Date.now()}`,
        name: paletteName.trim() || name.trim(),
        description: paletteDescription.trim() || 'Paleta base do projeto.',
        colors: [...colors],
        role,
        createdAt: 'Hoje',
        wcagLevel: 'WCAG AAA'
      }
    ],
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
};

const buildNewCollection = (
  title: string,
  description: string,
  tags: string,
  isPrivate: boolean,
  colors: string[]
): CollectionBoard => ({
  id: `col-${Date.now()}`,
  title: title.trim(),
  description: description.trim() || 'Coleção temática de paletas curadas.',
  tags: parseTags(tags),
  isPrivate,
  paletteIds: [],
  coverColors: [...colors],
  createdAt: 'Hoje'
});

const getSubmitFormId = (target: SaveTarget): string => {
  if (target === 'vault') return 'vault-form';
  if (target === 'project') return 'project-form';
  return 'collection-form';
};

const getSubmitButtonClass = (target: SaveTarget): string => {
  if (target === 'vault') return 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-500/20';
  if (target === 'project') return 'bg-[#6366F1] hover:bg-[#5254E0] text-white shadow-indigo-600/30';
  return 'bg-[#06B6D4] hover:bg-[#08BBD9] text-black shadow-cyan-500/20';
};

const getSubmitLabel = (
  target: SaveTarget,
  isCreatingNewProject: boolean,
  isCreatingNewCollection: boolean
): string => {
  if (target === 'vault') return 'Salvar no Cofre Privado';
  if (target === 'project') {
    return isCreatingNewProject ? 'Criar Projeto com Paleta' : 'Salvar no Projeto';
  }
  return isCreatingNewCollection ? 'Criar Coleção com Paleta' : 'Salvar na Coleção';
};

const getTabClass = (isActive: boolean, activeBorder: string): string =>
  `py-3 px-3 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${isActive
    ? `${activeBorder} text-white font-semibold bg-white/[0.03]`
    : 'border-transparent text-[#94A3B8] hover:text-white'
  }`;

const inputClass = (focusBorder: string): string =>
  `w-full bg-[#0D111A] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none ${focusBorder}`;

const labelClass = 'text-xs font-mono uppercase text-[#94A3B8] block mb-1';

interface VaultFormProps {
  colors: string[];
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
}

const VaultForm: React.FC<VaultFormProps> = ({ colors, onSubmit }) => {
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [desc, setDesc] = useState('Paleta completa salva com calibração perceptual.');
  const [tags, setTags] = useState('UI Tokens, Dark Mode, Oklch');
  const [notes, setNotes] = useState('Uso recomendado em superfícies e estados de interação primária.');
  const [gamut, setGamut] = useState('Display P3');

  useEffect(() => {
    setTitle(DEFAULT_TITLE);
  }, [colors]);

  return (
    <form id="vault-form" onSubmit={onSubmit} className="space-y-4">
      <div className="p-3.5 bg-amber-950/20 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          As paletas do Cofre Privado são salvas com criptografia local e sincronização restrita à sua conta de criador.
        </span>
      </div>

      <div>
        <label htmlFor="vault-title" className={labelClass}>
          Título da Paleta no Cofre:
        </label>
        <input
          id="vault-title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Obsidian Quantum High Contrast"
          className={inputClass('focus:border-amber-400')}
        />
      </div>

      <div>
        <label htmlFor="vault-desc" className={labelClass}>
          Descrição & Objetivo:
        </label>
        <input
          id="vault-desc"
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Ex: Paleta para interfaces críticas e dashboards de IA"
          className={inputClass('focus:border-amber-400')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="vault-tags" className={labelClass}>
            Tags (separadas por vírgula):
          </label>
          <input
            id="vault-tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Dark Mode, Oklch, UI"
            className={inputClass('focus:border-amber-400')}
          />
        </div>

        <div>
          <label htmlFor="vault-gamut" className={labelClass}>
            Espaço / Gamut Padrão:
          </label>
          <select
            id="vault-gamut"
            value={gamut}
            onChange={(e) => setGamut(e.target.value)}
            className={inputClass('focus:border-amber-400')}
          >
            <option value="Display P3">Display P3 (Apple & OLED)</option>
            <option value="sRGB">sRGB Padrão Web</option>
            <option value="Rec.2020">Rec.2020 Ultra Wide</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="vault-notes" className={labelClass}>
          Notas Técnicas de Aplicação:
        </label>
        <textarea
          id="vault-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Utilizar a primeira cor como background e a quarta como foco interativo."
          className={inputClass('focus:border-amber-400')}
        />
      </div>
    </form>
  );
};

interface ProjectFormProps {
  projects: ProjectWorkspace[];
  colors: string[];
  initialTitle: string;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ projects, colors, initialTitle, onSubmit }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [paletteName, setPaletteName] = useState(initialTitle);
  const [paletteRole, setPaletteRole] = useState<PaletteRole>('Primária');
  const [paletteDesc, setPaletteDesc] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  useEffect(() => {
    setPaletteName(initialTitle);
  }, [initialTitle, colors]);

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  return (
    <form id="project-form" onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
        <span className="text-xs font-semibold text-white">Opção de Armazenamento:</span>
        <button
          type="button"
          onClick={() => setIsCreatingNew(!isCreatingNew)}
          className="text-xs text-[#6366F1] hover:text-[#5254E0] font-mono flex items-center gap-1 cursor-pointer"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>{isCreatingNew ? 'Escolher Projeto Existente' : '+ Criar Novo Projeto'}</span>
        </button>
      </div>

      {!isCreatingNew ? (
        <>
          <div>
            <label htmlFor="project-select" className={labelClass}>
              Selecione o Projeto de Destino:
            </label>
            <select
              id="project-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className={inputClass('focus:border-[#6366F1]')}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.clientOrBrand})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="project-palette-name" className={labelClass}>
              Nome da Paleta no Projeto:
            </label>
            <input
              id="project-palette-name"
              type="text"
              required
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              placeholder="Ex: Paleta Primária de Componentes"
              className={inputClass('focus:border-[#6366F1]')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="project-palette-role" className={labelClass}>
                Função no Design System:
              </label>
              <select
                id="project-palette-role"
                value={paletteRole}
                onChange={(e) => setPaletteRole(e.target.value as PaletteRole)}
                className={inputClass('focus:border-[#6366F1]')}
              >
                <option value="Primária">Paleta Primária</option>
                <option value="Secundária">Paleta Secundária</option>
                <option value="Acentos">Acentos & Highlights</option>
                <option value="UI / Superfícies">UI & Superfícies</option>
                <option value="Semântica">Semântica (Feedback)</option>
                <option value="Dark Mode">Modo Escuro (Dark Mode)</option>
              </select>
            </div>

            <div>
              <label htmlFor="project-palette-desc" className={labelClass}>
                Descrição Breve:
              </label>
              <input
                id="project-palette-desc"
                type="text"
                value={paletteDesc}
                onChange={(e) => setPaletteDesc(e.target.value)}
                placeholder="Ex: Escala para cards e menus"
                className={inputClass('focus:border-[#6366F1]')}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3 bg-[#0D111A] p-4 rounded-xl border border-white/[0.06]">
          <div>
            <label htmlFor="new-project-name" className={labelClass}>
              Nome do Novo Projeto:
            </label>
            <input
              id="new-project-name"
              type="text"
              required
              placeholder="Ex: Fintech Alpha Mobile 2.0"
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              className="w-full bg-[#181C26] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
            />
          </div>

          <div>
            <label htmlFor="new-project-client" className={labelClass}>
              Cliente ou Marca:
            </label>
            <input
              id="new-project-client"
              type="text"
              placeholder="Ex: Alpha Corp"
              value={newProjClient}
              onChange={(e) => setNewProjClient(e.target.value)}
              className="w-full bg-[#181C26] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
            />
          </div>

          <div>
            <label htmlFor="new-project-desc" className={labelClass}>
              Descrição do Projeto:
            </label>
            <textarea
              id="new-project-desc"
              rows={2}
              placeholder="Diretrizes do design system e tokens..."
              value={newProjDesc}
              onChange={(e) => setNewProjDesc(e.target.value)}
              className="w-full bg-[#181C26] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
            />
          </div>
        </div>
      )}
    </form>
  );
};

interface CollectionFormProps {
  collections: CollectionBoard[];
  colors: string[];
  initialTitle: string;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
}

const CollectionForm: React.FC<CollectionFormProps> = ({ collections, colors, initialTitle, onSubmit }) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collections[0]?.id || '');
  const [isCreatingNew, setIsCreatingNew] = useState(collections.length === 0);
  const [newColTitle, setNewColTitle] = useState(initialTitle || 'Nova Coleção');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColTags, setNewColTags] = useState('Design System, UI Tokens');
  const [newColPrivate, setNewColPrivate] = useState(false);

  useEffect(() => {
    setNewColTitle(initialTitle || 'Nova Coleção');
  }, [initialTitle, colors]);

  useEffect(() => {
    if (collections.length > 0 && !selectedCollectionId) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [collections, selectedCollectionId]);

  const handleSelectChange = (value: string) => {
    if (value === '__new_collection__') {
      setIsCreatingNew(true);
    } else {
      setSelectedCollectionId(value);
    }
  };

  return (
    <form id="collection-form" onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#94A3B8]">
          <Bookmark className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>Quadro de Coleção</span>
        </div>
        <button
          type="button"
          onClick={() => setIsCreatingNew(!isCreatingNew)}
          className="text-xs font-mono text-[#06B6D4] hover:text-[#08BBD9] flex items-center gap-1.5 cursor-pointer bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 border border-[#06B6D4]/30 px-2.5 py-1 rounded-lg transition-colors"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>{isCreatingNew ? 'Escolher Coleção Existente' : '+ Inserir Nova Coleção'}</span>
        </button>
      </div>

      {!isCreatingNew ? (
        <>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="collection-select" className={`${labelClass} mb-0`}>
                Selecione a Coleção:
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="text-[11px] text-[#06B6D4] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Nova coleção</span>
              </button>
            </div>
            <select
              id="collection-select"
              value={selectedCollectionId}
              onChange={(e) => handleSelectChange(e.target.value)}
              className={inputClass('focus:border-[#06B6D4]')}
            >
              {collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title} ({col.isPrivate ? 'Privada' : 'Pública'})
                </option>
              ))}
              <option value="__new_collection__" className="text-[#06B6D4] font-semibold bg-[#181C26]">
                + Inserir Nova Coleção...
              </option>
            </select>
          </div>

          <div className="p-3 bg-[#0D111A] rounded-xl border border-white/[0.04] text-xs text-[#94A3B8] flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#06B6D4] shrink-0 mt-0.5" />
            <span>
              A paleta completa será salva como paleta de destaque nesta coleção e ficará acessível no seu perfil e na aba Coleções.
            </span>
          </div>
        </>
      ) : (
        <div className="space-y-3 bg-[#0D111A] p-4 rounded-xl border border-white/[0.06]">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
              <span className="text-xs font-mono font-semibold text-white uppercase">Dados da Nova Coleção</span>
            </div>
            {collections.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="text-[11px] text-[#94A3B8] hover:text-white underline cursor-pointer"
              >
                Cancelar e selecionar existente
              </button>
            )}
          </div>

          <div>
            <label htmlFor="new-collection-title" className={labelClass}>
              Nome da Coleção: <span className="text-[#06B6D4]">*</span>
            </label>
            <input
              id="new-collection-title"
              type="text"
              required
              placeholder="Ex: Identidade Minimalista 2026"
              value={newColTitle}
              onChange={(e) => setNewColTitle(e.target.value)}
              className="w-full bg-[#181C26] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
            />
          </div>

          <div>
            <label htmlFor="new-collection-desc" className={labelClass}>
              Descrição / Conceito (opcional):
            </label>
            <textarea
              id="new-collection-desc"
              rows={2}
              placeholder="Ex: Curadoria temática de paletas calibradas para interfaces e design editorial..."
              value={newColDesc}
              onChange={(e) => setNewColDesc(e.target.value)}
              className="w-full bg-[#181C26] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
            />
          </div>

          <div>
            <label htmlFor="new-collection-tags" className={labelClass}>
              Tags (separadas por vírgula):
            </label>
            <input
              id="new-collection-tags"
              type="text"
              placeholder="Ex: UI Tokens, Cyberpunk, Editorial, Dark Mode"
              value={newColTags}
              onChange={(e) => setNewColTags(e.target.value)}
              className="w-full bg-[#181C26] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
            />
          </div>

          <fieldset className="pt-1">
            <legend className="text-xs font-mono uppercase text-[#94A3B8] block mb-1.5">
              Visibilidade da Coleção:
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewColPrivate(false)}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${!newColPrivate
                  ? 'bg-[#06B6D4]/10 border-[#06B6D4]/50 text-white'
                  : 'bg-[#181C26] border-white/[0.06] text-[#94A3B8] hover:text-white'
                  }`}
              >
                <span className="text-xs font-bold block">Pública</span>
                <span className="text-[10px] text-[#94A3B8] block">Visível no perfil comunitário</span>
              </button>

              <button
                type="button"
                onClick={() => setNewColPrivate(true)}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${newColPrivate
                  ? 'bg-amber-400/10 border-amber-400/50 text-white'
                  : 'bg-[#181C26] border-white/[0.06] text-[#94A3B8] hover:text-white'
                  }`}
              >
                <span className="text-xs font-bold block">Privada</span>
                <span className="text-[10px] text-[#94A3B8] block">Apenas você terá acesso</span>
              </button>
            </div>
          </fieldset>

          {/* Visual preview of palette colors applied to the collection */}
          <div className="pt-2 border-t border-white/[0.06]">
            <div className="text-[11px] font-mono text-[#94A3B8] mb-1.5 flex items-center justify-between">
              <span>Cores de capa da coleção:</span>
              <span>{colors.length} amostras</span>
            </div>
            <div className="h-6 w-full rounded-lg overflow-hidden flex border border-white/[0.1]">
              {colors.map((c) => (
                <div key={c} className="flex-1 h-full" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export const SavePaletteModal: React.FC<SavePaletteModalProps> = ({
  isOpen,
  colors,
  initialTitle = DEFAULT_TITLE,
  projects = [],
  collections = [],
  onClose,
  onSaveToVault,
  onSaveToProject,
  onCreateProjectWithPalette,
  onSaveToCollection,
  onCreateCollection
}) => {
  const safeProjects = projects || [];
  const safeCollections = collections || [];
  const [saveTarget, setSaveTarget] = useState<SaveTarget>('vault');

  if (!isOpen) return null;

  const handleVaultSubmit: React.SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem('vault-title') as HTMLInputElement | null)?.value ?? '';
    if (!title.trim()) return;

    const desc = (form.elements.namedItem('vault-desc') as HTMLInputElement | null)?.value ?? '';
    const tags = (form.elements.namedItem('vault-tags') as HTMLInputElement | null)?.value ?? '';
    const notes = (form.elements.namedItem('vault-notes') as HTMLTextAreaElement | null)?.value ?? '';
    const gamut = (form.elements.namedItem('vault-gamut') as HTMLSelectElement | null)?.value ?? 'Display P3';

    onSaveToVault(buildVaultPalette(title, desc, tags, notes, gamut, colors));
    onClose();
  };

  const handleProjectSubmit: React.SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const isCreatingNew = form.elements.namedItem('new-project-name') !== null;

    if (isCreatingNew) {
      const name = (form.elements.namedItem('new-project-name') as HTMLInputElement | null)?.value ?? '';
      if (!name.trim()) return;
      if (onCreateProjectWithPalette) {
        const client = (form.elements.namedItem('new-project-client') as HTMLInputElement | null)?.value ?? '';
        const desc = (form.elements.namedItem('new-project-desc') as HTMLTextAreaElement | null)?.value ?? '';
        onCreateProjectWithPalette(
          buildNewProject(name, client, desc, name, desc, 'Primária', colors)
        );
      }
    } else {
      const projectId = (form.elements.namedItem('project-select') as HTMLSelectElement | null)?.value ?? '';
      if (!projectId) return;
      const paletteName = (form.elements.namedItem('project-palette-name') as HTMLInputElement | null)?.value ?? '';
      const paletteRole = (form.elements.namedItem('project-palette-role') as HTMLSelectElement | null)?.value as PaletteRole | undefined;
      const paletteDesc = (form.elements.namedItem('project-palette-desc') as HTMLInputElement | null)?.value ?? '';
      onSaveToProject(
        projectId,
        buildProjectPalette(paletteName, paletteDesc, paletteRole ?? 'Primária', colors)
      );
    }

    onClose();
  };

  const handleCollectionSubmit: React.SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const isCreatingNew = form.elements.namedItem('new-collection-title') !== null;

    if (isCreatingNew) {
      const title = (form.elements.namedItem('new-collection-title') as HTMLInputElement | null)?.value ?? '';
      if (!title.trim()) return;
      const desc = (form.elements.namedItem('new-collection-desc') as HTMLTextAreaElement | null)?.value ?? '';
      const tags = (form.elements.namedItem('new-collection-tags') as HTMLInputElement | null)?.value ?? '';
      const newCol = buildNewCollection(title, desc, tags, false, colors);
      if (onCreateCollection) {
        onCreateCollection(newCol);
      } else {
        onSaveToCollection(newCol.id, colors);
      }
    } else {
      const collectionId = (form.elements.namedItem('collection-select') as HTMLSelectElement | null)?.value ?? '';
      if (!collectionId) return;
      onSaveToCollection(collectionId, colors);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#141822] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#181C26]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6366F1]/20 border border-[#6366F1]/40 text-[#6366F1] flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Geist']">
                Salvar Paleta Completa
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Salve todas as {colors.length} cores no seu cofre privado, projeto ou coleção
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Palette Preview Strip */}
        <div className="p-5 bg-[#0D111A] border-b border-white/[0.06]">
          <div className="text-[11px] font-mono text-[#94A3B8] mb-2 flex items-center justify-between">
            <span>Prévia das {colors.length} Cores da Paleta</span>
            <span className="text-emerald-400 font-semibold">100% Calibrada</span>
          </div>

          <div className="h-14 rounded-xl overflow-hidden flex border border-white/10 shadow-lg">
            {colors.map((hex) => (
              <div
                key={hex}
                className="flex-1 h-full flex flex-col items-center justify-center relative group"
                style={{ backgroundColor: hex }}
              >
                <span className="text-[10px] font-mono font-bold px-1 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs opacity-90 group-hover:opacity-100 transition-opacity">
                  {hex}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Destination Target Tabs */}
        <div className="grid grid-cols-3 border-b border-white/[0.08] bg-[#111622]">
          <button
            type="button"
            onClick={() => setSaveTarget('vault')}
            className={getTabClass(saveTarget === 'vault', 'border-amber-400')}
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Cofre Privado</span>
          </button>

          <button
            type="button"
            onClick={() => setSaveTarget('project')}
            className={getTabClass(saveTarget === 'project', 'border-[#6366F1]')}
          >
            <Layers className="w-3.5 h-3.5 text-[#6366F1]" />
            <span>Projeto / Sistema</span>
          </button>

          <button
            type="button"
            onClick={() => setSaveTarget('collection')}
            className={getTabClass(saveTarget === 'collection', 'border-[#06B6D4]')}
          >
            <Bookmark className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Coleção</span>
          </button>
        </div>

        {/* Modal Body Forms */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {saveTarget === 'vault' && (
            <VaultForm colors={colors} onSubmit={handleVaultSubmit} />
          )}

          {saveTarget === 'project' && (
            <ProjectForm
              projects={safeProjects}
              colors={colors}
              initialTitle={initialTitle}
              onSubmit={handleProjectSubmit}
            />
          )}

          {saveTarget === 'collection' && (
            <CollectionForm
              collections={safeCollections}
              colors={colors}
              initialTitle={initialTitle}
              onSubmit={handleCollectionSubmit}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/[0.08] bg-[#181C26] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs text-[#94A3B8] hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form={getSubmitFormId(saveTarget)}
            className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${getSubmitButtonClass(saveTarget)}`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>
              {getSubmitLabel(saveTarget, false, safeCollections.length === 0)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
