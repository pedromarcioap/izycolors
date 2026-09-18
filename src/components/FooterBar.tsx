import React from 'react';
import { CheckCircle2, Circle, Sparkles, Terminal } from 'lucide-react';
import { ColorGamut } from '../types';

interface FooterBarProps {
  gamut: ColorGamut;
  onQuickGenerate: () => void;
}

export const FooterBar: React.FC<FooterBarProps> = ({ gamut, onQuickGenerate }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 h-8 bg-[#0B0F17]/90 backdrop-blur-md border-t border-white/[0.08] px-4 sm:px-6 flex items-center justify-between text-[11px] font-mono text-[#94A3B8] select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-[#06B6D4]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse" />
          <span>Gamut: {gamut === 'Display P3' ? 'P3 Wide Display' : gamut}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          <span>WCAG AAA Compliance</span>
        </div>
      </div>

      {/* Central generator hint */}
      <button
        onClick={onQuickGenerate}
        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#181C24] hover:bg-[#262A33] border border-white/[0.08] text-white/90 hover:text-white transition-colors cursor-pointer group"
      >
        <span className="px-1 py-0.2 rounded bg-white/10 text-[10px] text-white font-semibold">Space</span>
        <span className="group-hover:text-[#6366F1] transition-colors">Gerar nova paleta</span>
      </button>

      <div className="flex items-center gap-3">
        <span className="hidden md:inline text-[#64748B]">Oklab Perceptual Matrix</span>
        <span className="text-[#94A3B8]">APCA Engine v4.8.2</span>
      </div>
    </footer>
  );
};
