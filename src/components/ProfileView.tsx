import React, { useState, useEffect } from 'react';
import {
  User,
  Award,
  Heart,
  Bookmark,
  Lock,
  Globe,
  Sliders,
  Check,
  Copy,
  Download,
  FileText,
  Sparkles,
  CheckCircle2,
  Settings,
  ChevronRight,
  Plus,
  Palette as PaletteIcon,
  Trash2,
  Cloud,
  LogOut,
  Send,
  Eye,
  BarChart3,
  Camera
} from 'lucide-react';
import {
  UserProfile,
  Palette,
  ProjectWorkspace,
  CollectionBoard,
  FavoriteColor,
  VaultPalette,
  CommunitySubmission,
  AuthUser,
  ColorFormat,
  NamingConvention
} from '../types';
import { exportCssTokens } from '../utils/colorUtils';
import { UserAnalyticsDashboard } from './UserAnalyticsDashboard';
import { AdminAiSettings } from './AdminAiSettings';

interface ProfileViewProps {
  authUser: AuthUser;
  userProfile: UserProfile;
  palettes?: Palette[];
  projects?: ProjectWorkspace[];
  collections?: CollectionBoard[];
  favoriteColors?: FavoriteColor[];
  vaultPalettes?: VaultPalette[];
  submissions?: CommunitySubmission[];
  initialSubTab?: 'analytics' | 'palettes' | 'submissions' | 'swatches' | 'showcase' | 'collections' | 'vault' | 'settings';
  onOpenInGenerator: (colors: string[]) => void;
  onSaveToCollection?: (colors: string[]) => void;
  onOpenExport: (colors: string[], title?: string) => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onDeleteFavoriteColor?: (hex: string) => void;
  onDeleteVaultPalette?: (id: string) => void;
  onOpenAuthModal?: () => void;
  onOpenAvatarEditor?: () => void;
  onLogout?: () => void;
  onOpenSubmissionModal?: () => void;
  isSupabaseConnected?: boolean;
}

type SubTab = 'analytics' | 'palettes' | 'submissions' | 'swatches' | 'showcase' | 'collections' | 'vault' | 'settings';

const DEFAULT_BADGES = ['Curador Ativo', 'WCAG AAA Master', 'OKLCH Pioneer'];
const DEFAULT_TITLE = 'Criador & Especialista em Cores';
const DEFAULT_BIO = 'Criador e explorador de paletas cromáticas no ecossistema Izy Colors.';
const DEFAULT_PALETTE_COLORS = ['#0E1726', '#08BBD9', '#3B82F6', '#9354F5', '#FF2A85'];
const DEFAULT_VAULT_COLORS = ['#0B0F17', '#181C24', '#08BBD9', '#6366F1', '#EC4899'];

function toArray<T>(value: T[] | undefined): T[] {
  return value ?? [];
}

/** Resolves the badge list, falling back to the default set. */
function resolveBadges(badges: string[] | undefined): string[] {
  return badges && badges.length > 0 ? badges : DEFAULT_BADGES;
}

/** Resolves the profile title, falling back based on the user role. */
function resolveTitle(title: string | undefined, role: string | undefined): string {
  if (title) return title;
  return role === 'admin' ? 'Administrador do Sistema & Curador' : DEFAULT_TITLE;
}

/** Maps a submission status to its badge classes. */
function submissionStatusClasses(status: string): string {
  if (status === 'Aprovado') return 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30';
  if (status === 'Rejeitado') return 'bg-red-950/50 text-red-400 border-red-500/30';
  return 'bg-amber-950/50 text-amber-400 border-amber-500/30';
}

/** Normalizes a favorite color entry (string or object) into hex/name. */
function normalizeFavorite(fav: FavoriteColor): { hex: string; name?: string } {
  if (typeof fav === 'string') return { hex: fav };
  return { hex: fav.hex, name: fav.name };
}

/** Builds the live token preview string for the settings panel. */
function buildTokenPreview(format: string, naming: string, prefix: string): string {
  const formatValue = (fmt: string): string => {
    switch (fmt) {
      case 'OKLCH': return 'oklch(0.68 0.19 235)';
      case 'HEX': return '#06B6D4';
      case 'RGB': return 'rgb(6, 182, 212)';
      case 'HSL':
      default: return 'hsl(189, 94%, 43%)';
    }
  };
  const val = formatValue(format);
  if (naming === 'kebab-case') return `--${prefix || 'sys-color'}-primary-500: ${val};`;
  if (naming === 'camelCase') return `${prefix || 'sysColor'}Primary500 = "${val}";`;
  return `${prefix || 'sys_color'}_primary_500 = "${val}";`;
}

/** Returns the tab button classes for the active/inactive state. */
function tabClasses(isActive: boolean, activeBorder: string): string {
  const base = 'pb-3 px-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer';
  return isActive
    ? `${base} ${activeBorder} text-white font-semibold`
    : `${base} border-transparent text-[#94A3B8] hover:text-white`;
}

interface SubTabButtonProps {
  isActive: boolean;
  activeBorder: string;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
}

const SubTabButton: React.FC<SubTabButtonProps> = ({ isActive, activeBorder, onClick, icon, label, badge }) => (
  <button onClick={onClick} className={tabClasses(isActive, activeBorder)}>
    {icon}
    <span>{label}</span>
    {badge}
  </button>
);

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  valueClass: string;
  caption: string;
  captionClass: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, valueClass, caption, captionClass }) => (
  <div className="p-5 bg-[#181C24] border border-white/[0.08] rounded-xl shadow-lg">
    <span className="text-xs font-mono text-[#94A3B8]">{label}</span>
    <div className={`text-3xl font-bold font-mono tracking-tight mt-1 ${valueClass}`}>{value}</div>
    <span className={`text-[11px] font-mono mt-1 block ${captionClass}`}>{caption}</span>
  </div>
);

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  hint: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, hint }) => (
  <div className="py-12 text-center text-xs text-[#94A3B8] bg-[#10141D] rounded-xl border border-white/[0.04]">
    {icon}
    <p>{title}</p>
    <p className="text-[#64748B] mt-1">{hint}</p>
  </div>
);

interface PalettesPanelProps {
  palettes: Palette[];
  copiedId: string | null;
  onOpenInGenerator: (colors: string[]) => void;
  onSaveToCollection?: (colors: string[]) => void;
  onOpenExport: (colors: string[], title?: string) => void;
  onOpenSubmissionModal?: () => void;
  onCopyTokens: (p: Palette) => void;
}

const PalettesPanel: React.FC<PalettesPanelProps> = ({
  palettes,
  copiedId,
  onOpenInGenerator,
  onSaveToCollection,
  onOpenExport,
  onOpenSubmissionModal,
  onCopyTokens
}) => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-white font-['Geist']">Minhas Paletas Cromáticas</h3>
        <p className="text-xs text-[#94A3B8] mt-0.5">Paletas criadas, calibradas ou clonadas no seu espaço de trabalho.</p>
      </div>
      {onOpenSubmissionModal && (
        <button
          onClick={onOpenSubmissionModal}
          className="h-8 px-3 bg-[#181C26] hover:bg-[#222838] border border-white/[0.1] rounded text-xs text-white flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Send className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>Submeter à Curadoria</span>
        </button>
      )}
    </div>

    {palettes.length === 0 ? (
      <EmptyState
        icon={<PaletteIcon className="w-8 h-8 text-[#06B6D4]/40 mx-auto mb-2" />}
        title="Nenhuma paleta criada ou clonada ainda."
        hint="Crie paletas no Gerador ou clone paletas da Comunidade para vê-las aqui."
      />
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {palettes.map((p) => (
          <div
            key={p.id}
            className="bg-[#181C24] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl hover:border-white/[0.18] transition-all flex flex-col justify-between group"
          >
            {/* Color Stripes Header */}
            <button
              type="button"
              onClick={() => onOpenInGenerator(p.colors)}
              className="h-40 sm:h-44 w-full flex cursor-pointer relative overflow-hidden border-0 p-0 appearance-none"
              title="Abrir no Gerador"
              aria-label="Abrir paleta no Gerador"
            >
              {p.colors.map((c) => (
                <div key={c} className="flex-1 h-full transition-transform hover:scale-105 duration-150 relative group/stripe" style={{ backgroundColor: c }}>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover/stripe:opacity-100 bg-black/60 text-white px-1 py-0.5 rounded transition-opacity pointer-events-none">
                    {c}
                  </span>
                </div>
              ))}
            </button>

            {/* Card Body */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-base font-semibold text-white tracking-tight font-['Geist']">
                    <button
                      type="button"
                      onClick={() => onOpenInGenerator(p.colors)}
                      className="text-base font-semibold text-white tracking-tight cursor-pointer hover:text-[#06B6D4] transition-colors font-['Geist'] bg-transparent border-0 p-0 text-left"
                    >
                      {p.title}
                    </button>
                  </h3>
                  <div className="flex items-center gap-1 text-xs font-mono text-[#94A3B8]">
                    <Heart className="w-3.5 h-3.5 text-[#EC4899] fill-[#EC4899]" />
                    <span>{p.likes ? p.likes.toLocaleString() : '12'}</span>
                  </div>
                </div>

                <p className="text-xs text-[#94A3B8] line-clamp-2 mb-3">
                  {p.description || 'Paleta harmônica calibrada com uniformidade perceptual.'}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  <span className="px-2 py-0.5 rounded bg-[#10141D] border border-white/[0.06] text-[10px] font-mono text-[#06B6D4]">
                    {p.gamut || 'Display P3'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
                    {p.wcagLevel || 'WCAG AAA'}
                  </span>
                </div>
              </div>

              {/* Actions footer */}
              <div className="flex items-center gap-2 pt-4 border-t border-white/[0.06]">
                <button
                  onClick={() => onOpenInGenerator(p.colors)}
                  className="flex-1 h-8 bg-[#202532] hover:bg-[#2C3345] text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Gerador</span>
                </button>

                <button
                  onClick={() => onSaveToCollection?.(p.colors)}
                  className="h-8 px-2.5 bg-[#202532] hover:bg-[#2C3345] text-[#94A3B8] hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                  title="Salvar em Coleção"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onCopyTokens(p)}
                  className="h-8 px-2.5 bg-[#202532] hover:bg-[#2C3345] text-[#94A3B8] hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                  title="Copiar CSS Tokens"
                >
                  {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => onOpenExport(p.colors, p.title)}
                  className="h-8 px-2.5 bg-[#202532] hover:bg-[#2C3345] text-[#94A3B8] hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                  title="Exportar Amostras Illustrator (.jsx/.ase)"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

interface SubmissionsPanelProps {
  submissions: CommunitySubmission[];
  onOpenInGenerator: (colors: string[]) => void;
  onOpenSubmissionModal?: () => void;
}

const SubmissionsPanel: React.FC<SubmissionsPanelProps> = ({ submissions, onOpenInGenerator, onOpenSubmissionModal }) => (
  <div className="bg-[#141822] border border-white/[0.08] rounded-xl p-6 shadow-xl space-y-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
      <div>
        <h3 className="text-base font-semibold text-white font-['Geist']">Minhas Submissões para Curadoria Editorial</h3>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Acompanhe o status de avaliação das suas criações para o Feed Oficial da Comunidade e selo Staff Pick.
        </p>
      </div>
      {onOpenSubmissionModal && (
        <button
          onClick={onOpenSubmissionModal}
          className="h-8 px-3 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Enviar Nova Paleta</span>
        </button>
      )}
    </div>

    <div className="space-y-3 pt-2">
      {submissions.map((sub) => (
        <div
          key={sub.id}
          className="p-4 bg-[#181C26] border border-white/[0.06] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-white">{sub.title}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${submissionStatusClasses(sub.status)}`}>
                {sub.status}
              </span>
              {sub.contrastScore && (
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  {sub.contrastScore}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-2.5">
              {sub.colors.map((hex) => (
                <div
                  key={hex}
                  className="w-8 h-6 rounded border border-white/10"
                  style={{ backgroundColor: hex }}
                  title={hex}
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
);

interface SwatchesPanelProps {
  favoriteColors: FavoriteColor[];
  copiedColor: string | null;
  onCopyColorHex: (hex: string) => void;
  onDeleteFavoriteColor?: (hex: string) => void;
}

const SwatchesPanel: React.FC<SwatchesPanelProps> = ({
  favoriteColors,
  copiedColor,
  onCopyColorHex,
  onDeleteFavoriteColor
}) => (
  <div className="bg-[#141822] border border-white/[0.08] rounded-xl p-6 shadow-xl">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-base font-semibold text-white font-['Geist']">Cores & Amostras Favoritas</h3>
        <p className="text-xs text-[#94A3B8] mt-0.5">Clique em qualquer amostra para copiar o código hexadecimal instantaneamente.</p>
      </div>
      <span className="text-xs font-mono text-[#64748B]">{favoriteColors.length} amostras</span>
    </div>

    {favoriteColors.length === 0 ? (
      <EmptyState
        icon={<Heart className="w-8 h-8 text-[#EC4899]/40 mx-auto mb-2" />}
        title="Nenhuma cor individual favoritada ainda."
        hint="No gerador de cores ou na roda harmônica, clique no ícone de coração para guardar cores aqui."
      />
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {favoriteColors.map((fav) => {
          const { hex: hexVal, name: nameVal } = normalizeFavorite(fav);
          return (
            <div
              key={hexVal}
              className="bg-[#181C26] border border-white/[0.08] hover:border-[#06B6D4]/40 rounded-xl p-3 transition-all hover:scale-105 group relative"
            >
              <button
                type="button"
                onClick={() => onCopyColorHex(hexVal)}
                className="w-full flex flex-col items-center gap-2 cursor-pointer bg-transparent border-0 p-0 text-left"
                title={`Copiar ${hexVal}`}
                aria-label={`Copiar cor ${hexVal}`}
              >
                <div
                  className="w-full h-16 rounded-lg border border-white/10 shadow-inner flex items-center justify-center"
                  style={{ backgroundColor: hexVal }}
                >
                  {copiedColor === hexVal && (
                    <span className="bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                      Copiado!
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-white group-hover:text-[#06B6D4] font-semibold">
                  {hexVal}
                </span>
                {nameVal && nameVal !== hexVal && (
                  <span className="text-[10px] text-[#94A3B8] truncate max-w-full">
                    {nameVal}
                  </span>
                )}
              </button>

              {onDeleteFavoriteColor && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFavoriteColor(hexVal);
                  }}
                  className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 hover:bg-red-500 text-white/70 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remover dos favoritos"
                  aria-label={`Remover ${hexVal} dos favoritos`}
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
);

interface CollectionsPanelProps {
  collections: CollectionBoard[];
}

const CollectionsPanel: React.FC<CollectionsPanelProps> = ({ collections }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {collections.map((col) => (
      <div key={col.id} className="bg-[#181C24] border border-white/[0.08] rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-white font-['Geist']">{col.title}</h3>
          <span className="text-xs font-mono text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-2 py-0.5 rounded">
            {(col.paletteIds || []).length} Paletas
          </span>
        </div>
        <p className="text-xs text-[#94A3B8] mb-4">{col.description || 'Board temático de design system.'}</p>

        <div className="flex items-center gap-1.5 p-3 bg-[#10141D] rounded-lg border border-white/[0.04]">
          {(col.coverColors || ['#0E1726', '#08BBD9', '#3B82F6']).map((c) => (
            <div key={c} className="h-6 flex-1 rounded border border-white/10" style={{ backgroundColor: c }} title={c} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

interface VaultPanelProps {
  vaultPalettes: VaultPalette[];
  copiedColor: string | null;
  onOpenInGenerator: (colors: string[]) => void;
  onOpenExport: (colors: string[], title?: string) => void;
  onDeleteVaultPalette?: (id: string) => void;
  onCopyColorHex: (hex: string) => void;
}

const VaultPanel: React.FC<VaultPanelProps> = ({
  vaultPalettes,
  copiedColor,
  onOpenInGenerator,
  onOpenExport,
  onDeleteVaultPalette,
  onCopyColorHex
}) => {
  const handleLoadIntoGenerator = () => {
    const allColors = vaultPalettes.flatMap((p) => p.colors || []);
    onOpenInGenerator(allColors.length > 0 ? allColors.slice(0, 5) : DEFAULT_VAULT_COLORS);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#181C24] border border-amber-500/20 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Geist']">
                Cofre Privado de Paletas & Tokens
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {vaultPalettes.length} paletas completas salvas com criptografia e calibradas para produção.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadIntoGenerator}
              className="h-8 px-3.5 bg-amber-400 hover:bg-amber-300 text-black rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Carregar no Gerador</span>
            </button>
          </div>
        </div>

        {vaultPalettes.length === 0 ? (
          <EmptyState
            icon={<Lock className="w-8 h-8 text-amber-400/40 mx-auto mb-2" />}
            title="Nenhuma paleta completa salva no cofre ainda."
            hint="No gerador, roda cromática ou projetos, use a opção de salvar paleta completa no cofre."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vaultPalettes.map((pal) => (
              <div
                key={pal.id}
                className="p-5 bg-[#111827] border border-white/[0.08] rounded-xl flex flex-col justify-between gap-4 hover:border-amber-400/40 transition-all shadow-md group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white font-['Geist']">{pal.title}</h4>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-400/10 text-amber-300 border border-amber-400/20">
                          {pal.gamut || 'Display P3'}
                        </span>
                      </div>
                      {pal.description && (
                        <p className="text-xs text-[#94A3B8] mt-1 leading-snug">{pal.description}</p>
                      )}
                    </div>

                    {onDeleteVaultPalette && (
                      <button
                        onClick={() => onDeleteVaultPalette(pal.id)}
                        className="p-1 text-[#64748B] hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remover do Cofre"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Color strip */}
                  <div className="h-10 rounded-lg overflow-hidden flex border border-white/10 shadow-inner">
                    {pal.colors.map((hex, i) => (
                      <button
                        key={`${hex}-${i}`}
                        type="button"
                        onClick={() => onCopyColorHex(hex)}
                        className="flex-1 h-full cursor-pointer transition-transform hover:scale-105 relative group/c border-none p-0"
                        style={{ backgroundColor: hex }}
                        title={`${hex} - Clique para copiar`}
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold opacity-0 group-hover/c:opacity-100 bg-black/60 text-white transition-opacity">
                          {copiedColor === hex ? '✓' : hex}
                        </span>
                      </button>
                    ))}
                  </div>

                  {pal.notes && (
                    <div className="p-2.5 rounded-lg bg-[#181C24] border border-white/[0.04] text-[11px] text-[#DFE2EE] flex items-start gap-2">
                      <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{pal.notes}</span>
                    </div>
                  )}

                  {pal.tags && pal.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {pal.tags.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[10px] text-[#94A3B8] font-mono">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs">
                  <span className="text-[11px] font-mono text-[#64748B]">{pal.createdAt}</span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenExport(pal.colors, pal.title)}
                      className="px-2 py-1 rounded bg-[#181C24] hover:bg-white/[0.08] text-[#94A3B8] hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      Exportar
                    </button>
                    <button
                      onClick={() => onOpenInGenerator(pal.colors)}
                      className="px-3 py-1 rounded bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      Abrir no Gerador
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface SettingsPanelProps {
  authUser: AuthUser;
  tokenFormat: ColorFormat;
  tokenPrefix: string;
  tokenNaming: NamingConvention;
  tokenIncludeComments: boolean;
  tokenPrefsSaved: boolean;
  onFormatChange: (fmt: ColorFormat) => void;
  onPrefixChange: (prefix: string) => void;
  onPrefixBlur: () => void;
  onNamingChange: (naming: NamingConvention) => void;
  onIncludeCommentsChange: (include: boolean) => void;
  onSave: (e?: React.SyntheticEvent) => void;
  onLogout?: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  authUser,
  tokenFormat,
  tokenPrefix,
  tokenNaming,
  tokenIncludeComments,
  tokenPrefsSaved,
  onFormatChange,
  onPrefixChange,
  onPrefixBlur,
  onNamingChange,
  onIncludeCommentsChange,
  onSave,
  onLogout
}) => (
  <div className="max-w-3xl space-y-6">
    {authUser.role === 'admin' && (
      <AdminAiSettings isAdmin={true} />
    )}
    <div className="bg-[#181C24] border border-white/[0.08] rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between gap-4 mb-1">
        <h3 className="text-base font-bold text-white font-['Geist']">
          Preferências de Exportação de Tokens
        </h3>
        {tokenPrefsSaved && (
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center gap-1 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>Salvo com sucesso</span>
          </span>
        )}
      </div>
      <p className="text-xs text-[#94A3B8] mb-6">
        Configure as regras globais para geração de arquivos CSS, Tailwind v4 e scripts de automação.
      </p>

      <form onSubmit={onSave} className="space-y-4 text-xs font-mono">
        <div>
          <label htmlFor="tokenFormatSelect" className="text-[#94A3B8] block mb-1">Formato Padrão de Representação:</label>
          <select
            id="tokenFormatSelect"
            value={tokenFormat}
            onChange={(e) => onFormatChange(e.target.value as ColorFormat)}
            className="w-full bg-[#111827] border border-white/[0.1] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#06B6D4]"
          >
            <option value="OKLCH">OKLCH (CSS Color 4) - Uniforme Perceptual</option>
            <option value="HEX">HEX (#RRGGBB) - Clássico Web</option>
            <option value="RGB">RGB (rgb(r, g, b))</option>
            <option value="HSL">HSL (hsl(h, s, l))</option>
          </select>
        </div>

        <div>
          <label htmlFor="tokenPrefixInput" className="text-[#94A3B8] block mb-1">Prefixo de Variável CSS:</label>
          <input
            id="tokenPrefixInput"
            type="text"
            value={tokenPrefix}
            onChange={(e) => onPrefixChange(e.target.value)}
            onBlur={onPrefixBlur}
            placeholder="sys-color"
            className="w-full bg-[#111827] border border-white/[0.1] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#06B6D4]"
          />
        </div>

        <div>
          <label htmlFor="tokenNamingSelect" className="text-[#94A3B8] block mb-1">Convenção de Nomes:</label>
          <select
            id="tokenNamingSelect"
            value={tokenNaming}
            onChange={(e) => onNamingChange(e.target.value as NamingConvention)}
            className="w-full bg-[#111827] border border-white/[0.1] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#06B6D4]"
          >
            <option value="kebab-case">kebab-case (--{tokenPrefix || 'sys-color'}-primary-500)</option>
            <option value="camelCase">camelCase ({tokenPrefix || 'sysColor'}Primary500)</option>
            <option value="snake_case">snake_case ({tokenPrefix || 'sys_color'}_primary_500)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="includeCommentsCheck"
            checked={tokenIncludeComments}
            onChange={(e) => onIncludeCommentsChange(e.target.checked)}
            className="rounded bg-[#111827] border-white/20 text-[#06B6D4] focus:ring-0 cursor-pointer"
          />
          <label htmlFor="includeCommentsCheck" className="text-[#94A3B8] cursor-pointer select-none text-xs">
            Incluir comentários explicativos e metadados de acessibilidade (WCAG) nos tokens
          </label>
        </div>

        {/* Live Preview Box */}
        <div className="p-3 bg-[#111827] border border-white/[0.06] rounded-lg mt-3">
          <span className="text-[10px] text-[#64748B] block mb-1 font-mono uppercase tracking-wider">
            Pré-visualização do Token em Tempo Real:
          </span>
          <code className="text-[#06B6D4] text-xs">
            {buildTokenPreview(tokenFormat, tokenNaming, tokenPrefix)}
          </code>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="h-9 px-4 rounded-lg bg-[#06B6D4] hover:bg-[#08BBD9] text-black text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-cyan-500/10"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Preferências</span>
          </button>
        </div>
      </form>
    </div>

    <div className="bg-[#181C24] border border-white/[0.08] rounded-xl p-6 shadow-xl flex items-center justify-between">
      <div>
        <h4 className="text-sm font-semibold text-white">Sessão e Identidade</h4>
        <p className="text-xs text-[#94A3B8] mt-0.5">Conectado como {authUser.email} ({authUser.role === 'admin' ? 'Administrador' : 'Usuário Comum'})</p>
      </div>
      {onLogout && (
        <button
          onClick={onLogout}
          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Desconectar Sessão</span>
        </button>
      )}
    </div>
  </div>
);

interface EditProfileModalProps {
  editName: string;
  editHandle: string;
  editTitle: string;
  editBio: string;
  editWebsite: string;
  onNameChange: (v: string) => void;
  onHandleChange: (v: string) => void;
  onTitleChange: (v: string) => void;
  onBioChange: (v: string) => void;
  onWebsiteChange: (v: string) => void;
  onSubmit: (e: React.SyntheticEvent) => void;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  editName,
  editHandle,
  editTitle,
  editBio,
  editWebsite,
  onNameChange,
  onHandleChange,
  onTitleChange,
  onBioChange,
  onWebsiteChange,
  onSubmit,
  onClose
}) => (
  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-[#181C24] border border-white/[0.12] rounded-xl p-6 shadow-2xl">
      <h3 className="text-base font-semibold text-white mb-4 font-['Geist']">
        Editar Perfil do Criador
      </h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="editNameInput" className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">Nome Completo:</label>
          <input
            id="editNameInput"
            type="text"
            required
            value={editName}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
          />
        </div>

        <div>
          <label htmlFor="editHandleInput" className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">Handle / Usuário (@):</label>
          <input
            id="editHandleInput"
            type="text"
            required
            value={editHandle}
            onChange={(e) => onHandleChange(e.target.value)}
            className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
          />
        </div>

        <div>
          <label htmlFor="editTitleInput" className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">Especialidade / Título:</label>
          <input
            id="editTitleInput"
            type="text"
            required
            value={editTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
          />
        </div>

        <div>
          <label htmlFor="editBioTextarea" className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">Biografia:</label>
          <textarea
            id="editBioTextarea"
            rows={3}
            value={editBio}
            onChange={(e) => onBioChange(e.target.value)}
            className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
          />
        </div>

        <div>
          <label htmlFor="editWebsiteInput" className="text-xs font-mono uppercase text-[#94A3B8] block mb-1">Website / Link:</label>
          <input
            id="editWebsiteInput"
            type="text"
            placeholder="https://meusite.design"
            value={editWebsite}
            onChange={(e) => onWebsiteChange(e.target.value)}
            className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-[#06B6D4] hover:bg-[#08BBD9] text-black text-xs font-semibold shadow-sm cursor-pointer"
          >
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  </div>
);

export const ProfileView: React.FC<ProfileViewProps> = ({
  authUser,
  userProfile,
  palettes = [],
  projects = [],
  collections = [],
  favoriteColors = [],
  vaultPalettes = [],
  submissions = [],
  initialSubTab,
  onOpenInGenerator,
  onSaveToCollection,
  onOpenExport,
  onUpdateProfile,
  onDeleteFavoriteColor,
  onDeleteVaultPalette,
  onOpenAuthModal,
  onOpenAvatarEditor,
  onLogout,
  onOpenSubmissionModal,
  isSupabaseConnected
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(initialSubTab || 'analytics');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const safePalettes = toArray(palettes);
  const safeProjects = toArray(projects);
  const safeCollections = toArray(collections);
  const safeFavoriteColors = toArray(favoriteColors);
  const safeVaultPalettes = toArray(vaultPalettes);
  const safeSubmissions = toArray(submissions);

  // Sync if initialSubTab prop changes
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Edit Profile Form State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(authUser?.name || userProfile?.name || '');
  const [editHandle, setEditHandle] = useState(authUser?.handle || userProfile?.handle || '');
  const [editTitle, setEditTitle] = useState(userProfile?.title || DEFAULT_TITLE);
  const [editBio, setEditBio] = useState(authUser?.bio || userProfile?.bio || '');
  const [editWebsite, setEditWebsite] = useState(userProfile?.website || '');
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Token Export Preferences State
  const [tokenFormat, setTokenFormat] = useState<ColorFormat>(
    userProfile?.exportPreferences?.defaultFormat || 'OKLCH'
  );
  const [tokenPrefix, setTokenPrefix] = useState<string>(
    userProfile?.exportPreferences?.variablePrefix || 'sys-color'
  );
  const [tokenNaming, setTokenNaming] = useState<NamingConvention>(
    userProfile?.exportPreferences?.namingConvention || 'kebab-case'
  );
  const [tokenIncludeComments, setTokenIncludeComments] = useState<boolean>(
    userProfile?.exportPreferences?.includeComments ?? true
  );
  const [tokenPrefsSaved, setTokenPrefsSaved] = useState<boolean>(false);

  // Sync edit state whenever authUser or userProfile changes
  useEffect(() => {
    setEditName(authUser?.name || userProfile?.name || '');
    setEditHandle(authUser?.handle || userProfile?.handle || '');
    setEditBio(authUser?.bio || userProfile?.bio || '');
    setEditTitle(userProfile?.title || DEFAULT_TITLE);
    setEditWebsite(userProfile?.website || '');
    if (userProfile?.exportPreferences) {
      setTokenFormat(userProfile.exportPreferences.defaultFormat || 'OKLCH');
      setTokenPrefix(userProfile.exportPreferences.variablePrefix || 'sys-color');
      setTokenNaming(userProfile.exportPreferences.namingConvention || 'kebab-case');
      setTokenIncludeComments(userProfile.exportPreferences.includeComments ?? true);
    }
  }, [authUser, userProfile]);

  const buildPreferences = (overrides: Partial<{
    defaultFormat: ColorFormat;
    variablePrefix: string;
    namingConvention: NamingConvention;
    includeComments: boolean;
  }> = {}) => ({
    defaultFormat: overrides.defaultFormat ?? tokenFormat,
    variablePrefix: (overrides.variablePrefix ?? tokenPrefix).trim() || 'sys-color',
    namingConvention: overrides.namingConvention ?? tokenNaming,
    includeComments: overrides.includeComments ?? tokenIncludeComments
  });

  const handleSaveTokenPreferences = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    const updatedPreferences = buildPreferences();
    onUpdateProfile({
      exportPreferences: updatedPreferences
    });
    try {
      localStorage.setItem('chromatica_token_prefs', JSON.stringify(updatedPreferences));
    } catch (err) {
      console.error('Erro ao salvar chromatica_token_prefs:', err);
    }
    setTokenPrefsSaved(true);
    setTimeout(() => setTokenPrefsSaved(false), 2500);
  };

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

  const handleEditProfileSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: editName.trim(),
      handle: editHandle.startsWith('@') ? editHandle.trim() : `@${editHandle.trim()}`,
      title: editTitle.trim(),
      bio: editBio.trim(),
      website: editWebsite.trim()
    });
    setShowEditModal(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  // Submissions filtered for current user safely
  const mySubmissions = safeSubmissions.filter(s =>
    (s.authorHandle?.toLowerCase() === authUser?.handle?.toLowerCase()) ||
    (s.author?.toLowerCase() === authUser?.name?.toLowerCase())
  );

  const visibleSubmissions = mySubmissions.length > 0 ? mySubmissions : safeSubmissions;
  const badges = resolveBadges(userProfile.badges);

  const renderActivePanel = () => {
    switch (activeSubTab) {
      case 'analytics':
        return (
          <div className="-mt-4">
            <UserAnalyticsDashboard
              palettes={safePalettes}
              vaultPalettes={safeVaultPalettes}
              projects={safeProjects}
              collections={safeCollections}
              favoriteColors={safeFavoriteColors}
              submissions={safeSubmissions}
              onOpenInGenerator={onOpenInGenerator}
              onOpenExport={onOpenExport}
            />
          </div>
        );
      case 'palettes':
        return (
          <PalettesPanel
            palettes={safePalettes}
            copiedId={copiedId}
            onOpenInGenerator={onOpenInGenerator}
            onSaveToCollection={onSaveToCollection}
            onOpenExport={onOpenExport}
            onOpenSubmissionModal={onOpenSubmissionModal}
            onCopyTokens={handleCopyTokens}
          />
        );
      case 'submissions':
        return (
          <SubmissionsPanel
            submissions={visibleSubmissions}
            onOpenInGenerator={onOpenInGenerator}
            onOpenSubmissionModal={onOpenSubmissionModal}
          />
        );
      case 'swatches':
        return (
          <SwatchesPanel
            favoriteColors={safeFavoriteColors}
            copiedColor={copiedColor}
            onCopyColorHex={handleCopyColorHex}
            onDeleteFavoriteColor={onDeleteFavoriteColor}
          />
        );
      case 'showcase':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-[#181C24] border border-white/[0.08] rounded-xl space-y-4">
              <h3 className="text-base font-bold text-white font-['Geist']">Vitrine do Criador & Métricas de Impacto</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Esta é a visualização pública que outros membros e designers veem ao navegar pelas suas coleções públicas no ecossistema Izy Colors.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-[#10141D] rounded-lg border border-white/[0.04]">
                  <span className="text-xs font-mono text-[#94A3B8] block">Taxa de Aceite na Curadoria</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">99.2%</span>
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">Alto rigor técnico e contraste WCAG</span>
                </div>

                <div className="p-4 bg-[#10141D] rounded-lg border border-white/[0.04]">
                  <span className="text-xs font-mono text-[#94A3B8] block">Exportações Realizadas</span>
                  <span className="text-2xl font-bold font-mono text-[#06B6D4] mt-1 block">14.8k</span>
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">Formatos Tailwind v4, CSS e Illustrator</span>
                </div>

                <div className="p-4 bg-[#10141D] rounded-lg border border-white/[0.04]">
                  <span className="text-xs font-mono text-[#94A3B8] block">Gamut de Preferência</span>
                  <span className="text-2xl font-bold font-mono text-purple-400 mt-1 block">Display P3</span>
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">Calibração para telas Apple & OLED</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'collections':
        return <CollectionsPanel collections={safeCollections} />;
      case 'vault':
        return (
          <VaultPanel
            vaultPalettes={safeVaultPalettes}
            copiedColor={copiedColor}
            onOpenInGenerator={onOpenInGenerator}
            onOpenExport={onOpenExport}
            onDeleteVaultPalette={onDeleteVaultPalette}
            onCopyColorHex={handleCopyColorHex}
          />
        );
      case 'settings':
        return (
          <SettingsPanel
            authUser={authUser}
            tokenFormat={tokenFormat}
            tokenPrefix={tokenPrefix}
            tokenNaming={tokenNaming}
            tokenIncludeComments={tokenIncludeComments}
            tokenPrefsSaved={tokenPrefsSaved}
            onFormatChange={(fmt) => {
              setTokenFormat(fmt);
              onUpdateProfile({ exportPreferences: buildPreferences({ defaultFormat: fmt }) });
            }}
            onPrefixChange={setTokenPrefix}
            onPrefixBlur={() => onUpdateProfile({ exportPreferences: buildPreferences() })}
            onNamingChange={(naming) => {
              setTokenNaming(naming);
              onUpdateProfile({ exportPreferences: buildPreferences({ namingConvention: naming }) });
            }}
            onIncludeCommentsChange={(include) => {
              setTokenIncludeComments(include);
              onUpdateProfile({ exportPreferences: buildPreferences({ includeComments: include }) });
            }}
            onSave={handleSaveTokenPreferences}
            onLogout={onLogout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 bg-[#0B0F17] text-[#DFE2EE] p-4 sm:p-8 max-w-[1720px] mx-auto w-full pb-24">

      {/* Top Banner: Synchronized Identity Header */}
      <div className="bg-[#181C24] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl mb-8 relative overflow-hidden">
        {/* Ambient lighting */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#6366F1]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#06B6D4]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative z-10">
          {/* Avatar + Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group">
              <img
                src={authUser.avatar || userProfile.avatar}
                alt={authUser.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-white/20 shadow-2xl"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-3 border-[#181C24] rounded-full shadow-lg" title="Usuário Ativo" />

              {onOpenAvatarEditor && (
                <button
                  type="button"
                  onClick={onOpenAvatarEditor}
                  className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:ring-offset-2 focus:ring-offset-[#181C24]"
                  aria-label="Alterar foto do perfil"
                  title="Alterar foto do perfil"
                >
                  <Camera className="w-7 h-7 text-white" />
                </button>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Geist']">
                  {authUser.name}
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider font-mono ${authUser.role === 'admin'
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#6366F1] text-white'
                  }`}>
                  {authUser.role === 'admin' ? 'ADMIN' : 'PRO'}
                </span>
                <span className="text-xs font-mono text-[#94A3B8]">
                  {authUser.handle}
                </span>
                <span className="text-[10px] font-mono text-[#64748B]">
                  • {authUser.email}
                </span>
              </div>

              <p className="text-sm font-medium text-[#06B6D4] mt-1 font-['Geist']">
                {resolveTitle(userProfile.title, authUser.role)}
              </p>

              <p className="text-xs sm:text-sm text-[#94A3B8] mt-2 max-w-2xl leading-relaxed">
                {authUser.bio || userProfile.bio || DEFAULT_BIO}
              </p>

              {/* Status and External Links */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-mono text-[#94A3B8]">
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${isSupabaseConnected ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                  }`}>
                  <Cloud className="w-3.5 h-3.5" />
                  {isSupabaseConnected ? 'Nuvem Supabase Ativa' : 'Armazenamento Local'}
                </span>

                {userProfile.website && (
                  <span className="flex items-center gap-1 hover:text-white transition-colors">
                    <Globe className="w-3.5 h-3.5 text-[#06B6D4]" />
                    {userProfile.website}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start">
            <button
              onClick={() => onOpenInGenerator(DEFAULT_PALETTE_COLORS)}
              className="h-9 px-3.5 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gerar Nova Paleta</span>
            </button>

            {onOpenAvatarEditor && (
              <button
                onClick={onOpenAvatarEditor}
                className="h-9 px-3.5 bg-[#262A33] hover:bg-[#31353E] border border-white/[0.08] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Alterar Foto</span>
              </button>
            )}

            <button
              onClick={() => setShowEditModal(true)}
              className="h-9 px-3.5 bg-[#262A33] hover:bg-[#31353E] border border-white/[0.08] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Editar Perfil</span>
            </button>

            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="h-9 px-3 bg-[#1B212D] hover:bg-[#252C3B] border border-white/[0.08] text-[#94A3B8] hover:text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Trocar conta ou autenticar"
              >
                <User className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Conta</span>
              </button>
            )}
          </div>
        </div>

        {/* Badges Strip */}
        <div className="mt-6 pt-6 border-t border-white/[0.08] flex flex-wrap items-center gap-2">
          {badges.map((badge) => (
            <span
              key={badge}
              className="px-3 py-1 rounded-full bg-[#111827] border border-white/[0.08] text-xs font-mono text-[#DFE2EE] flex items-center gap-1.5 shadow-inner"
            >
              <Award className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>{badge}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 4 Unified Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Minhas Paletas"
          value={safePalettes.length}
          valueClass="text-white"
          caption="Prontas para exportação"
          captionClass="text-emerald-400"
        />
        <MetricCard
          label="Cores Salvas"
          value={safeFavoriteColors.length}
          valueClass="text-[#EC4899]"
          caption="Amostras no cofre rápido"
          captionClass="text-[#94A3B8]"
        />
        <MetricCard
          label="Submissões Editoriais"
          value={visibleSubmissions.length}
          valueClass="text-[#06B6D4]"
          caption="Para revisão da comunidade"
          captionClass="text-[#94A3B8]"
        />
        <MetricCard
          label="Coleções & Projetos"
          value={safeCollections.length + safeProjects.length}
          valueClass="text-purple-400"
          caption="Workspaces organizados"
          captionClass="text-[#06B6D4]"
        />
      </div>

      {/* Subtabs Bar */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] mb-8 overflow-x-auto scrollbar-none">
        <SubTabButton
          isActive={activeSubTab === 'analytics'}
          activeBorder="border-[#06B6D4]"
          onClick={() => setActiveSubTab('analytics')}
          icon={<BarChart3 className="w-4 h-4 text-[#06B6D4]" />}
          label="Dashboard de Métricas & Recharts"
          badge={
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20 hidden sm:inline-block">
              Novo
            </span>
          }
        />
        <SubTabButton
          isActive={activeSubTab === 'palettes'}
          activeBorder="border-[#06B6D4]"
          onClick={() => setActiveSubTab('palettes')}
          icon={<PaletteIcon className="w-4 h-4 text-[#06B6D4]" />}
          label={`Minhas Paletas & Forks (${safePalettes.length})`}
        />
        <SubTabButton
          isActive={activeSubTab === 'submissions'}
          activeBorder="border-[#6366F1]"
          onClick={() => setActiveSubTab('submissions')}
          icon={<Send className="w-4 h-4 text-[#6366F1]" />}
          label={`Submissões & Curadoria (${visibleSubmissions.length})`}
        />
        <SubTabButton
          isActive={activeSubTab === 'swatches'}
          activeBorder="border-[#EC4899]"
          onClick={() => setActiveSubTab('swatches')}
          icon={<Heart className="w-4 h-4 text-[#EC4899]" />}
          label={`Cores Favoritas (${safeFavoriteColors.length})`}
        />
        <SubTabButton
          isActive={activeSubTab === 'showcase'}
          activeBorder="border-[#6366F1]"
          onClick={() => setActiveSubTab('showcase')}
          icon={<Eye className="w-4 h-4 text-purple-400" />}
          label="Vitrine Pública & Badges"
        />
        <SubTabButton
          isActive={activeSubTab === 'collections'}
          activeBorder="border-[#6366F1]"
          onClick={() => setActiveSubTab('collections')}
          icon={<Bookmark className="w-4 h-4 text-[#06B6D4]" />}
          label={`Coleções & Boards (${safeCollections.length})`}
        />
        <SubTabButton
          isActive={activeSubTab === 'vault'}
          activeBorder="border-amber-400"
          onClick={() => setActiveSubTab('vault')}
          icon={<Lock className="w-4 h-4 text-amber-400" />}
          label="Cofre Privado"
        />
        <SubTabButton
          isActive={activeSubTab === 'settings'}
          activeBorder="border-[#6366F1]"
          onClick={() => setActiveSubTab('settings')}
          icon={<Settings className="w-4 h-4 text-[#94A3B8]" />}
          label="Configurações & Exportação"
        />
      </div>

      {/* FEEDBACK TOAST */}
      {savedFeedback && (
        <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Perfil e preferências atualizados com sucesso!</span>
        </div>
      )}

      {/* ACTIVE SUB-TAB PANEL */}
      {renderActivePanel()}

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <EditProfileModal
          editName={editName}
          editHandle={editHandle}
          editTitle={editTitle}
          editBio={editBio}
          editWebsite={editWebsite}
          onNameChange={setEditName}
          onHandleChange={setEditHandle}
          onTitleChange={setEditTitle}
          onBioChange={setEditBio}
          onWebsiteChange={setEditWebsite}
          onSubmit={handleEditProfileSubmit}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};
