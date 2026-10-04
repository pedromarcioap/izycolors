import React, { useState } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { CommunitySubmission, ColorGamut, AuthUser } from '../types';

interface SubmitPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (submission: CommunitySubmission) => void;
  defaultColors?: string[];
  currentUser?: AuthUser;
}

export const SubmitPaletteModal: React.FC<SubmitPaletteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultColors = ['#08BBD9', '#3B82F6', '#9354F5', '#FF2A85', '#0E1726'],
  currentUser
}) => {
  const [title, setTitle] = useState('');
  const authorName = currentUser?.name?.trim() || 'Criador Izy Colors';
  const authorHandle = currentUser?.handle?.trim() || '@criador';
  const authorAvatar = currentUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`;

  const [colors, setColors] = useState(() =>
    defaultColors.map((value, index) => ({ id: `swatch-${index}`, value }))
  );
  const [tags, setTags] = useState('Oklch, P3 Gamut, Dark Mode');
  const [gamut, setGamut] = useState<'sRGB' | 'Display P3' | 'Rec.2020'>('Display P3');

  if (!isOpen) return null;

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newSub: CommunitySubmission = {
      id: `sub-${Date.now()}`,
      title,
      author: authorName,
      authorHandle: authorHandle,
      authorAvatar: authorAvatar,
      colors: colors.map(c => c.value),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      submittedAt: 'Agora',
      status: 'Pendente',
      suggestedGamut: gamut,
      contrastScore: 'WCAG AAA (Ready)'
    };

    onSubmit(newSub);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <dialog
        open
        aria-label="Submeter Paleta para Curadoria"
        className="relative m-0 w-full max-w-lg bg-[#181C24] border border-white/[0.12] rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in-95"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
          <div>
            <h3 className="text-base font-bold text-white font-['Geist'] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#06B6D4]" />
              Submeter Paleta para Curadoria
            </h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Desafio Semanal #42: Oklch & Gamuts P3
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="submit-palette-title" className="text-xs font-mono text-[#94A3B8] block mb-1">Título da Paleta:</label>
            <input
              id="submit-palette-title"
              type="text"
              required
              placeholder="Ex: Aurora Boreal Cibernética"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
            />
          </div>

          <div>
            <span className="text-xs font-mono text-[#94A3B8] block mb-1">Cores da Paleta (5 colunas):</span>
            <div className="h-12 rounded-lg overflow-hidden flex shadow-inner border border-white/10 mb-2">
              {colors.map((c) => (
                <div key={c.id} className="flex-1 h-full" style={{ backgroundColor: c.value }} />
              ))}
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {colors.map((c, i) => (
                <input
                  key={c.id}
                  type="text"
                  aria-label={`Cor ${i + 1}`}
                  value={c.value}
                  onChange={(e) => {
                    setColors((prev) =>
                      prev.map((item, idx) =>
                        idx === i ? { ...item, value: e.target.value.toUpperCase() } : item
                      )
                    );
                  }}
                  className="bg-[#111827] border border-white/[0.1] rounded px-1.5 py-1 text-[11px] font-mono text-center text-white"
                />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="submit-palette-gamut" className="text-xs font-mono text-[#94A3B8] block mb-1">Gamut Alvo:</label>
            <select
              id="submit-palette-gamut"
              value={gamut}
              onChange={(e) => setGamut(e.target.value as ColorGamut)}
              className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
            >
              <option value="Display P3">Display P3 (Apple Wide Gamut)</option>
              <option value="Rec.2020">Rec.2020 (Ultra HD Cinema)</option>
              <option value="sRGB">sRGB (Standard Web)</option>
            </select>
          </div>

          <div>
            <label htmlFor="submit-palette-tags" className="text-xs font-mono text-[#94A3B8] block mb-1">Tags (separadas por vírgula):</label>
            <input
              id="submit-palette-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Enviar para Avaliação</span>
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
};
