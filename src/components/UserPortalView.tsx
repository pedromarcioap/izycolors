import React, { useState } from 'react';
import { 
  User, 
  Palette as PaletteIcon, 
  Heart, 
  Award, 
  Sliders, 
  Download, 
  Check, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  Layers, 
  Settings, 
  ShieldAlert, 
  ChevronRight,
  Plus,
  Bookmark
} from 'lucide-react';
import { AuthUser, Palette, CommunitySubmission, CollectionBoard } from '../types';
import { exportCssTokens } from '../utils/colorUtils';

interface UserPortalViewProps {
  currentUser: AuthUser;
  palettes?: Palette[];
  submissions?: CommunitySubmission[];
  collections?: CollectionBoard[];
  favoriteColors?: string[];
  onOpenInGenerator: (colors: string[]) => void;
  onOpenExport: (colors: string[], title?: string) => void;
  onOpenSubmissionModal: () => void;
  onUpdateCurrentUser: (updated: Partial<AuthUser>) => void;
  onNavigateToTab: (tab: any) => void;
}

export const UserPortalView: React.FC<UserPortalViewProps> = ({
  currentUser,
  palettes = [],
  submissions = [],
  collections = [],
  favoriteColors = [],
  onOpenInGenerator,
  onOpenExport,
  onOpenSubmissionModal,
  onUpdateCurrentUser,
  onNavigateToTab
}) => {
  const [tab, setTab] = useState<'my_palettes' | 'my_submissions' | 'swatches' | 'account'>('my_palettes');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const safePalettes = palettes || [];
  const safeSubmissions = submissions || [];
  const safeCollections = collections || [];
  const safeFavoriteColors = favoriteColors || [];

  // Edit account state
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editHandle, setEditHandle] = useState(currentUser?.handle || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleCopyTokens = (p: Palette) => {
    const css = exportCssTokens(p.colors, p.title.toLowerCase().replace(/\s+/g, '-'));
    navigator.clipboard.writeText(css);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyColorHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1800);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCurrentUser({
      name: editName,
      handle: editHandle.startsWith('@') ? editHandle : `@${editHandle}`,
      bio: editBio
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  // Submissions filtered for current user safely
  const mySubmissions = safeSubmissions.filter(s => 
    (s?.authorHandle && currentUser?.handle && s.authorHandle.toLowerCase() === currentUser.handle.toLowerCase()) ||
    (s?.author && currentUser?.name && s.author.toLowerCase() === currentUser.name.toLowerCase())
  );

  return (
    <div className="flex-1 bg-[#0B0F17] text-[#DFE2EE] p-4 sm:p-8 max-w-[1720px] mx-auto w-full pb-24 select-none">
      {/* User Welcome Banner */}
      <div className="bg-[#141822] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#06B6D4]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#6366F1]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#141822] rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-[#06B6D4] uppercase bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-2 py-0.5 rounded-full font-bold">
                  {currentUser.role === 'admin' ? 'Administrador do Sistema' : 'Área do Usuário Comum'}
                </span>
                <span className="text-[10px] font-mono text-[#64748B]">
                  Membro desde {currentUser.createdAt}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Geist'] mt-1.5">
                Olá, {currentUser.name}
              </h1>
              <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 max-w-xl line-clamp-2">
                {currentUser.bio || 'Criador e explorador de paletas cromáticas no ecossistema Izy Colors.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateToTab('generator')}
              className="h-9 px-4 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gerar Nova Paleta</span>
            </button>
          </div>
        </div>

        {/* User Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/[0.06]">
          <div className="bg-[#10141D] border border-white/[0.04] p-3 rounded-xl">
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase block">Paletas Criadas</span>
            <span className="text-xl font-bold text-white font-mono mt-0.5 block">{safePalettes.length}</span>
          </div>

          <div className="bg-[#10141D] border border-white/[0.04] p-3 rounded-xl">
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase block">Cores Favoritas</span>
            <span className="text-xl font-bold text-[#EC4899] font-mono mt-0.5 block">{safeFavoriteColors.length}</span>
          </div>

          <div className="bg-[#10141D] border border-white/[0.04] p-3 rounded-xl">
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase block">Coleções Ativas</span>
            <span className="text-xl font-bold text-[#06B6D4] font-mono mt-0.5 block">{safeCollections.length}</span>
          </div>

          <div className="bg-[#10141D] border border-white/[0.04] p-3 rounded-xl">
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase block">Submissões</span>
            <span className="text-xl font-bold text-purple-400 font-mono mt-0.5 block">{mySubmissions.length || safeSubmissions.length}</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.08] mb-6 overflow-x-auto scrollbar-none pb-2 text-xs font-medium">
        <button
          onClick={() => setTab('my_palettes')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
            tab === 'my_palettes'
              ? 'bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <PaletteIcon className="w-3.5 h-3.5" />
          <span>Minhas Paletas & Forks ({safePalettes.length})</span>
        </button>

        <button
          onClick={() => setTab('my_submissions')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
            tab === 'my_submissions'
              ? 'bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Status de Submissões ({mySubmissions.length || safeSubmissions.length})</span>
        </button>

        <button
          onClick={() => setTab('swatches')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
            tab === 'swatches'
              ? 'bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Cores Salvas ({safeFavoriteColors.length})</span>
        </button>

        <button
          onClick={() => setTab('account')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
            tab === 'account'
              ? 'bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Configurações da Conta</span>
        </button>
      </div>

      {/* SUB-TAB 1: MY PALETTES */}
      {tab === 'my_palettes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safePalettes.map((p) => (
            <div 
              key={p.id}
              className="bg-[#141822] border border-white/[0.08] hover:border-white/[0.2] rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white group-hover:text-[#06B6D4] transition-colors">
                    {p.title}
                  </h3>
                  <span className="text-[10px] font-mono text-[#64748B] uppercase">
                    {(p.tags && p.tags[0]) || p.wcagLevel || 'Oklch'}
                  </span>
                </div>

                {/* 5-Color Horizontal Swatches */}
                <div className="flex h-16 w-full rounded-lg overflow-hidden border border-white/10 shadow-inner mb-4">
                  {p.colors.map((hex, i) => (
                    <div 
                      key={i} 
                      className="flex-1 flex items-end justify-center pb-1 text-[9px] font-mono text-white/80 transition-transform hover:scale-105"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    >
                      {hex.substring(1, 4)}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
                  <span>Gamut: {p.gamut}</span>
                  <span className="text-emerald-400">WCAG AAA</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-white/[0.06]">
                <button
                  onClick={() => onOpenInGenerator(p.colors)}
                  className="flex-1 py-1.5 bg-[#181C26] hover:bg-[#222838] border border-white/[0.1] rounded text-xs text-white font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Gerador</span>
                </button>

                <button
                  onClick={() => handleCopyTokens(p)}
                  className="px-2.5 py-1.5 bg-[#181C26] hover:bg-[#222838] border border-white/[0.1] rounded text-xs text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                  title="Copiar variáveis CSS"
                >
                  {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => onOpenExport(p.colors, p.title)}
                  className="px-2.5 py-1.5 bg-[#181C26] hover:bg-[#222838] border border-white/[0.1] rounded text-xs text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                  title="Exportar Amostras Illustrator (.jsx/.ase)"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 2: SUBMISSIONS */}
      {tab === 'my_submissions' && (
        <div className="bg-[#141822] border border-white/[0.08] rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Minhas Submissões para Curadoria Editorial</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Acompanhe em tempo real se suas paletas foram aceitas pela administração para o Feed Oficial ou destacadas como Staff Pick.
              </p>
            </div>
            <button
              onClick={onOpenSubmissionModal}
              className="h-8 px-3 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enviar Nova Paleta</span>
            </button>
          </div>

          <div className="space-y-3">
            {(mySubmissions.length > 0 ? mySubmissions : safeSubmissions).map((sub) => (
              <div 
                key={sub.id} 
                className="p-4 bg-[#181C26] border border-white/[0.06] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{sub.title}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      sub.status === 'Aprovado' 
                        ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30'
                        : sub.status === 'Rejeitado'
                        ? 'bg-red-950/50 text-red-400 border-red-500/30'
                        : 'bg-amber-950/50 text-amber-400 border-amber-500/30'
                    }`}>
                      {sub.status}
                    </span>
                    {sub.contrastScore && (
                      <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        {sub.contrastScore}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-2">
                    {sub.colors.map((hex, i) => (
                      <div 
                        key={i} 
                        className="w-8 h-6 rounded border border-white/10"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenInGenerator(sub.colors)}
                    className="h-8 px-3 bg-[#10141D] hover:bg-[#202534] border border-white/[0.1] rounded text-xs text-[#94A3B8] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Abrir no Gerador</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SAVED SWATCHES */}
      {tab === 'swatches' && (
        <div className="bg-[#141822] border border-white/[0.08] rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Cores & Amostras Individuais Salvas</h3>
            <span className="text-xs font-mono text-[#64748B]">Clique para copiar código HEX</span>
          </div>

          {safeFavoriteColors.length === 0 ? (
            <p className="text-xs text-[#94A3B8] py-8 text-center">
              Nenhuma cor individual favoritada ainda. No gerador ou na roda, clique no ícone de coração para guardar aqui.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {safeFavoriteColors.map((hex, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCopyColorHex(hex)}
                  className="bg-[#181C26] border border-white/[0.08] hover:border-[#06B6D4]/40 rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer transition-all hover:scale-105 group"
                >
                  <div 
                    className="w-full h-16 rounded-lg border border-white/10 shadow-inner flex items-center justify-center"
                    style={{ backgroundColor: hex }}
                  >
                    {copiedColor === hex && (
                      <span className="bg-black/70 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                        Copiado!
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-white group-hover:text-[#06B6D4] font-semibold">
                    {hex}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: ACCOUNT SETTINGS */}
      {tab === 'account' && (
        <div className="bg-[#141822] border border-white/[0.08] rounded-xl p-6 shadow-xl max-w-2xl">
          <h3 className="text-sm font-semibold text-white mb-1">Informações do Perfil de Criador</h3>
          <p className="text-xs text-[#94A3B8] mb-6">
            Atualize seus dados de exibição pública na comunidade e exportação de paletas.
          </p>

          {savedFeedback && (
            <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Dados atualizados com sucesso!</span>
            </div>
          )}

          <form onSubmit={handleSaveAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-[#10141D] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1">Handle / Usuário</label>
                <input
                  type="text"
                  required
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  className="w-full bg-[#10141D] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1">E-mail (Leitura)</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.email}
                  className="w-full bg-[#10141D]/50 border border-white/[0.05] rounded-lg px-3 py-2 text-xs text-[#64748B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1">Bio / Perfil</label>
              <textarea
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full bg-[#10141D] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#06B6D4] hover:bg-[#08BBD9] text-black font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
