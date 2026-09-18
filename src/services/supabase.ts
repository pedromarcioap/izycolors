import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CuratedDemoImage, Palette } from '../types';

// Default Curated Demonstration Images for Izy Colors
export const DEFAULT_CURATED_IMAGES: CuratedDemoImage[] = [
  {
    id: 'cyberpunk-shinjuku',
    name: 'Cyberpunk Shinjuku',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    tag: 'Neon & Dark',
    colors: ['#0B1B2B', '#1E3A5F', '#08BBD9', '#FF2A85', '#E2E8F0'],
    createdAt: '2026-03-01',
    isCustom: false
  },
  {
    id: 'nordic-fjord-ice',
    name: 'Nordic Fjord Ice',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    tag: 'Glacier Blue',
    colors: ['#0A192F', '#1E3A8A', '#38BDF8', '#E0F2FE', '#F8FAFC'],
    createdAt: '2026-03-02',
    isCustom: false
  },
  {
    id: 'duna-terracota',
    name: 'Duna Terracota',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&auto=format&fit=crop&q=80',
    tag: 'Ocre & Terra',
    colors: ['#451A03', '#9A3412', '#EA580C', '#FB923C', '#FEF3C7'],
    createdAt: '2026-03-03',
    isCustom: false
  },
  {
    id: 'floresta-botanica',
    name: 'Floresta Botânica',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80',
    tag: 'Matcha & Musgo',
    colors: ['#14532D', '#166534', '#22C55E', '#86EFAC', '#F0FDF4'],
    createdAt: '2026-03-04',
    isCustom: false
  },
  {
    id: 'arquitetura-suica',
    name: 'Arquitetura Suíça',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
    tag: 'Concreto & Minimal',
    colors: ['#18181B', '#3F3F46', '#71717A', '#D4D4D8', '#FAFAFA'],
    createdAt: '2026-03-05',
    isCustom: false
  }
];

const LOCAL_STORAGE_KEY_CURATED = 'chromatica_curated_images_v2';
const LOCAL_STORAGE_KEY_FORKS = 'chromatica_palette_forks_v2';
const LOCAL_STORAGE_SUPABASE_URL = 'chromatica_supabase_url';
const LOCAL_STORAGE_SUPABASE_ANON = 'chromatica_supabase_anon_key';

let cachedSupabaseClient: SupabaseClient | null = null;

// Get Supabase credentials from Vite env or user localStorage configuration
export function getSupabaseCredentials(): { url: string; key: string; isConfigured: boolean } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
  const storedUrl = localStorage.getItem(LOCAL_STORAGE_SUPABASE_URL) || '';
  const storedKey = localStorage.getItem(LOCAL_STORAGE_SUPABASE_ANON) || '';

  const url = storedUrl || envUrl;
  const key = storedKey || envKey;
  const isConfigured = Boolean(url && key && url.startsWith('http'));

  return { url, key, isConfigured };
}

// Get or lazy-create the Supabase client
export function getSupabaseClient(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;

  if (!cachedSupabaseClient) {
    try {
      cachedSupabaseClient = createClient(url, key, {
        auth: { persistSession: true }
      });
    } catch (err) {
      console.warn('Falha ao inicializar cliente Supabase:', err);
      return null;
    }
  }
  return cachedSupabaseClient;
}

// Set custom credentials at runtime from UI modal
export function setCustomSupabaseCredentials(url: string, key: string) {
  if (url && key) {
    localStorage.setItem(LOCAL_STORAGE_SUPABASE_URL, url.trim());
    localStorage.setItem(LOCAL_STORAGE_SUPABASE_ANON, key.trim());
    cachedSupabaseClient = null; // force reload
  } else {
    localStorage.removeItem(LOCAL_STORAGE_SUPABASE_URL);
    localStorage.removeItem(LOCAL_STORAGE_SUPABASE_ANON);
    cachedSupabaseClient = null;
  }
}

// -------------------------------------------------------------
// CURATED DEMO IMAGES PERSISTENCE SERVICE
// -------------------------------------------------------------

// Load all curated demonstration images
export async function loadCuratedImages(): Promise<CuratedDemoImage[]> {
  // 1. Try local storage first for instant synchronous UI render
  let localList: CuratedDemoImage[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CURATED);
    if (raw) {
      localList = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Erro ao ler cache local de imagens curadas:', err);
  }

  // If local list is empty, initialize with defaults
  if (!localList || localList.length === 0) {
    localList = [...DEFAULT_CURATED_IMAGES];
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CURATED, JSON.stringify(localList));
    } catch (e) {
      // ignore
    }
  }

  // 2. If Supabase is connected, attempt to sync from cloud
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('curated_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Map from Supabase table format
        const cloudImages: CuratedDemoImage[] = data.map((item: any) => ({
          id: item.id || `curated-${Date.now()}`,
          name: item.name || item.title || 'Imagem Curada',
          url: item.url || item.image_url,
          tag: item.tag || item.category || 'Curadoria',
          colors: item.colors || [],
          isCustom: item.is_custom ?? true,
          createdAt: item.created_at || new Date().toISOString()
        }));

        // Merge cloud with defaults ensuring uniqueness by ID
        const merged = [...cloudImages];
        for (const def of DEFAULT_CURATED_IMAGES) {
          if (!merged.some(m => m.id === def.id)) {
            merged.push(def);
          }
        }
        localStorage.setItem(LOCAL_STORAGE_KEY_CURATED, JSON.stringify(merged));
        return merged;
      }
    } catch (cloudErr) {
      console.warn('Supabase offline ou tabela inexistente, utilizando cache local persistente:', cloudErr);
    }
  }

  return localList;
}

// Save a curated demo image (persist locally + to Supabase if connected)
export async function saveCuratedImage(image: CuratedDemoImage): Promise<CuratedDemoImage[]> {
  const current = await loadCuratedImages();
  const existingIndex = current.findIndex(i => i.id === image.id);
  let updatedList: CuratedDemoImage[];

  if (existingIndex >= 0) {
    updatedList = [...current];
    updatedList[existingIndex] = { ...image };
  } else {
    updatedList = [image, ...current];
  }

  // Save to local storage immediately
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_CURATED, JSON.stringify(updatedList));
  } catch (storageErr) {
    console.warn('LocalStorage quota or write error:', storageErr);
  }

  // Sync to Supabase if available
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('curated_images')
        .upsert({
          id: image.id,
          name: image.name,
          url: image.url,
          tag: image.tag,
          colors: image.colors || [],
          is_custom: image.isCustom ?? true,
          created_at: image.createdAt || new Date().toISOString()
        });
    } catch (e) {
      console.warn('Falha ao sincronizar imagem curada com Supabase:', e);
    }
  }

  return updatedList;
}

// Delete a curated demo image
export async function deleteCuratedImage(imageId: string): Promise<CuratedDemoImage[]> {
  const current = await loadCuratedImages();
  const updatedList = current.filter(img => img.id !== imageId);

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_CURATED, JSON.stringify(updatedList));
  } catch (e) {
    // ignore
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('curated_images')
        .delete()
        .eq('id', imageId);
    } catch (e) {
      console.warn('Falha ao remover imagem do Supabase:', e);
    }
  }

  return updatedList;
}

// Reset curated demo images to factory defaults
export function resetCuratedImagesToDefaults(): CuratedDemoImage[] {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_CURATED, JSON.stringify(DEFAULT_CURATED_IMAGES));
  } catch (e) {
    // ignore
  }
  return [...DEFAULT_CURATED_IMAGES];
}

// Check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return getSupabaseCredentials().isConfigured;
}

// Reset curated images to initial demonstration defaults
export async function resetCuratedImages(): Promise<void> {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY_CURATED);
  } catch (e) {}
}

// -------------------------------------------------------------
// FORKS & CLONES SERVICE
// -------------------------------------------------------------

export interface ForkRecord {
  id: string;
  originalPaletteId: string;
  originalTitle: string;
  originalAuthor: string;
  forkedPalette: Palette;
  createdAt: string;
}

// Load all user forks
export async function loadForks(): Promise<ForkRecord[]> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_FORKS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler forks salvos:', err);
  }
  return [];
}

// Save a fork record (locally and to Supabase)
export async function recordPaletteFork(
  originalPalette: Palette,
  authorOrProfile: string | { name: string; handle: string; avatar?: string },
  authorHandle?: string,
  authorAvatar?: string,
  customTitle?: string
): Promise<{ forkedPalette: Palette; allForks: ForkRecord[] }> {
  const forkId = `fork-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const title = customTitle || `${originalPalette.title} (Fork)`;

  const name = typeof authorOrProfile === 'object' ? authorOrProfile.name : authorOrProfile;
  const handle = typeof authorOrProfile === 'object' ? authorOrProfile.handle : (authorHandle || '@criador');
  const avatar = typeof authorOrProfile === 'object' ? (authorOrProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80') : (authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  const forkedPalette: Palette = {
    id: forkId,
    title,
    author: {
      name,
      handle,
      avatar,
      pro: true
    },
    colors: [...originalPalette.colors],
    likes: 1,
    forks: 0,
    wcagLevel: originalPalette.wcagLevel,
    tags: Array.from(new Set([...originalPalette.tags, 'Fork da Comunidade'])),
    gamut: originalPalette.gamut || 'Display P3',
    staffPick: false,
    createdAt: 'Agora',
    description: `Fork e derivação cromática originada de "${originalPalette.title}" por @${originalPalette.author.handle}.`,
    forkedFrom: {
      id: originalPalette.id,
      title: originalPalette.title,
      author: originalPalette.author.name,
      handle: originalPalette.author.handle
    },
    isFork: true
  };

  const forkRecord: ForkRecord = {
    id: forkId,
    originalPaletteId: originalPalette.id,
    originalTitle: originalPalette.title,
    originalAuthor: originalPalette.author.name,
    forkedPalette,
    createdAt: new Date().toISOString()
  };

  const existing = await loadForks();
  const updatedForks = [forkRecord, ...existing];

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_FORKS, JSON.stringify(updatedForks));
  } catch (e) {
    console.warn('Erro ao salvar fork no localStorage:', e);
  }

  // Sync to Supabase if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('palette_forks')
        .insert({
          id: forkId,
          original_palette_id: originalPalette.id,
          original_title: originalPalette.title,
          original_author: originalPalette.author.name,
          colors: originalPalette.colors,
          forked_by: handle,
          created_at: new Date().toISOString()
        });
    } catch (err) {
      console.warn('Falha ao sincronizar fork com Supabase:', err);
    }
  }

  return { forkedPalette, allForks: updatedForks };
}

