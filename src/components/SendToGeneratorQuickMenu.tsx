import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Sliders,
  Layers,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { GeneratorOpenMode, SendToGeneratorPayload } from '../types';

export interface SendToGeneratorQuickMenuProps {
  colors: string[];
  title?: string;
  sourceLabel?: string;
  sourceType?: 'collection' | 'vault' | 'palette' | 'project' | 'swatch' | 'image' | 'curation' | 'custom';
  onOpenInGenerator: (colors: string[], mode?: GeneratorOpenMode) => void;
  onOpenSendToGeneratorModal?: (payload: SendToGeneratorPayload) => void;
  size?: 'sm' | 'md';
  variant?: 'primary' | 'secondary' | 'ghost' | 'amber';
  className?: string;
  label?: string;
}

export const SendToGeneratorQuickMenu: React.FC<SendToGeneratorQuickMenuProps> = ({
  colors,
  title,
  sourceLabel,
  sourceType = 'custom',
  onOpenInGenerator,
  onOpenSendToGeneratorModal,
  size = 'sm',
  variant = 'primary',
  className = '',
  label = 'Gerador'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (mode: GeneratorOpenMode) => {
    setIsOpen(false);
    onOpenInGenerator(colors, mode);
  };

  const handleOpenModal = () => {
    setIsOpen(false);
    if (onOpenSendToGeneratorModal) {
      onOpenSendToGeneratorModal({
        colors,
        title,
        sourceLabel: sourceLabel || title,
        sourceType,
        defaultMode: 'overlay'
      });
    } else {
      onOpenInGenerator(colors, 'overlay');
    }
  };

  const isSmall = size === 'sm';

  // Base styling for variant
  let btnClasses = 'bg-[#6366F1] hover:bg-[#5254E0] text-white';
  if (variant === 'secondary') {
    btnClasses = 'bg-[#181C24] hover:bg-[#262A33] text-[#06B6D4] hover:text-white border border-[#06B6D4]/30';
  } else if (variant === 'amber') {
    btnClasses = 'bg-amber-400 hover:bg-amber-300 text-black font-semibold';
  } else if (variant === 'ghost') {
    btnClasses = 'bg-white/[0.06] hover:bg-white/[0.12] text-white';
  }

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={menuRef}>
      {/* Main Action Button */}
      <button
        type="button"
        onClick={() => {
          if (onOpenSendToGeneratorModal) {
            handleOpenModal();
          } else {
            handleAction('overlay');
          }
        }}
        className={`rounded-l-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${btnClasses} ${
          isSmall ? 'h-7 px-2.5 text-[11px]' : 'h-8 px-3 text-xs'
        }`}
        title="Levar cores ao Gerador de Cores (Criação, Edição ou Sobreposição)"
      >
        <Sparkles className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>{label}</span>
      </button>

      {/* Dropdown Toggle Caret */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`rounded-r-lg border-l border-black/20 flex items-center justify-center transition-colors cursor-pointer ${btnClasses} ${
          isSmall ? 'h-7 px-1.5' : 'h-8 px-2'
        }`}
        title="Mais opções de envio ao Gerador"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <ChevronDown className={`transition-transform duration-150 ${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-60 bg-[#111827] border border-white/[0.12] rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">
              Levar ao Gerador ({colors.length} cores)
            </span>
          </div>

          <div className="p-1 space-y-0.5">
            {/* Action 1: Sobrepor à Paleta Atual */}
            <button
              type="button"
              onClick={() => handleAction('overlay')}
              className="w-full px-2.5 py-2 rounded-lg text-left text-xs hover:bg-amber-400/10 text-[#DFE2EE] hover:text-amber-300 flex items-center gap-2.5 transition-colors cursor-pointer group"
            >
              <div className="w-6 h-6 rounded bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-semibold text-white group-hover:text-amber-300">
                  🔀 Sobrepor no Gerador
                </div>
                <div className="text-[10px] text-[#94A3B8]">
                  Adicionar/mesclar com a paleta atual
                </div>
              </div>
            </button>

            {/* Action 2: Criação Nova */}
            <button
              type="button"
              onClick={() => handleAction('new')}
              className="w-full px-2.5 py-2 rounded-lg text-left text-xs hover:bg-[#6366F1]/15 text-[#DFE2EE] hover:text-[#818CF8] flex items-center gap-2.5 transition-colors cursor-pointer group"
            >
              <div className="w-6 h-6 rounded bg-[#6366F1]/20 text-[#818CF8] flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-semibold text-white group-hover:text-[#818CF8]">
                  ✨ Nova Paleta Limpa
                </div>
                <div className="text-[10px] text-[#94A3B8]">
                  Substituir tudo e começar nova
                </div>
              </div>
            </button>

            {/* Action 3: Edição Detalhada */}
            <button
              type="button"
              onClick={() => handleAction('edit')}
              className="w-full px-2.5 py-2 rounded-lg text-left text-xs hover:bg-[#06B6D4]/15 text-[#DFE2EE] hover:text-[#06B6D4] flex items-center gap-2.5 transition-colors cursor-pointer group"
            >
              <div className="w-6 h-6 rounded bg-[#06B6D4]/20 text-[#06B6D4] flex items-center justify-center shrink-0">
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-semibold text-white group-hover:text-[#06B6D4]">
                  🎨 Abrir para Edição
                </div>
                <div className="text-[10px] text-[#94A3B8]">
                  Ajustar cores nos sliders e seletores
                </div>
              </div>
            </button>

            {/* Action 4: Opções Avançadas e Preview */}
            {onOpenSendToGeneratorModal && (
              <div className="pt-1 mt-1 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left text-[11px] text-[#94A3B8] hover:text-white hover:bg-white/[0.06] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Opções Avançadas & Preview...</span>
                  <ExternalLink className="w-3 h-3 text-[#94A3B8]" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
