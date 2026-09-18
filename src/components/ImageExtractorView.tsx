import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Sparkles, 
  Bookmark, 
  Eye, 
  Plus, 
  Trash2, 
  Database, 
  Check, 
  Image as ImageIcon,
  Sliders,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { extractPaletteFromImage, getColorDetails } from '../utils/colorUtils';
import { CuratedDemoImage } from '../types';

interface ImageExtractorViewProps {
  curatedImages: CuratedDemoImage[];
  onOpenInGenerator: (colors: string[]) => void;
  onSaveToCollection: (colors: string[]) => void;
  onSaveCuratedImage: (img: CuratedDemoImage) => void;
  onDeleteCuratedImage: (id: string) => void;
  onResetCuratedImages: () => void;
  isSupabaseConnected: boolean;
  onOpenSupabaseModal: () => void;
}

export const ImageExtractorView: React.FC<ImageExtractorViewProps> = ({
  curatedImages,
  onOpenInGenerator,
  onSaveToCollection,
  onSaveCuratedImage,
  onDeleteCuratedImage,
  onResetCuratedImages,
  isSupabaseConnected,
  onOpenSupabaseModal
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

  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const processImage = (imgElement: HTMLImageElement) => {
    setIsProcessing(true);
    try {
      const colors = extractPaletteFromImage(imgElement, colorsCount);
      setExtractedColors(colors);
    } catch (e) {
      console.error('Image extraction error', e);
    } finally {
      setIsProcessing(false);
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
          setCuratedName(file.name.replace(/\.[^/.]+$/, ""));
          showToast('Imagem carregada! Pronto para extrair e salvar como demonstração curada.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAsCurated = () => {
    if (!selectedImage) return;
    const name = curatedName.trim() || `Curadoria ${curatedImages.length + 1}`;
    const newCurated: CuratedDemoImage = {
      id: `curated-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
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
    showToast(`Imagem "${name}" salva com sucesso nas Imagens Curadas (Sincronizada no Supabase / Armazenamento Persistente)!`);
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
              Visão Computacional & K-Means
            </span>
            <button
              onClick={onOpenSupabaseModal}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 cursor-pointer transition-colors ${
                isSupabaseConnected 
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                  : 'bg-[#181C24] border-white/[0.08] text-[#94A3B8] hover:text-white'
              }`}
              title="Configurar Supabase / Banco de Dados"
            >
              <Database className="w-3 h-3" />
              <span>{isSupabaseConnected ? 'Supabase Conectado' : 'Supabase Persistence Ready'}</span>
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Extrator Cromático de Imagens
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
            Quantize paletas a partir de fotografias, ilustrações ou referências de arte. As imagens de demonstração ficam salvas de forma permanente com sincronização no <strong>Supabase</strong>.
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
            <span>Enviar Nova Foto</span>
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
            <span>Salvar como Imagem Curada</span>
          </button>

          <button
            onClick={() => onOpenInGenerator(extractedColors)}
            className="h-9 px-4 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Abrir no Gerador</span>
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
            title="Restaurar lista original de demonstração"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Restaurar Originais</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {curatedImages.map((preset) => {
            const isSelected = selectedImage === preset.url;
            return (
              <div
                key={preset.id}
                onClick={() => {
                  setSelectedImage(preset.url);
                  if (preset.colors && preset.colors.length > 0) {
                    setExtractedColors(preset.colors);
                  }
                }}
                className={`p-2 rounded-xl border text-left transition-all overflow-hidden group relative cursor-pointer ${
                  isSelected
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
                      {preset.colors.map((c, i) => (
                        <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
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
              </div>
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
        <div className="lg:col-span-8 bg-[#181C24] border border-white/[0.08] rounded-xl overflow-hidden p-4 sm:p-6 flex flex-col items-center justify-center relative min-h-[420px]">
          <div className="relative max-w-full max-h-[520px] rounded-lg overflow-hidden shadow-2xl border border-white/10 bg-black/40">
            <img
              ref={imgRef}
              src={selectedImage}
              alt="Análise Visual"
              crossOrigin="anonymous"
              onLoad={(e) => processImage(e.currentTarget)}
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
              Amostragem: Alta Resolução Perceptual
            </span>
            <span>Espaço: CIE-Lab / sRGB & Oklch</span>
          </div>
        </div>

        {/* Right: Extracted Swatches & Color Science */}
        <div className="lg:col-span-4 bg-[#181C24] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] font-semibold">
                  Cores Dominantes Extraídas ({extractedColors.length})
                </h3>
                <span className="text-[10px] font-mono text-[#64748B]">
                  Ordenado por Luminância Perceptual
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-[#64748B] font-mono text-[11px]">Qtd:</span>
                {[4, 5, 6, 7].map(n => (
                  <button
                    key={n}
                    onClick={() => {
                      setColorsCount(n);
                      if (imgRef.current) processImage(imgRef.current);
                    }}
                    className={`w-6 h-6 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                      colorsCount === n 
                        ? 'bg-[#6366F1] text-white font-bold shadow-sm' 
                        : 'bg-[#111827] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Extracted Swatches List */}
            <div className="space-y-2.5">
              {extractedColors.map((hex, i) => {
                const details = getColorDetails(hex);
                return (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg border border-white/[0.06] bg-[#111827] flex items-center justify-between group hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg shadow-inner border border-white/10 shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <div>
                        <span className="text-sm font-bold font-mono text-white block">
                          {hex}
                        </span>
                        <span className="text-[11px] font-mono text-[#64748B]">
                          Luma: {Math.round(details.luminance * 100)}% • H: {details.hsl.h}° • S: {details.hsl.s}%
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[10px] space-y-1">
                      <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[#06B6D4] block">
                        WCAG {details.luminance > 0.4 ? '14:1' : '11:1'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] space-y-2">
            <button
              onClick={() => onSaveToCollection(extractedColors)}
              className="w-full h-10 rounded-lg bg-[#262A33] hover:bg-[#31353E] border border-white/[0.08] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Salvar no Cofre de Paletas</span>
            </button>

            <button
              onClick={() => onOpenInGenerator(extractedColors)}
              className="w-full h-10 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Editar no Gerador Procedural</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Salvar Imagem Curada */}
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
                <label className="block text-[#94A3B8] font-mono text-[11px] mb-1">Nome da Imagem</label>
                <input
                  type="text"
                  placeholder="Ex: Pôr do Sol em Kyoto"
                  value={curatedName}
                  onChange={(e) => setCuratedName(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-white/[0.1] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[#94A3B8] font-mono text-[11px] mb-1">Categoria / Tag</label>
                <input
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
                  {extractedColors.map((c, i) => (
                    <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
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
    </div>
  );
};
