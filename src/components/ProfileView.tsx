import React, { useState } from 'react';
import { 
  User, 
  Award, 
  Heart, 
  Layers, 
  Code, 
  Bookmark, 
  Lock, 
  Globe, 
  Sliders, 
  Check, 
  Copy, 
  Share2, 
  ExternalLink, 
  FileText, 
  Sparkles,
  CheckCircle2,
  Settings,
  ChevronRight
} from 'lucide-react';
import { UserProfile, Palette, ProjectWorkspace, CollectionBoard } from '../types';
import { exportCssTokens } from '../utils/colorUtils';

interface ProfileViewProps {
  userProfile: UserProfile;
  palettes: Palette[];
  projects: ProjectWorkspace[];
  collections: CollectionBoard[];
  onOpenInGenerator: (colors: string[]) => void;
  onSaveToCollection: (colors: string[]) => void;
  onOpenExport: (colors: string[]) => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  palettes,
  projects,
  collections,
  onOpenInGenerator,
  onSaveToCollection,
  onOpenExport,
  onUpdateProfile
}) => {
  const [profileTab, setProfileTab] = useState<'palettes' | 'tokens' | 'collections' | 'vault' | 'settings'>('palettes');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editTitle, setEditTitle] = useState(userProfile.title);
  const [editBio, setEditBio] = useState(userProfile.bio);

  const handleCopyTokens = (p: Palette) => {
    const css = exportCssTokens(p.colors, p.title.toLowerCase().replace(/\s+/g, '-'));
    navigator.clipboard.writeText(css);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEditProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: editName,
      title: editTitle,
      bio: editBio
    });
    setShowEditModal(false);
  };

  return (
    <div className="flex-1 bg-[#0B0F17] text-[#DFE2EE] p-4 sm:p-8 max-w-[1720px] mx-auto w-full pb-24">
      {/* Top Banner / Identity Header (Image 5 Replica) */}
      <div className="bg-[#181C24] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl mb-8 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#6366F1]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#06B6D4]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative z-10">
          {/* Left: Avatar + Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <img 
                src={userProfile.avatar} 
                alt={userProfile.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-white/20 shadow-2xl" 
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-3 border-[#181C24] rounded-full shadow-lg" title="Criador Online" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Geist']">
                  {userProfile.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#6366F1] text-[11px] font-bold text-white uppercase tracking-wider font-mono">
                  PRO
                </span>
                <span className="text-xs font-mono text-[#94A3B8]">
                  {userProfile.handle}
                </span>
              </div>

              <p className="text-sm font-medium text-[#06B6D4] mt-1 font-['Geist']">
                {userProfile.title}
              </p>

              <p className="text-xs sm:text-sm text-[#94A3B8] mt-2 max-w-2xl leading-relaxed">
                {userProfile.bio}
              </p>

              {/* Social and portfolio links */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-mono text-[#94A3B8]">
                <span className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                  <Globe className="w-3.5 h-3.5 text-[#06B6D4]" />
                  {userProfile.website}
                </span>
                <span className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                  <ExternalLink className="w-3.5 h-3.5 text-[#6366F1]" />
                  {userProfile.github}
                </span>
                <span className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                  <ExternalLink className="w-3.5 h-3.5 text-[#EC4899]" />
                  {userProfile.figma}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-start">
            <button
              onClick={() => setShowEditModal(true)}
              className="h-9 px-3.5 bg-[#262A33] hover:bg-[#31353E] border border-white/[0.08] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Editar Perfil</span>
            </button>

            <button
              onClick={() => onOpenExport(['#00B4D8', '#48CAE4', '#90E0EF', '#C77DFF', '#FF007F'])}
              className="h-9 px-4 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-colors"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Exportar Tokens Globais</span>
            </button>
          </div>
        </div>

        {/* Badges Strip (Image 5) */}
        <div className="mt-6 pt-6 border-t border-white/[0.08] flex flex-wrap items-center gap-2">
          {userProfile.badges.map((badge, idx) => (
            <span
              key={idx}
              className="px-3 py-1 rounded-full bg-[#111827] border border-white/[0.08] text-xs font-mono text-[#DFE2EE] flex items-center gap-1.5 shadow-inner"
            >
              <Award className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>{badge}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 4 Metric Cards (Matching Image 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-[#181C24] border border-white/[0.08] rounded-xl shadow-lg">
          <span className="text-xs font-mono text-[#94A3B8]">Paletas Criadas</span>
          <div className="text-3xl font-bold font-mono text-white tracking-tight mt-1">
            {userProfile.stats.palettesCreated}
          </div>
          <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
            +{userProfile.stats.palettesCreatedMonthlyDelta} este mês
          </span>
        </div>

        <div className="p-5 bg-[#181C24] border border-white/[0.08] rounded-xl shadow-lg">
          <span className="text-xs font-mono text-[#94A3B8]">Clones & Forks</span>
          <div className="text-3xl font-bold font-mono text-[#06B6D4] tracking-tight mt-1">
            {userProfile.stats.clonesAndForks}
          </div>
          <span className="text-[11px] text-[#94A3B8] font-mono mt-1 block">
            Global Rank {userProfile.stats.globalRank}
          </span>
        </div>

        <div className="p-5 bg-[#181C24] border border-white/[0.08] rounded-xl shadow-lg">
          <span className="text-xs font-mono text-[#94A3B8]">Curtidas Recebidas</span>
          <div className="text-3xl font-bold font-mono text-[#EC4899] tracking-tight mt-1">
            {userProfile.stats.likesReceived}
          </div>
          <span className="text-[11px] text-[#94A3B8] font-mono mt-1 block">
            {userProfile.stats.approvalRate} aprovação
          </span>
        </div>

        <div className="p-5 bg-[#181C24] border border-white/[0.08] rounded-xl shadow-lg">
          <span className="text-xs font-mono text-[#94A3B8]">Publicações CMS</span>
          <div className="text-3xl font-bold font-mono text-white tracking-tight mt-1">
            {userProfile.stats.cmsArticlesCount}
          </div>
          <span className="text-[11px] text-[#06B6D4] font-mono mt-1 block">
            {userProfile.stats.editorialFeaturedCount} Destaques Editoriais
          </span>
        </div>
      </div>

      {/* Subtabs Bar (Image 5) */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] mb-8 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setProfileTab('palettes')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            profileTab === 'palettes'
              ? 'border-[#6366F1] text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#6366F1]" />
          <span>Paletas Públicas ({palettes.length})</span>
        </button>

        <button
          onClick={() => setProfileTab('tokens')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            profileTab === 'tokens'
              ? 'border-[#6366F1] text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <Code className="w-4 h-4 text-[#06B6D4]" />
          <span>Design Tokens ({projects.length})</span>
        </button>

        <button
          onClick={() => setProfileTab('collections')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            profileTab === 'collections'
              ? 'border-[#6366F1] text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4 text-[#EC4899]" />
          <span>Coleções & Boards ({collections.length})</span>
        </button>

        <button
          onClick={() => setProfileTab('vault')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            profileTab === 'vault'
              ? 'border-[#6366F1] text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Cofre Privado PRO</span>
          <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono">
            PRO
          </span>
        </button>

        <button
          onClick={() => setProfileTab('settings')}
          className={`pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            profileTab === 'settings'
              ? 'border-[#6366F1] text-white font-semibold'
              : 'border-transparent text-[#94A3B8] hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 text-[#94A3B8]" />
          <span>Preferências de Exportação</span>
        </button>
      </div>

      {/* Tab 1: Palettes Grid (Exact replica of Image 5 cards: Hyper-Nordic Cyber, Neural Bioluminescence, Deep Ultraviolet Prism, etc.) */}
      {profileTab === 'palettes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {palettes.map((p) => (
            <div
              key={p.id}
              className="bg-[#181C24] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl hover:border-white/[0.18] transition-all flex flex-col justify-between group"
            >
              {/* Color Stripes Header */}
              <div 
                onClick={() => onOpenInGenerator(p.colors)}
                className="h-44 sm:h-48 w-full flex cursor-pointer relative overflow-hidden"
                title="Abrir no Gerador"
              >
                {p.colors.map((c, i) => (
                  <div key={i} className="flex-1 h-full transition-transform hover:scale-105 duration-150 relative group/stripe" style={{ backgroundColor: c }}>
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover/stripe:opacity-100 bg-black/60 text-white px-1 py-0.5 rounded transition-opacity">
                      {c}
                    </span>
                  </div>
                ))}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 
                      onClick={() => onOpenInGenerator(p.colors)}
                      className="text-base font-semibold text-white tracking-tight cursor-pointer hover:text-[#06B6D4] transition-colors font-['Geist']"
                    >
                      {p.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-mono text-[#94A3B8]">
                      <Heart className="w-3.5 h-3.5 text-[#EC4899] fill-[#EC4899]" />
                      <span>{p.likes.toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed mb-3">
                    {p.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <span className="px-2 py-0.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] text-[10px] font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {p.wcagLevel}
                    </span>
                    {p.tags.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-full bg-[#262A33] text-[#94A3B8] text-[10px] font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <button
                    onClick={() => onOpenInGenerator(p.colors)}
                    className="h-8 px-3 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Abrir no Gerador</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSaveToCollection(p.colors)}
                      className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#262A33] transition-colors"
                      title="Salvar na Coleção"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleCopyTokens(p)}
                      className="h-8 px-2.5 rounded-lg bg-[#262A33] hover:bg-[#31353E] text-white text-xs font-mono flex items-center gap-1 border border-white/[0.06] transition-colors"
                      title="Copiar tokens de cores"
                    >
                      {copiedId === p.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Code className="w-3 h-3" />}
                      <span>{copiedId === p.id ? 'Copiado!' : '< > Tokens'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Design Tokens */}
      {profileTab === 'tokens' && (
        <div className="space-y-4">
          {projects.map((proj) => (
            <div key={proj.id} className="p-6 bg-[#181C24] border border-white/[0.08] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-[#06B6D4] uppercase">{proj.clientOrBrand}</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{proj.name}</h3>
                <p className="text-xs text-[#94A3B8] mt-1">{proj.description}</p>
              </div>
              <button
                onClick={() => onOpenExport([...proj.primaryColors, ...proj.secondaryColors, ...proj.neutralGrays])}
                className="h-9 px-4 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 self-start md:self-auto"
              >
                <Code className="w-4 h-4" />
                <span>Exportar Design Tokens</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Collections */}
      {profileTab === 'collections' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {collections.map(col => (
            <div key={col.id} className="p-5 bg-[#181C24] border border-white/[0.08] rounded-xl">
              <h3 className="text-base font-bold text-white">{col.title}</h3>
              <p className="text-xs text-[#94A3B8] mt-1">{col.description}</p>
              <div className="h-10 rounded-lg overflow-hidden flex my-3">
                {col.coverColors.map((c, i) => (
                  <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                ))}
              </div>
              <button
                onClick={() => onOpenInGenerator(col.coverColors)}
                className="text-xs text-[#06B6D4] hover:underline font-mono flex items-center gap-1"
              >
                <span>Explorar coleção</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Vault PRO */}
      {profileTab === 'vault' && (
        <div className="p-8 bg-[#181C24] border border-amber-500/20 rounded-xl text-center max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Cofre Privado PRO Desbloqueado</h3>
          <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
            Seus 24 tokens confidenciais da conta Pro estão criptografados em repouso com algoritmo AES-256 e sincronizados com seus repositórios GitHub.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => onOpenInGenerator(['#0B0F17', '#181C24', '#08BBD9', '#6366F1', '#EC4899'])}
              className="h-9 px-4 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded-lg text-xs font-semibold"
            >
              Carregar Cofre no Gerador
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: Export Preferences */}
      {profileTab === 'settings' && (
        <div className="max-w-2xl bg-[#181C24] border border-white/[0.08] rounded-xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white font-['Geist']">
            Preferências Técnicas de Exportação
          </h3>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <label className="text-[#94A3B8] block mb-1">Formato Padrão de Representação:</label>
              <select className="w-full bg-[#111827] border border-white/[0.1] rounded-lg p-2.5 text-white">
                <option>OKLCH (CSS Color 4) - Uniforme Perceptual</option>
                <option>HEX (#RRGGBB) - Clássico Web</option>
                <option>RGB (rgb(r, g, b))</option>
                <option>HSL (hsl(h, s, l))</option>
              </select>
            </div>

            <div>
              <label className="text-[#94A3B8] block mb-1">Prefixo de Variável CSS:</label>
              <input
                type="text"
                defaultValue="sys-color"
                className="w-full bg-[#111827] border border-white/[0.1] rounded-lg p-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-[#94A3B8] block mb-1">Convenção de Nomes:</label>
              <select className="w-full bg-[#111827] border border-white/[0.1] rounded-lg p-2.5 text-white">
                <option>kebab-case (--sys-color-primary-500)</option>
                <option>camelCase (sysColorPrimary500)</option>
                <option>snake_case (sys_color_primary_500)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="cm" defaultChecked className="rounded text-[#6366F1]" />
              <label htmlFor="cm" className="text-[#DFE2EE] cursor-pointer">
                Incluir comentários com taxa de contraste WCAG no CSS gerado
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#181C24] border border-white/[0.12] rounded-xl p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-4 font-['Geist']">
              Editar Perfil Profissional
            </h3>
            <form onSubmit={handleEditProfileSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Nome Completo:</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Cargo / Especialidade:</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">Biografia:</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-semibold shadow-sm"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
