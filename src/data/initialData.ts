import { Palette, UserProfile, ProjectWorkspace, CollectionBoard, FavoriteColor, CmsArticle, CommunitySubmission } from '../types';

export const INITIAL_PALETTES: Palette[] = [
  {
    id: 'midnight-aurora',
    title: 'Midnight Aurora',
    author: {
      name: 'Marcus UI',
      handle: '@marcus_ui',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      pro: true
    },
    colors: ['#0E1726', '#223249', '#08BBD9', '#3B82F6', '#9354F5'],
    likes: 3840,
    forks: 1420,
    wcagLevel: 'WCAG 2.1 AAA Ready',
    tags: ['Dark Mode', 'Dark Mode Safe', 'Oklab Calibrado'],
    gamut: 'P3 Display Gamut',
    staffPick: true,
    createdAt: 'há 2 dias',
    description: 'Paleta balanceada para interfaces escuras com luminescência ciano e violeta.'
  },
  {
    id: 'tokyo-synthwave',
    title: 'Tokyo Synthwave',
    author: {
      name: 'Elena Dev',
      handle: '@elena_dev',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      pro: true
    },
    colors: ['#280F3E', '#4B1865', '#FF2A85', '#7A0BC0', '#4CD7F6'],
    likes: 2410,
    forks: 890,
    wcagLevel: 'WCAG AAA Ready',
    tags: ['Neon & Cyber', 'P3 Display Gamut', 'Vibrante'],
    gamut: 'Display P3',
    staffPick: false,
    createdAt: 'há 3 dias',
    description: 'Gradiente cibernético saturado com inspiração nos letreiros noturnos de Shinjuku.'
  },
  {
    id: 'matcha-latte-cream',
    title: 'Matcha Latte & Cream',
    author: {
      name: 'Studio Forma',
      handle: '@studio_forma',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      pro: false
    },
    colors: ['#2F4432', '#58735A', '#A0B89C', '#E2EBD3', '#FAFBF7'],
    likes: 1420,
    forks: 560,
    wcagLevel: 'WCAG AAA (Text Safe)',
    tags: ['Minimalista', 'Editorial Orgânico', 'Pastel'],
    gamut: 'sRGB',
    staffPick: true,
    createdAt: 'há 4 dias',
    description: 'Tons terrosos e botânicos de alta neutralidade estética para design editorial e embalagens.'
  },
  {
    id: 'desert-mirage',
    title: 'Desert Mirage',
    author: {
      name: 'Clara Dune',
      handle: '@clara_dune',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      pro: false
    },
    colors: ['#4E2817', '#9E4413', '#E67E22', '#F39C12', '#FBE7C6'],
    likes: 952,
    forks: 310,
    wcagLevel: 'WCAG 2.1 AAA Ready',
    tags: ['Outono & Terra', 'Oklab Calibrado', 'Quente'],
    gamut: 'Display P3',
    staffPick: false,
    createdAt: 'há 5 dias',
    description: 'Harmonia análoga em tons ocre, terracota e areia dourada.'
  },
  {
    id: 'deep-ocean-trench',
    title: 'Deep Ocean Trench',
    author: {
      name: 'Kael Abyss',
      handle: '@kael_abyss',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      pro: true
    },
    colors: ['#081628', '#0B2D52', '#0070BA', '#00A8E8', '#8EE4F5'],
    likes: 1940,
    forks: 670,
    wcagLevel: 'WCAG 2.1 AAA Ready',
    tags: ['Monocromático Azul', 'Dark Mode Safe', 'Oklch Calibrado'],
    gamut: 'Display P3',
    staffPick: false,
    createdAt: 'há 6 dias',
    description: 'Degradê abissal com rigorosa transição de luminosidade Oklch Luma.'
  },
  {
    id: 'nordic-glacier-frost',
    title: 'Nordic Glacier Frost',
    author: {
      name: 'Astrid Oslo',
      handle: '@astrid_oslo',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      pro: false
    },
    colors: ['#1C232E', '#3D4958', '#697A8D', '#CBD5E1', '#F1F5F9'],
    likes: 1120,
    forks: 410,
    wcagLevel: 'WCAG AAA Ready',
    tags: ['Minimalista', 'Clean Slate', 'Frio'],
    gamut: 'sRGB',
    staffPick: false,
    createdAt: 'há 1 semana',
    description: 'Tons de ardósia e gelo nórdico com equilíbrio perfeito de cinzas neutros.'
  },
  {
    id: 'velvet-burgundy-sunset',
    title: 'Velvet Burgundy Sunset',
    author: {
      name: 'Valentin V',
      handle: '@valentin_v',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      pro: true
    },
    colors: ['#280816', '#59112F', '#9B1D45', '#ED3D63', '#FFCAD4'],
    likes: 3120,
    forks: 1100,
    wcagLevel: 'WCAG AAA Ready',
    tags: ['Retrô Vintage', 'Staff Pick', 'Vinho & Carmim'],
    gamut: 'Rec.2020',
    staffPick: true,
    createdAt: 'há 1 semana',
    description: 'Paleta luxuosa para moda e e-commerce de alto padrão com carmim veludo.'
  },
  {
    id: 'cyberpunk-limelight',
    title: 'Cyberpunk Limelight',
    author: {
      name: 'GLSL Wizard',
      handle: '@glsl_wizard',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      pro: true
    },
    colors: ['#0A200B', '#114B15', '#1FE365', '#8CEE28', '#F5BC00'],
    likes: 874,
    forks: 230,
    wcagLevel: 'WCAG AAA Ready',
    tags: ['High Frequency', 'Neon & Cyber', 'Display P3'],
    gamut: 'Display P3',
    staffPick: false,
    createdAt: 'há 1 semana',
    description: 'Verdes bio-elétricos e citrino com saturação máxima para arte generativa.'
  },
  // Profile curated palettes (Image 5)
  {
    id: 'hyper-nordic-cyber',
    title: 'Hyper-Nordic Cyber',
    author: {
      name: 'Helena Vance',
      handle: '@helena.design',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      pro: true
    },
    colors: ['#00B4D8', '#48CAE4', '#90E0EF', '#C77DFF', '#FF007F'],
    likes: 24800,
    forks: 12100,
    wcagLevel: 'WCAG 2.1 AAA Ready',
    tags: ['WCAG AAA', 'Cibernético Polar', 'P3 Gamut'],
    gamut: 'Display P3',
    staffPick: true,
    createdAt: 'há 2 semanas',
    description: 'Gradiente cibernético polar com saturação balanceada para dashboards futuristas.'
  },
  {
    id: 'neural-bioluminescence',
    title: 'Neural Bioluminescence',
    author: {
      name: 'Helena Vance',
      handle: '@helena.design',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      pro: true
    },
    colors: ['#031B28', '#073B4C', '#06D6A0', '#00BBF9', '#D8F3DC'],
    likes: 19200,
    forks: 8900,
    wcagLevel: 'WCAG AAA (Text Safe)',
    tags: ['OKLCH Curated', 'Dark Mode Safe', 'Bio Ocean'],
    gamut: 'Rec.2020',
    staffPick: true,
    createdAt: 'há 3 semanas',
    description: 'Inspirado em profundezas oceânicas com luminescência celular sutil.'
  },
  {
    id: 'deep-ultraviolet-prism',
    title: 'Deep Ultraviolet Prism',
    author: {
      name: 'Helena Vance',
      handle: '@helena.design',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      pro: true
    },
    colors: ['#120078', '#240090', '#4A0E4E', '#5865F2', '#8EA7E9'],
    likes: 31500,
    forks: 15700,
    wcagLevel: 'WCAG 2.1 AAA Ready',
    tags: ['P3 Gamut', 'Lavanda & Índigo', 'UI Dark Mode'],
    gamut: 'Display P3',
    staffPick: true,
    createdAt: 'há 1 mês',
    description: 'Espectro de lavandas e índigo puro calibrado para SaaS de inteligência artificial.'
  },
  {
    id: 'acid-editorial-gradient',
    title: 'Acid Editorial Gradient',
    author: {
      name: 'Helena Vance',
      handle: '@helena.design',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      pro: true
    },
    colors: ['#440026', '#BD005C', '#845EC2', '#D65DB1', '#FFC75F'],
    likes: 14700,
    forks: 6400,
    wcagLevel: 'WCAG AAA Ready',
    tags: ['APCA 82', 'Moda Digital', 'Vibrante'],
    gamut: 'Display P3',
    staffPick: false,
    createdAt: 'há 1 mês',
    description: 'Harmonia experimental para publicações de moda digital e pôsteres suíços contemporâneos.'
  },
  {
    id: 'bauhaus-concrete-red',
    title: 'Bauhaus Concrete & Red',
    author: {
      name: 'Helena Vance',
      handle: '@helena.design',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      pro: true
    },
    colors: ['#1A1C20', '#343A40', '#6C757D', '#E9ECEF', '#E63946'],
    likes: 11200,
    forks: 4900,
    wcagLevel: 'WCAG 2.1 AAA Ready',
    tags: ['Editorial', 'Brutalismo', 'Design Suíço'],
    gamut: 'sRGB',
    staffPick: true,
    createdAt: 'há 2 meses',
    description: 'Monocromático brutalista pontuado por carmesim suíço de alto impacto óptico.'
  },
  {
    id: 'quantum-emerald-clean',
    title: 'Quantum Emerald Clean',
    author: {
      name: 'Helena Vance',
      handle: '@helena.design',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      pro: true
    },
    colors: ['#0A2527', '#0F4C5C', '#00A896', '#02C39A', '#72EFDD'],
    likes: 28100,
    forks: 13400,
    wcagLevel: 'WCAG 2.1 AAA Ready',
    tags: ['Fintech Pro', 'Espectro Verde', 'Clean UI'],
    gamut: 'Display P3',
    staffPick: true,
    createdAt: 'há 2 meses',
    description: 'Espectro de alta legibilidade criado especialmente para plataformas financeiras e crypto.'
  }
];

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'Helena Vance',
  handle: '@helena.design',
  title: 'Lead Design Technologist & Color Specialist',
  bio: 'Especialista em acessibilidade digital, design systems e espaços de cor perceptuais. Criando tokens cromáticos para produtos escaláveis na Europa e América Latina.',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  isPro: true,
  website: 'helenavance.design',
  github: 'github.com/helenavance',
  figma: 'figma.com/@helena',
  behance: 'behance.net/helenavance',
  badges: ['Top 1% Curator', '100k+ Paletas Salvas', 'WCAG Master (AAA)', 'OKLCH Pioneer'],
  stats: {
    palettesCreated: 428,
    palettesCreatedMonthlyDelta: 18,
    clonesAndForks: '142.8k',
    globalRank: '#3',
    likesReceived: '89.4k',
    approvalRate: '99.2%',
    cmsArticlesCount: 12,
    editorialFeaturedCount: 4
  },
  exportPreferences: {
    defaultFormat: 'OKLCH',
    variablePrefix: 'sys-color',
    namingConvention: 'kebab-case',
    includeComments: true
  }
};

export const INITIAL_PROJECTS: ProjectWorkspace[] = [
  {
    id: 'proj-fintech-aurora',
    name: 'Aurora Financial Design System',
    clientOrBrand: 'Aurora Bank UK',
    description: 'Sistema completo de design tokens cromáticos para aplicativo mobile e web banking internacional.',
    primaryColors: ['#08BBD9', '#3B82F6', '#9354F5'],
    secondaryColors: ['#10B981', '#F59E0B', '#EF4444'],
    neutralGrays: ['#0B0F17', '#181C24', '#262A33', '#94A3B8', '#F8FAFC'],
    semanticTokens: {
      primary: '#08BBD9',
      secondary: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      surface: '#181C24',
      background: '#0B0F17'
    },
    updatedAt: 'Hoje às 11:42'
  },
  {
    id: 'proj-editorial-suico',
    name: 'Revista Espaço & Tipografia',
    clientOrBrand: 'Zürich Press',
    description: 'Paleta editorial com alta densidade monocromática e carmesim brutalista.',
    primaryColors: ['#1A1C20', '#6C757D', '#E63946'],
    secondaryColors: ['#F39C12', '#2F4432'],
    neutralGrays: ['#111827', '#1F2937', '#4B5563', '#E5E7EB', '#FFFFFF'],
    semanticTokens: {
      primary: '#E63946',
      secondary: '#1A1C20',
      success: '#2F4432',
      warning: '#F39C12',
      error: '#E63946',
      surface: '#F8FAFC',
      background: '#FFFFFF'
    },
    updatedAt: 'Ontem às 18:20'
  }
];

export const INITIAL_COLLECTIONS: CollectionBoard[] = [
  {
    id: 'col-editorial-outono',
    title: 'Editorial Outono',
    description: 'Paletas em terracota, mostarda ocre e musgo terroso para catálogos de moda.',
    tags: ['Outono', 'Terra', 'Moda', 'Editorial'],
    isPrivate: false,
    paletteIds: ['desert-mirage', 'matcha-latte-cream'],
    coverColors: ['#4E2817', '#9E4413', '#E67E22', '#F39C12', '#FBE7C6'],
    createdAt: '12 Out 2025'
  },
  {
    id: 'col-ui-dark-mode',
    title: 'UI Dark Mode & Cyberpunk',
    description: 'Sistemas de alta luminescência em fundo obsidian sem fadiga ocular.',
    tags: ['Dark Mode', 'Cyberpunk', 'Oklch', 'OLED'],
    isPrivate: false,
    paletteIds: ['midnight-aurora', 'tokyo-synthwave', 'hyper-nordic-cyber'],
    coverColors: ['#0E1726', '#08BBD9', '#3B82F6', '#9354F5', '#FF2A85'],
    createdAt: '28 Jan 2026'
  },
  {
    id: 'col-biophilic-spaces',
    title: 'Espaços Biofílicos & Orgânicos',
    description: 'Cromática suave inspirada em jardins japoneses e musgo.',
    tags: ['Orgânico', 'Botânico', 'Pastel'],
    isPrivate: true,
    paletteIds: ['matcha-latte-cream', 'neural-bioluminescence'],
    coverColors: ['#2F4432', '#58735A', '#A0B89C', '#E2EBD3', '#FAFBF7'],
    createdAt: '04 Mar 2026'
  }
];

export const INITIAL_FAVORITE_COLORS: FavoriteColor[] = [
  {
    id: 'fav-1',
    hex: '#08BBD9',
    name: 'Cyan Laser Pulse',
    note: 'Acento primário em botões e badges com aprovação WCAG AAA sobre obsidian.',
    dateAdded: '15 Fev 2026',
    tags: ['Acento', 'P3 Gamut', 'Ciano']
  },
  {
    id: 'fav-2',
    hex: '#6366F1',
    name: 'Electric Indigo',
    note: 'Cor de foco de estado ativo e botões primários no design system.',
    dateAdded: '20 Fev 2026',
    tags: ['Primária', 'Indigo', 'Foco']
  },
  {
    id: 'fav-3',
    hex: '#FF2A85',
    name: 'Hyper Pink Shinjuku',
    note: 'Usada para highlights no modo dark e marcação de harmonias.',
    dateAdded: '01 Mar 2026',
    tags: ['Neon', 'Destaque', 'Rosa']
  },
  {
    id: 'fav-4',
    hex: '#06D6A0',
    name: 'Neural Emerald Bioluminescent',
    note: 'Ideal para gráficos de crescimento fintech com taxa positiva de conversão.',
    dateAdded: '08 Mar 2026',
    tags: ['Sucesso', 'Bio', 'Esmeralda']
  },
  {
    id: 'fav-5',
    hex: '#0B0F17',
    name: 'Deep Obsidian Void',
    note: 'Fundo padrão da interface sem reflexos parasitas de cor.',
    dateAdded: '10 Mar 2026',
    tags: ['Superfície', 'Dark Base', 'Obsidian']
  },
  {
    id: 'fav-6',
    hex: '#E63946',
    name: 'Swiss Brutalism Crimson',
    note: 'Vermelho de alta energia para tipografia editorial e CTAs marcantes.',
    dateAdded: '14 Mar 2026',
    tags: ['Vermelho', 'Suíço', 'Editorial']
  }
];

export const INITIAL_CMS_ARTICLES: CmsArticle[] = [
  {
    id: 'art-1',
    title: 'Por que o espaço OKLCH está substituindo o HSL e HEX nos Design Systems modernos',
    slug: 'oklch-vs-hsl-design-systems',
    category: 'Teoria da Cor',
    summary: 'Uma análise matemática sobre uniformidade perceptual, interpolação de gradientes sem áreas cinzas mortas e suporte nativo em CSS com gamuts Display P3.',
    content: `O modelo HSL (Hue, Saturation, Lightness), introduzido na computação na década de 1970, foi uma excelente abstração simplificada para programadores, mas possui uma falha fundamental: ele não é perceptualmente uniforme. Um amarelo puro com 50% de lightness no HSL parece exponencialmente mais brilhante aos olhos humanos do que um azul puro com os mesmos 50% de lightness.

O espaço Oklch (desenvolvido por Björn Ottosson em 2020) resolve este problema calculando a luminosidade de acordo com a resposta física dos cones da retina humana. Quando interpolamos dois tons em Oklch ou Oklab, não passamos pelo infame "vale da morte cinzento" onde as cores intermediárias perdem saturação.

Além disso, com a proliferação de telas Retina e OLED com suporte ao gamut Display P3 e Rec.2020, o Oklch nos permite acessar cores 30% mais vívidas que o sRGB jamais conseguiria renderizar.`,
    author: 'Helena Vance',
    readTime: '6 min de leitura',
    status: 'Publicado',
    featured: true,
    publishedAt: '14 Mar 2026',
    views: 4890
  },
  {
    id: 'art-2',
    title: 'WCAG 2.1 vs APCA: A nova ciência do contraste perceptual para tipografia digital',
    slug: 'wcag-vs-apca-contraste-perceptual',
    category: 'Acessibilidade',
    summary: 'Como o algoritmo APCA do futuro padrão WCAG 3.0 avalia o peso da fonte, espessura dos traços e polaridade fundo-texto com precisão clínica.',
    content: `O clássico teste de razão 4.5:1 do WCAG 2.1 baseia-se em matemática simples de luminância relativa. Porém, qualquer designer sênior já notou o problema: um texto fino em cinza pode passar no teste 4.5:1 e ainda ser quase ilegível, enquanto um texto ultra-negrito com razão 4.0:1 pode ser lido sem esforço.

O Advanced Perceptual Contrast Algorithm (APCA) leva em consideração a frequência espacial, o tamanho da fonte em pixels, o peso (regular, medium, bold) e a polaridade da luz (texto claro em fundo escuro estimula a fóvea diferentemente de texto escuro em fundo claro). No Izy Colors, integramos tanto a checagem oficial WCAG 2.1 AA/AAA quanto a leitura de índice APCA Lc.`,
    author: 'Helena Vance',
    readTime: '8 min de leitura',
    status: 'Publicado',
    featured: true,
    publishedAt: '02 Mar 2026',
    views: 6120
  },
  {
    id: 'art-3',
    title: 'Guia definitivo para escalas de cinzas cromáticas em interfaces OLED',
    slug: 'escalas-cinzas-cromaticas-oled',
    category: 'Design Systems',
    summary: 'Evite o preto puro #000000 absoluto. Como introduzir 2% a 5% de saturação na matiz primária para enriquecer as superfícies e hierarquia.',
    content: `O preto puro (#000000) em telas OLED causa o efeito de pixel smearing (arrasto de pixel) durante a rolagem rápida e cria uma transição de contraste excessivamente violenta para os olhos humanos. 

A abordagem suíça e moderna para Dark Mode consiste em utilizar uma cor base neutra escura com 3% a 6% de saturação (como nosso Obsidian #0B0F17 ou Charcoal #111827), alinhada à matiz do produto. Isso cria harmonia óptica entre o fundo da página e os botões primários.`,
    author: 'Marcus UI',
    readTime: '5 min de leitura',
    status: 'Publicado',
    featured: false,
    publishedAt: '18 Fev 2026',
    views: 3240
  }
];

export const INITIAL_SUBMISSIONS: CommunitySubmission[] = [
  {
    id: 'sub-1',
    title: 'Neon Tokyo Rain',
    author: 'Koji Sato',
    authorHandle: '@koji_creative',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    colors: ['#0D1B2A', '#1B263B', '#415A77', '#00E8C6', '#FF0055'],
    tags: ['Cyberpunk', 'Chuva', 'Dark Mode'],
    submittedAt: 'Hoje às 09:15',
    status: 'Pendente',
    suggestedGamut: 'Display P3',
    contrastScore: 'WCAG AAA (8.4:1)'
  },
  {
    id: 'sub-2',
    title: 'Cerrado Brasileiro Seco',
    author: 'Mariana Costa',
    authorHandle: '@mari_costa_design',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    colors: ['#3A2E2B', '#7A5C43', '#B88B4A', '#D9A74A', '#EAE0CC'],
    tags: ['Outono & Terra', 'Brasil', 'Natureza'],
    submittedAt: 'Ontem às 16:40',
    status: 'Pendente',
    suggestedGamut: 'sRGB',
    contrastScore: 'WCAG AAA (9.1:1)'
  },
  {
    id: 'sub-3',
    title: 'Scandinavian Birch Minimal',
    author: 'Lars Lindqvist',
    authorHandle: '@lars_arch',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    colors: ['#1E2022', '#52616B', '#C9D6DF', '#F0F5F9', '#D8B384'],
    tags: ['Minimalista', 'Arquitetura', 'Nórdico'],
    submittedAt: '16 Mar 2026',
    status: 'Aprovado',
    suggestedGamut: 'sRGB',
    contrastScore: 'WCAG AA (5.2:1)'
  }
];

export const INITIAL_TAXONOMY_TAGS = [
  { name: 'Vibrante', count: 482, category: 'Humor' },
  { name: 'Dark Mode', count: 914, category: 'Tema' },
  { name: 'Neon & Cyber', count: 320, category: 'Estilo' },
  { name: 'Pastel', count: 641, category: 'Saturação' },
  { name: 'Minimalista', count: 785, category: 'Estilo' },
  { name: 'Outono & Terra', count: 290, category: 'Natureza' },
  { name: 'Retrô Vintage', count: 356, category: 'Época' },
  { name: 'Gradientes', count: 412, category: 'Técnica' },
  { name: 'Gradiente Bicolor', count: 188, category: 'Técnica' },
  { name: 'Monocromático Azul', count: 245, category: 'Harmonia' },
  { name: 'Oklab Calibrado', count: 512, category: 'Ciência' },
  { name: 'P3 Display Gamut', count: 398, category: 'Hardware' }
];
