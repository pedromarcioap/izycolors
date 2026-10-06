import { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { GeneratorView } from './components/GeneratorView';
import { ExplorerView } from './components/ExplorerView';
import { HarmonicWheelView } from './components/HarmonicWheelView';
import { ImageExtractorView } from './components/ImageExtractorView';
import { ColorSpaceLabView } from './components/ColorSpaceLabView';
import { AccessibilityView } from './components/AccessibilityView';
import { ProjectsVaultView } from './components/ProjectsVaultView';
import { CmsAdminView } from './components/CmsAdminView';
import { ProfileView } from './components/ProfileView';
import { UserAnalyticsDashboard } from './components/UserAnalyticsDashboard';
import { AdminAreaView } from './components/AdminAreaView';
import { AuthModal } from './components/AuthModal';
import { CommandPalette } from './components/CommandPalette';
import { ExportModal } from './components/ExportModal';
import { SubmitPaletteModal } from './components/SubmitPaletteModal';
import { SavePaletteModal } from './components/SavePaletteModal';
import { WorkflowDock } from './components/WorkflowDock';
import { AvatarEditorModal } from './components/AvatarEditorModal';
import { useAppHandlers } from './hooks/useAppHandlers';
import { useAppData } from './hooks/useAppData';

import {
  NavigationTab,
  StudioStage,
  ColorGamut,
  Palette,
  ProjectWorkspace,
  ProjectPalette,
  CollectionBoard,
  FavoriteColor,
  VaultPalette,
  CmsArticle,
  CommunitySubmission,
  UserProfile,
  CuratedDemoImage,
  AuthUser,
  UserRole,
  AuditLogItem,
  ColorFormat,
  NamingConvention,
  ProjectSlot
} from './types';

import { isSupabaseConfigured } from './services/supabase';
import { CreatorProfile, TaxonomyTag } from './services/db';

import {
  Menu,
  Download,
  Check,
  ShieldAlert,
  Sparkles,
  Eye,
  Disc3,
  SlidersHorizontal,
  Bookmark,
  AlertTriangle,
  Lock,
  LogIn
} from 'lucide-react';

const DEFAULT_PALETTE = ['#1A1A1A', '#2563EB', '#38BDF8', '#F1F5F9', '#FFFFFF'];

const STUDIO_STAGE_LABELS: Record<StudioStage, string> = {
  generate: 'Estúdio de Cores — Criar',
  refine: 'Estúdio de Cores — Refinar (Roda & Lab)',
  audit: 'Estúdio de Cores — Auditar WCAG',
  export: 'Estúdio de Cores — Salvar/Exportar'
};

const TAB_TITLES: Record<Exclude<NavigationTab, 'generator'>, string> = {
  projects: 'Cofre de Projetos & Coleções',
  explorer: 'Comunidade & Forks',
  admin: 'Painel Administrativo & Governança',
  user_dashboard: 'Área do Usuário & Criador',
  cms: 'CMS Editorial & Curadoria',
  profile: 'Perfil de Criador'
};

/** Abas liberadas para visitantes sem sessão. */
const PUBLIC_TABS: ReadonlySet<NavigationTab> = new Set<NavigationTab>(['generator', 'explorer']);

/** Papéis com acesso ao CMS Editorial e à curadoria de conteúdo. */
const CMS_ROLES: ReadonlySet<UserRole> = new Set<UserRole>(['admin', 'moderator', 'editor']);

/** Indica se o papel informado pode acessar o CMS Editorial. */
function canAccessCms(role: UserRole): boolean {
  return CMS_ROLES.has(role);
}

/**
 * Identidade visual usada APENAS para renderizar a interface enquanto o
 * visitante está deslogado. Não representa uma conta real e nunca é
 * persistida: qualquer ação que exija sessão abre o modal de autenticação.
 */
const ANONYMOUS_VIEWER: AuthUser = {
  id: '',
  email: '',
  name: 'Visitante',
  handle: '@visitante',
  role: 'user',
  avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=izycolors',
  bio: '',
  status: 'active',
  createdAt: '',
  lastLoginAt: '',
  palettesCount: 0,
  favoritesCount: 0,
  submissionsCount: 0
};

type GenerateInputMode = 'procedural' | 'image';
type RefineTool = 'wheel' | 'lab';

/**
 * Resolve a aba efetiva considerando as regras de RBAC (sessão + papel).
 * Extraído do componente para manter a complexidade cognitiva baixa.
 *
 * As três guardas são avaliadas nesta ordem sobre a aba recebida e a última
 * que casar prevalece — exatamente o efeito de chamar `setCurrentTab` em
 * sequência dentro do efeito (React aplica a última atualização do lote).
 */
function resolveGuardedTab(
  currentTab: NavigationTab,
  isSignedIn: boolean,
  role: UserRole
): NavigationTab {
  let resolvedTab = currentTab;
  if (!isSignedIn && !PUBLIC_TABS.has(currentTab)) resolvedTab = 'generator';
  if (currentTab === 'admin' && role !== 'admin') resolvedTab = 'profile';
  if (currentTab === 'cms' && !canAccessCms(role)) resolvedTab = 'profile';
  return resolvedTab;
}

/**
 * Normaliza as preferências de exportação persistidas no perfil do criador,
 * aplicando os padrões da aplicação para cada campo nunca salvo.
 */
function buildExportPreferences(creatorProfile: CreatorProfile | null): UserProfile['exportPreferences'] {
  const preferences = (creatorProfile?.exportPreferences ?? {}) as Partial<UserProfile['exportPreferences']>;
  return {
    defaultFormat: (preferences.defaultFormat as ColorFormat) ?? 'OKLCH',
    variablePrefix: preferences.variablePrefix ?? 'sys-color',
    namingConvention: (preferences.namingConvention as NamingConvention) ?? 'kebab-case',
    includeComments: preferences.includeComments ?? true
  };
}

/** Calcula o perfil derivado do criador a partir dos dados reais. */
function buildUserProfile(
  creatorProfile: CreatorProfile | null,
  viewer: AuthUser,
  myPalettes: Palette[],
  articles: CmsArticle[],
  submissions: CommunitySubmission[]
): UserProfile {
  const likedByOthers = myPalettes.reduce((total, palette) => total + (palette.likes ?? 0), 0);
  const forks = myPalettes.filter((palette) => palette.isFork).length;
  const staffPicks = myPalettes.filter((palette) => palette.staffPick).length;
  const myArticles = articles.filter((article) => article.author === creatorProfile?.name).length;
  const approved = submissions.filter((submission) => submission.status === 'Aprovado').length;
  const decided = submissions.filter((submission) => submission.status !== 'Pendente').length;
  const approvalRate = decided > 0 ? `${((approved / decided) * 100).toFixed(1)}%` : '—';

  return {
    name: creatorProfile?.name ?? viewer.name,
    handle: creatorProfile?.handle ?? viewer.handle,
    title: creatorProfile?.title ?? '',
    bio: creatorProfile?.bio ?? '',
    avatar: creatorProfile?.avatar ?? viewer.avatar,
    isPro: creatorProfile?.isPro ?? false,
    website: creatorProfile?.website ?? '',
    github: creatorProfile?.github ?? '',
    figma: creatorProfile?.figma ?? '',
    behance: creatorProfile?.behance ?? '',
    badges: creatorProfile?.badges ?? [],
    stats: {
      palettesCreated: myPalettes.length,
      palettesCreatedMonthlyDelta: 0,
      clonesAndForks: String(forks),
      globalRank: '—',
      likesReceived: likedByOthers.toLocaleString('pt-BR'),
      approvalRate,
      cmsArticlesCount: myArticles,
      editorialFeaturedCount: staffPicks
    },
    exportPreferences: buildExportPreferences(creatorProfile)
  };
}

const GenerateInputModeBar: React.FC<{
  mode: GenerateInputMode;
  onChange: (mode: GenerateInputMode) => void;
}> = ({ mode, onChange }) => (
  <div className="shrink-0 bg-[#111827] border-b border-white/[0.08] px-4 sm:px-6 py-2 flex items-center justify-center gap-2">
    <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] mr-1">Entrada:</span>
    <button
      onClick={() => onChange('procedural')}
      className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${mode === 'procedural'
        ? 'bg-[#6366F1] text-white shadow-sm'
        : 'bg-[#181C24] hover:bg-[#262A33] border border-white/[0.08] text-[#DFE2EE]'
        }`}
    >
      <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
      <span>Geração Procedural & Mood</span>
    </button>
    <button
      onClick={() => onChange('image')}
      className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${mode === 'image'
        ? 'bg-[#6366F1] text-white shadow-sm'
        : 'bg-[#181C24] hover:bg-[#262A33] border border-white/[0.08] text-[#DFE2EE]'
        }`}
    >
      <Eye className="w-3.5 h-3.5 text-[#06B6D4]" />
      <span>Extrair de Imagem</span>
    </button>
  </div>
);

const RefineToolTabs: React.FC<{
  tool: RefineTool;
  onChange: (tool: RefineTool) => void;
}> = ({ tool, onChange }) => (
  <div className="shrink-0 bg-[#111827] border-b border-white/[0.08] px-4 sm:px-6 py-2 flex items-center justify-center gap-2">
    <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] mr-1">Refinar com:</span>
    <button
      onClick={() => onChange('wheel')}
      className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${tool === 'wheel'
        ? 'bg-[#6366F1] text-white shadow-sm'
        : 'bg-[#181C24] hover:bg-[#262A33] border border-white/[0.08] text-[#DFE2EE]'
        }`}
    >
      <Disc3 className="w-3.5 h-3.5 text-[#06B6D4]" />
      <span>Roda Harmônica</span>
    </button>
    <button
      onClick={() => onChange('lab')}
      className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${tool === 'lab'
        ? 'bg-[#6366F1] text-white shadow-sm'
        : 'bg-[#181C24] hover:bg-[#262A33] border border-white/[0.08] text-[#DFE2EE]'
        }`}
    >
      <SlidersHorizontal className="w-3.5 h-3.5 text-[#06B6D4]" />
      <span>Color Space Lab</span>
    </button>
  </div>
);

const ExportStagePanel: React.FC<{
  colors: string[];
  onSave: () => void;
  onExport: () => void;
}> = ({ colors, onSave, onExport }) => (
  <div className="flex-1 flex items-center justify-center p-6 sm:p-8 pb-24">
    <div className="w-full max-w-lg bg-[#181C24] border border-white/[0.08] rounded-2xl p-8 text-center shadow-2xl">
      <div className="w-12 h-12 rounded-xl bg-[#6366F1]/20 border border-[#6366F1]/40 text-[#6366F1] flex items-center justify-center mx-auto mb-4">
        <Download className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-white font-['Geist'] tracking-tight">
        Salvar & Exportar
      </h2>
      <p className="text-xs text-[#94A3B8] mt-2 mb-6 leading-relaxed">
        Sua Paleta Ativa está pronta. Salve no Cofre, Projeto ou Coleção — ou exporte os design tokens
        para Illustrator, ASE, CSS, Tailwind, JSON e SVG.
      </p>

      <div className="h-14 rounded-xl overflow-hidden flex border border-white/10 shadow-inner mb-6">
        {colors.map((hex, i) => (
          <div key={`${hex}-${i}`} className="flex-1 h-full" style={{ backgroundColor: hex }} title={hex} />
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onSave}
          className="h-10 px-5 rounded-lg bg-[#262A33] hover:bg-[#31353E] border border-white/[0.08] text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Bookmark className="w-4 h-4 text-[#06B6D4]" />
          <span>Salvar Paleta</span>
        </button>
        <button
          onClick={onExport}
          className="h-10 px-5 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Tokens</span>
        </button>
      </div>
    </div>
  </div>
);

const SignInGate: React.FC<{ onOpenAuth: () => void; title: string; description: string }> = ({
  onOpenAuth,
  title,
  description
}) => (
  <div className="p-12 text-center max-w-md mx-auto my-16 bg-[#121622] border border-white/[0.08] rounded-2xl shadow-xl">
    <Lock className="w-12 h-12 text-[#06B6D4] mx-auto mb-4" />
    <h3 className="text-lg font-bold text-white font-['Geist']">{title}</h3>
    <p className="text-xs text-[#94A3B8] mt-2 mb-6 leading-relaxed">{description}</p>
    <button
      onClick={onOpenAuth}
      className="px-4 py-2 bg-[#6366F1] text-white font-semibold text-xs rounded-lg hover:bg-[#5254E0] transition-colors cursor-pointer inline-flex items-center gap-2"
    >
      <LogIn className="w-4 h-4" />
      Entrar ou criar conta
    </button>
  </div>
);

/** Painel exibido quando a aba exige privilégios que a sessão não possui. */
const AccessDeniedPanel: React.FC<{
  iconClassName: string;
  title: string;
  description: string;
  isSignedIn: boolean;
  onOpenAuth: () => void;
  onNavigateToProfile: () => void;
}> = ({ iconClassName, title, description, isSignedIn, onOpenAuth, onNavigateToProfile }) => (
  <div className="p-12 text-center max-w-md mx-auto my-16 bg-[#121622] border border-white/[0.08] rounded-2xl shadow-xl">
    <ShieldAlert className={`w-12 h-12 ${iconClassName} mx-auto mb-4`} />
    <h3 className="text-lg font-bold text-white font-['Geist']">{title}</h3>
    <p className="text-xs text-[#94A3B8] mt-2 mb-6 leading-relaxed">{description}</p>
    <button
      onClick={isSignedIn ? onNavigateToProfile : onOpenAuth}
      className="px-4 py-2 bg-[#6366F1] text-white font-semibold text-xs rounded-lg hover:bg-[#6366F1]/90 transition-colors cursor-pointer"
    >
      {isSignedIn ? 'Ir para Meu Perfil & Painel' : 'Entrar para continuar'}
    </button>
  </div>
);

/** Palco "Gerar" do Estúdio: entrada procedural ou extração de imagem. */
const GenerateStageContent: React.FC<{
  generateInputMode: GenerateInputMode;
  setGenerateInputMode: (mode: GenerateInputMode) => void;
  activePalette: string[];
  setActivePalette: (colors: string[]) => void;
  setActiveStage: (stage: StudioStage) => void;
  curatedImages: CuratedDemoImage[];
  isSupabaseConnected: boolean;
  projects?: ProjectWorkspace[];
  collections?: CollectionBoard[];
  handleSaveToFavorites: (hex: string, name: string) => void;
  handleSaveCuratedImage: (img: CuratedDemoImage) => void;
  handleDeleteCuratedImage: (id: string) => void;
  handleResetCuratedImages: () => void;
  handleAddColorsToProject?: (
    projectId: string,
    targetType: ProjectSlot,
    colors: string[],
    paletteName?: string
  ) => void;
  handleAddColorsToCollection?: (collectionId: string, colors: string[]) => void;
  handleCreateProject?: (project: ProjectWorkspace) => void;
  handleCreateCollection?: (collection: CollectionBoard) => void;
  handleOpenSavePaletteModal: (colors?: string[], title?: string) => void;
  handleOpenExport: (colors?: string[], title?: string) => void;
}> = ({
  generateInputMode,
  setGenerateInputMode,
  activePalette,
  setActivePalette,
  setActiveStage,
  curatedImages,
  isSupabaseConnected,
  projects = [],
  collections = [],
  handleSaveToFavorites,
  handleSaveCuratedImage,
  handleDeleteCuratedImage,
  handleResetCuratedImages,
  handleAddColorsToProject,
  handleAddColorsToCollection,
  handleCreateProject,
  handleCreateCollection,
  handleOpenSavePaletteModal,
  handleOpenExport
}) => (
    <>
      <GenerateInputModeBar mode={generateInputMode} onChange={setGenerateInputMode} />
      {generateInputMode === 'procedural' ? (
        <GeneratorView
          colors={activePalette}
          onColorsChange={setActivePalette}
          onSaveToFavorites={handleSaveToFavorites}
          onSaveToCollection={handleOpenSavePaletteModal}
          onOpenExport={handleOpenExport}
        />
      ) : (
        <ImageExtractorView
          curatedImages={curatedImages}
          onApplyToActivePalette={setActivePalette}
          onProceedToRefine={() => setActiveStage('refine')}
          onSaveCuratedImage={handleSaveCuratedImage}
          onDeleteCuratedImage={handleDeleteCuratedImage}
          onResetCuratedImages={handleResetCuratedImages}
          isSupabaseConnected={isSupabaseConnected}
          projects={projects}
          collections={collections}
          onSaveToFavorites={handleSaveToFavorites}
          onAddColorsToProject={handleAddColorsToProject}
          onAddColorsToCollection={handleAddColorsToCollection}
          onCreateProject={handleCreateProject}
          onCreateCollection={handleCreateCollection}
          onOpenSavePaletteModal={handleOpenSavePaletteModal}
          onOpenExport={handleOpenExport}
        />
      )}
    </>
  );

/** Palco "Refinar" do Estúdio: roda harmônica ou Color Space Lab. */
const RefineStageContent: React.FC<{
  refineTool: RefineTool;
  setRefineTool: (tool: RefineTool) => void;
  activePalette: string[];
  setActivePalette: (colors: string[]) => void;
}> = ({ refineTool, setRefineTool, activePalette, setActivePalette }) => (
  <>
    <RefineToolTabs tool={refineTool} onChange={setRefineTool} />
    {refineTool === 'wheel' ? (
      <HarmonicWheelView colors={activePalette} onColorsChange={setActivePalette} />
    ) : (
      <ColorSpaceLabView colors={activePalette} onColorsChange={setActivePalette} />
    )}
  </>
);

/** Conteúdo do Estúdio: renderiza apenas o palco ativo. */
const StudioContent: React.FC<{
  activeStage: StudioStage;
  activePalette: string[];
  generateInputMode: GenerateInputMode;
  refineTool: RefineTool;
  curatedImages: CuratedDemoImage[];
  isSupabaseConnected: boolean;
  projects?: ProjectWorkspace[];
  collections?: CollectionBoard[];
  setActivePalette: (colors: string[]) => void;
  setActiveStage: (stage: StudioStage) => void;
  setGenerateInputMode: (mode: GenerateInputMode) => void;
  setRefineTool: (tool: RefineTool) => void;
  handleSaveToFavorites: (hex: string, name: string) => void;
  handleSaveCuratedImage: (img: CuratedDemoImage) => void;
  handleDeleteCuratedImage: (id: string) => void;
  handleResetCuratedImages: () => void;
  handleAddColorsToProject?: (
    projectId: string,
    targetType: ProjectSlot,
    colors: string[],
    paletteName?: string
  ) => void;
  handleAddColorsToCollection?: (collectionId: string, colors: string[]) => void;
  handleCreateProject?: (project: ProjectWorkspace) => void;
  handleCreateCollection?: (collection: CollectionBoard) => void;
  handleOpenSavePaletteModal: (colors?: string[], title?: string) => void;
  handleOpenExport: (colors?: string[], title?: string) => void;
  openSavePaletteModal: () => void;
  openExportModal: () => void;
}> = ({
  activeStage,
  activePalette,
  generateInputMode,
  refineTool,
  curatedImages,
  isSupabaseConnected,
  projects = [],
  collections = [],
  setActivePalette,
  setActiveStage,
  setGenerateInputMode,
  setRefineTool,
  handleSaveToFavorites,
  handleSaveCuratedImage,
  handleDeleteCuratedImage,
  handleResetCuratedImages,
  handleAddColorsToProject,
  handleAddColorsToCollection,
  handleCreateProject,
  handleCreateCollection,
  handleOpenSavePaletteModal,
  handleOpenExport,
  openSavePaletteModal,
  openExportModal
}) => (
    <div className="flex-1 flex flex-col min-h-0">
      {activeStage === 'generate' && (
        <GenerateStageContent
          generateInputMode={generateInputMode}
          setGenerateInputMode={setGenerateInputMode}
          activePalette={activePalette}
          setActivePalette={setActivePalette}
          setActiveStage={setActiveStage}
          curatedImages={curatedImages}
          isSupabaseConnected={isSupabaseConnected}
          projects={projects}
          collections={collections}
          handleSaveToFavorites={handleSaveToFavorites}
          handleSaveCuratedImage={handleSaveCuratedImage}
          handleDeleteCuratedImage={handleDeleteCuratedImage}
          handleResetCuratedImages={handleResetCuratedImages}
          handleAddColorsToProject={handleAddColorsToProject}
          handleAddColorsToCollection={handleAddColorsToCollection}
          handleCreateProject={handleCreateProject}
          handleCreateCollection={handleCreateCollection}
          handleOpenSavePaletteModal={handleOpenSavePaletteModal}
          handleOpenExport={handleOpenExport}
        />
      )}

      {activeStage === 'refine' && (
        <RefineStageContent
          refineTool={refineTool}
          setRefineTool={setRefineTool}
          activePalette={activePalette}
          setActivePalette={setActivePalette}
        />
      )}

      {activeStage === 'audit' && (
        <AccessibilityView colors={activePalette} onColorsChange={setActivePalette} />
      )}

      {activeStage === 'export' && (
        <ExportStagePanel colors={activePalette} onSave={openSavePaletteModal} onExport={openExportModal} />
      )}
    </div>
  );

/** Aba Comunidade & Forks. */
const ExplorerTab: React.FC<{
  palettes: Palette[];
  articles: CmsArticle[];
  isSignedIn: boolean;
  setIsSubmitModalOpen: (open: boolean) => void;
  requireSession: () => boolean;
  handleOpenInGenerator: (colors: string[]) => void;
  handleOpenSavePaletteModal: (colors?: string[], title?: string) => void;
  handleLikePalette: (paletteId: string) => void;
  handleForkPalette: (palette: Palette) => void;
  handleSendToAudit: (colors: string[]) => void;
}> = ({
  palettes,
  articles,
  isSignedIn,
  setIsSubmitModalOpen,
  requireSession,
  handleOpenInGenerator,
  handleOpenSavePaletteModal,
  handleLikePalette,
  handleForkPalette,
  handleSendToAudit
}) => (
    <ExplorerView
      palettes={palettes}
      articles={articles}
      onOpenInGenerator={handleOpenInGenerator}
      onSaveToCollection={handleOpenSavePaletteModal}
      onLikePalette={handleLikePalette}
      onForkPalette={handleForkPalette}
      onOpenSubmissionModal={() => (isSignedIn ? setIsSubmitModalOpen(true) : requireSession())}
      onSendToAudit={handleSendToAudit}
    />
  );

/** Aba Cofre de Projetos & Coleções. */
const ProjectsTab: React.FC<{
  isSignedIn: boolean;
  openAuth: () => void;
  projects: ProjectWorkspace[];
  collections: CollectionBoard[];
  favoriteColors: FavoriteColor[];
  vaultPalettes: VaultPalette[];
  showToast: (message: string, type?: 'success' | 'error') => void;
  handleOpenInGenerator: (colors: string[]) => void;
  handleOpenExport: (colors?: string[], title?: string) => void;
  handleCreateProject: (project: ProjectWorkspace) => void;
  handleDeleteProject: (id: string) => void;
  handleCreateCollection: (collection: CollectionBoard) => void;
  handleSavePaletteToProject: (projectId: string, palette: ProjectPalette) => void;
  handleDeleteProjectPalette: (projectId: string, paletteId: string) => void;
  handleSavePaletteToVault: (palette: VaultPalette) => void;
  handleDeleteVaultPalette: (id: string) => void;
  handleDeleteFavoriteColor: (id: string) => void;
  handleDeleteCollection: (id: string) => void;
  handleSendToAudit: (colors: string[]) => void;
  handleAddColorsToProject: (
    projectId: string,
    targetType: ProjectSlot,
    colors: string[],
    paletteName?: string
  ) => void;
  handleAddColorsToCollection: (collectionId: string, colors: string[]) => void;
  handleSubmitToCuration: (submission: { title: string; colors: string[]; tags: string[]; gamut: string; type: 'collection' | 'board'; sourceId: string }) => void;
}> = ({
  isSignedIn,
  openAuth,
  projects,
  collections,
  favoriteColors,
  vaultPalettes,
  showToast,
  handleOpenInGenerator,
  handleOpenExport,
  handleCreateProject,
  handleDeleteProject,
  handleCreateCollection,
  handleSavePaletteToProject,
  handleDeleteProjectPalette,
  handleSavePaletteToVault,
  handleDeleteVaultPalette,
  handleDeleteFavoriteColor,
  handleDeleteCollection,
  handleSendToAudit,
  handleAddColorsToProject,
  handleAddColorsToCollection,
  handleSubmitToCuration
}) => {
    if (!isSignedIn) {
      return (
        <SignInGate
          onOpenAuth={openAuth}
          title="Cofre de Projetos"
          description="Seus projetos, coleções, paletas privadas e amostras favoritas ficam vinculados à sua conta no Supabase."
        />
      );
    }
    return (
      <ProjectsVaultView
        projects={projects}
        collections={collections}
        favoriteColors={favoriteColors}
        vaultPalettes={vaultPalettes}
        onOpenInGenerator={handleOpenInGenerator}
        onOpenExport={handleOpenExport}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onCreateCollection={handleCreateCollection}
        onSavePaletteToProject={handleSavePaletteToProject}
        onDeletePaletteFromProject={handleDeleteProjectPalette}
        onSavePaletteToVault={handleSavePaletteToVault}
        onDeleteVaultPalette={handleDeleteVaultPalette}
        onDeleteFavoriteColor={handleDeleteFavoriteColor}
        onDeleteCollection={handleDeleteCollection}
        onSendToAudit={handleSendToAudit}
        onAddColorsToProject={handleAddColorsToProject}
        onAddColorsToCollection={handleAddColorsToCollection}
        onSubmitToCuration={handleSubmitToCuration}
        showToast={showToast}
      />
    );
  };

/** Aba CMS Editorial & Curadoria. */
const CmsTab: React.FC<{
  hasCmsAccess: boolean;
  isSignedIn: boolean;
  openAuth: () => void;
  onNavigateToProfile: () => void;
  articles: CmsArticle[];
  submissions: CommunitySubmission[];
  taxonomyTags: TaxonomyTag[];
  handleCreateArticle: (article: CmsArticle) => void;
  handleApproveSubmission: (id: string, asStaffPick: boolean) => void;
  handleRejectSubmission: (id: string) => void;
  handleAddTag: (name: string, category: string) => void;
  handleOpenInGenerator: (colors: string[]) => void;
  currentUser: AuthUser;
}> = ({
  hasCmsAccess,
  isSignedIn,
  openAuth,
  onNavigateToProfile,
  articles,
  submissions,
  taxonomyTags,
  handleCreateArticle,
  handleApproveSubmission,
  handleRejectSubmission,
  handleAddTag,
  handleOpenInGenerator,
  currentUser
}) => {
    if (!hasCmsAccess) {
      return (
        <AccessDeniedPanel
          iconClassName="text-amber-400"
          title="Acesso Restrito"
          description="O painel CMS Editorial e curadoria de conteúdo é restrito a editores e administradores credenciados."
          isSignedIn={isSignedIn}
          onOpenAuth={openAuth}
          onNavigateToProfile={onNavigateToProfile}
        />
      );
    }
    return (
      <CmsAdminView
        articles={articles}
        submissions={submissions}
        tags={taxonomyTags}
        onCreateArticle={handleCreateArticle}
        onApproveSubmission={handleApproveSubmission}
        onRejectSubmission={handleRejectSubmission}
        onAddTag={handleAddTag}
        onOpenInGenerator={handleOpenInGenerator}
        currentUser={currentUser}
      />
    );
  };

/** Aba Painel Administrativo & Governança. */
const AdminTab: React.FC<{
  authUser: AuthUser | null;
  isSignedIn: boolean;
  openAuth: () => void;
  onNavigateToProfile: () => void;
  usersList: AuthUser[];
  setUsersList: (users: AuthUser[]) => void;
  submissions: CommunitySubmission[];
  articles: CmsArticle[];
  auditLogs: AuditLogItem[];
  isSupabaseConnected: boolean;
  handleApproveSubmission: (id: string, asStaffPick: boolean) => void;
  handleRejectSubmission: (id: string) => void;
  handleCreateArticle: (article: CmsArticle) => void;
  handleDeleteArticle: (id: string) => void;
  handleOpenInGenerator: (colors: string[]) => void;
}> = ({
  authUser,
  isSignedIn,
  openAuth,
  onNavigateToProfile,
  usersList,
  setUsersList,
  submissions,
  articles,
  auditLogs,
  isSupabaseConnected,
  handleApproveSubmission,
  handleRejectSubmission,
  handleCreateArticle,
  handleDeleteArticle,
  handleOpenInGenerator
}) => {
    if (authUser?.role !== 'admin') {
      return (
        <AccessDeniedPanel
          iconClassName="text-purple-400"
          title="Painel Restrito a Administradores"
          description="Esta área contém governança de usuários, logs de auditoria e configurações de persistência na nuvem. Privilégios de administrador são obrigatórios."
          isSignedIn={isSignedIn}
          onOpenAuth={openAuth}
          onNavigateToProfile={onNavigateToProfile}
        />
      );
    }
    return (
      <AdminAreaView
        currentUser={authUser}
        usersList={usersList}
        onUpdateUsersList={setUsersList}
        submissions={submissions}
        onApproveSubmission={handleApproveSubmission}
        onRejectSubmission={handleRejectSubmission}
        articles={articles}
        onCreateArticle={handleCreateArticle}
        onDeleteArticle={handleDeleteArticle}
        auditLogs={auditLogs}
        onOpenInGenerator={handleOpenInGenerator}
        onNavigateToUserPortal={onNavigateToProfile}
        isSupabaseConnected={isSupabaseConnected}
      />
    );
  };

/** Aba Área do Usuário & Criador. */
const UserDashboardTab: React.FC<{
  authUser: AuthUser | null;
  isSignedIn: boolean;
  openAuth: () => void;
  onNavigateToProfile: () => void;
  myPalettes: Palette[];
  vaultPalettes: VaultPalette[];
  projects: ProjectWorkspace[];
  collections: CollectionBoard[];
  favoriteColors: FavoriteColor[];
  submissions: CommunitySubmission[];
  handleOpenInGenerator: (colors: string[]) => void;
  handleOpenExport: (colors?: string[], title?: string) => void;
}> = ({
  authUser,
  isSignedIn,
  openAuth,
  onNavigateToProfile,
  myPalettes,
  vaultPalettes,
  projects,
  collections,
  favoriteColors,
  submissions,
  handleOpenInGenerator,
  handleOpenExport
}) => {
    if (!isSignedIn || !authUser) {
      return (
        <SignInGate
          onOpenAuth={openAuth}
          title="Área do Criador"
          description="Entre para acompanhar suas métricas reais de criação, forks e curadoria."
        />
      );
    }
    return (
      <UserAnalyticsDashboard
        palettes={myPalettes}
        vaultPalettes={vaultPalettes}
        projects={projects}
        collections={collections}
        favoriteColors={favoriteColors}
        submissions={submissions}
        onOpenInGenerator={handleOpenInGenerator}
        onOpenExport={handleOpenExport}
        onNavigateToProfile={onNavigateToProfile}
      />
    );
  };

/** Aba Perfil de Criador. */
const ProfileTab: React.FC<{
  authUser: AuthUser | null;
  openAuth: () => void;
  userProfile: UserProfile;
  myPalettes: Palette[];
  projects: ProjectWorkspace[];
  collections: CollectionBoard[];
  favoriteColors: FavoriteColor[];
  vaultPalettes: VaultPalette[];
  submissions: CommunitySubmission[];
  isSupabaseConnected: boolean;
  showToast: (message: string, type?: 'success' | 'error') => void;
  setIsAvatarEditorOpen: (open: boolean) => void;
  setIsSubmitModalOpen: (open: boolean) => void;
  handleOpenInGenerator: (colors: string[]) => void;
  handleOpenSavePaletteModal: (colors?: string[], title?: string) => void;
  handleOpenExport: (colors?: string[], title?: string) => void;
  handleUpdateProfile: (updated: Partial<UserProfile>) => void;
  handleDeleteFavoriteColor: (id: string) => void;
  handleDeleteVaultPalette: (id: string) => void;
  handleDeleteCollection: (id: string) => void;
  handleAddColorsToProject: (
    projectId: string,
    targetType: ProjectSlot,
    colors: string[],
    paletteName?: string
  ) => void;
  handleAddColorsToCollection: (collectionId: string, colors: string[]) => void;
  handleCreateProject: (project: ProjectWorkspace) => void;
  handleCreateCollection: (collection: CollectionBoard) => void;
  handleLogout: () => void;
}> = ({
  authUser,
  openAuth,
  userProfile,
  myPalettes,
  projects,
  collections,
  favoriteColors,
  vaultPalettes,
  submissions,
  isSupabaseConnected,
  showToast,
  setIsAvatarEditorOpen,
  setIsSubmitModalOpen,
  handleOpenInGenerator,
  handleOpenSavePaletteModal,
  handleOpenExport,
  handleUpdateProfile,
  handleDeleteFavoriteColor,
  handleDeleteVaultPalette,
  handleDeleteCollection,
  handleAddColorsToProject,
  handleAddColorsToCollection,
  handleCreateProject,
  handleCreateCollection,
  handleLogout
}) => {
    if (!authUser) {
      return (
        <SignInGate
          onOpenAuth={openAuth}
          title="Perfil de Criador"
          description="Crie sua conta para editar seu perfil, preferências de exportação e portfólio."
        />
      );
    }
    return (
      <ProfileView
        authUser={authUser}
        userProfile={userProfile}
        palettes={myPalettes}
        projects={projects}
        collections={collections}
        favoriteColors={favoriteColors}
        vaultPalettes={vaultPalettes}
        submissions={submissions}
        onOpenInGenerator={handleOpenInGenerator}
        onSaveToCollection={handleOpenSavePaletteModal}
        onOpenExport={handleOpenExport}
        onUpdateProfile={handleUpdateProfile}
        onDeleteFavoriteColor={handleDeleteFavoriteColor}
        onDeleteVaultPalette={handleDeleteVaultPalette}
        onDeleteCollection={handleDeleteCollection}
        onAddColorsToProject={handleAddColorsToProject}
        onAddColorsToCollection={handleAddColorsToCollection}
        onCreateProject={handleCreateProject}
        onCreateCollection={handleCreateCollection}
        showToast={showToast}
        onOpenAuthModal={openAuth}
        onOpenAvatarEditor={() => setIsAvatarEditorOpen(true)}
        onLogout={handleLogout}
        onOpenSubmissionModal={() => setIsSubmitModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
      />
    );
  };

interface MainContentRouterProps {
  currentTab: NavigationTab;
  viewer: AuthUser;
  authUser: AuthUser | null;
  isSignedIn: boolean;
  activeStage: StudioStage;
  activePalette: string[];
  generateInputMode: GenerateInputMode;
  refineTool: RefineTool;
  curatedImages: CuratedDemoImage[];
  palettes: Palette[];
  myPalettes: Palette[];
  articles: CmsArticle[];
  submissions: CommunitySubmission[];
  taxonomyTags: TaxonomyTag[];
  projects: ProjectWorkspace[];
  collections: CollectionBoard[];
  favoriteColors: FavoriteColor[];
  vaultPalettes: VaultPalette[];
  usersList: AuthUser[];
  auditLogs: AuditLogItem[];
  userProfile: UserProfile;
  isSupabaseConnected: boolean;
  setActivePalette: (colors: string[]) => void;
  setActiveStage: (stage: StudioStage) => void;
  setGenerateInputMode: (mode: GenerateInputMode) => void;
  setRefineTool: (tool: RefineTool) => void;
  setCurrentTab: (tab: NavigationTab) => void;
  setUsersList: (users: AuthUser[]) => void;
  setIsAuthModalOpen: (open: boolean) => void;
  setIsSubmitModalOpen: (open: boolean) => void;
  setIsAvatarEditorOpen: (open: boolean) => void;
  requireSession: () => boolean;
  showToast: (message: string, type?: 'success' | 'error') => void;
  handleOpenInGenerator: (colors: string[]) => void;
  handleSendToAudit: (colors: string[]) => void;
  handleOpenExport: (colors?: string[], title?: string) => void;
  handleOpenSavePaletteModal: (colors?: string[], title?: string) => void;
  handleSaveToFavorites: (hex: string, name: string) => Promise<void>;
  handleSaveCuratedImage: (img: CuratedDemoImage) => Promise<void>;
  handleDeleteCuratedImage: (id: string) => Promise<void>;
  handleResetCuratedImages: () => Promise<void>;
  handleLikePalette: (paletteId: string) => Promise<void>;
  handleForkPalette: (palette: Palette) => Promise<void>;
  handleCreateProject: (project: ProjectWorkspace) => Promise<void>;
  handleDeleteProject: (id: string) => Promise<void>;
  handleCreateCollection: (collection: CollectionBoard) => Promise<void>;
  handleSavePaletteToProject: (projectId: string, palette: ProjectPalette) => Promise<void>;
  handleDeleteProjectPalette: (projectId: string, paletteId: string) => Promise<void>;
  handleSavePaletteToVault: (palette: VaultPalette) => Promise<void>;
  handleDeleteVaultPalette: (id: string) => Promise<void>;
  handleDeleteFavoriteColor: (id: string) => Promise<void>;
  handleDeleteCollection: (id: string) => Promise<void>;
  handleAddColorsToProject: (
    projectId: string,
    targetType: ProjectSlot,
    colors: string[],
    paletteName?: string
  ) => Promise<void>;
  handleAddColorsToCollection: (collectionId: string, colors: string[]) => Promise<void>;
  handleCreateArticle: (article: CmsArticle) => Promise<void>;
  handleDeleteArticle: (id: string) => Promise<void>;
  handleApproveSubmission: (id: string, asStaffPick: boolean) => Promise<void>;
  handleRejectSubmission: (id: string) => Promise<void>;
  handleAddTag: (name: string, category: string) => Promise<void>;
  handleSubmitToCuration: (submission: { title: string; colors: string[]; tags: string[]; gamut: string; type: 'collection' | 'board'; sourceId: string }) => Promise<void>;
  handleUpdateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  handleLogout: () => Promise<void>;
}

const MainContentRouter: React.FC<MainContentRouterProps> = (props) => {
  const {
    currentTab,
    viewer,
    authUser,
    isSignedIn,
    activeStage,
    activePalette,
    generateInputMode,
    refineTool,
    curatedImages,
    palettes,
    myPalettes,
    articles,
    submissions,
    taxonomyTags,
    projects,
    collections,
    favoriteColors,
    vaultPalettes,
    usersList,
    auditLogs,
    userProfile,
    isSupabaseConnected,
    setActivePalette,
    setActiveStage,
    setGenerateInputMode,
    setRefineTool,
    setCurrentTab,
    setUsersList,
    setIsAuthModalOpen,
    setIsSubmitModalOpen,
    setIsAvatarEditorOpen,
    requireSession,
    showToast,
    handleOpenInGenerator,
    handleSendToAudit,
    handleOpenExport,
    handleOpenSavePaletteModal,
    handleSaveToFavorites,
    handleSaveCuratedImage,
    handleDeleteCuratedImage,
    handleResetCuratedImages,
    handleLikePalette,
    handleForkPalette,
    handleCreateProject,
    handleDeleteProject,
    handleCreateCollection,
    handleSavePaletteToProject,
    handleDeleteProjectPalette,
    handleSavePaletteToVault,
    handleDeleteVaultPalette,
    handleDeleteFavoriteColor,
    handleDeleteCollection,
    handleAddColorsToProject,
    handleAddColorsToCollection,
    handleCreateArticle,
    handleDeleteArticle,
    handleApproveSubmission,
    handleRejectSubmission,
    handleAddTag,
    handleSubmitToCuration,
    handleUpdateProfile,
    handleLogout
  } = props;

  const openAuth = () => setIsAuthModalOpen(true);
  const openSavePaletteModal = () => handleOpenSavePaletteModal();
  const openExportModal = () => handleOpenExport();
  const navigateToProfile = () => setCurrentTab('profile');
  const hasCmsAccess = canAccessCms(viewer.role);

  return (
    <main className="flex-1 flex flex-col min-w-0">
      {currentTab === 'generator' && (
        <StudioContent
          activeStage={activeStage}
          activePalette={activePalette}
          generateInputMode={generateInputMode}
          refineTool={refineTool}
          curatedImages={curatedImages}
          isSupabaseConnected={isSupabaseConnected}
          projects={projects}
          collections={collections}
          setActivePalette={setActivePalette}
          setActiveStage={setActiveStage}
          setGenerateInputMode={setGenerateInputMode}
          setRefineTool={setRefineTool}
          handleSaveToFavorites={handleSaveToFavorites}
          handleSaveCuratedImage={handleSaveCuratedImage}
          handleDeleteCuratedImage={handleDeleteCuratedImage}
          handleResetCuratedImages={handleResetCuratedImages}
          handleAddColorsToProject={handleAddColorsToProject}
          handleAddColorsToCollection={handleAddColorsToCollection}
          handleCreateProject={handleCreateProject}
          handleCreateCollection={handleCreateCollection}
          handleOpenSavePaletteModal={handleOpenSavePaletteModal}
          handleOpenExport={handleOpenExport}
          openSavePaletteModal={openSavePaletteModal}
          openExportModal={openExportModal}
        />
      )}

      {currentTab === 'explorer' && (
        <ExplorerTab
          palettes={palettes}
          articles={articles}
          isSignedIn={isSignedIn}
          setIsSubmitModalOpen={setIsSubmitModalOpen}
          requireSession={requireSession}
          handleOpenInGenerator={handleOpenInGenerator}
          handleOpenSavePaletteModal={handleOpenSavePaletteModal}
          handleLikePalette={handleLikePalette}
          handleForkPalette={handleForkPalette}
          handleSendToAudit={handleSendToAudit}
        />
      )}

      {currentTab === 'projects' && (
        <ProjectsTab
          isSignedIn={isSignedIn}
          openAuth={openAuth}
          projects={projects}
          collections={collections}
          favoriteColors={favoriteColors}
          vaultPalettes={vaultPalettes}
          showToast={showToast}
          handleOpenInGenerator={handleOpenInGenerator}
          handleOpenExport={handleOpenExport}
          handleCreateProject={handleCreateProject}
          handleDeleteProject={handleDeleteProject}
          handleCreateCollection={handleCreateCollection}
          handleSavePaletteToProject={handleSavePaletteToProject}
          handleDeleteProjectPalette={handleDeleteProjectPalette}
          handleSavePaletteToVault={handleSavePaletteToVault}
          handleDeleteVaultPalette={handleDeleteVaultPalette}
          handleDeleteFavoriteColor={handleDeleteFavoriteColor}
          handleDeleteCollection={handleDeleteCollection}
          handleSendToAudit={handleSendToAudit}
          handleAddColorsToProject={handleAddColorsToProject}
          handleAddColorsToCollection={handleAddColorsToCollection}
          handleSubmitToCuration={handleSubmitToCuration}
        />
      )}

      {currentTab === 'cms' && (
        <CmsTab
          hasCmsAccess={hasCmsAccess}
          isSignedIn={isSignedIn}
          openAuth={openAuth}
          onNavigateToProfile={navigateToProfile}
          articles={articles}
          submissions={submissions}
          taxonomyTags={taxonomyTags}
          handleCreateArticle={handleCreateArticle}
          handleApproveSubmission={handleApproveSubmission}
          handleRejectSubmission={handleRejectSubmission}
          handleAddTag={handleAddTag}
          handleOpenInGenerator={handleOpenInGenerator}
          currentUser={viewer}
        />
      )}

      {currentTab === 'admin' && (
        <AdminTab
          authUser={authUser}
          isSignedIn={isSignedIn}
          openAuth={openAuth}
          onNavigateToProfile={navigateToProfile}
          usersList={usersList}
          setUsersList={setUsersList}
          submissions={submissions}
          articles={articles}
          auditLogs={auditLogs}
          isSupabaseConnected={isSupabaseConnected}
          handleApproveSubmission={handleApproveSubmission}
          handleRejectSubmission={handleRejectSubmission}
          handleCreateArticle={handleCreateArticle}
          handleDeleteArticle={handleDeleteArticle}
          handleOpenInGenerator={handleOpenInGenerator}
        />
      )}

      {currentTab === 'user_dashboard' && (
        <UserDashboardTab
          authUser={authUser}
          isSignedIn={isSignedIn}
          openAuth={openAuth}
          onNavigateToProfile={navigateToProfile}
          myPalettes={myPalettes}
          vaultPalettes={vaultPalettes}
          projects={projects}
          collections={collections}
          favoriteColors={favoriteColors}
          submissions={submissions}
          handleOpenInGenerator={handleOpenInGenerator}
          handleOpenExport={handleOpenExport}
        />
      )}

      {currentTab === 'profile' && (
        <ProfileTab
          authUser={authUser}
          openAuth={openAuth}
          userProfile={userProfile}
          myPalettes={myPalettes}
          projects={projects}
          collections={collections}
          favoriteColors={favoriteColors}
          vaultPalettes={vaultPalettes}
          submissions={submissions}
          isSupabaseConnected={isSupabaseConnected}
          showToast={showToast}
          setIsAvatarEditorOpen={setIsAvatarEditorOpen}
          setIsSubmitModalOpen={setIsSubmitModalOpen}
          handleOpenInGenerator={handleOpenInGenerator}
          handleOpenSavePaletteModal={handleOpenSavePaletteModal}
          handleOpenExport={handleOpenExport}
          handleUpdateProfile={handleUpdateProfile}
          handleDeleteFavoriteColor={handleDeleteFavoriteColor}
          handleDeleteVaultPalette={handleDeleteVaultPalette}
          handleDeleteCollection={handleDeleteCollection}
          handleAddColorsToProject={handleAddColorsToProject}
          handleAddColorsToCollection={handleAddColorsToCollection}
          handleCreateProject={handleCreateProject}
          handleCreateCollection={handleCreateCollection}
          handleLogout={handleLogout}
        />
      )}
    </main>
  );
};

interface AppHeaderProps {
  currentTab: NavigationTab;
  activeStage: StudioStage;
  gamut: ColorGamut;
  viewer: AuthUser;
  authUser: AuthUser | null;
  isSignedIn: boolean;
  isSidebarExpanded: boolean;
  onToggleSidebar: () => void;
  onOpenAuthModal: () => void;
  onOpenExport: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  currentTab,
  activeStage,
  gamut,
  viewer,
  authUser,
  isSignedIn,
  isSidebarExpanded,
  onToggleSidebar,
  onOpenAuthModal,
  onOpenExport
}) => {
  const tabTitle =
    currentTab === 'generator'
      ? STUDIO_STAGE_LABELS[activeStage]
      : TAB_TITLES[currentTab as Exclude<NavigationTab, 'generator'>];

  const accountTitle = isSignedIn && authUser
    ? `Conta: ${authUser.name} (${authUser.role})`
    : 'Entrar ou criar conta';

  const isAdmin = authUser?.role === 'admin';

  return (
    <header className="h-16 bg-[#0E131E]/90 backdrop-blur-md border-b border-white/[0.08] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          title={isSidebarExpanded ? 'Retrair Menu' : 'Expandir Menu'}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="h-4 w-px bg-white/10 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white capitalize">{tabTitle}</span>
          <span className="text-[10px] font-mono text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/20 px-1.5 py-0.5 rounded uppercase hidden md:inline-block">
            {gamut}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* User Account / Auth Modal Trigger */}
        <button
          onClick={onOpenAuthModal}
          className="h-8 px-2 sm:px-2.5 rounded-lg bg-[#181C24] hover:bg-[#202534] border border-white/[0.08] hover:border-white/20 text-xs flex items-center gap-2 transition-colors cursor-pointer"
          title={accountTitle}
        >
          <img
            src={viewer.avatar}
            alt={viewer.name}
            className="w-5 h-5 rounded-full object-cover border border-white/20"
          />
          <span className="hidden sm:inline text-white font-medium text-xs">
            {isSignedIn && authUser ? authUser.name.split(' ')[0] : 'Entrar'}
          </span>
          {isSignedIn && authUser && (
            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${isAdmin
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
              : 'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4]/40'
              }`}>
              {isAdmin ? 'ADMIN' : 'USUÁRIO'}
            </span>
          )}
        </button>

        <button
          onClick={onOpenExport}
          className="h-8 px-3 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          title="Exportar para Illustrator (.jsx / .ase), CSS, Tailwind, JSON e SVG"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exportar Amostras & Tokens</span>
        </button>
      </div>
    </header>
  );
};

const ToastNotification: React.FC<{ toast: { message: string; type: 'success' | 'error' } }> = ({ toast }) => {
  const isError = toast.type === 'error';
  return (
    <output
      className={`fixed top-20 right-6 z-50 bg-[#141A24] text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-4 ${isError
        ? 'border border-red-500/50'
        : 'border border-[#06B6D4]/40'
        }`}
    >
      {isError ? (
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
      ) : (
        <Check className="w-4 h-4 text-[#06B6D4] shrink-0" />
      )}
      <span>{toast.message}</span>
    </output>
  );
};

export function App() {
  // Navigation & Studio state
  const [currentTab, setCurrentTab] = useState<NavigationTab>('generator');
  const [activePalette, setActivePalette] = useState<string[]>(DEFAULT_PALETTE);
  const [activeStage, setActiveStage] = useState<StudioStage>('generate');
  const [generateInputMode, setGenerateInputMode] = useState<GenerateInputMode>('procedural');
  const [refineTool, setRefineTool] = useState<RefineTool>('wheel');
  const [gamut, setGamut] = useState<ColorGamut>('Display P3');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(false);

  // Authentication & Role Governance State
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [usersList, setUsersList] = useState<AuthUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Supabase & Persistence State
  const isSupabaseConnected = useMemo(() => isSupabaseConfigured(), []);
  const [curatedImages, setCuratedImages] = useState<CuratedDemoImage[]>([]);

  // Core domain data
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [myPalettes, setMyPalettes] = useState<Palette[]>([]);
  const [projects, setProjects] = useState<ProjectWorkspace[]>([]);
  const [collections, setCollections] = useState<CollectionBoard[]>([]);
  const [favoriteColors, setFavoriteColors] = useState<FavoriteColor[]>([]);
  const [vaultPalettes, setVaultPalettes] = useState<VaultPalette[]>([]);
  const [articles, setArticles] = useState<CmsArticle[]>([]);
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>([]);
  const [taxonomyTags, setTaxonomyTags] = useState<TaxonomyTag[]>([]);

  // Modals state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportPaletteTitle, setExportPaletteTitle] = useState<string>('Izy Colors System Palette');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSavePaletteModalOpen, setIsSavePaletteModalOpen] = useState(false);
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
  const [savePaletteModalTitle, setSavePaletteModalTitle] = useState<string>('Nova Paleta Harmônica');
  const [notificationToast, setNotificationToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const viewer: AuthUser = authUser ?? ANONYMOUS_VIEWER;
  const isSignedIn = authUser !== null;

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotificationToast({ message, type });
    setTimeout(() => setNotificationToast(null), 3500);
  }, []);

  const requireSession = useCallback((): boolean => {
    if (authUser) return true;
    showToast('Entre na sua conta para executar esta ação.', 'error');
    setIsAuthModalOpen(true);
    return false;
  }, [authUser, showToast]);

  /** Executa uma mutação convertendo qualquer erro do banco em toast. */
  const runMutation = useCallback(async (action: () => Promise<unknown>, success?: string): Promise<boolean> => {
    try {
      await action();
      if (success) showToast(success);
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro inesperado.', 'error');
      return false;
    }
  }, [showToast]);

  // -------------------------------------------------------------------------
  // Carga de dados, bootstrap de sessão e efeitos (extraídos para um hook)
  // -------------------------------------------------------------------------

  const { loadPrivateData, handleLogout } = useAppData({
    isSignedIn,
    activePalette,
    activeStage,
    setAuthUser,
    setCreatorProfile,
    setUsersList,
    setAuditLogs,
    setIsBootstrapping,
    setCurrentTab,
    setPalettes,
    setArticles,
    setTaxonomyTags,
    setCuratedImages,
    setProjects,
    setCollections,
    setFavoriteColors,
    setVaultPalettes,
    setSubmissions,
    setMyPalettes,
    setActivePalette,
    setActiveStage,
    showToast
  });

  // RBAC Guard: admin, curadoria e áreas privadas exigem sessão
  useEffect(() => {
    const guardedTab = resolveGuardedTab(currentTab, isSignedIn, viewer.role);
    if (guardedTab !== currentTab) {
      setCurrentTab(guardedTab);
    }
  }, [viewer.role, isSignedIn, currentTab]);

  // -------------------------------------------------------------------------
  // Perfil derivado (estatísticas calculadas com dados reais)
  // -------------------------------------------------------------------------

  const userProfile: UserProfile = useMemo<UserProfile>(
    () => buildUserProfile(creatorProfile, viewer, myPalettes, articles, submissions),
    [creatorProfile, viewer, myPalettes, articles, submissions]
  );

  // -------------------------------------------------------------------------
  // Handlers — extraídos para um hook dedicado (mantém a complexidade baixa)
  // -------------------------------------------------------------------------

  const {
    handleOpenInGenerator,
    handleSendToAudit,
    handleOpenExport,
    handleSaveToFavorites,
    handleOpenSavePaletteModal,
    handleSavePaletteToVault,
    handleSavePaletteToProject,
    handleCreateProjectWithPalette,
    handleDeleteVaultPalette,
    handleDeleteProjectPalette,
    handleSaveToCollectionBoard,
    handleDeleteFavoriteColor,
    handleCreateProject,
    handleDeleteProject,
    handleCreateCollection,
    handleDeleteCollection,
    handleAddColorsToProject,
    handleAddColorsToCollection,
    handleLikePalette,
    handleForkPalette,
    handleNewSubmission,
    handleCreateArticle,
    handleDeleteArticle,
    handleApproveSubmission,
    handleRejectSubmission,
    handleAddTag,
    handleSubmitToCuration,
    handleSaveCuratedImage,
    handleDeleteCuratedImage,
    handleResetCuratedImages,
    handleSaveAvatar,
    handleRemoveAvatar,
    handleUpdateProfile
  } = useAppHandlers({
    gamut,
    requireSession,
    runMutation,
    showToast,
    setActivePalette,
    setActiveStage,
    setCurrentTab,
    setExportPaletteTitle,
    setIsExportModalOpen,
    setSavePaletteModalTitle,
    setIsSavePaletteModalOpen,
    setFavoriteColors,
    setVaultPalettes,
    setProjects,
    setCollections,
    setPalettes,
    setMyPalettes,
    setSubmissions,
    setArticles,
    setTaxonomyTags,
    setCuratedImages,
    setCreatorProfile,
    setAuthUser,
    collections,
    projects,
    favoriteColors,
    submissions
  });

  const forksCount = palettes.filter((p) => p.isFork || (p.forks && p.forks > 0)).length;

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-[#DFE2EE] flex items-center justify-center font-['Geist']">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#06B6D4] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-mono text-[#94A3B8]">Conectando ao Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#DFE2EE] flex font-['Geist'] selection:bg-[#6366F1]/40 selection:text-white">
      {/* Retractable Collapsible Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        gamut={gamut}
        onGamutChange={setGamut}
        authUser={viewer}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenExportModal={() => handleOpenExport()}
        favoritesCount={favoriteColors.length}
        projectsCount={projects.length}
        forksCount={forksCount}
        isExpanded={isSidebarExpanded}
        onToggleExpanded={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      {/* Main Content Viewport (offset by sidebar width dynamically) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'pl-64' : 'pl-16'
          }`}
      >
        {/* Slim Top Bar with Current Tab Context & Mobile Toggle */}
        <AppHeader
          currentTab={currentTab}
          activeStage={activeStage}
          gamut={gamut}
          viewer={viewer}
          authUser={authUser}
          isSignedIn={isSignedIn}
          isSidebarExpanded={isSidebarExpanded}
          onToggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenExport={() => handleOpenExport()}
        />

        {/* Floating Toast Notification */}
        {notificationToast && <ToastNotification toast={notificationToast} />}

        {/* Main Studio Views Router */}
        <MainContentRouter
          currentTab={currentTab}
          viewer={viewer}
          authUser={authUser}
          isSignedIn={isSignedIn}
          activeStage={activeStage}
          activePalette={activePalette}
          generateInputMode={generateInputMode}
          refineTool={refineTool}
          curatedImages={curatedImages}
          palettes={palettes}
          myPalettes={myPalettes}
          articles={articles}
          submissions={submissions}
          taxonomyTags={taxonomyTags}
          projects={projects}
          collections={collections}
          favoriteColors={favoriteColors}
          vaultPalettes={vaultPalettes}
          usersList={usersList}
          auditLogs={auditLogs}
          userProfile={userProfile}
          isSupabaseConnected={isSupabaseConnected}
          setActivePalette={setActivePalette}
          setActiveStage={setActiveStage}
          setGenerateInputMode={setGenerateInputMode}
          setRefineTool={setRefineTool}
          setCurrentTab={setCurrentTab}
          setUsersList={setUsersList}
          setIsAuthModalOpen={setIsAuthModalOpen}
          setIsSubmitModalOpen={setIsSubmitModalOpen}
          setIsAvatarEditorOpen={setIsAvatarEditorOpen}
          requireSession={requireSession}
          showToast={showToast}
          handleOpenInGenerator={handleOpenInGenerator}
          handleSendToAudit={handleSendToAudit}
          handleOpenExport={handleOpenExport}
          handleOpenSavePaletteModal={handleOpenSavePaletteModal}
          handleSaveToFavorites={handleSaveToFavorites}
          handleSaveCuratedImage={handleSaveCuratedImage}
          handleDeleteCuratedImage={handleDeleteCuratedImage}
          handleResetCuratedImages={handleResetCuratedImages}
          handleLikePalette={handleLikePalette}
          handleForkPalette={handleForkPalette}
          handleCreateProject={handleCreateProject}
          handleDeleteProject={handleDeleteProject}
          handleCreateCollection={handleCreateCollection}
          handleSavePaletteToProject={handleSavePaletteToProject}
          handleDeleteProjectPalette={handleDeleteProjectPalette}
          handleSavePaletteToVault={handleSavePaletteToVault}
          handleDeleteVaultPalette={handleDeleteVaultPalette}
          handleDeleteFavoriteColor={handleDeleteFavoriteColor}
          handleDeleteCollection={handleDeleteCollection}
          handleAddColorsToProject={handleAddColorsToProject}
          handleAddColorsToCollection={handleAddColorsToCollection}
          handleCreateArticle={handleCreateArticle}
          handleDeleteArticle={handleDeleteArticle}
          handleApproveSubmission={handleApproveSubmission}
          handleRejectSubmission={handleRejectSubmission}
          handleAddTag={handleAddTag}
          handleSubmitToCuration={handleSubmitToCuration}
          handleUpdateProfile={handleUpdateProfile}
          handleLogout={handleLogout}
        />
      </div>

      {/* Contextual Workflow Dock (only inside the Studio) */}
      {currentTab === 'generator' && (
        <WorkflowDock
          colors={activePalette}
          activeStage={activeStage}
          onStageChange={setActiveStage}
          onSave={() => handleOpenSavePaletteModal()}
          onExport={() => handleOpenExport()}
          isSidebarExpanded={isSidebarExpanded}
        />
      )}

      {/* Save Palette to Projects, Vault or Collections Modal */}
      <SavePaletteModal
        isOpen={isSavePaletteModalOpen}
        colors={activePalette}
        initialTitle={savePaletteModalTitle}
        projects={projects}
        collections={collections}
        onClose={() => setIsSavePaletteModalOpen(false)}
        onSaveToVault={handleSavePaletteToVault}
        onSaveToProject={handleSavePaletteToProject}
        onCreateProjectWithPalette={handleCreateProjectWithPalette}
        onSaveToCollection={handleSaveToCollectionBoard}
        onCreateCollection={handleCreateCollection}
      />

      {/* Command Palette (⌘K) Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setCurrentTab}
        onNavigateStage={setActiveStage}
        onOpenImageExtractor={() => {
          setCurrentTab('generator');
          setActiveStage('generate');
          setGenerateInputMode('image');
        }}
        onQuickGenerate={() => {
          setCurrentTab('generator');
          setActiveStage('generate');
        }}
        onGamutChange={setGamut}
        onOpenExport={() => handleOpenExport()}
        authUser={viewer}
      />

      {/* Export Tokens Modal with Illustrator & Swatches support */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        colors={activePalette}
        paletteTitle={exportPaletteTitle}
        variablePrefix={userProfile.exportPreferences.variablePrefix}
      />

      {/* Community Challenge Submission Modal */}
      <SubmitPaletteModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handleNewSubmission}
        defaultColors={activePalette}
        currentUser={viewer}
      />

      {/* Role-Based Authentication & Account Management Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={viewer}
        onUserChange={(user) => {
          setAuthUser(user);
          showToast(`Sessão ativa como ${user.name} (${user.role})`);
          void loadPrivateData();
        }}
        onLogout={handleLogout}
        onNavigateToAdmin={() => setCurrentTab('admin')}
        onNavigateToUserPortal={() => setCurrentTab('user_dashboard')}
      />

      {/* Avatar Upload / Change / Remove Modal */}
      <AvatarEditorModal
        isOpen={isAvatarEditorOpen}
        currentAvatar={viewer.avatar}
        userName={viewer.name}
        onClose={() => setIsAvatarEditorOpen(false)}
        onSaveAvatar={handleSaveAvatar}
        onRemoveAvatar={handleRemoveAvatar}
      />
    </div>
  );
}

export default App;
