import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Lock, 
  Unlock, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  Sliders, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  RotateCcw, 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  Download, 
  Share2,
  Sparkles,
  Info,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { ColorItem, ColorDetails } from '../types';
import { 
  getColorDetails, 
  generateRandomHarmoniousPalette, 
  generateHarmonies,
  getContrastRatio,
  hslToRgb,
  rgbToHex,
  rgbToHsl
} from '../utils/colorUtils';
import { WcagTooltip } from './WcagTooltip';

interface GeneratorViewProps {
  initialColors?: string[];
  onSaveToFavorites: (hex: string, name: string) => void;
  onSaveToCollection: (colors: string[]) => void;
  onOpenExport: (colors: string[]) => void;
}

export const GeneratorView: React.FC<GeneratorViewProps> = ({
  initialColors,
  onSaveToFavorites,
  onSaveToCollection,
  onOpenExport
}) => {
  const [colors, setColors] = useState<ColorItem[]>(() => {
    const seed = initialColors || ['#0E1726', '#08BBD9', '#3B82F6', '#9354F5', '#FF2A85'];
    return seed.map((hex, i) => ({
      id: `col-${i}-${Date.now()}`,
      hex: hex.toUpperCase(),
      name: `Color ${i + 1}`,
      locked: false
    }));
  });

  const [history, setHistory] = useState<ColorItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeFormat, setActiveFormat] = useState<'HEX' | 'RGB' | 'HSL' | 'OKLCH'>('HEX');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [harmonyMode, setHarmonyMode] = useState<string>('smart');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hoveredSwatch, setHoveredSwatch] = useState<{
    index: number;
    hex: string;
    name: string;
    position: { x: number; y: number };
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Generate new colors respecting locked ones
  const generateNewPalette = useCallback(() => {
    let newHexes: string[] = [];
    if (harmonyMode === 'smart') {
      newHexes = generateRandomHarmoniousPalette(colors.length);
    } else {
      const baseH = Math.floor(Math.random() * 360);
      newHexes = generateHarmonies(baseH, colors.length, harmonyMode);
    }

    setColors(prev => {
      // Push previous state to history
      setHistory(h => [...h.slice(0, historyIndex + 1), prev]);
      setHistoryIndex(i => i + 1);

      return prev.map((item, idx) => {
        if (item.locked) return item;
        return {
          ...item,
          hex: newHexes[idx] || rgbToHex(Math.random() * 255, Math.random() * 255, Math.random() * 255)
        };
      });
    });
  }, [colors.length, harmonyMode, historyIndex]);

  // Spacebar and Escape global event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        generateNewPalette();
      }
      if (e.code === 'Escape' && isFocusMode) {
        e.preventDefault();
        setIsFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generateNewPalette, isFocusMode]);

  // Toggle lock on a column
  const toggleLock = (index: number) => {
    setColors(prev => prev.map((col, i) => i === index ? { ...col, locked: !col.locked } : col));
  };

  // Move column left or right
  const moveColumn = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= colors.length) return;
    setColors(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  // Add column
  const addColumn = (atIndex: number) => {
    if (colors.length >= 8) {
      showToast('Limite de 8 colunas atingido.');
      return;
    }
    const leftHex = colors[atIndex].hex;
    const rightHex = colors[atIndex + 1]?.hex || colors[atIndex].hex;
    const details = getColorDetails(leftHex);
    // Slight variation
    const nextH = (details.hsl.h + 30) % 360;
    const rgb = hslToRgb(nextH, details.hsl.s, details.hsl.l);
    const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);

    setColors(prev => {
      const next = [...prev];
      next.splice(atIndex + 1, 0, {
        id: `col-${Date.now()}-${Math.random()}`,
        hex: newHex,
        name: `Color ${next.length + 1}`,
        locked: false
      });
      return next;
    });
  };

  // Delete column
  const deleteColumn = (index: number) => {
    if (colors.length <= 2) {
      showToast('A paleta deve conter no mínimo 2 cores.');
      return;
    }
    setColors(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  // Copy color code
  const copyColor = (index: number, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
    showToast(`Copiado: ${val}`);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex >= 0) {
      const targetState = history[historyIndex];
      setColors(targetState);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setColors(history[nextIndex]);
      setHistoryIndex(nextIndex);
    }
  };

  // Update specific color from picker
  const handleColorUpdate = (index: number, newHex: string) => {
    setColors(prev => prev.map((col, i) => i === index ? { ...col, hex: newHex.toUpperCase() } : col));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={
        isFocusMode 
          ? "fixed inset-0 z-50 bg-[#0B0F17] flex flex-col w-screen h-screen select-none overflow-hidden animate-in fade-in duration-200"
          : "flex-1 flex flex-col bg-[#0B0F17] select-none min-h-[calc(100vh-88px)]"
      }
    >
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#181C24] border border-[#6366F1]/50 text-white text-xs font-medium rounded-full shadow-2xl animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Focus Mode Control Bar */}
      {isFocusMode ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-[#0E131E]/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/[0.15] shadow-2xl animate-in slide-in-from-top-4">
          <div className="flex items-center gap-1.5 text-xs text-[#06B6D4] font-mono">
            <Eye className="w-3.5 h-3.5" />
            <span className="font-bold tracking-wider text-[11px] uppercase">Modo Foco</span>
          </div>

          <div className="w-px h-4 bg-white/10" />

          <button
            onClick={generateNewPalette}
            className="h-7 px-3 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3 h-3" />
            <span>Gerar</span>
            <span className="text-[9px] bg-white/20 px-1 rounded font-mono">Espaço</span>
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center bg-[#181C24] rounded-full border border-white/10 px-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex < 0}
              className="p-1 text-[#94A3B8] hover:text-white disabled:opacity-30 transition-colors"
              title="Desfazer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <div className="w-[1px] h-3 bg-white/10" />
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1 text-[#94A3B8] hover:text-white disabled:opacity-30 transition-colors"
              title="Refazer"
            >
              <RotateCw className="w-3 h-3" />
            </button>
          </div>

          <div className="w-px h-4 bg-white/10" />

          <button
            onClick={() => setIsFocusMode(false)}
            className="h-7 px-3 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Sair do Modo Foco (Esc)"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Sair do Foco</span>
            <span className="text-[9px] font-mono bg-black/30 px-1 rounded">Esc</span>
          </button>
        </div>
      ) : (
        /* Generator Control Header Toolbar */
        <div className="h-12 bg-[#111827] border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={generateNewPalette}
              className="h-8 px-3.5 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded text-xs font-semibold flex items-center gap-2 shadow-sm shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gerar</span>
              <span className="hidden sm:inline text-[10px] bg-white/20 px-1 rounded font-mono">Espaço</span>
            </button>

            {/* Harmony Mode Selector */}
            <div className="hidden sm:flex items-center bg-[#181C24] p-0.5 rounded border border-white/[0.08] text-xs">
              <span className="text-[10px] font-mono text-[#64748B] px-2">Harmonia:</span>
              {[
                { id: 'smart', label: 'Coolors Smart' },
                { id: 'analogous', label: 'Análoga' },
                { id: 'monochromatic', label: 'Monocromática' },
                { id: 'triad', label: 'Tríade' },
                { id: 'complementary', label: 'Complementar' },
                { id: 'tetradic', label: 'Tétrade' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setHarmonyMode(m.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    harmonyMode === m.id
                      ? 'bg-[#262A33] text-white'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tools Right */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Format Switcher */}
            <div className="flex items-center bg-[#181C24] p-0.5 rounded border border-white/[0.08] text-xs font-mono">
              {(['HEX', 'RGB', 'HSL', 'OKLCH'] as const).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setActiveFormat(fmt)}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                    activeFormat === fmt
                      ? 'bg-[#6366F1] text-white font-semibold'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            {/* Modo Foco Button */}
            <button
              onClick={() => setIsFocusMode(true)}
              className="h-8 px-2.5 bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 border border-[#06B6D4]/30 rounded text-xs text-[#06B6D4] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Modo Foco: Ocultar navegação e barras laterais para visualizar em tela cheia"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-medium">Modo Foco</span>
            </button>

            {/* Undo / Redo */}
            <div className="flex items-center bg-[#181C24] rounded border border-white/[0.08]">
              <button
                onClick={handleUndo}
                disabled={historyIndex < 0}
                className="p-1.5 text-[#94A3B8] hover:text-white disabled:opacity-30 transition-colors"
                title="Desfazer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <div className="w-[1px] h-3 bg-white/[0.08]" />
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 text-[#94A3B8] hover:text-white disabled:opacity-30 transition-colors"
                title="Refazer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Save to Collection */}
            <button
              onClick={() => onSaveToCollection(colors.map(c => c.hex))}
              className="h-8 px-2.5 bg-[#181C24] hover:bg-[#262A33] border border-white/[0.08] rounded text-xs text-[#DFE2EE] flex items-center gap-1.5 transition-colors"
              title="Salvar em Projetos / Coleções"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span className="hidden md:inline">Salvar Coleção</span>
            </button>

            {/* Export Tokens */}
            <button
              onClick={() => onOpenExport(colors.map(c => c.hex))}
              className="h-8 px-2.5 bg-[#181C24] hover:bg-[#262A33] border border-white/[0.08] rounded text-xs text-[#DFE2EE] flex items-center gap-1.5 transition-colors"
              title="Exportar tokens em CSS, Tailwind, JSON e SVG"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Exportar</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-[#181C24] hover:bg-[#262A33] border border-white/[0.08] rounded text-[#94A3B8] hover:text-white transition-colors"
              title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia do navegador'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Main Color Swatch Columns Area (Full-Bleed Coolors Layout) */}
      <div className="flex-1 flex flex-col md:flex-row w-full h-full relative overflow-hidden">
        {colors.map((col, idx) => {
          const details = getColorDetails(col.hex);
          const isLight = details.isLight;
          const textColor = isLight ? '#0B0F17' : '#FFFFFF';
          const mutedTextColor = isLight ? 'rgba(11, 15, 23, 0.7)' : 'rgba(255, 255, 255, 0.7)';
          const buttonBg = isLight ? 'rgba(11, 15, 23, 0.12)' : 'rgba(255, 255, 255, 0.15)';
          const buttonHoverBg = isLight ? 'rgba(11, 15, 23, 0.22)' : 'rgba(255, 255, 255, 0.28)';

          let formattedValue = col.hex;
          if (activeFormat === 'RGB') {
            formattedValue = `rgb(${details.rgb.r}, ${details.rgb.g}, ${details.rgb.b})`;
          } else if (activeFormat === 'HSL') {
            formattedValue = `hsl(${details.hsl.h}, ${details.hsl.s}%, ${details.hsl.l}%)`;
          } else if (activeFormat === 'OKLCH') {
            formattedValue = `oklch(${details.oklch.l} ${details.oklch.c} ${details.oklch.h})`;
          }

          const ratioW = getContrastRatio('#FFFFFF', col.hex);
          const ratioB = getContrastRatio('#000000', col.hex);
          const bestR = Math.max(ratioW, ratioB);
          const wcagBadgeLabel = bestR >= 7.0 ? 'AAA' : bestR >= 4.5 ? 'AA' : bestR >= 3.0 ? 'AA Grande' : 'Falha';

          return (
            <div
              key={col.id}
              className="flex-1 min-h-[140px] md:min-h-0 relative flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200 group border-b md:border-b-0 md:border-r border-black/10 last:border-none cursor-crosshair"
              style={{ backgroundColor: col.hex }}
              onMouseEnter={(e) => {
                setHoveredSwatch({
                  index: idx,
                  hex: col.hex,
                  name: col.name,
                  position: { x: e.clientX, y: e.clientY }
                });
              }}
              onMouseMove={(e) => {
                setHoveredSwatch(prev => {
                  if (prev && prev.index === idx) {
                    return { ...prev, position: { x: e.clientX, y: e.clientY } };
                  }
                  return {
                    index: idx,
                    hex: col.hex,
                    name: col.name,
                    position: { x: e.clientX, y: e.clientY }
                  };
                });
              }}
              onMouseLeave={() => setHoveredSwatch(null)}
            >
              {/* Top Controls on Hover */}
              <div className="flex items-center justify-between opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Column movement and remove */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveColumn(idx, 'left')}
                    disabled={idx === 0}
                    className="p-1.5 rounded transition-colors disabled:opacity-20 cursor-pointer"
                    style={{ backgroundColor: buttonBg, color: textColor }}
                    title="Mover para esquerda"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveColumn(idx, 'right')}
                    disabled={idx === colors.length - 1}
                    className="p-1.5 rounded transition-colors disabled:opacity-20 cursor-pointer"
                    style={{ backgroundColor: buttonBg, color: textColor }}
                    title="Mover para direita"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {/* Save single swatch */}
                  <button
                    onClick={() => {
                      onSaveToFavorites(col.hex, `Swatch ${idx + 1}`);
                      showToast(`Cor ${col.hex} salva no Cofre!`);
                    }}
                    className="p-1.5 rounded transition-colors cursor-pointer"
                    style={{ backgroundColor: buttonBg, color: textColor }}
                    title="Salvar cor no Cofre de Favoritos"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>

                  {/* Adjust color details / sliders */}
                  <button
                    onClick={() => setEditingIndex(editingIndex === idx ? null : idx)}
                    className="p-1.5 rounded transition-colors cursor-pointer"
                    style={{ backgroundColor: buttonBg, color: textColor }}
                    title="Ajustar Matiz e Luminosidade"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete column */}
                  {colors.length > 2 && (
                    <button
                      onClick={() => deleteColumn(idx)}
                      className="p-1.5 rounded transition-colors cursor-pointer"
                      style={{ backgroundColor: buttonBg, color: textColor }}
                      title="Excluir coluna"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Central Color Code and Lock Button */}
              <div className="my-auto flex flex-col items-center justify-center gap-3 text-center">
                {/* Lock Toggle Button */}
                <button
                  onClick={() => toggleLock(idx)}
                  className={`p-3 rounded-full transition-all duration-200 shadow-md cursor-pointer ${
                    col.locked 
                      ? 'scale-110 ring-2 ring-white/50' 
                      : 'opacity-70 group-hover:opacity-100 hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: col.locked ? (isLight ? '#0B0F17' : '#FFFFFF') : buttonBg,
                    color: col.locked ? (isLight ? '#FFFFFF' : '#0B0F17') : textColor
                  }}
                  title={col.locked ? 'Cor bloqueada (não mudará ao apertar Espaço)' : 'Cor desbloqueada'}
                >
                  {col.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>

                {/* Color Code Value Button */}
                <button
                  onClick={() => copyColor(idx, formattedValue)}
                  className="flex flex-col items-center group/btn focus:outline-none cursor-pointer"
                  title="Clique para copiar"
                >
                  <span 
                    className="text-lg sm:text-2xl font-bold font-mono tracking-tight transition-transform group-hover/btn:scale-105"
                    style={{ color: textColor }}
                  >
                    {activeFormat === 'HEX' ? col.hex : formattedValue}
                  </span>
                  <span 
                    className="text-[11px] font-mono uppercase tracking-widest mt-0.5 flex items-center gap-1"
                    style={{ color: mutedTextColor }}
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-2.5 h-2.5" />
                        <span>Copiar {activeFormat}</span>
                      </>
                    )}
                  </span>
                </button>
              </div>

              {/* Bottom Color Science Metrics */}
              <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: mutedTextColor }}>
                <span>Lum: {Math.round(details.luminance * 100)}%</span>
                <span 
                  className="px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-semibold border border-white/10 shadow-sm cursor-help transition-transform hover:scale-105" 
                  style={{ backgroundColor: buttonBg }}
                  title="Auditoria de acessibilidade WCAG"
                >
                  <ShieldCheck className="w-3 h-3 text-[#06B6D4]" />
                  <span>WCAG {wcagBadgeLabel}</span>
                  <span className="opacity-80 text-[9px]">({bestR.toFixed(1)}:1)</span>
                </span>
              </div>

              {/* Add Column Button on Divider Hover */}
              {idx < colors.length - 1 && (
                <button
                  onClick={() => addColumn(idx)}
                  className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-[#111827] border border-white/20 text-white opacity-0 group-hover:opacity-100 hover:scale-125 transition-all flex items-center justify-center shadow-lg cursor-pointer"
                  title="Adicionar coluna aqui"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Inline Color Adjuster Popover */}
              {editingIndex === idx && (
                <div 
                  className="absolute bottom-16 left-4 right-4 md:left-auto md:right-auto md:w-64 bg-[#181C24] border border-white/[0.12] rounded-xl p-4 shadow-2xl z-30 animate-in fade-in zoom-in-95 text-xs text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-3 border-b border-white/[0.08] pb-2">
                    <span className="font-semibold font-['Geist']">Ajustar Cor {idx + 1}</span>
                    <button 
                      onClick={() => setEditingIndex(null)}
                      className="text-[#94A3B8] hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Native Color Picker + Hex Input */}
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="color"
                      value={col.hex}
                      onChange={(e) => handleColorUpdate(idx, e.target.value)}
                      className="w-8 h-8 rounded border border-white/20 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={col.hex}
                      onChange={(e) => handleColorUpdate(idx, e.target.value)}
                      className="flex-1 bg-[#0B0F17] border border-white/[0.1] rounded px-2 py-1.5 font-mono text-xs text-white uppercase focus:outline-none focus:border-[#6366F1]"
                    />
                  </div>

                  {/* Sliders: Hue, Saturation, Lightness */}
                  <div className="space-y-2.5 font-mono text-[11px]">
                    <div>
                      <div className="flex justify-between text-[#94A3B8] mb-1">
                        <span>Matiz (Hue)</span>
                        <span>{details.hsl.h}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={details.hsl.h}
                        onChange={(e) => {
                          const rgb = hslToRgb(Number(e.target.value), details.hsl.s, details.hsl.l);
                          handleColorUpdate(idx, rgbToHex(rgb.r, rgb.g, rgb.b));
                        }}
                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-red-500 via-green-500 via-blue-500 to-red-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[#94A3B8] mb-1">
                        <span>Saturação</span>
                        <span>{details.hsl.s}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={details.hsl.s}
                        onChange={(e) => {
                          const rgb = hslToRgb(details.hsl.h, Number(e.target.value), details.hsl.l);
                          handleColorUpdate(idx, rgbToHex(rgb.r, rgb.g, rgb.b));
                        }}
                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-700"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[#94A3B8] mb-1">
                        <span>Luminosidade</span>
                        <span>{details.hsl.l}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={details.hsl.l}
                        onChange={(e) => {
                          const rgb = hslToRgb(details.hsl.h, details.hsl.s, Number(e.target.value));
                          handleColorUpdate(idx, rgbToHex(rgb.r, rgb.g, rgb.b));
                        }}
                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-700"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Render WCAG Contrast Tooltip automatically on hover */}
      {hoveredSwatch && editingIndex === null && (
        <WcagTooltip
          colorHex={hoveredSwatch.hex}
          colorName={hoveredSwatch.name}
          index={hoveredSwatch.index}
          prevColorHex={colors[hoveredSwatch.index - 1]?.hex}
          nextColorHex={colors[hoveredSwatch.index + 1]?.hex}
          position={hoveredSwatch.position}
        />
      )}
    </div>
  );
};
