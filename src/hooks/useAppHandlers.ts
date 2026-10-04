import { useCallback } from 'react';
import {
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
    ProjectSlot,
    StudioStage,
    NavigationTab
} from '../types';
import {
    CreatorProfile,
    addFavoriteColor,
    addProjectPalette,
    createArticle,
    createCollection,
    createPalette,
    createProject,
    createSubmission,
    createTaxonomyTag,
    createVaultPalette,
    deleteArticle,
    deleteCollection,
    deleteFavoriteColorByHex,
    deleteProject,
    deleteProjectPalette,
    deleteVaultPalette,
    forkPalette,
    listArticles,
    listCollections,
    listCuratedImages,
    listFavoriteColors,
    listMyPalettes,
    listPalettes,
    listProjects,
    listSubmissions,
    listTaxonomyTags,
    listVaultPalettes,
    saveCuratedImage as persistCuratedImage,
    togglePaletteLike,
    updateCollection,
    updateCurrentProfile,
    updateProject,
    updateSubmissionStatus,
    deleteCuratedImage as removeCuratedImage
} from '../services/db';
import {
    uploadUserAvatar,
    removeUserAvatar,
    updateProfileAvatar
} from '../services/avatarService';

type ToastType = 'success' | 'error';
type ShowToast = (message: string, type?: ToastType) => void;
type RunMutation = (action: () => Promise<unknown>, success?: string) => Promise<boolean>;

interface UseAppHandlersParams {
    gamut: string;
    requireSession: () => boolean;
    runMutation: RunMutation;
    showToast: ShowToast;
    setActivePalette: (colors: string[]) => void;
    setActiveStage: (stage: StudioStage) => void;
    setCurrentTab: (tab: NavigationTab) => void;
    setExportPaletteTitle: (title: string) => void;
    setIsExportModalOpen: (open: boolean) => void;
    setSavePaletteModalTitle: (title: string) => void;
    setIsSavePaletteModalOpen: (open: boolean) => void;
    setFavoriteColors: (colors: FavoriteColor[]) => void;
    setVaultPalettes: (palettes: VaultPalette[]) => void;
    setProjects: (projects: ProjectWorkspace[]) => void;
    setCollections: (collections: CollectionBoard[]) => void;
    setPalettes: (palettes: Palette[]) => void;
    setMyPalettes: (palettes: Palette[]) => void;
    setSubmissions: (submissions: CommunitySubmission[]) => void;
    setArticles: (articles: CmsArticle[]) => void;
    setTaxonomyTags: (tags: Awaited<ReturnType<typeof listTaxonomyTags>>) => void;
    setCuratedImages: (images: CuratedDemoImage[]) => void;
    setCreatorProfile: (updater: (prev: CreatorProfile | null) => CreatorProfile | null) => void;
    setAuthUser: (updater: (prev: AuthUser | null) => AuthUser | null) => void;
    collections: CollectionBoard[];
    projects: ProjectWorkspace[];
    favoriteColors: FavoriteColor[];
    submissions: CommunitySubmission[];
}

/**
 * Encapsula todos os handlers de mutação do App.
 *
 * Extraído do componente `App` para manter a complexidade cognitiva baixa
 * (regra Sonar S3776): cada handler possui seus próprios `if`/`try-catch`,
 * que deixam de contar para o componente principal.
 */
export function useAppHandlers(params: UseAppHandlersParams) {
    const {
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
    } = params;

    // -------------------------------------------------------------------------
    // Handlers — Estúdio
    // -------------------------------------------------------------------------

    const handleOpenInGenerator = useCallback((colors: string[]) => {
        if (colors && colors.length > 0) setActivePalette(colors);
        setActiveStage('generate');
        setCurrentTab('generator');
    }, [setActivePalette, setActiveStage, setCurrentTab]);

    const handleSendToAudit = useCallback((colors: string[]) => {
        if (colors && colors.length > 0) setActivePalette(colors);
        setActiveStage('audit');
        setCurrentTab('generator');
    }, [setActivePalette, setActiveStage, setCurrentTab]);

    const handleOpenExport = useCallback((colors?: string[], title?: string) => {
        if (colors && colors.length > 0) setActivePalette(colors);
        if (title) setExportPaletteTitle(title);
        setIsExportModalOpen(true);
    }, [setActivePalette, setExportPaletteTitle, setIsExportModalOpen]);

    const handleSaveToFavorites = useCallback(async (hex: string, name: string) => {
        if (!requireSession()) return;
        const saved = await runMutation(
            () =>
                addFavoriteColor({
                    hex,
                    name: name || 'Amostra personalizada',
                    note: 'Salvo via Gerador / Studio',
                    tags: ['Salvo', gamut]
                }),
            `Amostra ${hex} salva com sucesso no Cofre de Cores!`
        );
        if (saved) {
            setFavoriteColors(await listFavoriteColors());
        }
    }, [requireSession, runMutation, gamut, setFavoriteColors]);

    const handleOpenSavePaletteModal = useCallback((colors?: string[], title?: string) => {
        if (!requireSession()) return;
        if (colors && colors.length > 0) setActivePalette(colors);
        setSavePaletteModalTitle(title || 'Nova Paleta Harmônica');
        setIsSavePaletteModalOpen(true);
    }, [requireSession, setActivePalette, setSavePaletteModalTitle, setIsSavePaletteModalOpen]);

    // -------------------------------------------------------------------------
    // Handlers — Cofre, projetos e coleções
    // -------------------------------------------------------------------------

    const handleSavePaletteToVault = useCallback(async (vaultPalette: VaultPalette) => {
        if (!requireSession()) return;
        const ok = await runMutation(
            async () => {
                await createVaultPalette({
                    title: vaultPalette.title,
                    description: vaultPalette.description ?? '',
                    colors: vaultPalette.colors,
                    tags: vaultPalette.tags ?? [],
                    notes: vaultPalette.notes ?? null,
                    gamut: vaultPalette.gamut ?? null,
                    wcagLevel: vaultPalette.wcagLevel ?? null
                });
            },
            `Paleta completa "${vaultPalette.title}" salva no Cofre Privado!`
        );
        if (ok) setVaultPalettes(await listVaultPalettes());
    }, [requireSession, runMutation, setVaultPalettes]);

    const handleSavePaletteToProject = useCallback(async (projectId: string, projectPalette: ProjectPalette) => {
        if (!requireSession()) return;
        const ok = await runMutation(
            () =>
                addProjectPalette(projectId, {
                    name: projectPalette.name,
                    description: projectPalette.description ?? '',
                    colors: projectPalette.colors,
                    role: projectPalette.role,
                    wcagLevel: projectPalette.wcagLevel
                }),
            `Paleta "${projectPalette.name}" adicionada ao projeto com sucesso!`
        );
        if (ok) setProjects(await listProjects());
    }, [requireSession, runMutation, setProjects]);

    const handleCreateProject = useCallback(async (project: ProjectWorkspace) => {
        if (!requireSession()) return;
        const ok = await runMutation(
            () =>
                createProject({
                    name: project.name,
                    clientOrBrand: project.clientOrBrand,
                    description: project.description,
                    primaryColors: project.primaryColors,
                    secondaryColors: project.secondaryColors,
                    neutralGrays: project.neutralGrays,
                    semanticTokens: project.semanticTokens
                }),
            `Projeto "${project.name}" criado no Cofre.`
        );
        if (ok) setProjects(await listProjects());
    }, [requireSession, runMutation, setProjects]);

    const handleCreateProjectWithPalette = useCallback(async (newProject: ProjectWorkspace) => {
        if (!requireSession()) return;
        await handleCreateProject(newProject);
        const firstProjectId = (await listProjects())[0]?.id;
        if (firstProjectId) {
            await handleSavePaletteToProject(firstProjectId, {
                id: '',
                name: `${newProject.name} — Paleta Inicial`,
                description: 'Paleta criada junto com o projeto.',
                colors: newProject.primaryColors,
                role: 'Primária',
                createdAt: '',
                wcagLevel: 'WCAG AAA'
            });
        }
    }, [requireSession, handleCreateProject, handleSavePaletteToProject]);

    const handleDeleteVaultPalette = useCallback(async (id: string) => {
        if (!requireSession()) return;
        const ok = await runMutation(() => deleteVaultPalette(id), 'Paleta removida do Cofre.');
        if (ok) setVaultPalettes(await listVaultPalettes());
    }, [requireSession, runMutation, setVaultPalettes]);

    const handleDeleteProjectPalette = useCallback(async (projectId: string, paletteId: string) => {
        if (!requireSession()) return;
        const ok = await runMutation(
            () => deleteProjectPalette(projectId, paletteId),
            'Paleta removida do projeto.'
        );
        if (ok) setProjects(await listProjects());
    }, [requireSession, runMutation, setProjects]);

    const handleSaveToCollectionBoard = useCallback(async (collectionId: string, colors: string[]) => {
        if (!requireSession()) return;
        if (!collections.some((item) => item.id === collectionId)) return;

        const ok = await runMutation(
            () => updateCollection(collectionId, { coverColors: colors }),
            'Paleta vinculada ao quadro de coleção com sucesso!'
        );
        if (ok) setCollections(await listCollections());
    }, [requireSession, collections, runMutation, setCollections]);

    const handleDeleteFavoriteColor = useCallback(async (id: string) => {
        if (!requireSession()) return;
        const target = favoriteColors.find((item) => item.id === id) ?? favoriteColors.find((item) => item.hex === id);
        if (!target) return;
        const ok = await runMutation(() => deleteFavoriteColorByHex(target.hex));
        if (ok) setFavoriteColors(await listFavoriteColors());
    }, [requireSession, favoriteColors, runMutation, setFavoriteColors]);

    const handleDeleteProject = useCallback(async (id: string) => {
        if (!requireSession()) return;
        const ok = await runMutation(() => deleteProject(id), 'Projeto removido.');
        if (ok) setProjects(await listProjects());
    }, [requireSession, runMutation, setProjects]);

    const handleCreateCollection = useCallback(async (collection: CollectionBoard) => {
        if (!requireSession()) return;
        const ok = await runMutation(
            () =>
                createCollection({
                    title: collection.title,
                    description: collection.description,
                    tags: collection.tags,
                    isPrivate: collection.isPrivate,
                    paletteIds: collection.paletteIds,
                    coverColors: collection.coverColors
                }),
            `Coleção "${collection.title}" criada.`
        );
        if (ok) setCollections(await listCollections());
    }, [requireSession, runMutation, setCollections]);

    const handleDeleteCollection = useCallback(async (id: string) => {
        if (!requireSession()) return;
        const ok = await runMutation(() => deleteCollection(id), 'Coleção excluída com sucesso.');
        if (ok) setCollections(await listCollections());
    }, [requireSession, runMutation, setCollections]);

    const handleAddColorsToProject = useCallback(async (
        projectId: string,
        targetType: ProjectSlot,
        colors: string[],
        paletteName?: string
    ) => {
        if (!requireSession()) return;
        const project = projects.find((item) => item.id === projectId);
        if (!project) return;

        if (targetType === 'palette') {
            await handleSavePaletteToProject(projectId, {
                id: '',
                name: paletteName || 'Paleta de Cores Favoritas',
                description: 'Criada a partir de amostras de cores favoritas.',
                colors,
                role: 'Acentos',
                createdAt: '',
                wcagLevel: 'WCAG AAA'
            });
            return;
        }

        let key: 'primaryColors' | 'secondaryColors' | 'neutralGrays';
        if (targetType === 'primary') {
            key = 'primaryColors';
        } else if (targetType === 'secondary') {
            key = 'secondaryColors';
        } else {
            key = 'neutralGrays';
        }
        const ok = await runMutation(
            () =>
                updateProject(projectId, {
                    [key]: Array.from(new Set([...project[key], ...colors]))
                }),
            'Cores adicionadas ao projeto.'
        );
        if (ok) setProjects(await listProjects());
    }, [requireSession, projects, handleSavePaletteToProject, runMutation, setProjects]);

    const handleAddColorsToCollection = useCallback(async (collectionId: string, colors: string[]) => {
        if (!requireSession()) return;
        const collection = collections.find((item) => item.id === collectionId);
        if (!collection) return;

        const ok = await runMutation(
            () =>
                updateCollection(collectionId, {
                    coverColors: Array.from(new Set([...collection.coverColors, ...colors]))
                })
        );
        if (ok) setCollections(await listCollections());
    }, [requireSession, collections, runMutation, setCollections]);

    // -------------------------------------------------------------------------
    // Handlers — Comunidade
    // -------------------------------------------------------------------------

    const handleLikePalette = useCallback(async (paletteId: string) => {
        if (!requireSession()) return;
        const liked = await runMutation(() => togglePaletteLike(paletteId));
        if (liked) setPalettes(await listPalettes());
    }, [requireSession, runMutation, setPalettes]);

    const handleForkPalette = useCallback(async (palette: Palette) => {
        if (!requireSession()) return;

        let forked: Palette;
        try {
            forked = await forkPalette(palette);
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Não foi possível criar o fork.', 'error');
            return;
        }

        const [nextPalettes, nextMine, nextCollections] = await Promise.all([
            listPalettes(),
            listMyPalettes(),
            listCollections()
        ]);
        setPalettes(nextPalettes);
        setMyPalettes(nextMine);

        if (nextCollections.length > 0) {
            await handleSaveToCollectionBoard(nextCollections[0].id, forked.colors);
        }

        setActivePalette(forked.colors);
        setActiveStage('generate');
        setCurrentTab('generator');
        showToast(`Fork criado com sucesso! "${forked.title}" está carregado no Estúdio.`);
    }, [requireSession, showToast, setPalettes, setMyPalettes, handleSaveToCollectionBoard, setActivePalette, setActiveStage, setCurrentTab]);

    const handleNewSubmission = useCallback(async (submission: CommunitySubmission) => {
        if (!requireSession()) return;
        const ok = await runMutation(
            () =>
                createSubmission({
                    title: submission.title,
                    author: submission.author,
                    authorHandle: submission.authorHandle,
                    authorAvatar: submission.authorAvatar,
                    colors: submission.colors,
                    tags: submission.tags,
                    suggestedGamut: submission.suggestedGamut,
                    contrastScore: submission.contrastScore
                }),
            'Paleta submetida com sucesso para o Edital da Comunidade!'
        );
        if (ok) setSubmissions(await listSubmissions());
    }, [requireSession, runMutation, setSubmissions]);

    // -------------------------------------------------------------------------
    // Handlers — CMS e curadoria
    // -------------------------------------------------------------------------

    const handleCreateArticle = useCallback(async (article: CmsArticle) => {
        const ok = await runMutation(
            () =>
                createArticle({
                    title: article.title,
                    slug: article.slug,
                    category: article.category,
                    summary: article.summary,
                    metaDescription: article.metaDescription,
                    content: article.content,
                    author: article.author,
                    readTime: article.readTime,
                    status: article.status,
                    featured: article.featured
                }),
            'Artigo publicado no CMS com sucesso!'
        );
        if (ok) setArticles(await listArticles());
    }, [runMutation, setArticles]);

    const handleDeleteArticle = useCallback(async (id: string) => {
        const ok = await runMutation(() => deleteArticle(id), 'Artigo removido do CMS.');
        if (ok) setArticles(await listArticles());
    }, [runMutation, setArticles]);

    const handleApproveSubmission = useCallback(async (id: string, asStaffPick: boolean) => {
        const submission = submissions.find((item) => item.id === id);
        if (!submission) return;

        const ok = await runMutation(async () => {
            await updateSubmissionStatus(id, 'Aprovado');
            await createPalette({
                title: submission.title,
                colors: submission.colors,
                wcagLevel: 'WCAG 2.1 AAA Ready',
                tags: submission.tags,
                gamut: submission.suggestedGamut,
                staffPick: asStaffPick,
                description: 'Submetida pela comunidade e aprovada pela Curadoria Editorial.',
                author: {
                    id: null,
                    name: submission.author,
                    handle: submission.authorHandle,
                    avatar: submission.authorAvatar
                }
            });
        }, `Paleta "${submission.title}" aprovada pela Curadoria!`);

        if (ok) {
            const [nextPalettes, nextSubmissions] = await Promise.all([listPalettes(), listSubmissions()]);
            setPalettes(nextPalettes);
            setSubmissions(nextSubmissions);
        }
    }, [submissions, runMutation, setPalettes, setSubmissions]);

    const handleRejectSubmission = useCallback(async (id: string) => {
        const ok = await runMutation(() => updateSubmissionStatus(id, 'Rejeitado'));
        if (ok) setSubmissions(await listSubmissions());
    }, [runMutation, setSubmissions]);

    const handleAddTag = useCallback(async (name: string, category: string) => {
        const ok = await runMutation(() => createTaxonomyTag(name, category));
        if (ok) setTaxonomyTags(await listTaxonomyTags());
    }, [runMutation, setTaxonomyTags]);

    // -------------------------------------------------------------------------
    // Handlers — Curadoria de imagens e perfil
    // -------------------------------------------------------------------------

    const handleSaveCuratedImage = useCallback(async (img: CuratedDemoImage) => {
        const ok = await runMutation(
            () =>
                persistCuratedImage({
                    id: img.id,
                    name: img.name,
                    url: img.url,
                    tag: img.tag,
                    colors: img.colors ?? [],
                    isCustom: img.isCustom ?? true
                }),
            'Imagem curada salva no banco.'
        );
        if (ok) setCuratedImages(await listCuratedImages());
    }, [runMutation, setCuratedImages]);

    const handleDeleteCuratedImage = useCallback(async (id: string) => {
        const ok = await runMutation(() => removeCuratedImage(id));
        if (ok) setCuratedImages(await listCuratedImages());
    }, [runMutation, setCuratedImages]);

    const handleResetCuratedImages = useCallback(async () => {
        const next = await listCuratedImages();
        setCuratedImages(next);
        showToast('Imagens curadas recarregadas do banco de dados.');
    }, [setCuratedImages, showToast]);

    const applyAvatarChange = useCallback((avatarUrl: string | null) => {
        const nextAvatar = avatarUrl || undefined;
        setCreatorProfile((prev) => (prev ? { ...prev, avatar: nextAvatar ?? prev.avatar } : prev));
        setAuthUser((prev) => (prev ? { ...prev, avatar: nextAvatar ?? prev.avatar } : prev));
    }, [setCreatorProfile, setAuthUser]);

    const handleSaveAvatar = useCallback(async (file: File) => {
        if (!requireSession()) return;
        try {
            const publicUrl = await uploadUserAvatar(file);
            await updateProfileAvatar(publicUrl);
            applyAvatarChange(publicUrl);
            showToast('Foto do perfil atualizada com sucesso.');
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Falha ao enviar o avatar.', 'error');
        }
    }, [requireSession, applyAvatarChange, showToast]);

    const handleRemoveAvatar = useCallback(async () => {
        if (!requireSession()) return;
        try {
            await removeUserAvatar();
            await updateProfileAvatar(null);
            applyAvatarChange(null);
            showToast('Foto do perfil removida.');
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Falha ao remover o avatar.', 'error');
        }
    }, [requireSession, applyAvatarChange, showToast]);

    const handleUpdateProfile = useCallback(async (updated: Partial<UserProfile>) => {
        if (!requireSession()) return;

        const patch = {
            name: updated.name,
            handle: updated.handle,
            bio: updated.bio,
            title: updated.title,
            website: updated.website,
            exportPreferences: updated.exportPreferences
        };

        try {
            const next = await updateCurrentProfile(patch);
            setCreatorProfile(() => next);
            setAuthUser((prev) =>
                prev
                    ? {
                        ...prev,
                        name: next.name,
                        handle: next.handle,
                        bio: next.bio,
                        avatar: next.avatar,
                        role: next.role
                    }
                    : prev
            );
            showToast('Perfil e preferências salvos com sucesso.');
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Falha ao salvar o perfil.', 'error');
        }
    }, [requireSession, setCreatorProfile, setAuthUser, showToast]);

    return {
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
        handleSaveCuratedImage,
        handleDeleteCuratedImage,
        handleResetCuratedImages,
        handleSaveAvatar,
        handleRemoveAvatar,
        handleUpdateProfile
    };
}
