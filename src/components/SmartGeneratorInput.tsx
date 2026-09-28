import React, { useState, useEffect, useRef } from 'react';
import { Wand2, X, Command, ArrowRight, Lock, Check } from 'lucide-react';

interface SmartGeneratorInputProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitMood: (prompt: string) => void;
  activeMood: string;
  onClearMood: () => void;
  lockedCount: number;
}

const PRESET_MOODS = [
  { label: 'Outono Melancólico', prompt: 'Outono melancólico', icon: '🍂' },
  { label: 'Cyberpunk Neon', prompt: 'Cyberpunk neon', icon: '⚡' },
  { label: 'Corporate Clean', prompt: 'Corporate clean', icon: '💼' },
  { label: 'Pôr do Sol Warm', prompt: 'Pôr do sol praiano', icon: '🌅' },
  { label: 'Pastel Soft', prompt: 'Pastel suave delicado', icon: '🌸' },
  { label: 'Café Espresso', prompt: 'Café aconchegante espresso', icon: '☕' }
];

export const SmartGeneratorInput: React.FC<SmartGeneratorInputProps> = ({
  isOpen,
  onClose,
  onSubmitMood,
  activeMood,
  onClearMood,
  lockedCount
}) => {
  const [inputValue, setInputValue] = useState(activeMood || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal input value when activeMood changes
  useEffect(() => {
    setInputValue(activeMood || '');
  }, [activeMood]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle global shortcut Ctrl+K / Cmd+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && target !== inputRef.current) {
          return;
        }
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    setIsSubmitting(true);
    onSubmitMood(inputValue.trim());
    setTimeout(() => {
      setIsSubmitting(false);
    }, 400);
  };

  const handleSelectPreset = (prompt: string) => {
    setInputValue(prompt);
    setIsSubmitting(true);
    onSubmitMood(prompt);
    setTimeout(() => {
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 animate-in fade-in zoom-in-95 duration-200">
      <div
        className="bg-[#181C24]/85 backdrop-blur-xl border border-white/[0.15] rounded-2xl shadow-2xl p-3.5 sm:p-4 text-white relative overflow-hidden ring-1 ring-white/10"
      >
        {/* Subtle top glow effect */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#6366F1] to-transparent opacity-70" />

        {/* Input Bar & Controls */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-[#6366F1]/20 to-[#06B6D4]/20 border border-[#6366F1]/30 text-[#06B6D4] shrink-0">
            <Wand2 className={`w-4 h-4 ${isSubmitting ? 'animate-spin text-[#6366F1]' : ''}`} />
          </div>

          <div className="flex-1 flex items-center gap-2 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite um mood ou conceito (ex: 'Outono melancólico', 'Cyberpunk neon')..."
              className="w-full bg-transparent text-sm text-white placeholder-[#94A3B8] focus:outline-none font-['Geist'] py-1"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => {
                  setInputValue('');
                  onClearMood();
                }}
                className="text-[#94A3B8] hover:text-white p-1 rounded-md transition-colors"
                title="Limpar texto"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="h-8 px-3 bg-gradient-to-r from-[#6366F1] to-[#06B6D4] hover:opacity-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
            >
              <span>Gerar</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Status Bar: Locked Seeds & Active Mood */}
        <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {lockedCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-indigo-400" />
                <span>{lockedCount} {lockedCount === 1 ? 'Cor-Semente Travada' : 'Cores-Semente Travadas'}</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono text-[#94A3B8]">
                Sem travas: paleta livre
              </span>
            )}

            {activeMood && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono flex items-center gap-1">
                <Check className="w-2.5 h-2.5 text-emerald-400" />
                <span>Mood Ativo: "{activeMood}"</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[10px] font-mono text-[#94A3B8] shrink-0">
            <Command className="w-3 h-3" />
            <span>+ K para alternar</span>
          </div>
        </div>

        {/* Preset Mood Chips */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <span className="text-[10px] font-mono text-[#94A3B8] shrink-0 mr-1">Sugestões:</span>
          {PRESET_MOODS.map((preset) => (
            <button
              key={preset.prompt}
              type="button"
              onClick={() => handleSelectPreset(preset.prompt)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${inputValue.toLowerCase() === preset.prompt.toLowerCase()
                  ? 'bg-[#6366F1] text-white border-[#6366F1] shadow-sm'
                  : 'bg-white/[0.05] hover:bg-white/[0.12] text-[#DFE2EE] border-white/[0.08] hover:border-white/20'
                }`}
            >
              <span>{preset.icon}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
