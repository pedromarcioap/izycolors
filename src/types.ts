export type ColorGamut = 'sRGB' | 'Display P3' | 'Rec.2020';

export type ColorBlindnessType = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

export type NavigationTab = 
  | 'generator'
  | 'explorer'
  | 'wheel'
  | 'extractor'
  | 'lab'
  | 'accessibility'
  | 'projects'
  | 'cms'
  | 'profile';

export interface ColorItem {
  id: string;
  hex: string;
  name: string;
  locked?: boolean;
}

export interface CuratedDemoImage {
  id: string;
  name: string;
  url: string;
  tag: string;
  colors?: string[];
  isCustom?: boolean;
  createdAt?: string;
  dimensions?: string;
}

export interface Palette {
  id: string;
  title: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
    pro?: boolean;
  };
  colors: string[]; // hex codes
  likes: number;
  forks?: number;
  wcagLevel: 'WCAG 2.1 AAA Ready' | 'WCAG AAA (Text Safe)' | 'WCAG AAA Ready' | 'AA Standard';
  tags: string[];
  gamut?: string;
  staffPick?: boolean;
  createdAt: string;
  description?: string;
  forkedFrom?: {
    id: string;
    title: string;
    author: string;
    handle?: string;
  };
  isFork?: boolean;
}

export interface ColorDetails {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  hsv: { h: number; s: number; v: number };
  cmyk: { c: number; m: number; y: number; k: number };
  lab: { l: number; a: number; b: number };
  lch: { l: number; c: number; h: number };
  oklch: { l: number; c: number; h: number };
  luminance: number;
  isLight: boolean;
}

export interface ProjectWorkspace {
  id: string;
  name: string;
  clientOrBrand: string;
  description: string;
  primaryColors: string[];
  secondaryColors: string[];
  neutralGrays: string[];
  semanticTokens: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    surface: string;
    background: string;
  };
  updatedAt: string;
}

export interface CollectionBoard {
  id: string;
  title: string;
  description: string;
  tags: string[];
  isPrivate: boolean;
  paletteIds: string[];
  coverColors: string[];
  createdAt: string;
}

export interface FavoriteColor {
  id: string;
  hex: string;
  name: string;
  note: string;
  dateAdded: string;
  tags: string[];
}

export interface CmsArticle {
  id: string;
  title: string;
  slug: string;
  category: 'Teoria da Cor' | 'Design Systems' | 'Acessibilidade' | 'Tendências' | 'Estudos de Caso';
  summary: string;
  content: string;
  author: string;
  readTime: string;
  status: 'Publicado' | 'Rascunho' | 'Em Revisão';
  featured?: boolean;
  publishedAt: string;
  views: number;
}

export interface CommunitySubmission {
  id: string;
  title: string;
  author: string;
  authorHandle: string;
  authorAvatar: string;
  colors: string[];
  tags: string[];
  submittedAt: string;
  status: 'Pendente' | 'Aprovado' | 'Rejeitado';
  suggestedGamut: string;
  contrastScore: string;
}

export interface UserProfile {
  name: string;
  handle: string;
  title: string;
  bio: string;
  avatar: string;
  isPro: boolean;
  website: string;
  github: string;
  figma: string;
  behance: string;
  badges: string[];
  stats: {
    palettesCreated: number;
    palettesCreatedMonthlyDelta: number;
    clonesAndForks: string;
    globalRank: string;
    likesReceived: string;
    approvalRate: string;
    cmsArticlesCount: number;
    editorialFeaturedCount: number;
  };
  exportPreferences: {
    defaultFormat: 'HEX' | 'RGB' | 'HSL' | 'OKLCH';
    variablePrefix: string;
    namingConvention: 'kebab-case' | 'camelCase' | 'snake_case';
    includeComments: boolean;
  };
}
