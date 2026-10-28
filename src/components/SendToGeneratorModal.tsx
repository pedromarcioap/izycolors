import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Sliders,
  Layers,
  Check,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import {
  CollectionBoard,
  VaultPalette,
  GeneratorOpenMode,
  OverlayStrategy
} from '../types';
import { getColorDetails } from '../utils/colorUtils';

export interface SendToGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  incomingColors?: string[];
  title?: string;
  sourceLabel?: string;
  sourceType?: 'collection' | 'vault' | 'palette' | 'project' | 'swatch' | 'image' | 'curation' | 'custom';
  defaultMode?: GeneratorOpenMode;
  currentGeneratorColors: string[];
  onConfirm: (
    mode: GeneratorOpenMode,
    finalColors: string[],
    options?: {
      startEditingIndex?: number;
      strategy?: OverlayStrategy;
    }
  ) => void;
  // Available data libraries for fallback when opened without pre-selected colors
  collections?: CollectionBoard[];
  vaultPalettes?: VaultPalette[];
}

export const SendToGeneratorModal: React.FC<SendToGeneratorModalProps> = ({
  isOpen,
  onClose,
  incomingColors = [],
  title,
  sourceLabel,
  sourceType = 'custom',
  defaultMode = 'overlay',
  currentGeneratorColors = [],
  onConfirm,
  collections = [],
  vaultPalettes = []
}) => {
  // If incomingColors is passed, start with it; otherwise user can pick from libraries
  const [activeColors, setActiveColors] = useState<string[]>(incomingColors);
  const [activeTitle, setActiveTitle] = useState<string>(title || '');
  const [activeSourceLabel, setActiveSourceLabel] = useState<string>(sourceLabel || '');

  // Selected mode: 'new' | 'edit' | 'overlay'
  const [selectedMode, setSelectedMode] = useState<GeneratorOpenMode>(defaultMode);

  // Overlay strategy: 'append' | 'replace-unlocked' | 'blend' | 'custom'
  const [overlayStrategy, setOverlayStrategy] = useState<OverlayStrategy>('append');

  // Custom selection set for 'custom' strategy
  const [customSelectedColors, setCustomSelectedColors] = useState<string[]>([]);

  // Update internal states when incoming props change
  useEffect(() => {
    if (incomingColors && incomingColors.length > 0) {
      setActiveColors(incomingColors);
      setActiveTitle(title || '');
      setActiveSourceLabel(sourceLabel || '');
    } else {
      // Default to first collection or vault palette if available
      if (collections.length > 0 && collections[0].coverColors.length > 0) {
        setActiveColors(collections[0].coverColors);
        setActiveTitle(collections[0].title);
        setActiveSourceLabel(`Coleção: ${collections[0].title}`);
      } else if (vaultPalettes.length > 0 && vaultPalettes[0].colors.length > 0) {
        setActiveColors(vaultPalettes[0].colors);
        setActiveTitle(vaultPalettes[0].title);
        setActiveSourceLabel(`Cofre: ${vaultPalettes[0].title}`);
      }
    }
    setSelectedMode(defaultMode);
  }, [incomingColors, title, sourceLabel, defaultMode, isOpen, collections, vaultPalettes]);

  // Compute final merged colors based on mode and strategy
  const computedFinalColors = useMemo(() => {
    if (selectedMode === 'new' || selectedMode === 'edit') {
      return (activeColors || []).slice(0, 8);
    }

    // OVERLAY MODE
    const current = currentGeneratorColors && currentGeneratorColors.length > 0
      ? currentGeneratorColors
      : ['#0E1726', '#08BBD9', '#3B82F6', '#9354F5', '#FF2A85'];
    const incoming = activeColors || [];

    if (overlayStrategy === 'append') {
      const remainingSlots = Math.max(0, 8 - current.length);
      const toAdd = incoming.slice(0, remainingSlots);
      const combined = [...current, ...toAdd];
      return combined.slice(0, 8);
    }

    if (overlayStrategy === 'blend') {
      // Interleave current and incoming
      const result: string[] = [];
      const maxLen = Math.max(current.length, incoming.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < current.length) result.push(current[i]);
        if (i < incoming.length && !result.includes(incoming[i])) {
          result.push(incoming[i]);
        }
      }
      return result.slice(0, 8);
    }

    if (overlayStrategy === 'replace-unlocked') {
      // Replace from index 1 onward or up to incoming length
      const result = [...current];
      for (let i = 0; i < incoming.length && i < result.length; i++) {
        result[result.length - 1 - i] = incoming[i];
      }
      return result.slice(0, 8);
    }

    if (overlayStrategy === 'custom') {
      return customSelectedColors.length > 0
        ? customSelectedColors.slice(0, 8)
        : [...current, ...incoming].slice(0, 8);
    }

    return [...current, ...incoming].slice(0, 8);
  }, [selectedMode, activeColors, currentGeneratorColors, overlayStrategy, customSelectedColors]);

  // Initialize customSelectedColors when activeColors or currentGeneratorColors changes
  useEffect(() => {
    const combined = Array.from(new Set([...currentGeneratorColors, ...activeColors])).slice(0, 8);
    setCustomSelectedColors(combined);
  }, [activeColors, currentGeneratorColors]);

  const handleToggleCustomColor = (hex: string) => {
    setCustomSelectedColors(prev => {
      if (prev.includes(hex)) {
        if (prev.length <= 2) return prev; // Keep at least 2 colors
        return prev.filter(c => c !== hex);
      } else {
        if (prev.length >= 8) return prev; // Limit to 8
        return [...prev, hex];
      }
    });
  };

  const handleConfirm = () => {
    if (!computedFinalColors || computedFinalColors.length === 0) return;
    onConfirm(selectedMode, computedFinalColors, {
      startEditingIndex: selectedMode === 'edit' ? 0 : undefined,
      strategy: overlayStrategy
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-[#0E131F] border border-white/[0.12] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-to-generator-title"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-[#111827] via-[#141C2E] to-[#111827]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#06B6D4] flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="send-to-generator-title" className="text-lg sm:text-xl font-bold text-white tracking-tight font-['Geist']">
                  Levar Cores ao Gerador de Cores
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30">
                  Estúdio
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {activeSourceLabel || activeTitle ? (
                  <span>Origem: <strong className="text-white font-medium">{activeSourceLabel || activeTitle}</strong> ({activeColors.length} cores)</span>
                ) : (
                  <span>Escolha como deseja abrir e integrar estas cores no Gerador</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[#94A3B8] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Incoming colors preview stripe */}
          <div className="bg-[#141A28] border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#06B6D4] font-bold">
                  Cores Selecionadas para o Gerador ({activeColors.length})
                </span>
                {activeTitle && (
                  <span className="text-xs text-white/60 font-mono">
                    • {activeTitle}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#64748B] font-mono">
                {sourceType.toUpperCase()}
              </span>
            </div>

            {/* Color Swatches */}
            <div className="flex h-14 w-full rounded-lg overflow-hidden border border-white/10 shadow-inner">
              {activeColors.map((hex, i) => {
                const details = getColorDetails(hex);
                const textColor = details.isLight ? '#0B0F17' : '#FFFFFF';
                return (
                  <div
                    key={`incoming-${hex}-${i}`}
                    className="flex-1 h-full flex flex-col items-center justify-center relative group/swatch transition-transform hover:scale-105"
                    style={{ backgroundColor: hex }}
                  >
                    <span
                      className="text-[10px] font-mono font-bold tracking-tight px-1 py-0.5 rounded shadow-sm opacity-90 group-hover/swatch:opacity-100"
                      style={{ color: textColor }}
                    >
                      {hex}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* THE 3 CORE GENERATOR ACTION PILLARS */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#94A3B8] font-semibold mb-3">
              Selecione o Modo de Integração no Gerador
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Option 1: Criação Nova */}
              <button
                type="button"
                onClick={() => setSelectedMode('new')}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  selectedMode === 'new'
                    ? 'bg-gradient-to-b from-[#6366F1]/20 to-[#6366F1]/5 border-[#6366F1] shadow-lg shadow-indigo-500/10 ring-1 ring-[#6366F1]'
                    : 'bg-[#141A28] border-white/[0.08] hover:border-white/20 hover:bg-[#182032]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[#6366F1]/20 border border-[#6366F1]/40 flex items-center justify-center text-[#818CF8]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    {selectedMode === 'new' && (
                      <span className="w-5 h-5 rounded-full bg-[#6366F1] text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white font-['Geist'] mb-1">
                    ✨ Criação Nova
                  </h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Substitui a paleta atual no Gerador por estas cores, iniciando uma criação limpa pronta para novas variações harmônicas.
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#818CF8]">
                  <span>Substituição Total</span>
                  <span>Limpa Trava</span>
                </div>
              </button>

              {/* Option 2: Edição Detalhada */}
              <button
                type="button"
                onClick={() => setSelectedMode('edit')}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  selectedMode === 'edit'
                    ? 'bg-gradient-to-b from-[#06B6D4]/20 to-[#06B6D4]/5 border-[#06B6D4] shadow-lg shadow-cyan-500/10 ring-1 ring-[#06B6D4]'
                    : 'bg-[#141A28] border-white/[0.08] hover:border-white/20 hover:bg-[#182032]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/20 border border-[#06B6D4]/40 flex items-center justify-center text-[#06B6D4]">
                      <Sliders className="w-4 h-4" />
                    </div>
                    {selectedMode === 'edit' && (
                      <span className="w-5 h-5 rounded-full bg-[#06B6D4] text-black flex items-center justify-center text-xs font-bold">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white font-['Geist'] mb-1">
                    🎨 Edição Detalhada
                  </h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Abre as cores no Gerador com foco direto em edição, disponibilizando o seletor de cores e sliders de Matiz, Saturação e Luz.
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#06B6D4]">
                  <span>Modo Editor Aberto</span>
                  <span>Ajuste HSL/OKLCH</span>
                </div>
              </button>

              {/* Option 3: Sobreposição (Overlay / Merge) */}
              <button
                type="button"
                onClick={() => setSelectedMode('overlay')}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  selectedMode === 'overlay'
                    ? 'bg-gradient-to-b from-amber-400/20 to-amber-400/5 border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400'
                    : 'bg-[#141A28] border-white/[0.08] hover:border-white/20 hover:bg-[#182032]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                      <Layers className="w-4 h-4" />
                    </div>
                    {selectedMode === 'overlay' && (
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center text-xs font-bold">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white font-['Geist'] mb-1 flex items-center gap-1.5">
                    <span>🔀 Sobreposição</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono">Mesclar</span>
                  </h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Combina e sobrepõe estas cores à paleta que você já tem no Gerador, preservando o trabalho atual e expandindo o esquema.
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-amber-300">
                  <span>Preserva Cores Atuais</span>
                  <span>Mescla Inteligente</span>
                </div>
              </button>
            </div>
          </div>

          {/* OVERLAY CONFIGURATION OPTIONS (when 'overlay' is active) */}
          {selectedMode === 'overlay' && (
            <div className="bg-[#141A28] border border-amber-400/30 rounded-xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-300" />
                  <h4 className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
                    Estratégia de Sobreposição & Mesclagem
                  </h4>
                </div>
                <span className="text-xs text-[#94A3B8] font-mono">
                  Gerador suporta até 8 colunas
                </span>
              </div>

              {/* Strategy choices */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'append' as OverlayStrategy,
                    label: 'Anexar ao Final',
                    desc: 'Mantém as cores atuais e adiciona as novas cores como colunas extras.'
                  },
                  {
                    id: 'blend' as OverlayStrategy,
                    label: 'Intercalar Harmônico',
                    desc: 'Alterna cores da paleta atual e da nova para uma composição balanceada.'
                  },
                  {
                    id: 'replace-unlocked' as OverlayStrategy,
                    label: 'Substituir Direita',
                    desc: 'Mantém as primeiras cores do gerador e sobrepõe as novas nas demais posições.'
                  }
                ].map(strat => (
                  <button
                    key={strat.id}
                    type="button"
                    onClick={() => setOverlayStrategy(strat.id)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      overlayStrategy === strat.id
                        ? 'bg-amber-400/10 border-amber-400 text-white font-medium'
                        : 'bg-[#0E131F] border-white/[0.08] text-[#94A3B8] hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-bold text-white mb-0.5">{strat.label}</div>
                    <div className="text-[11px] text-[#94A3B8] leading-tight">{strat.desc}</div>
                  </button>
                ))}
              </div>

              {/* Manual Swatch Selection Chips */}
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#94A3B8]">
                    Cores disponíveis para sobreposição (clique para ativar/desativar):
                  </span>
                  <span className="text-xs font-mono text-amber-300">
                    {computedFinalColors.length} de 8 colunas
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Current Generator Colors */}
                  {currentGeneratorColors.map((hex, i) => {
                    const isSelected = computedFinalColors.includes(hex);
                    return (
                      <button
                        key={`chip-current-${hex}-${i}`}
                        type="button"
                        onClick={() => handleToggleCustomColor(hex)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-[#1C2436] border-white/30 text-white'
                            : 'bg-[#111827]/40 border-white/10 text-white/40 line-through opacity-50'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: hex }} />
                        <span>{hex}</span>
                        <span className="text-[9px] text-[#06B6D4] font-sans font-semibold">Atual</span>
                      </button>
                    );
                  })}

                  {/* Incoming Colors */}
                  {activeColors.map((hex, i) => {
                    const isSelected = computedFinalColors.includes(hex);
                    return (
                      <button
                        key={`chip-incoming-${hex}-${i}`}
                        type="button"
                        onClick={() => handleToggleCustomColor(hex)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400/20 border-amber-400/60 text-amber-300'
                            : 'bg-[#111827]/40 border-white/10 text-white/40 line-through opacity-50'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: hex }} />
                        <span>{hex}</span>
                        <span className="text-[9px] text-amber-300 font-sans font-semibold">Nova</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* LIVE PREVIEW OF THE RESULTING PALETTE */}
          <div className="bg-[#111827] border border-white/[0.1] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Preview do Resultado no Gerador ({computedFinalColors.length} Colunas)
                </span>
              </div>
              <span className="text-[11px] text-[#94A3B8] font-mono">
                {selectedMode === 'new' && '✨ Nova Paleta'}
                {selectedMode === 'edit' && '🎨 Pronta para Edição'}
                {selectedMode === 'overlay' && '🔀 Sobreposição Ativa'}
              </span>
            </div>

            {/* Visual full-bleed palette row */}
            <div className="flex h-16 w-full rounded-lg overflow-hidden border border-white/20 shadow-lg">
              {computedFinalColors.map((hex, idx) => {
                const details = getColorDetails(hex);
                const textColor = details.isLight ? '#0B0F17' : '#FFFFFF';
                return (
                  <div
                    key={`final-${hex}-${idx}`}
                    className="flex-1 h-full flex flex-col items-center justify-center relative group/final transition-all"
                    style={{ backgroundColor: hex }}
                  >
                    <span
                      className="text-xs font-mono font-bold tracking-tight px-1.5 py-0.5 rounded shadow-sm opacity-90 group-hover/final:opacity-100"
                      style={{ color: textColor }}
                    >
                      {hex}
                    </span>
                    <span
                      className="text-[9px] font-mono opacity-0 group-hover/final:opacity-100 transition-opacity"
                      style={{ color: textColor }}
                    >
                      Col {idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#0B0F17] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              className={`h-10 px-5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 ${
                selectedMode === 'new'
                  ? 'bg-[#6366F1] hover:bg-[#5254E0] text-white shadow-indigo-500/20'
                  : selectedMode === 'edit'
                  ? 'bg-[#06B6D4] hover:bg-[#08BBD9] text-black shadow-cyan-500/20'
                  : 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-500/20'
              }`}
            >
              {selectedMode === 'new' && (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Criar Nova Paleta no Gerador</span>
                </>
              )}
              {selectedMode === 'edit' && (
                <>
                  <Sliders className="w-4 h-4" />
                  <span>Abrir para Edição no Gerador</span>
                </>
              )}
              {selectedMode === 'overlay' && (
                <>
                  <Layers className="w-4 h-4" />
                  <span>Confirmar Sobreposição no Gerador</span>
                </>
              )}
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
