import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Sparkles,
  Bookmark,
  Plus,
  Trash2,
  Database,
  Check,
  RefreshCw,
  Copy,
  FolderPlus,
  Download,
  Edit3
} from 'lucide-react';
import { extractPaletteFromImage, getColorDetails, toValidColorInputValue } from '../utils/colorUtils';
import { CuratedDemoImage, ProjectWorkspace, CollectionBoard, ProjectSlot } from '../types';
import { AddFavoriteToTargetModal } from './AddFavoriteToTargetModal';

interface ImageExtractorViewProps {
  curatedImages: CuratedDemoImage[];
  onApplyToActivePalette: (colors: string[]) => void;
  onProceedToRefine: () => void;
  onSaveCuratedImage: (img: CuratedDemoImage) => void;
  onDeleteCuratedImage: (id: string) => void;
  onResetCuratedImages: () => void;
  isSupabaseConnected: boolean;
  projects?: ProjectWorkspace[];
  collections?: CollectionBoard[];
  onSaveToFavorites?: (hex: string, name: string) => void;
  onAddColorsToProject?: (
    projectId: string,
    targetType: ProjectSlot,
    colors: string[],
    paletteName?: string
  ) => void;
  onAddColorsToCollection?: (collectionId: string, colors: string[]) => void;
  onCreateProject?: (project: ProjectWorkspace) => void;
  onCreateCollection?: (collection: CollectionBoard) => void;
  onOpenSavePaletteModal?: (colors?: string[], title?: string) => void;
  onOpenExport?: (colors?: string[], title?: string) => void;
}

export const ImageExtractorView: React.FC<ImageExtractorViewProps> = ({
  curatedImages,
  onApplyToActivePalette,
  onProceedToRefine,
  onSaveCuratedImage,
  onDeleteCuratedImage,
  onResetCuratedImages,
  isSupabaseConnected,
  projects = [],
  collections = [],
  onSaveToFavorites,
  onAddColorsToProject,
  onAddColorsToCollection,
  onCreateProject,
  onCreateCollection,
  onOpenSavePaletteModal,
  onOpenExport
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(
    curatedImages[0]?.url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80'
  );
  const [colorsCount, setColorsCount] = useState<number>(5);
  const [extractedColors, setExtractedColors] = useState<string[]>(
    curatedImages[0]?.colors || ['#0B1B2B', '#1E3A5F', '#08BBD9', '#FF2A85', '#E2E8F0']
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [curatedName, setCuratedName] = useState('');
  const [curatedTag, setCuratedTag] = useState('Arte & Estudo');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Target modal (Save single or multiple colors into Projects / Collections)
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [targetSelectedColors, setTargetSelectedColors] = useState<string[]>([]);

  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Input mode behavior: every extraction is immediately synced into the
  // centralized active palette.
  useEffect(() => {
    if (extractedColors.length > 0) {
      onApplyToActivePalette(extractedColors);
    }
  }, [extractedColors, onApplyToActivePalette]);

  /**
   * Process image with explicit count to avoid React state closure delays.
   * Fixes the requirement where quantity buttons (4, 5, 6, 7) required two clicks.
   */
  const processImage = (imgElement: HTMLImageElement, count: number = colorsCount) => {
    setIsProcessing(true);
    try {
      const colors = extractPaletteFromImage(imgElement, count);
      if (colors && colors.length > 0) {
        setExtractedColors(colors);
        onApplyToActivePalette(colors);
      }
    } catch (e) {
      console.error('Image extraction error', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetColorCount = (count: number) => {
    setColorsCount(count);
    if (imgRef.current) {
      processImage(imgRef.current, count);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setSelectedImage(dataUrl);
          setCuratedName(file.name.replace(/\.[^/.]+$/, ''));
          showToast('Imagem carregada! Extraindo paleta perceptual...');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAsCurated = () => {
    if (!selectedImage) return;
    const name = curatedName.trim() || `Curadoria ${curatedImages.length + 1}`;
    const newCurated: CuratedDemoImage = {
      id: `curated-${crypto.randomUUID()}`,
      name,
      url: selectedImage,
      tag: curatedTag.trim() || 'Curadoria',
      colors: extractedColors,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    onSaveCuratedImage(newCurated);
    setShowSaveModal(false);
    setCuratedName('');
    showToast(`Imagem "${name}" salva nas Imagens Curadas de Demonstração!`);
  };

  const handleDeleteCurated = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Remover "${name}" das imagens curadas de demonstração?`)) {
      onDeleteCuratedImage(id);
      showToast(`Imagem "${name}" removida.`);
      if (selectedImage === curatedImages.find(i => i.id === id)?.url && curatedImages.length > 1) {
        setSelectedImage(curatedImages[0].url);
      }
    }
  };

  // Color Editing
  const handleEditColor = (index: number, newHex: string) => {
    const updated = [...extractedColors];
    updated[index] = newHex.toUpperCase();
    setExtractedColors(updated);
    onApplyToActivePalette(updated);
  };

  // Color Deletion (Minimum 1 color maintained)
  const handleDeleteColor = (index: number) => {
    if (extractedColors.length <= 1) {
      showToast('A paleta deve conter no mínimo 1 cor dominante.');
      return;
    }
    const colorToRemove = extractedColors[index];
    const updated = extractedColors.filter((_, idx) => idx !== index);
    setExtractedColors(updated);
    onApplyToActivePalette(updated);
    showToast(`Amostra ${colorToRemove} removida.`);
  };

  // Add a new color swatch manually
  const handleAddColor = () => {
    if (extractedColors.length >= 10) {
      showToast('Limite máximo de 10 cores na extração.');
      return;
    }
    const lastColor = extractedColors.at(-1) || '#08BBD9';
    const details = getColorDetails(lastColor);
    // Generate a complementary or offset color
    const nextHue = (details.hsl.h + 45) % 360;
    const detailsNew = getColorDetails(`hsl(${nextHue}, 70%, 50%)`);
    const newHex = detailsNew.hex.toUpperCase();
    const updated = [...extractedColors, newHex];
    setExtractedColors(updated);
    onApplyToActivePalette(updated);
    showToast(`Nova amostra ${newHex} adicionada.`);
  };

  // Copy Color Hex
  const handleCopyColor = (hex: string) => {
    void navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    showToast(`Código ${hex} copiado para a área de transferência!`);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // Save single color to favorites
  const handleFavoriteSingleColor = (hex: string) => {
    if (onSaveToFavorites) {
      onSaveToFavorites(hex, `Amostra Extraída ${hex}`);
      showToast(`Cor ${hex} favoritada e salva no Cofre de Cores!`);
    } else {
      showToast(`Cor ${hex} salva!`);
    }
  };

  // Open modal to save color(s) to project or collection
  const handleOpenTargetModal = (colors: string[]) => {
    setTargetSelectedColors(colors);
    setTargetModalOpen(true);
  };

  // Apply & Proceed to Refine conveyor
  const handleProceedToRefine = () => {
    onApplyToActivePalette(extractedColors);
    onProceedToRefine();
  };

  return (
    <div className="flex-1 bg-[#0B0F17] text-[#DFE2EE] p-4 sm:p-8 max-w-[1600px] mx-auto w-full pb-24 font-['Geist']">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181C24] border border-[#06B6D4]/40 shadow-2xl rounded-xl px-4 py-3 text-xs text-white flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 text-[#06B6D4] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#06B6D4] flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
              {' '}Visão Computacional & K-Means
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 transition-colors ${isSupabaseConnected
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-[#181C24] border-white/[0.08] text-[#94A3B8]'
                }`}
              title="Status do Banco de Dados Supabase"
            >
              <Database className="w-3 h-3" />
              <span>{isSupabaseConnected ? 'Supabase Conectado' : 'Supabase Persistence Ready'}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Extrator Cromático de Imagens
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
            Quantize paletas a partir de fotografias, ilustrações ou referências visuais. Salve cores individualmente em projetos, edite amostras e continue o fluxo de design na esteira de refino.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-9 px-3.5 bg-[#181C24] hover:bg-[#262A33] border border-white/[0.08] rounded-lg text-xs text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Enviar Foto</span>
          </button>

          <button
            onClick={() => {
              setCuratedName('');
              setShowSaveModal(true);
            }}
            className="h-9 px-3.5 bg-[#181C24] hover:bg-[#262A33] border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Salvar a foto atual no acervo de demonstração permanente"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Salvar Foto Curada</span>
          </button>

          <button
            onClick={handleProceedToRefine}
            className="h-9 px-4 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-colors cursor-pointer"
            title="Levar as cores extraídas para a esteira de Refino Harmônico / Color Space Lab"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Continuar para Refinar</span>
          </button>
        </div>
      </div>

      {/* Curated Demo Images Carousel / Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider font-semibold">
              Imagens Curadas de Demonstração ({curatedImages.length}):
            </span>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.2 rounded">
              Persistência Ativa
            </span>
          </div>
          <button
            onClick={onResetCuratedImages}
            className="text-[11px] font-mono text-[#64748B] hover:text-[#94A3B8] transition-colors cursor-pointer flex items-center gap-1"
            title="Recarregar imagens curadas do banco de dados Supabase"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Sincronizar com Banco</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {curatedImages.map((preset) => {
            const isSelected = selectedImage === preset.url;
            return (
              <button
                type="button"
                key={preset.id}
                onClick={() => {
                  setSelectedImage(preset.url);
                  if (preset.colors && preset.colors.length > 0) {
                    setExtractedColors(preset.colors);
                    onApplyToActivePalette(preset.colors);
                  }
                }}
                className={`p-2 rounded-xl border text-left transition-all overflow-hidden group relative cursor-pointer ${isSelected
                  ? 'border-[#06B6D4] bg-[#181C24] ring-1 ring-[#06B6D4]'
                  : 'border-white/[0.08] bg-[#111827] hover:border-white/20'
                  }`}
              >
                <div className="h-20 w-full rounded-lg overflow-hidden mb-2 bg-black relative">
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {preset.isCustom && (
                    <button
                      onClick={(e) => handleDeleteCurated(e, preset.id, preset.name)}
                      className="absolute top-1.5 right-1.5 p-1 rounded bg-black/70 hover:bg-rose-600 text-white/70 hover:text-white transition-colors"
                      title="Excluir imagem curada"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  {preset.colors && preset.colors.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 flex">
                      {preset.colors.map((c) => (
                        <div key={c} className="flex-1 h-full" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-white block truncate">{preset.name}</span>
                  {preset.isCustom && (
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-1 rounded">
                      Custom
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-[#64748B] block truncate">{preset.tag}</span>
              </button>
            );
          })}

          {/* Add Custom Button Card */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl border border-dashed border-white/[0.12] hover:border-[#06B6D4] bg-[#111827]/60 hover:bg-[#181C24] flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-[#262A33] group-hover:bg-[#06B6D4]/20 flex items-center justify-center text-[#94A3B8] group-hover:text-[#06B6D4] transition-colors mb-1.5">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-white group-hover:text-[#06B6D4] transition-colors">
              Adicionar Imagem
            </span>
            <span className="text-[10px] text-[#64748B] font-mono mt-0.5">
              Salva no Supabase
            </span>
          </button>
        </div>
      </div>

      {/* Image Stage + Extracted Palette Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Image Canvas */}
        <div className="lg:col-span-7 bg-[#181C24] border border-white/[0.08] rounded-xl overflow-hidden p-4 sm:p-6 flex flex-col items-center justify-center relative min-h-[420px]">
          <div className="relative max-w-full max-h-[520px] rounded-lg overflow-hidden shadow-2xl border border-white/10 bg-black/40">
            <img
              ref={imgRef}
              src={selectedImage}
              alt="Análise Visual"
              crossOrigin="anonymous"
              onLoad={(e) => processImage(e.currentTarget, colorsCount)}
              className="max-h-[500px] w-auto object-contain rounded-lg"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-xs font-mono gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-[#06B6D4]" />
                <span>Processando aglomerados de cores K-Means...</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between w-full max-w-xl text-xs font-mono text-[#94A3B8] pt-2 border-t border-white/[0.04]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {' '}Amostragem: Alta Resolução Perceptual
            </span>
            <span>Espaço: CIE-Lab / sRGB & Oklch</span>
          </div>
        </div>

        {/* Right: Extracted Swatches & Individual Color Actions */}
        <div className="lg:col-span-5 bg-[#181C24] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between">
          <div>
            {/* Header with Quantity Switcher & Add Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] font-semibold flex items-center gap-2">
                  <span>Cores Dominantes Extraídas ({extractedColors.length})</span>
                </h3>
                <span className="text-[10px] font-mono text-[#64748B]">
                  Mínimo de 1 cor • Salve individualmente ou em paleta
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Quantity selector (4, 5, 6, 7) - 1-click execution */}
                <div className="flex items-center gap-1 text-xs bg-[#111827] p-1 rounded-lg border border-white/[0.08]">
                  <span className="text-[#64748B] font-mono text-[10px] px-1">Qtd:</span>
                  {[4, 5, 6, 7].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleSetColorCount(n)}
                      className={`w-5 h-5 rounded text-[10px] font-mono cursor-pointer transition-colors ${colorsCount === n && extractedColors.length === n
                        ? 'bg-[#6366F1] text-white font-bold shadow-sm'
                        : 'bg-[#181C24] text-[#94A3B8] hover:text-white'
                        }`}
                      title={`Extrair ${n} cores dominantes`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                {/* Add Manual Color */}
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="h-7 px-2 bg-[#111827] hover:bg-[#262A33] border border-white/[0.08] rounded-lg text-[11px] font-mono text-[#06B6D4] flex items-center gap-1 transition-colors cursor-pointer"
                  title="Adicionar uma cor personalizada à paleta extraída"
                >
                  <Plus className="w-3 h-3" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            {/* Extracted Swatches List with Inline Edit, Delete, and Individual Save Actions */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {extractedColors.map((hex, idx) => {
                const details = getColorDetails(hex);
                const isCopied = copiedHex === hex;
                const canDelete = extractedColors.length > 1;

                return (
                  <div
                    key={`${hex}-${idx}`}
                    className="p-2.5 rounded-lg border border-white/[0.06] bg-[#111827] flex items-center justify-between group hover:border-white/20 transition-all"
                  >
                    {/* Left: Swatch Picker + Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Color Picker trigger */}
                      <label
                        className="w-10 h-10 rounded-lg shadow-inner border border-white/10 shrink-0 cursor-pointer relative overflow-hidden group/swatch block"
                        style={{ backgroundColor: hex }}
                        title="Clique para editar com o seletor de cores nativo"
                      >
                        <input
                          type="color"
                          value={toValidColorInputValue(hex)}
                          onChange={(e) => handleEditColor(idx, e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/swatch:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                          <Edit3 className="w-3.5 h-3.5 text-white" />
                        </div>
                      </label>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={hex}
                            onChange={(e) => handleEditColor(idx, e.target.value)}
                            className="text-xs font-bold font-mono text-white bg-transparent border-b border-transparent hover:border-white/30 focus:border-[#06B6D4] focus:outline-none w-20 uppercase"
                            title="Editar código HEX diretamente"
                          />
                          <span className="text-[10px] font-mono text-[#64748B]">#{idx + 1}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#64748B] block truncate">
                          L: {Math.round(details.luminance * 100)}% • H: {details.hsl.h}° • S: {details.hsl.s}%
                        </span>
                      </div>
                    </div>

                    {/* Right: Individual Actions (Copy, Favorite, Add to Project/Collection, Delete) */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Copy Hex */}
                      <button
                        type="button"
                        onClick={() => handleCopyColor(hex)}
                        className="p-1.5 rounded-md bg-[#181C24] hover:bg-[#262A33] border border-white/[0.06] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                        title={`Copiar código ${hex}`}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {/* Favorite single color */}
                      <button
                        type="button"
                        onClick={() => handleFavoriteSingleColor(hex)}
                        className="p-1.5 rounded-md bg-[#181C24] hover:bg-[#262A33] border border-white/[0.06] text-[#94A3B8] hover:text-amber-400 transition-colors cursor-pointer"
                        title="Favoritar / Salvar esta cor no Cofre de Cores"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>

                      {/* Save single color to Project or Collection */}
                      <button
                        type="button"
                        onClick={() => handleOpenTargetModal([hex])}
                        className="p-1.5 rounded-md bg-[#181C24] hover:bg-[#262A33] border border-white/[0.06] text-[#94A3B8] hover:text-[#06B6D4] transition-colors cursor-pointer"
                        title="Salvar esta cor individualmente em Projeto ou Coleção"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete swatch (minimum 1 color allowed) */}
                      <button
                        type="button"
                        onClick={() => handleDeleteColor(idx)}
                        disabled={!canDelete}
                        className={`p-1.5 rounded-md border transition-colors cursor-pointer ${canDelete
                          ? 'bg-[#181C24] hover:bg-rose-950/60 border-white/[0.06] hover:border-rose-500/40 text-[#94A3B8] hover:text-rose-400'
                          : 'bg-[#181C24]/50 border-white/[0.04] text-white/20 cursor-not-allowed'
                          }`}
                        title={canDelete ? 'Remover esta cor dominante' : 'Mínimo de 1 cor mantido (não é possível deletar a última cor)'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Bulk Save Buttons */}
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleOpenTargetModal(extractedColors)}
                className="flex-1 h-8 px-2.5 rounded-lg bg-[#111827] hover:bg-[#262A33] border border-white/[0.08] text-[11px] font-mono text-[#94A3B8] hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Salvar todas as cores extraídas em um Projeto ou Coleção"
              >
                <FolderPlus className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Adicionar ao Projeto/Coleção</span>
              </button>

              {onOpenSavePaletteModal && (
                <button
                  type="button"
                  onClick={() => onOpenSavePaletteModal(extractedColors, curatedName || 'Paleta Extraída da Imagem')}
                  className="h-8 px-2.5 rounded-lg bg-[#111827] hover:bg-[#262A33] border border-white/[0.08] text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Salvar como paleta completa no Cofre Privado"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Salvar Paleta</span>
                </button>
              )}

              {onOpenExport && (
                <button
                  type="button"
                  onClick={() => onOpenExport(extractedColors, curatedName || 'Paleta Extraída')}
                  className="h-8 px-2.5 rounded-lg bg-[#111827] hover:bg-[#262A33] border border-white/[0.08] text-[11px] font-mono text-[#94A3B8] hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Exportar paleta extraída em CSS, JSON, ASE ou SVG"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Workflow Action */}
          <div className="mt-6 pt-4 border-t border-white/[0.06] space-y-2">
            <button
              onClick={handleProceedToRefine}
              className="w-full h-10 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Aplicar & Continuar na Esteira de Edição</span>
            </button>
            <p className="text-[11px] font-mono text-[#64748B] text-center">
              Paleta extraída sincronizada com a Paleta Ativa
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Salvar Imagem Curada de Demonstração */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-white/[0.12] rounded-xl shadow-2xl p-5 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-emerald-400" />
              Salvar nas Imagens Curadas de Demonstração
            </h3>
            <p className="text-xs text-[#94A3B8] mb-4">
              Esta imagem será guardada permanentemente e sincronizada com o banco de dados Supabase.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label htmlFor="curated-name" className="block text-[#94A3B8] font-mono text-[11px] mb-1">Nome da Imagem</label>
                <input
                  id="curated-name"
                  type="text"
                  placeholder="Ex: Pôr do Sol em Kyoto"
                  value={curatedName}
                  onChange={(e) => setCuratedName(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-white/[0.1] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="curated-tag" className="block text-[#94A3B8] font-mono text-[11px] mb-1">Categoria / Tag</label>
                <input
                  id="curated-tag"
                  type="text"
                  placeholder="Ex: Arquitetura, Cyberpunk, Natureza..."
                  value={curatedTag}
                  onChange={(e) => setCuratedTag(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-white/[0.1] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-2.5 bg-[#0B0F17] rounded-lg border border-white/[0.06] flex items-center gap-2">
                <span className="text-[11px] text-[#64748B] font-mono">Paleta:</span>
                <div className="flex-1 h-4 rounded overflow-hidden flex">
                  {extractedColors.map((c) => (
                    <div key={c} className="flex-1 h-full" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="h-9 px-4 rounded-lg bg-[#262A33] text-white text-xs hover:bg-[#31353E] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAsCurated}
                className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvar Imagem Curada</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target Modal: Save Individual Color or Selection to Projects / Collections */}
      <AddFavoriteToTargetModal
        isOpen={targetModalOpen}
        onClose={() => setTargetModalOpen(false)}
        selectedColors={targetSelectedColors}
        projects={projects}
        collections={collections}
        onAddColorsToProject={(projId, slot, colors, name) => {
          if (onAddColorsToProject) {
            onAddColorsToProject(projId, slot, colors, name);
          }
        }}
        onAddColorsToCollection={(colId, colors) => {
          if (onAddColorsToCollection) {
            onAddColorsToCollection(colId, colors);
          }
        }}
        onCreateProject={onCreateProject}
        onCreateCollection={onCreateCollection}
        showToast={showToast}
      />
    </div>
  );
};
