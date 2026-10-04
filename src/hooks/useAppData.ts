import { useCallback, useEffect } from 'react';
import {
    AuthUser,
    AuditLogItem,
    Palette,
    ProjectWorkspace,
    CollectionBoard,
    FavoriteColor,
    VaultPalette,
    CmsArticle,
    CommunitySubmission,
    CuratedDemoImage,
    StudioStage,
    NavigationTab
} from '../types';
import { checkCurrentSession, initAuthListener, logoutAuthUser } from '../services/authService';
import {
    CreatorProfile,
    TaxonomyTag,
    fetchCreatorProfile,
    listAllProfiles,
    listArticles,
    listAuditLogs,
    listCollections,
    listCuratedImages,
    listFavoriteColors,
    listMyPalettes,
    listPalettes,
    listProjects,
    listSubmissions,
    listTaxonomyTags,
    listVaultPalettes,
    loadWorkspaceState,
    saveWorkspaceState
} from '../services/db';

type ToastType = 'success' | 'error';
type ShowToast = (message: string, type?: ToastType) => void;

interface UseAppDataParams {
    isSignedIn: boolean;
    activePalette: string[];
    activeStage: StudioStage;
    setAuthUser: (user: AuthUser | null) => void;
    setCreatorProfile: (profile: CreatorProfile | null) => void;
    setUsersList: (users: AuthUser[]) => void;
    setAuditLogs: (logs: AuditLogItem[]) => void;
    setIsBootstrapping: (value: boolean) => void;
    setCurrentTab: (tab: NavigationTab) => void;
    setPalettes: (palettes: Palette[]) => void;
    setArticles: (articles: CmsArticle[]) => void;
    setTaxonomyTags: (tags: TaxonomyTag[]) => void;
    setCuratedImages: (images: CuratedDemoImage[]) => void;
    setProjects: (projects: ProjectWorkspace[]) => void;
    setCollections: (collections: CollectionBoard[]) => void;
    setFavoriteColors: (colors: FavoriteColor[]) => void;
    setVaultPalettes: (palettes: VaultPalette[]) => void;
    setSubmissions: (submissions: CommunitySubmission[]) => void;
    setMyPalettes: (palettes: Palette[]) => void;
    setActivePalette: (colors: string[]) => void;
    setActiveStage: (stage: StudioStage) => void;
    showToast: ShowToast;
}

/**
 * Encapsula a carga de dados, o bootstrap de sessão e os efeitos de
 * sincronização do App.
 *
 * Extraído do componente `App` para manter a complexidade cognitiva baixa
 * (regra Sonar S3776): os `if`/`try-catch`/ternários de carregamento e de
 * sessão deixam de contar para o componente principal.
 */
export function useAppData(params: UseAppDataParams) {
    const {
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
    } = params;

    const loadPublicData = useCallback(async () => {
        const [nextPalettes, nextArticles, nextTags, nextCurated] = await Promise.all([
            listPalettes(),
            listArticles(),
            listTaxonomyTags(),
            listCuratedImages()
        ]);
        setPalettes(nextPalettes);
        setArticles(nextArticles);
        setTaxonomyTags(nextTags);
        setCuratedImages(nextCurated);
    }, [setPalettes, setArticles, setTaxonomyTags, setCuratedImages]);

    const loadPrivateData = useCallback(async () => {
        const [nextProjects, nextCollections, nextFavorites, nextVault, nextSubmissions, nextMine, workspace] =
            await Promise.all([
                listProjects(),
                listCollections(),
                listFavoriteColors(),
                listVaultPalettes(),
                listSubmissions(),
                listMyPalettes(),
                loadWorkspaceState()
            ]);

        setProjects(nextProjects);
        setCollections(nextCollections);
        setFavoriteColors(nextFavorites);
        setVaultPalettes(nextVault);
        setSubmissions(nextSubmissions);
        setMyPalettes(nextMine);
        setActivePalette(workspace.activePalette);
        setActiveStage(workspace.activeStage);
    }, [
        setProjects,
        setCollections,
        setFavoriteColors,
        setVaultPalettes,
        setSubmissions,
        setMyPalettes,
        setActivePalette,
        setActiveStage
    ]);

    const clearPrivateData = useCallback(() => {
        setProjects([]);
        setCollections([]);
        setFavoriteColors([]);
        setVaultPalettes([]);
        setMyPalettes([]);
        setSubmissions([]);
        setUsersList([]);
        setAuditLogs([]);
        setCreatorProfile(null);
    }, [
        setProjects,
        setCollections,
        setFavoriteColors,
        setVaultPalettes,
        setMyPalettes,
        setSubmissions,
        setUsersList,
        setAuditLogs,
        setCreatorProfile
    ]);

    /**
     * Restaura uma sessão completa (perfil + dados privados + público).
     *
     * O perfil do criador só é buscado DEPOIS de confirmar a sessão: sem login,
     * `auth.getUser()` falha e `fetchCreatorProfile()` lançaria — derrubando a
     * inicialização para o visitante anônimo, que precisa enxergar o feed público.
     */
    const bootstrapSignedIn = useCallback(async () => {
        const sessionUser = await checkCurrentSession();

        if (!sessionUser) {
            setAuthUser(null);
            clearPrivateData();
            await loadPublicData();
            return;
        }

        const profile = await fetchCreatorProfile();
        setAuthUser(sessionUser);
        setCreatorProfile(profile);
        await Promise.all([loadPublicData(), loadPrivateData()]);
    }, [setAuthUser, clearPrivateData, loadPublicData, setCreatorProfile, loadPrivateData]);

    // Bootstrap: sessão atual + conteúdo público
    useEffect(() => {
        void (async () => {
            try {
                await bootstrapSignedIn();
            } catch (err) {
                console.error('Falha ao inicializar a aplicação:', err);
                showToast(err instanceof Error ? err.message : 'Falha ao inicializar.', 'error');
            } finally {
                setIsBootstrapping(false);
            }
        })();
        // Executa uma única vez na montagem.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Assina as mudanças de sessão do Supabase Auth
    useEffect(() => {
        const unsubscribe = initAuthListener((user) => {
            if (!user) {
                setAuthUser(null);
                clearPrivateData();
                void loadPublicData();
                setCurrentTab('generator');
                return;
            }
            void (async () => {
                setAuthUser(user);
                const [profile, nextUsers, nextLogs] = await Promise.all([
                    fetchCreatorProfile(),
                    user.role === 'admin' ? listAllProfiles().catch(() => [] as AuthUser[]) : Promise.resolve([]),
                    user.role === 'admin' ? listAuditLogs().catch(() => [] as AuditLogItem[]) : Promise.resolve([])
                ]);
                setCreatorProfile(profile);
                setUsersList(nextUsers);
                setAuditLogs(nextLogs);
                await Promise.all([loadPublicData(), loadPrivateData()]);
            })();
        });

        return unsubscribe;
    }, [
        setAuthUser,
        clearPrivateData,
        loadPublicData,
        setCurrentTab,
        setCreatorProfile,
        setUsersList,
        setAuditLogs,
        loadPrivateData
    ]);

    // Guarda o estado do Estúdio no servidor (substitui o localStorage)
    useEffect(() => {
        if (!isSignedIn) return;
        const timer = setTimeout(() => {
            void saveWorkspaceState({ activePalette, activeStage }).catch((err: unknown) => {
                console.warn('Não foi possível salvar o estado do estúdio:', err);
            });
        }, 600);
        return () => clearTimeout(timer);
    }, [activePalette, activeStage, isSignedIn]);

    const handleLogout = useCallback(async () => {
        await logoutAuthUser();
        setAuthUser(null);
        clearPrivateData();
        await loadPublicData();
        setCurrentTab('generator');
        showToast('Sessão encerrada com sucesso via Supabase Auth.');
    }, [setAuthUser, clearPrivateData, loadPublicData, setCurrentTab, showToast]);

    return {
        loadPublicData,
        loadPrivateData,
        clearPrivateData,
        handleLogout
    };
}
