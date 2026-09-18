import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { FooterBar } from './components/FooterBar';
import { GeneratorView } from './components/GeneratorView';
import { ExplorerView } from './components/ExplorerView';
import { HarmonicWheelView } from './components/HarmonicWheelView';
import { ImageExtractorView } from './components/ImageExtractorView';
import { ColorSpaceLabView } from './components/ColorSpaceLabView';
import { AccessibilityView } from './components/AccessibilityView';
import { ProjectsVaultView } from './components/ProjectsVaultView';
import { CmsAdminView } from './components/CmsAdminView';
import { ProfileView } from './components/ProfileView';
import { CommandPalette } from './components/CommandPalette';
import { ExportModal } from './components/ExportModal';
import { SubmitPaletteModal } from './components/SubmitPaletteModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';

import { 
  NavigationTab, 
  ColorGamut, 
  Palette, 
  ProjectWorkspace, 
  CollectionBoard, 
  FavoriteColor, 
  CmsArticle, 
  CommunitySubmission, 
  UserProfile,
  CuratedDemoImage
} from './types';

import { 
  INITIAL_PALETTES, 
  INITIAL_USER_PROFILE, 
  INITIAL_PROJECTS, 
  INITIAL_COLLECTIONS, 
  INITIAL_FAVORITE_COLORS, 
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
  isSupabaseConfigured
} from './services/supabase';

import { Menu, Sparkles, Sliders, Database, GitFork, Download, Check } from 'lucide-react';

export function App() {
  // Navigation & Gamut State
  const [currentTab, setCurrentTab] = useState<NavigationTab>('generator');
  const [gamut, setGamut] = useState<ColorGamut>('Display P3');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(false);

  // Supabase & Persistence State
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(isSupabaseConfigured());
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
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

  const [articles, setArticles] = useState<CmsArticle[]>(() => {
    const saved = localStorage.getItem('chromatica_articles');
    return saved ? JSON.parse(saved) : INITIAL_CMS_ARTICLES;
  });

  const [submissions, setSubmissions] = useState<CommunitySubmission[]>(() => {
    const saved = localStorage.getItem('chromatica_submissions');
    return saved ? JSON.parse(saved) : INITIAL_SUBMISSIONS;
  });

  const [taxonomyTags, setTaxonomyTags] = useState(INITIAL_TAXONOMY_TAGS);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);

  // Generator Seed State
  const [generatorSeed, setGeneratorSeed] = useState<string[]>(['#0E1726', '#08BBD9', '#3B82F6', '#9354F5', '#FF2A85']);

  // Modals state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportColors, setExportColors] = useState<string[]>(['#0E1726', '#08BBD9', '#3B82F6', '#9354F5', '#FF2A85']);
  const [exportPaletteTitle, setExportPaletteTitle] = useState<string>('Izy Colors System Palette');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 3500);
  }, []);

  // Load curated images on mount
  useEffect(() => {
    loadCuratedImages().then(images => {
      setCuratedImages(images);
    });
  }, []);

  // Check Supabase connection
  const checkSupabaseStatus = useCallback(() => {
    setIsSupabaseConnected(isSupabaseConfigured());
  }, []);

  // Persistence to local storage
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
    localStorage.setItem('chromatica_articles', JSON.stringify(articles));
  }, [articles]);

  useEffect(() => {
    localStorage.setItem('chromatica_submissions', JSON.stringify(submissions));
  }, [submissions]);

  // Open any palette into the Generator
  const handleOpenInGenerator = (colors: string[]) => {
    setGeneratorSeed(colors);
    setCurrentTab('generator');
  };

  // Open Export Modal with given or default colors
  const handleOpenExport = (colors?: string[], title?: string) => {
    setExportColors(colors || generatorSeed);
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

  // Save current palette to a collection
  const handleSaveToCollection = (colors: string[]) => {
    setCollections(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[0] = {
        ...updated[0],
        coverColors: colors
      };
      return updated;
    });
    showToast(`Paleta salva com sucesso na coleção "${collections[0]?.title || 'Recentes'}"!`);
  };

  // Likes on community palettes
  const handleLikePalette = (paletteId: string) => {
    setPalettes(prev => prev.map(p => p.id === paletteId ? { ...p, likes: p.likes + 1 } : p));
  };

  // Forks & Clones Handler
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

    showToast(`Fork criado com sucesso! "${forkedPalette.title}" está disponível no seu Cofre e Explorar.`);
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
        userProfile={userProfile}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenExportModal={() => handleOpenExport()}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        favoritesCount={favoriteColors.length}
        projectsCount={projects.length}
        forksCount={forksCount}
        isExpanded={isSidebarExpanded}
        onToggleExpanded={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      {/* Main Content Viewport (offset by sidebar width dynamically) */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarExpanded ? 'pl-64' : 'pl-16'
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
                {currentTab === 'generator' && 'Gerador Procedural Oklch'}
                {currentTab === 'projects' && 'Cofre de Projetos & Coleções'}
                {currentTab === 'explorer' && 'Comunidade & Forks'}
                {currentTab === 'wheel' && 'Roda Harmônica Adobe'}
                {currentTab === 'extractor' && 'Extrator de Imagens & Curador'}
                {currentTab === 'lab' && 'Color Space Lab (P3 / Rec.2020)'}
                {currentTab === 'accessibility' && 'Auditoria Acessibilidade WCAG / APCA'}
                {currentTab === 'cms' && 'CMS Editorial & Curadoria'}
                {currentTab === 'profile' && 'Perfil de Criador'}
              </span>
              <span className="text-[10px] font-mono text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/20 px-1.5 py-0.5 rounded uppercase hidden md:inline-block">
                {gamut}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className={`h-8 px-2.5 rounded-lg text-xs font-mono border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isSupabaseConnected 
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
                  : 'bg-[#181C24] border-white/[0.08] text-[#94A3B8] hover:text-white'
              }`}
              title="Status do Banco de Dados / Supabase"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isSupabaseConnected ? 'Supabase Conectado' : 'Supabase Sync'}
              </span>
            </button>

            <button
              onClick={() => handleOpenExport()}
              className="h-8 px-3 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Exportar para Adobe Illustrator (.jsx / .ase) e Código"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar Amostras</span>
            </button>
          </div>
        </header>

        {/* Floating Toast Notification */}
        {notificationToast && (
          <div className="fixed top-20 right-6 z-50 bg-[#141A24] border border-[#06B6D4]/40 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-4">
            <Check className="w-4 h-4 text-[#06B6D4] shrink-0" />
            <span>{notificationToast}</span>
          </div>
        )}

        {/* Main Studio Views Router */}
        <main className="flex-1 flex flex-col min-w-0">
          {currentTab === 'generator' && (
            <GeneratorView
              initialColors={generatorSeed}
              onSaveToFavorites={handleSaveToFavorites}
              onSaveToCollection={handleSaveToCollection}
              onOpenExport={handleOpenExport}
            />
          )}

          {currentTab === 'explorer' && (
            <ExplorerView
              palettes={palettes}
              onOpenInGenerator={handleOpenInGenerator}
              onSaveToCollection={handleSaveToCollection}
              onLikePalette={handleLikePalette}
              onForkPalette={handleForkPalette}
              onOpenSubmissionModal={() => setIsSubmitModalOpen(true)}
            />
          )}

          {currentTab === 'wheel' && (
            <HarmonicWheelView
              onOpenInGenerator={handleOpenInGenerator}
              onSaveToCollection={handleSaveToCollection}
            />
          )}

          {currentTab === 'extractor' && (
            <ImageExtractorView
              curatedImages={curatedImages}
              onOpenInGenerator={handleOpenInGenerator}
              onSaveToCollection={handleSaveToCollection}
              onSaveCuratedImage={handleSaveCuratedImage}
              onDeleteCuratedImage={handleDeleteCuratedImage}
              onResetCuratedImages={handleResetCuratedImages}
              isSupabaseConnected={isSupabaseConnected}
              onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
            />
          )}

          {currentTab === 'lab' && (
            <ColorSpaceLabView
              onOpenInGenerator={handleOpenInGenerator}
              onSaveToCollection={handleSaveToCollection}
            />
          )}

          {currentTab === 'accessibility' && (
            <AccessibilityView
              initialColors={generatorSeed}
              onOpenInGenerator={handleOpenInGenerator}
            />
          )}

          {currentTab === 'projects' && (
            <ProjectsVaultView
              projects={projects}
              collections={collections}
              favoriteColors={favoriteColors}
              onOpenInGenerator={handleOpenInGenerator}
              onOpenExport={handleOpenExport}
              onCreateProject={handleCreateProject}
              onCreateCollection={handleCreateCollection}
              onDeleteFavoriteColor={handleDeleteFavoriteColor}
              onDeleteCollection={handleDeleteCollection}
            />
          )}

          {currentTab === 'cms' && (
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
          )}

          {currentTab === 'profile' && (
            <ProfileView
              userProfile={userProfile}
              palettes={palettes}
              projects={projects}
              collections={collections}
              onOpenInGenerator={handleOpenInGenerator}
              onSaveToCollection={handleSaveToCollection}
              onOpenExport={handleOpenExport}
              onUpdateProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated }))}
            />
          )}
        </main>

        {/* Floating telemetry footer bar */}
        <FooterBar
          gamut={gamut}
          onQuickGenerate={() => {
            setCurrentTab('generator');
            setGeneratorSeed(prev => [...prev].reverse());
          }}
        />
      </div>

      {/* Command Palette (⌘K) Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setCurrentTab}
        onQuickGenerate={() => {
          setCurrentTab('generator');
          setGeneratorSeed(prev => [...prev].reverse());
        }}
        onGamutChange={setGamut}
        onOpenExport={() => handleOpenExport()}
      />

      {/* Export Tokens Modal with Adobe Illustrator & Swatches support */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        colors={exportColors}
        paletteTitle={exportPaletteTitle}
      />

      {/* Community Challenge Submission Modal */}
      <SubmitPaletteModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handleNewSubmission}
        defaultColors={generatorSeed}
      />

      {/* Supabase Persistence & Database Configuration Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConnectionChange={checkSupabaseStatus}
      />
    </div>
  );
}

export default App;
