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
  FolderPlus, 
  Tag, 
  FileText,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { ProjectWorkspace, ProjectPalette, CollectionBoard, VaultPalette } from '../types';
import { getColorDetails } from '../utils/colorUtils';

interface SavePaletteModalProps {
  isOpen: boolean;
  colors: string[];
  initialTitle?: string;
  projects: ProjectWorkspace[];
  collections: CollectionBoard[];
  onClose: () => void;
  onSaveToVault: (vaultPalette: VaultPalette) => void;
  onSaveToProject: (projectId: string, projectPalette: ProjectPalette) => void;
  onCreateProjectWithPalette?: (newProject: ProjectWorkspace) => void;
  onSaveToCollection: (collectionId: string, colors: string[]) => void;
}

export const SavePaletteModal: React.FC<SavePaletteModalProps> = ({
  isOpen,
  colors,
  initialTitle = 'Nova Paleta Harmônica',
  projects,
  collections,
  onClose,
  onSaveToVault,
  onSaveToProject,
  onCreateProjectWithPalette,
  onSaveToCollection
}) => {
  const [saveTarget, setSaveTarget] = useState<'vault' | 'project' | 'collection'>('vault');

  // Vault form state
  const [vaultTitle, setVaultTitle] = useState(initialTitle);
  const [vaultDesc, setVaultDesc] = useState('Paleta completa salva com calibração perceptual.');
  const [vaultTags, setVaultTags] = useState('UI Tokens, Dark Mode, Oklch');
  const [vaultNotes, setVaultNotes] = useState('Uso recomendado em superfícies e estados de interação primária.');
  const [vaultGamut, setVaultGamut] = useState('Display P3');

  // Project form state
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [paletteNameInProject, setPaletteNameInProject] = useState(initialTitle);
  const [paletteRoleInProject, setPaletteRoleInProject] = useState<'Primária' | 'Secundária' | 'Acentos' | 'UI / Superfícies' | 'Semântica' | 'Dark Mode'>('Primária');
  const [paletteDescInProject, setPaletteDescInProject] = useState('');
  const [isCreatingNewProject, setIsCreatingNewProject] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  // Collection form state
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collections[0]?.id || '');

  // Reset title whenever opened with new initialTitle or colors
  useEffect(() => {
    if (isOpen) {
      setVaultTitle(initialTitle || 'Nova Paleta Harmônica');
      setPaletteNameInProject(initialTitle || 'Nova Paleta Harmônica');
      if (projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projects[0].id);
      }
      if (collections.length > 0 && !selectedCollectionId) {
        setSelectedCollectionId(collections[0].id);
      }
    }
  }, [isOpen, initialTitle, projects, collections, selectedProjectId, selectedCollectionId]);

  if (!isOpen) return null;

  const handleVaultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultTitle.trim()) return;

    const newVaultPalette: VaultPalette = {
      id: `vault-${Date.now()}`,
      title: vaultTitle.trim(),
      description: vaultDesc.trim(),
      colors: [...colors],
      tags: vaultTags.split(',').map(t => t.trim()).filter(Boolean),
      notes: vaultNotes.trim(),
      gamut: vaultGamut,
      wcagLevel: 'WCAG AAA (12.4:1)',
      createdAt: 'Agora'
    };

    onSaveToVault(newVaultPalette);
    onClose();
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isCreatingNewProject) {
      if (!newProjName.trim()) return;
      if (onCreateProjectWithPalette) {
        const newProj: ProjectWorkspace = {
          id: `proj-${Date.now()}`,
          name: newProjName.trim(),
          clientOrBrand: newProjClient.trim() || 'Interno',
          description: newProjDesc.trim() || 'Design System cromático.',
          primaryColors: colors.slice(0, 3),
          secondaryColors: colors.slice(3, 5).length > 0 ? colors.slice(3, 5) : ['#10B981', '#F59E0B'],
          neutralGrays: ['#0B0F17', '#181C24', '#262A33', '#94A3B8', '#F8FAFC'],
          palettes: [
            {
              id: `pal-${Date.now()}`,
              name: paletteNameInProject.trim() || newProjName.trim(),
              description: paletteDescInProject.trim() || 'Paleta base do projeto.',
              colors: [...colors],
              role: paletteRoleInProject,
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
        onCreateProjectWithPalette(newProj);
      }
    } else {
      if (!selectedProjectId) return;
      const newProjPalette: ProjectPalette = {
        id: `pal-${Date.now()}`,
        name: paletteNameInProject.trim() || 'Paleta do Projeto',
        description: paletteDescInProject.trim() || 'Paleta adicionada ao workspace.',
        colors: [...colors],
        role: paletteRoleInProject,
        createdAt: 'Agora',
        wcagLevel: 'WCAG AAA'
      };
      onSaveToProject(selectedProjectId, newProjPalette);
    }

    onClose();
  };

  const handleCollectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollectionId) return;
    onSaveToCollection(selectedCollectionId, colors);
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
            {colors.map((hex, idx) => (
              <div 
                key={idx} 
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
            className={`py-3 px-3 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              saveTarget === 'vault'
                ? 'border-amber-400 text-white font-semibold bg-white/[0.03]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Cofre Privado</span>
          </button>

          <button
            type="button"
            onClick={() => setSaveTarget('project')}
            className={`py-3 px-3 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              saveTarget === 'project'
                ? 'border-[#6366F1] text-white font-semibold bg-white/[0.03]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#6366F1]" />
            <span>Projeto / Sistema</span>
          </button>

          <button
            type="button"
            onClick={() => setSaveTarget('collection')}
            className={`py-3 px-3 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              saveTarget === 'collection'
                ? 'border-[#06B6D4] text-white font-semibold bg-white/[0.03]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Coleção</span>
          </button>
        </div>

        {/* Modal Body Forms */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: COFRE PRIVADO (VAULT) */}
          {saveTarget === 'vault' && (
            <form id="vault-form" onSubmit={handleVaultSubmit} className="space-y-4">
              <div className="p-3.5 bg-amber-950/20 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  As paletas do Cofre Privado são salvas com criptografia local e sincronização restrita à sua conta de criador.
                </span>
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">
                  Título da Paleta no Cofre:
                </label>
                <input
                  type="text"
                  required
                  value={vaultTitle}
                  onChange={(e) => setVaultTitle(e.target.value)}
                  placeholder="Ex: Obsidian Quantum High Contrast"
                  className="w-full bg-[#0D111A] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">
                  Descrição & Objetivo:
                </label>
                <input
                  type="text"
                  value={vaultDesc}
                  onChange={(e) => setVaultDesc(e.target.value)}
                  placeholder="Ex: Paleta para interfaces críticas e dashboards de IA"
                  className="w-full bg-[#0D111A] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">
                    Tags (separadas por vírgula):
                  </label>
                  <input
                    type="text"
                    value={vaultTags}
                    onChange={(e) => setVaultTags(e.target.value)}
                    placeholder="Dark Mode, Oklch, UI"
                    className="w-full bg-[#0D111A] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">
                    Espaço / Gamut Padrão:
                  </label>
                  <select
                    value={vaultGamut}
                    onChange={(e) => setVaultGamut(e.target.value)}
                    className="w-full bg-[#0D111A] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Display P3">Display P3 (Apple & OLED)</option>
                    <option value="sRGB">sRGB Padrão Web</option>
                    <option value="Rec.2020">Rec.2020 Ultra Wide</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">
                  Notas Técnicas de Aplicação:
                </label>
                <textarea
                  rows={2}
                  value={vaultNotes}
                  onChange={(e) => setVaultNotes(e.target.value)}
                  placeholder="Ex: Utilizar a primeira cor como background e a quarta como foco interativo."
                  className="w-full bg-[#0D111A] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </form>
          )}

          {/* TAB 2: PROJETO DE DESIGN SYSTEM */}
          {saveTarget === 'project' && (
            <form id="project-form" onSubmit={handleProjectSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-semibold text-white">Opção de Armazenamento:</span>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewProject(!isCreatingNewProject)}
                  className="text-xs text-[#6366F1] hover:text-[#5254E0] font-mono flex items-center gap-1 cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>{isCreatingNewProject ? 'Escolher Projeto Existente' : '+ Criar Novo Projeto'}</span>
                </button>
              </div>

              {!isCreatingNewProject ? (
                <>
                  <div>
                    <label className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">
                      Selecione o Projeto de Destino:
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full bg-[#0D111A] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.clientOrBrand})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">
                      Nome da Paleta no Projeto:
                    </label>
                    <input
                      type="text"
                      required
                      value={paletteNameInProject}
                      onChange={(e) => setPaletteNameInProject(e.target.value)}
                      placeholder="Ex: Paleta Primária de Componentes"
                      className="w-full bg-[#0D111A] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">
                        Função no Design System:
                      </label>
                      <select
                        value={paletteRoleInProject}
                        onChange={(e) => setPaletteRoleInProject(e.target.value as any)}
                        className="w-full bg-[#0D111A] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
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
                      <label className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">
                        Descrição Breve:
                      </label>
                      <input
                        type="text"
                        value={paletteDescInProject}
                        onChange={(e) => setPaletteDescInProject(e.target.value)}
                        placeholder="Ex: Escala para cards e menus"
                        className="w-full bg-[#0D111A] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3 bg-[#0D111A] p-4 rounded-xl border border-white/[0.06]">
                  <div>
                    <label className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">
                      Nome do Novo Projeto:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Fintech Alpha Mobile 2.0"
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      className="w-full bg-[#181C26] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">
                      Cliente ou Marca:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Alpha Corp"
                      value={newProjClient}
                      onChange={(e) => setNewProjClient(e.target.value)}
                      className="w-full bg-[#181C26] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">
                      Descrição do Projeto:
                    </label>
                    <textarea
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
          )}

          {/* TAB 3: COLEÇÃO / MOODBOARD */}
          {saveTarget === 'collection' && (
            <form id="collection-form" onSubmit={handleCollectionSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">
                  Selecione a Coleção:
                </label>
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="w-full bg-[#0D111A] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
                >
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title} ({col.isPrivate ? 'Privada' : 'Pública'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-[#0D111A] rounded-xl border border-white/[0.04] text-xs text-[#94A3B8]">
                A paleta completa será salva como paleta de destaque nesta coleção e ficará acessível no seu perfil e na aba Coleções.
              </div>
            </form>
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
            form={
              saveTarget === 'vault' 
                ? 'vault-form' 
                : saveTarget === 'project' 
                ? 'project-form' 
                : 'collection-form'
            }
            className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
              saveTarget === 'vault'
                ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-500/20'
                : saveTarget === 'project'
                ? 'bg-[#6366F1] hover:bg-[#5254E0] text-white shadow-indigo-600/30'
                : 'bg-[#06B6D4] hover:bg-[#08BBD9] text-black shadow-cyan-500/20'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>
              {saveTarget === 'vault' 
                ? 'Salvar no Cofre Privado' 
                : saveTarget === 'project' 
                ? (isCreatingNewProject ? 'Criar Projeto com Paleta' : 'Salvar no Projeto')
                : 'Salvar na Coleção'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
