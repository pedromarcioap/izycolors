import { useState, useEffect, useCallback } from 'react';
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
  AuditLogItem
} from './types';

import {
  INITIAL_PALETTES,
  INITIAL_USER_PROFILE,
  INITIAL_PROJECTS,
  INITIAL_COLLECTIONS,
  INITIAL_FAVORITE_COLORS,
  INITIAL_VAULT_PALETTES,
  INITIAL_CMS_ARTICLES,
  INITIAL_SUBMISSIONS,
  INITIAL_TAXONOMY_TAGS
} from './data/initialData';

import {
  loadCuratedImages,
  saveCuratedImage,
  deleteCuratedImage,
  resetCuratedImages,
  recordPaletteFork,
  isSupabaseConfigured,
  getSupabaseClient
} from './services/supabase';

import {
  uploadUserAvatar,
  removeUserAvatar,
  updateProfileAvatar,
  processAvatarImage,
  blobToDataUrl,
  getInitialsAvatarUrl
} from './services/avatarService';

import {
  getStoredUsers,
  saveStoredUsers,
  getCurrentAuthUser,
  setCurrentAuthUser,
  getStoredAuditLogs,
  checkCurrentSession,
  logoutAuthUser,
  initAuthListener
} from './services/authService';

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
  AlertTriangle
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

type GenerateInputMode = 'procedural' | 'image';
type RefineTool = 'wheel' | 'lab';

const readStoredPalette = (): string[] => {
  try {
    const raw = localStorage.getItem('izycolors_active_palette');
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(c => typeof c === 'string')) {
        return parsed as string[];
      }
    }
  } catch (err) {
    console.error('Erro ao ler izycolors_active_palette:', err);
  }
  return DEFAULT_PALETTE;
};

const readStoredStage = (): StudioStage => {
  const raw = localStorage.getItem('izycolors_active_stage');
  if (raw === 'refine' || raw === 'audit' || raw === 'export') {
    return raw;
  }
  return 'generate';
};

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

export function App() {
  // Navigation & Studio state
  const [currentTab, setCurrentTab] = useState<NavigationTab>('generator');
  const [activePalette, setActivePalette] = useState<string[]>(readStoredPalette);
  const [activeStage, setActiveStage] = useState<StudioStage>(readStoredStage);
  const [generateInputMode, setGenerateInputMode] = useState<GenerateInputMode>('procedural');
  const [refineTool, setRefineTool] = useState<RefineTool>('wheel');
  const [gamut, setGamut] = useState<ColorGamut>('Display P3');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(false);

  // Authentication & Role Governance State
  const [authUser, setAuthUser] = useState<AuthUser>(() => getCurrentAuthUser());
  const [usersList, setUsersList] = useState<AuthUser[]>(() => getStoredUsers());
  const [auditLogs] = useState<AuditLogItem[]>(() => getStoredAuditLogs());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Supabase & Persistence State
  const [isSupabaseConnected] = useState<boolean>(() => isSupabaseConfigured());
  const [curatedImages, setCuratedImages] = useState<CuratedDemoImage[]>([]);

  // Core domain data
  const [palettes, setPalettes] = useState<Palette[]>(() => {
    const saved = localStorage.getItem('chromatica_palettes');
    return saved ? JSON.parse(saved) : INITIAL_PALETTES;
  });

  const [projects, setProjects] = useState<ProjectWorkspace[]>(() => {
    const saved = localStorage.getItem('chromatica_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [collections, setCollections] = useState<CollectionBoard[]>(() => {
    const saved = localStorage.getItem('chromatica_collections');
    return saved ? JSON.parse(saved) : INITIAL_COLLECTIONS;
  });

  const [favoriteColors, setFavoriteColors] = useState<FavoriteColor[]>(() => {
    const saved = localStorage.getItem('chromatica_fav_colors');
    return saved ? JSON.parse(saved) : INITIAL_FAVORITE_COLORS;
  });

  const [vaultPalettes, setVaultPalettes] = useState<VaultPalette[]>(() => {
    const saved = localStorage.getItem('chromatica_vault_palettes');
    return saved ? JSON.parse(saved) : INITIAL_VAULT_PALETTES;
  });

  const [articles, setArticles] = useState<CmsArticle[]>(() => {
    const saved = localStorage.getItem('chromatica_articles');
    return saved ? JSON.parse(saved) : INITIAL_CMS_ARTICLES;
  });

  const [submissions, setSubmissions] = useState<CommunitySubmission[]>(() => {
    const saved = localStorage.getItem('chromatica_submissions');
    return saved ? JSON.parse(saved) : INITIAL_SUBMISSIONS;
  });

  const [taxonomyTags, setTaxonomyTags] = useState(INITIAL_TAXONOMY_TAGS);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const current = getCurrentAuthUser();
    let savedProfile: Partial<UserProfile> = {};
    try {
      const raw = localStorage.getItem('chromatica_user_profile');
      if (raw) savedProfile = JSON.parse(raw);
    } catch (err) {
      console.error('Erro ao ler chromatica_user_profile:', err);
    }
    return {
      ...INITIAL_USER_PROFILE,
      ...savedProfile,
      name: current.name || savedProfile.name || INITIAL_USER_PROFILE.name,
      handle: current.handle || savedProfile.handle || INITIAL_USER_PROFILE.handle,
      avatar: current.avatar || savedProfile.avatar || INITIAL_USER_PROFILE.avatar,
      bio: current.bio || savedProfile.bio || INITIAL_USER_PROFILE.bio,
      exportPreferences: {
        ...INITIAL_USER_PROFILE.exportPreferences,
        ...savedProfile.exportPreferences
      }
    };
  });

  // Modals state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportPaletteTitle, setExportPaletteTitle] = useState<string>('Izy Colors System Palette');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSavePaletteModalOpen, setIsSavePaletteModalOpen] = useState(false);
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
  const [savePaletteModalTitle, setSavePaletteModalTitle] = useState<string>('Nova Paleta Harmônica');
  const [notificationToast, setNotificationToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotificationToast({ message, type });
    setTimeout(() => setNotificationToast(null), 3500);
  }, []);

  // Propaga o novo avatar para todos os pontos da interface (cabeçalho, menu lateral e perfil).
  const applyAvatarChange = (avatarUrl: string | null) => {
    const fallbackAvatar = getInitialsAvatarUrl(authUser.email || authUser.name || 'user');
    const nextAvatar = avatarUrl || fallbackAvatar;

    const nextUser: AuthUser = { ...authUser, avatar: nextAvatar };
    setAuthUser(nextUser);
    setCurrentAuthUser(nextUser);

    const updatedUsers = usersList.map(user => (user.id === nextUser.id ? nextUser : user));
    setUsersList(updatedUsers);
    saveStoredUsers(updatedUsers);

    setUserProfile(prev => ({ ...prev, avatar: nextAvatar }));
  };

  // Envia (ou persiste localmente) o novo avatar, mantendo o anterior em caso de falha.
  const handleSaveAvatar = async (file: File) => {
    const supabase = getSupabaseClient();
    let hasSupabaseSession = false;

    if (supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        hasSupabaseSession = Boolean(data.session);
      } catch {
        hasSupabaseSession = false;
      }
    }

    let nextAvatar: string | null = null;

    if (supabase && hasSupabaseSession) {
      nextAvatar = await uploadUserAvatar(file);
      await updateProfileAvatar(nextAvatar);
    } else {
      // Fallback local para contas fora da nuvem: imagem processada persiste como Data URL.
      const blob = await processAvatarImage(file);
      nextAvatar = await blobToDataUrl(blob);
    }

    applyAvatarChange(nextAvatar);
    showToast('Foto do perfil atualizada com sucesso.');
  };

  // Remove o avatar existente (mantendo o anterior em caso de falha no envio).
  const handleRemoveAvatar = async () => {
    const supabase = getSupabaseClient();
    let hasSupabaseSession = false;

    if (supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        hasSupabaseSession = Boolean(data.session);
      } catch {
        hasSupabaseSession = false;
      }
    }

    if (supabase && hasSupabaseSession) {
      await removeUserAvatar();
      await updateProfileAvatar(null);
    }

    applyAvatarChange(null);
    showToast('Foto do perfil removida.');
  };

  // Load curated images and sync active auth session on mount
  useEffect(() => {
    loadCuratedImages().then(images => {
      setCuratedImages(images);
    });

    // Check if there is an active Supabase or local session
    checkCurrentSession().then(user => {
      if (user) {
        setAuthUser(user);
        setUserProfile(prev => ({
          ...prev,
          name: user.name,
          handle: user.handle,
          avatar: user.avatar,
          bio: user.bio || prev.bio
        }));
      }
    });

    // Subscribe to Supabase Auth state changes in real time
    const unsubscribeAuth = initAuthListener((user) => {
      setAuthUser(user);
      setUserProfile(prev => ({
        ...prev,
        name: user.name,
        handle: user.handle,
        avatar: user.avatar,
        bio: user.bio || prev.bio
      }));
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Handle Logout via Supabase Auth
  const handleLogout = useCallback(async () => {
    await logoutAuthUser();
    const regularUser = getCurrentAuthUser();
    setAuthUser(regularUser);
    setUserProfile(prev => ({
      ...prev,
      name: regularUser.name,
      handle: regularUser.handle,
      avatar: regularUser.avatar,
      bio: regularUser.bio || ''
    }));
    if (currentTab === 'admin' || currentTab === 'cms') {
      setCurrentTab('generator');
    }
    showToast('Sessão encerrada com sucesso via Supabase Auth.');
  }, [currentTab, showToast]);

  // Strict RBAC Guard: Protect admin and cms routes based on user role
  useEffect(() => {
    if (currentTab === 'admin' && authUser.role !== 'admin') {
      setCurrentTab('profile');
    }
    if (currentTab === 'cms' && authUser.role !== 'admin' && authUser.role !== 'moderator' && authUser.role !== 'editor') {
      setCurrentTab('profile');
    }
  }, [authUser.role, currentTab]);

  // Persistence to local storage
  useEffect(() => {
    localStorage.setItem('izycolors_active_palette', JSON.stringify(activePalette));
  }, [activePalette]);

  useEffect(() => {
    localStorage.setItem('izycolors_active_stage', activeStage);
  }, [activeStage]);

  useEffect(() => {
    localStorage.setItem('chromatica_palettes', JSON.stringify(palettes));
  }, [palettes]);

  useEffect(() => {
    localStorage.setItem('chromatica_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('chromatica_collections', JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem('chromatica_fav_colors', JSON.stringify(favoriteColors));
  }, [favoriteColors]);

  useEffect(() => {
    localStorage.setItem('chromatica_vault_palettes', JSON.stringify(vaultPalettes));
  }, [vaultPalettes]);

  useEffect(() => {
    localStorage.setItem('chromatica_articles', JSON.stringify(articles));
  }, [articles]);

  useEffect(() => {
    localStorage.setItem('chromatica_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    try {
      localStorage.setItem('chromatica_user_profile', JSON.stringify(userProfile));
    } catch (e) {
      console.error('Erro ao persistir chromatica_user_profile:', e);
    }
  }, [userProfile]);

  useEffect(() => {
    saveStoredUsers(usersList);
  }, [usersList]);

  // Load a palette into the centralized active palette and open the Studio at the
  // creation/editing stage.
  const handleOpenInGenerator = (colors: string[]) => {
    if (colors && colors.length > 0) setActivePalette(colors);
    setActiveStage('generate');
    setCurrentTab('generator');
  };

  // Load a palette into the active palette and open the Studio directly at the audit stage.
  const handleSendToAudit = (colors: string[]) => {
    if (colors && colors.length > 0) setActivePalette(colors);
    setActiveStage('audit');
    setCurrentTab('generator');
  };

  // Open Export Modal with given or default (active palette) colors
  const handleOpenExport = (colors?: string[], title?: string) => {
    if (colors && colors.length > 0) setActivePalette(colors);
    if (title) setExportPaletteTitle(title);
    setIsExportModalOpen(true);
  };

  // Save single color to favorite swatches / vault
  const handleSaveToFavorites = (hex: string, name: string) => {
    const exists = favoriteColors.some(c => c.hex.toLowerCase() === hex.toLowerCase());
    if (exists) {
      showToast(`Amostra ${hex} já consta no seu cofre.`);
      return;
    }
    const newFav: FavoriteColor = {
      id: `fav-${Date.now()}`,
      hex: hex.toUpperCase(),
      name: name || 'Custom Swatch',
      note: 'Salvo via Gerador / Studio',
      dateAdded: 'Hoje',
      tags: ['Salvo', gamut]
    };
    setFavoriteColors(prev => [newFav, ...prev]);
    showToast(`Amostra ${hex} salva com sucesso no Cofre de Cores!`);
  };

  // Open Save Palette Modal for saving entire palette to Vault, Project, or Collection
  const handleOpenSavePaletteModal = (colors?: string[], title?: string) => {
    if (colors && colors.length > 0) setActivePalette(colors);
    setSavePaletteModalTitle(title || 'Nova Paleta Harmônica');
    setIsSavePaletteModalOpen(true);
  };

  // Save full palette to private Vault
  const handleSavePaletteToVault = (vaultPalette: VaultPalette) => {
    setVaultPalettes(prev => [vaultPalette, ...prev]);
    showToast(`Paleta completa "${vaultPalette.title}" salva com sucesso no Cofre Privado!`);
  };

  // Save full palette to a specific project workspace
  const handleSavePaletteToProject = (projectId: string, projectPalette: ProjectPalette) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          palettes: [projectPalette, ...(p.palettes || [])],
          updatedAt: 'Agora'
        };
      }
      return p;
    }));
    showToast(`Paleta "${projectPalette.name}" adicionada ao projeto com sucesso!`);
  };

  // Create new project with palette included
  const handleCreateProjectWithPalette = (newProject: ProjectWorkspace) => {
    setProjects(prev => [newProject, ...prev]);
    showToast(`Projeto "${newProject.name}" criado com sua nova paleta!`);
  };

  // Save palette into a specific Collection board
  const handleSaveToCollectionBoard = (collectionId: string, colors: string[]) => {
    setCollections(prev => prev.map(c => {
      if (c.id === collectionId) {
        return {
          ...c,
          coverColors: colors
        };
      }
      return c;
    }));
    showToast('Paleta vinculada ao quadro de coleção com sucesso!');
  };

  // Delete full palette from Vault
  const handleDeleteVaultPalette = (id: string) => {
    setVaultPalettes(prev => prev.filter(p => p.id !== id));
    showToast('Paleta removida do Cofre.');
  };

  // Delete palette from Project
  const handleDeleteProjectPalette = (projectId: string, paletteId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          palettes: (p.palettes || []).filter(pal => pal.id !== paletteId)
        };
      }
      return p;
    }));
    showToast('Paleta removida do projeto.');
  };

  // Save current palette to a collection (shortcut or modal)
  const handleSaveToCollection = (colors: string[]) => {
    handleOpenSavePaletteModal(colors);
  };

  // Likes on community palettes
  const handleLikePalette = (paletteId: string) => {
    setPalettes(prev => prev.map(p => p.id === paletteId ? { ...p, likes: p.likes + 1 } : p));
  };

  // Forks & Clones Handler — also loads the fork into the active palette Studio
  const handleForkPalette = async (palette: Palette) => {
    // 1. Increment fork counter on original palette
    setPalettes(prev => prev.map(p => p.id === palette.id ? { ...p, forks: (p.forks || 0) + 1 } : p));

    // 2. Persist fork in Supabase / Local storage
    const { forkedPalette } = await recordPaletteFork(palette, userProfile);

    // 3. Add the cloned palette to local state
    setPalettes(prev => [forkedPalette, ...prev]);

    // 4. Also add to user's first collection
    setCollections(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[0] = {
        ...updated[0],
        coverColors: forkedPalette.colors
      };
      return updated;
    });

    // 5. Load the forked palette into the Studio
    setActivePalette(forkedPalette.colors);
    setActiveStage('generate');
    setCurrentTab('generator');

    showToast(`Fork criado com sucesso! "${forkedPalette.title}" está carregado no Estúdio.`);
  };

  // Curated Images persistence handlers
  const handleSaveCuratedImage = async (img: CuratedDemoImage) => {
    await saveCuratedImage(img);
    setCuratedImages(prev => [img, ...prev.filter(i => i.id !== img.id)]);
  };

  const handleDeleteCuratedImage = async (id: string) => {
    await deleteCuratedImage(id);
    setCuratedImages(prev => prev.filter(i => i.id !== id));
  };

  const handleResetCuratedImages = async () => {
    await resetCuratedImages();
    const reloaded = await loadCuratedImages();
    setCuratedImages(reloaded);
    showToast('Imagens curadas de demonstração restauradas para o padrão.');
  };

  // CMS handlers
  const handleCreateArticle = (article: CmsArticle) => {
    setArticles(prev => [article, ...prev]);
    showToast('Artigo publicado no CMS com sucesso!');
  };

  const handleApproveSubmission = (id: string, asStaffPick: boolean) => {
    const sub = submissions.find(s => s.id === id);
    if (!sub) return;

    const newPalette: Palette = {
      id: `pal-${Date.now()}`,
      title: sub.title,
      author: {
        name: sub.author,
        handle: sub.authorHandle,
        avatar: sub.authorAvatar,
        pro: true
      },
      colors: sub.colors,
      likes: 1,
      forks: 0,
      wcagLevel: 'WCAG 2.1 AAA Ready',
      tags: sub.tags,
      gamut: sub.suggestedGamut,
      staffPick: asStaffPick,
      createdAt: 'Agora',
      description: `Submetida pela comunidade e aprovada pela Curadoria Editorial.`
    };

    setPalettes(prev => [newPalette, ...prev]);
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: 'Aprovado' } : s));
    showToast(`Paleta "${sub.title}" aprovada pela Curadoria!`);
  };

  const handleRejectSubmission = (id: string) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: 'Rejeitado' } : s));
  };

  const handleAddTag = (name: string, category: string) => {
    setTaxonomyTags(prev => [...prev, { name, count: 1, category }]);
  };

  const handleCreateProject = (project: ProjectWorkspace) => {
    setProjects(prev => [project, ...prev]);
    showToast(`Projeto "${project.name}" criado no Cofre.`);
  };

  const handleCreateCollection = (collection: CollectionBoard) => {
    setCollections(prev => [collection, ...prev]);
    showToast(`Coleção "${collection.title}" criada.`);
  };

  const handleDeleteFavoriteColor = (id: string) => {
    setFavoriteColors(prev => prev.filter(c => c.id !== id));
  };

  const handleDeleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
  };

  const handleNewSubmission = (sub: CommunitySubmission) => {
    setSubmissions(prev => [sub, ...prev]);
    showToast('Paleta submetida com sucesso para o Edital da Comunidade!');
  };

  // Calculate forks count
  const forksCount = palettes.filter(p => p.isFork || (p.forks && p.forks > 0)).length;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#DFE2EE] flex font-['Geist'] selection:bg-[#6366F1]/40 selection:text-white">
      {/* Retractable Collapsible Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        gamut={gamut}
        onGamutChange={setGamut}
        authUser={authUser}
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
        <header className="h-16 bg-[#0E131E]/90 backdrop-blur-md border-b border-white/[0.08] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title={isSidebarExpanded ? 'Retrair Menu' : 'Expandir Menu'}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white capitalize">
                {currentTab === 'generator'
                  ? STUDIO_STAGE_LABELS[activeStage]
                  : TAB_TITLES[currentTab as Exclude<NavigationTab, 'generator'>]}
              </span>
              <span className="text-[10px] font-mono text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/20 px-1.5 py-0.5 rounded uppercase hidden md:inline-block">
                {gamut}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User Account / Auth Modal Trigger */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="h-8 px-2 sm:px-2.5 rounded-lg bg-[#181C24] hover:bg-[#202534] border border-white/[0.08] hover:border-white/20 text-xs flex items-center gap-2 transition-colors cursor-pointer"
              title={`Conta: ${authUser.name} (${authUser.role === 'admin' ? 'Administrador' : 'Usuário Comum'}) - Clique para gerenciar`}
            >
              <img
                src={authUser.avatar}
                alt={authUser.name}
                className="w-5 h-5 rounded-full object-cover border border-white/20"
              />
              <span className="hidden sm:inline text-white font-medium text-xs">
                {authUser.name.split(' ')[0]}
              </span>
              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${authUser.role === 'admin'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4]/40'
                }`}>
                {authUser.role === 'admin' ? 'ADMIN' : 'USUÁRIO'}
              </span>
            </button>

            <button
              onClick={() => handleOpenExport()}
              className="h-8 px-3 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Exportar para Illustrator (.jsx / .ase), CSS, Tailwind, JSON e SVG"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar Amostras & Tokens</span>
            </button>
          </div>
        </header>

        {/* Floating Toast Notification */}
        {notificationToast && (
          <output
            className={`fixed top-20 right-6 z-50 bg-[#141A24] text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-4 ${notificationToast.type === 'error'
              ? 'border border-red-500/50'
              : 'border border-[#06B6D4]/40'
              }`}
          >
            {notificationToast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-[#06B6D4] shrink-0" />
            )}
            <span>{notificationToast.message}</span>
          </output>
        )}

        {/* Main Studio Views Router */}
        <main className="flex-1 flex flex-col min-w-0">
          {currentTab === 'generator' && (
            <div className="flex-1 flex flex-col min-h-0">
              {activeStage === 'generate' && (
                <>
                  <GenerateInputModeBar mode={generateInputMode} onChange={setGenerateInputMode} />
                  {generateInputMode === 'procedural' ? (
                    <GeneratorView
                      colors={activePalette}
                      onColorsChange={setActivePalette}
                      onSaveToFavorites={handleSaveToFavorites}
                      onSaveToCollection={handleSaveToCollection}
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
                    />
                  )}
                </>
              )}

              {activeStage === 'refine' && (
                <>
                  <RefineToolTabs tool={refineTool} onChange={setRefineTool} />
                  {refineTool === 'wheel' ? (
                    <HarmonicWheelView colors={activePalette} onColorsChange={setActivePalette} />
                  ) : (
                    <ColorSpaceLabView colors={activePalette} onColorsChange={setActivePalette} />
                  )}
                </>
              )}

              {activeStage === 'audit' && (
                <AccessibilityView colors={activePalette} onColorsChange={setActivePalette} />
              )}

              {activeStage === 'export' && (
                <ExportStagePanel
                  colors={activePalette}
                  onSave={() => handleOpenSavePaletteModal()}
                  onExport={() => handleOpenExport()}
                />
              )}
            </div>
          )}

          {currentTab === 'explorer' && (
            <ExplorerView
              palettes={palettes}
              articles={articles}
              onOpenInGenerator={handleOpenInGenerator}
              onSaveToCollection={handleSaveToCollection}
              onLikePalette={handleLikePalette}
              onForkPalette={handleForkPalette}
              onOpenSubmissionModal={() => setIsSubmitModalOpen(true)}
              onSendToAudit={handleSendToAudit}
            />
          )}

          {currentTab === 'projects' && (
            <ProjectsVaultView
              projects={projects}
              collections={collections}
              favoriteColors={favoriteColors}
              vaultPalettes={vaultPalettes}
              onOpenInGenerator={handleOpenInGenerator}
              onOpenExport={handleOpenExport}
              onCreateProject={handleCreateProject}
              onDeleteProject={(id) => {
                setProjects(prev => prev.filter(p => p.id !== id));
                showToast('Projeto removido.');
              }}
              onCreateCollection={handleCreateCollection}
              onSavePaletteToProject={handleSavePaletteToProject}
              onDeletePaletteFromProject={handleDeleteProjectPalette}
              onSavePaletteToVault={handleSavePaletteToVault}
              onDeleteVaultPalette={handleDeleteVaultPalette}
              onDeleteFavoriteColor={handleDeleteFavoriteColor}
              onDeleteCollection={handleDeleteCollection}
              onSendToAudit={handleSendToAudit}
            />
          )}

          {currentTab === 'cms' && (
            (authUser.role === 'admin' || authUser.role === 'editor') ? (
              <CmsAdminView
                articles={articles}
                submissions={submissions}
                tags={taxonomyTags}
                onCreateArticle={handleCreateArticle}
                onApproveSubmission={handleApproveSubmission}
                onRejectSubmission={handleRejectSubmission}
                onAddTag={handleAddTag}
                onOpenInGenerator={handleOpenInGenerator}
              />
            ) : (
              <div className="p-12 text-center max-w-md mx-auto my-16 bg-[#121622] border border-white/[0.08] rounded-2xl shadow-xl">
                <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white font-['Geist']">Acesso Restrito</h3>
                <p className="text-xs text-[#94A3B8] mt-2 mb-6 leading-relaxed">
                  O painel CMS Editorial e curadoria de conteúdo é restrito a editores e administradores credenciados.
                </p>
                <button
                  onClick={() => setCurrentTab('profile')}
                  className="px-4 py-2 bg-[#6366F1] text-white font-semibold text-xs rounded-lg hover:bg-[#6366F1]/90 transition-colors cursor-pointer"
                >
                  Ir para Meu Perfil & Painel
                </button>
              </div>
            )
          )}

          {currentTab === 'admin' && (
            authUser.role === 'admin' ? (
              <AdminAreaView
                currentUser={authUser}
                usersList={usersList}
                onUpdateUsersList={setUsersList}
                submissions={submissions}
                onApproveSubmission={handleApproveSubmission}
                onRejectSubmission={handleRejectSubmission}
                articles={articles}
                onCreateArticle={handleCreateArticle}
                onDeleteArticle={(id) => setArticles(prev => prev.filter(a => a.id !== id))}
                auditLogs={auditLogs}
                onOpenInGenerator={handleOpenInGenerator}
                onNavigateToUserPortal={() => setCurrentTab('profile')}
                isSupabaseConnected={isSupabaseConnected}
              />
            ) : (
              <div className="p-12 text-center max-w-md mx-auto my-16 bg-[#121622] border border-white/[0.08] rounded-2xl shadow-xl">
                <ShieldAlert className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white font-['Geist']">Painel Restrito a Administradores</h3>
                <p className="text-xs text-[#94A3B8] mt-2 mb-6 leading-relaxed">
                  Esta área contém governança de usuários, logs de auditoria e configurações de persistência na nuvem. Privilégios de administrador são obrigatórios.
                </p>
                <button
                  onClick={() => setCurrentTab('profile')}
                  className="px-4 py-2 bg-[#6366F1] text-white font-semibold text-xs rounded-lg hover:bg-[#6366F1]/90 transition-colors cursor-pointer"
                >
                  Ir para Meu Perfil & Painel
                </button>
              </div>
            )
          )}

          {currentTab === 'user_dashboard' && (
            <UserAnalyticsDashboard
              palettes={palettes}
              vaultPalettes={vaultPalettes}
              projects={projects}
              collections={collections}
              favoriteColors={favoriteColors}
              submissions={submissions}
              onOpenInGenerator={handleOpenInGenerator}
              onOpenExport={handleOpenExport}
              onNavigateToProfile={() => setCurrentTab('profile')}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileView
              authUser={authUser}
              userProfile={userProfile}
              palettes={palettes}
              projects={projects}
              collections={collections}
              favoriteColors={favoriteColors}
              vaultPalettes={vaultPalettes}
              submissions={submissions}
              onOpenInGenerator={handleOpenInGenerator}
              onSaveToCollection={handleSaveToCollection}
              onOpenExport={handleOpenExport}
              onUpdateProfile={(updated) => {
                setUserProfile(prev => {
                  const nextProfile = {
                    ...prev,
                    ...updated,
                    exportPreferences: updated.exportPreferences
                      ? { ...prev.exportPreferences, ...updated.exportPreferences }
                      : prev.exportPreferences
                  };
                  try {
                    localStorage.setItem('chromatica_user_profile', JSON.stringify(nextProfile));
                    if (updated.exportPreferences) {
                      localStorage.setItem('chromatica_token_prefs', JSON.stringify(nextProfile.exportPreferences));
                    }
                  } catch (e) {
                    console.error('Erro ao salvar chromatica_user_profile:', e);
                  }
                  return nextProfile;
                });
                if (updated.name || updated.handle || updated.bio) {
                  setAuthUser(prev => {
                    const nextUser: AuthUser = {
                      ...prev,
                      name: updated.name || prev.name,
                      handle: updated.handle || prev.handle,
                      bio: updated.bio ?? prev.bio
                    };
                    setCurrentAuthUser(nextUser);
                    setUsersList(curr => {
                      const updatedUsers = curr.map(u => u.id === nextUser.id ? nextUser : u);
                      saveStoredUsers(updatedUsers);
                      return updatedUsers;
                    });
                    return nextUser;
                  });
                }
                showToast('Perfil e preferências salvos com sucesso.');
              }}
              onDeleteFavoriteColor={(hex) => {
                setFavoriteColors(prev => prev.filter(f => f.hex !== hex));
                showToast('Amostra removida dos favoritos.');
              }}
              onDeleteVaultPalette={handleDeleteVaultPalette}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onOpenAvatarEditor={() => setIsAvatarEditorOpen(true)}
              onLogout={handleLogout}
              onOpenSubmissionModal={() => setIsSubmitModalOpen(true)}
              isSupabaseConnected={isSupabaseConnected}
            />
          )}
        </main>
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
        authUser={authUser}
      />

      {/* Export Tokens Modal with Illustrator & Swatches support */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        colors={activePalette}
        paletteTitle={exportPaletteTitle}
      />

      {/* Community Challenge Submission Modal */}
      <SubmitPaletteModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handleNewSubmission}
        defaultColors={activePalette}
      />

      {/* Role-Based Authentication & Account Management Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={authUser}
        onUserChange={(user) => {
          setAuthUser(user);
          setUserProfile(prev => ({
            ...prev,
            name: user.name,
            handle: user.handle,
            avatar: user.avatar,
            bio: user.bio || prev.bio
          }));
          showToast(`Sessão ativa como ${user.name} (${user.role === 'admin' ? 'Administrador' : 'Usuário Comum'})`);
        }}
        onLogout={handleLogout}
        onNavigateToAdmin={() => setCurrentTab('admin')}
        onNavigateToUserPortal={() => setCurrentTab('user_dashboard')}
      />

      {/* Avatar Upload / Change / Remove Modal */}
      <AvatarEditorModal
        isOpen={isAvatarEditorOpen}
        currentAvatar={authUser.avatar}
        userName={authUser.name}
        onClose={() => setIsAvatarEditorOpen(false)}
        onSaveAvatar={handleSaveAvatar}
        onRemoveAvatar={handleRemoveAvatar}
      />
    </div>
  );
}

export default App;
