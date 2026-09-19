import React from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import { getContrastRatio } from '../utils/colorUtils';

export interface WcagTooltipProps {
  colorHex: string;
  prevColorHex?: string;
  nextColorHex?: string;
  colorName?: string;
  index?: number;
  position?: { x: number; y: number } | null;
  alignment?: 'center' | 'left' | 'right';
  className?: string;
}

export const WcagTooltip: React.FC<WcagTooltipProps> = ({
  colorHex,
  prevColorHex,
  nextColorHex,
  colorName,
  position,
  className = ''
}) => {
  const ratioWhite = getContrastRatio('#FFFFFF', colorHex);
  const ratioBlack = getContrastRatio('#000000', colorHex);

  const bestText = ratioWhite >= ratioBlack ? 'white' : 'black';
  const bestRatio = Math.max(ratioWhite, ratioBlack);

  // Criteria for best text color
  const normalAa = bestRatio >= 4.5;
  const normalAaa = bestRatio >= 7.0;
  const largeAa = bestRatio >= 3.0;
  const largeAaa = bestRatio >= 4.5;
  const uiAa = bestRatio >= 3.0;

  // Criteria specifically for white & black text
  const whiteAa = ratioWhite >= 4.5;
  const whiteAaa = ratioWhite >= 7.0;
  const blackAa = ratioBlack >= 4.5;
  const blackAaa = ratioBlack >= 7.0;

  // Adjacent contrasts
  const prevContrast = prevColorHex ? getContrastRatio(prevColorHex, colorHex) : null;
  const nextContrast = nextColorHex ? getContrastRatio(nextColorHex, colorHex) : null;

  // Adjust style position if fixed coordinates provided
  let positionStyle: React.CSSProperties = {};
  if (position) {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    // Clamp to screen bounds
    const tooltipWidth = 280;
    const tooltipHeight = 250;
    
    let left = position.x;
    let top = position.y - 15;

    if (left - tooltipWidth / 2 < 10) {
      left = tooltipWidth / 2 + 10;
    } else if (left + tooltipWidth / 2 > screenWidth - 10) {
      left = screenWidth - tooltipWidth / 2 - 10;
    }

    if (top - tooltipHeight < 10) {
      top = position.y + 25; // Flip below cursor if near top
    }

    positionStyle = {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      transform: top > position.y ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
    };
  }

  return (
    <div
      className={`w-72 bg-[#0E131F]/95 backdrop-blur-md border border-white/20 rounded-xl p-3.5 shadow-2xl z-50 text-xs text-[#DFE2EE] pointer-events-none select-none transition-all duration-150 animate-in fade-in zoom-in-95 ${className}`}
      style={positionStyle}
    >
      {/* Tooltip Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border border-white/40 shadow-sm shrink-0"
            style={{ backgroundColor: colorHex }}
          />
          <span className="font-mono font-bold text-white uppercase text-xs tracking-wide">
            {colorHex}
          </span>
          {colorName && (
            <span className="text-[10px] text-[#94A3B8] font-sans truncate max-w-[90px]">
              ({colorName})
            </span>
          )}
        </div>
        <div
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border shadow-sm ${
            normalAaa
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : normalAa
              ? 'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4]/40'
              : largeAa
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          }`}
        >
          {normalAaa ? 'WCAG AAA' : normalAa ? 'WCAG AA' : largeAa ? 'AA Grande' : 'Falha WCAG'}
        </div>
      </div>

      {/* Main Contrast Values: White vs Black Text */}
      <div className="grid grid-cols-2 gap-2 mb-2.5">
        {/* White Text Box */}
        <div
          className={`p-2 rounded-lg border text-center transition-all ${
            bestText === 'white'
              ? 'bg-white/15 border-white/40 shadow-md ring-1 ring-white/20'
              : 'bg-[#111827]/60 border-white/5 opacity-75'
          }`}
        >
          <div className="flex items-center justify-center gap-1 text-[10px] text-white font-medium mb-0.5">
            <span className="w-2 h-2 rounded-full bg-white border border-black/40 inline-block shrink-0" />
            <span>Texto Branco</span>
          </div>
          <div className="font-mono text-sm font-bold text-white">
            {ratioWhite.toFixed(2)}:1
          </div>
          <div className="text-[9px] font-mono mt-0.5 flex justify-center gap-1">
            <span className={whiteAaa ? 'text-emerald-400 font-bold' : whiteAa ? 'text-[#06B6D4]' : 'text-rose-400'}>
              {whiteAaa ? 'AAA' : whiteAa ? 'AA' : 'Reprovado'}
            </span>
          </div>
        </div>

        {/* Black Text Box */}
        <div
          className={`p-2 rounded-lg border text-center transition-all ${
            bestText === 'black'
              ? 'bg-white/15 border-white/40 shadow-md ring-1 ring-white/20'
              : 'bg-[#111827]/60 border-white/5 opacity-75'
          }`}
        >
          <div className="flex items-center justify-center gap-1 text-[10px] text-[#94A3B8] font-medium mb-0.5">
            <span className="w-2 h-2 rounded-full bg-black border border-white/40 inline-block shrink-0" />
            <span>Texto Preto</span>
          </div>
          <div className="font-mono text-sm font-bold text-white">
            {ratioBlack.toFixed(2)}:1
          </div>
          <div className="text-[9px] font-mono mt-0.5 flex justify-center gap-1">
            <span className={blackAaa ? 'text-emerald-400 font-bold' : blackAa ? 'text-[#06B6D4]' : 'text-rose-400'}>
              {blackAaa ? 'AAA' : blackAa ? 'AA' : 'Reprovado'}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Standards Breakdown */}
      <div className="space-y-1.5 bg-[#111827]/80 rounded-lg p-2 border border-white/5 font-mono text-[10px]">
        <div className="flex items-center justify-between text-[#94A3B8]">
          <span>Texto Normal (16px)</span>
          <span className="flex items-center gap-1 font-semibold">
            {normalAa ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Passa {normalAaa ? 'AAA (7.0)' : 'AA (4.5)'}
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-0.5">
                <X className="w-3 h-3" /> Falha (&lt;4.5)
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between text-[#94A3B8]">
          <span>Texto Grande (18px+)</span>
          <span className="flex items-center gap-1 font-semibold">
            {largeAa ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Passa {largeAaa ? 'AAA (4.5)' : 'AA (3.0)'}
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-0.5">
                <X className="w-3 h-3" /> Falha (&lt;3.0)
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between text-[#94A3B8]">
          <span>Ícones / UI</span>
          <span className="flex items-center gap-1 font-semibold">
            {uiAa ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Passa AA (3.0)
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-0.5">
                <X className="w-3 h-3" /> Falha (&lt;3.0)
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Adjacent Swatch Contrast Ratios (if provided) */}
      {(prevContrast !== null || nextContrast !== null) && (
        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-[#94A3B8]">
          <span className="text-[9px] uppercase tracking-wider text-[#64748B]">Contraste Adjacente:</span>
          <div className="flex items-center gap-2">
            {prevContrast !== null && (
              <span className="bg-[#111827] px-1.5 py-0.5 rounded border border-white/10 font-mono">
                ← {prevContrast.toFixed(1)}:1
              </span>
            )}
            {nextContrast !== null && (
              <span className="bg-[#111827] px-1.5 py-0.5 rounded border border-white/10 font-mono">
                → {nextContrast.toFixed(1)}:1
              </span>
            )}
          </div>
        </div>
      )}

      {/* Text recommendation helper */}
      <div className="mt-2 text-[10px] text-[#06B6D4] flex items-center gap-1 font-medium">
        <Sparkles className="w-3 h-3 shrink-0" />
        <span>Texto {bestText === 'white' ? 'Branco (#FFF)' : 'Preto (#000)'} oferece melhor contraste</span>
      </div>
    </div>
  );
};
