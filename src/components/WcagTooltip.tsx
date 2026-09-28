import React from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import { getContrastRatio } from '../utils/colorUtils';

export interface WcagTooltipProps {
  colorHex: string;
  prevColorHex?: string;
  nextColorHex?: string;
  colorName?: string;
  position?: { x: number; y: number } | null;
  className?: string;
}

interface Badge {
  className: string;
  label: string;
}

interface WcagLevel {
  badgeClassName: string;
  badgeLabel: string;
}

const getTextBadge = (aaa: boolean, aa: boolean): Badge => {
  if (aaa) {
    return { className: 'text-emerald-400 font-bold', label: 'AAA' };
  }
  if (aa) {
    return { className: 'text-[#06B6D4]', label: 'AA' };
  }
  return { className: 'text-rose-400', label: 'Reprovado' };
};

const getWcagLevel = (normalAaa: boolean, normalAa: boolean, largeAa: boolean): WcagLevel => {
  if (normalAaa) {
    return {
      badgeClassName: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      badgeLabel: 'WCAG AAA',
    };
  }
  if (normalAa) {
    return {
      badgeClassName: 'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4]/40',
      badgeLabel: 'WCAG AA',
    };
  }
  if (largeAa) {
    return {
      badgeClassName: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      badgeLabel: 'AA Grande',
    };
  }
  return {
    badgeClassName: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    badgeLabel: 'Falha WCAG',
  };
};

const getPositionStyle = (
  position: { x: number; y: number } | null | undefined
): React.CSSProperties => {
  if (!position) {
    return {};
  }

  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
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

  return {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    transform: top > position.y ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
  };
};

interface ContrastBoxProps {
  isBest: boolean;
  dotClassName: string;
  labelClassName: string;
  label: string;
  ratio: number;
  badge: Badge;
}

const ContrastBox: React.FC<ContrastBoxProps> = ({
  isBest,
  dotClassName,
  labelClassName,
  label,
  ratio,
  badge,
}) => (
  <div
    className={`p-2 rounded-lg border text-center transition-all ${isBest
        ? 'bg-white/15 border-white/40 shadow-md ring-1 ring-white/20'
        : 'bg-[#111827]/60 border-white/5 opacity-75'
      }`}
  >
    <div className={`flex items-center justify-center gap-1 text-[10px] font-medium mb-0.5 ${labelClassName}`}>
      <span className={`w-2 h-2 rounded-full inline-block shrink-0 ${dotClassName}`} />
      <span>{label}</span>
    </div>
    <div className="font-mono text-sm font-bold text-white">{ratio.toFixed(2)}:1</div>
    <div className="text-[9px] font-mono mt-0.5 flex justify-center gap-1">
      <span className={badge.className}>{badge.label}</span>
    </div>
  </div>
);

interface StandardRowProps {
  label: string;
  passes: boolean;
  passText: string;
  failText: string;
}

const StandardRow: React.FC<StandardRowProps> = ({ label, passes, passText, failText }) => (
  <div className="flex items-center justify-between text-[#94A3B8]">
    <span>{label}</span>
    <span className="flex items-center gap-1 font-semibold">
      {passes ? (
        <span className="text-emerald-400 flex items-center gap-0.5">
          <Check className="w-3 h-3" /> Passa {passText}
        </span>
      ) : (
        <span className="text-rose-400 flex items-center gap-0.5">
          <X className="w-3 h-3" /> Falha {failText}
        </span>
      )}
    </span>
  </div>
);

export const WcagTooltip: React.FC<WcagTooltipProps> = ({
  colorHex,
  prevColorHex,
  nextColorHex,
  colorName,
  position,
  className = '',
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

  const whiteBadge = getTextBadge(whiteAaa, whiteAa);
  const blackBadge = getTextBadge(blackAaa, blackAa);
  const wcagLevel = getWcagLevel(normalAaa, normalAa, largeAa);

  // Adjacent contrasts
  const prevContrast = prevColorHex ? getContrastRatio(prevColorHex, colorHex) : null;
  const nextContrast = nextColorHex ? getContrastRatio(nextColorHex, colorHex) : null;

  const positionStyle = getPositionStyle(position);

  const normalPassText = normalAaa ? 'AAA (7.0)' : 'AA (4.5)';
  const largePassText = largeAaa ? 'AAA (4.5)' : 'AA (3.0)';
  const bestTextLabel = bestText === 'white' ? 'Branco (#FFF)' : 'Preto (#000)';

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
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border shadow-sm ${wcagLevel.badgeClassName}`}
        >
          {wcagLevel.badgeLabel}
        </div>
      </div>

      {/* Main Contrast Values: White vs Black Text */}
      <div className="grid grid-cols-2 gap-2 mb-2.5">
        <ContrastBox
          isBest={bestText === 'white'}
          dotClassName="bg-white border border-black/40"
          labelClassName="text-white"
          label="Texto Branco"
          ratio={ratioWhite}
          badge={whiteBadge}
        />
        <ContrastBox
          isBest={bestText === 'black'}
          dotClassName="bg-black border border-white/40"
          labelClassName="text-[#94A3B8]"
          label="Texto Preto"
          ratio={ratioBlack}
          badge={blackBadge}
        />
      </div>

      {/* Detailed Standards Breakdown */}
      <div className="space-y-1.5 bg-[#111827]/80 rounded-lg p-2 border border-white/5 font-mono text-[10px]">
        <StandardRow
          label="Texto Normal (16px)"
          passes={normalAa}
          passText={normalPassText}
          failText="(<4.5)"
        />
        <StandardRow
          label="Texto Grande (18px+)"
          passes={largeAa}
          passText={largePassText}
          failText="(<3.0)"
        />
        <StandardRow
          label="Ícones / UI"
          passes={uiAa}
          passText="AA (3.0)"
          failText="(<3.0)"
        />
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
        <span>Texto {bestTextLabel} oferece melhor contraste</span>
      </div>
    </div>
  );
};
