import React, { useState } from 'react';
import { X, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import { CommunitySubmission } from '../types';

interface SubmitPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (submission: CommunitySubmission) => void;
  defaultColors?: string[];
}

export const SubmitPaletteModal: React.FC<SubmitPaletteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultColors = ['#08BBD9', '#3B82F6', '#9354F5', '#FF2A85', '#0E1726']
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('Helena Vance');
  const [handle, setHandle] = useState('@helena.design');
  const [colors, setColors] = useState<string[]>(defaultColors);
  const [tags, setTags] = useState('Oklch, P3 Gamut, Dark Mode');
  const [gamut, setGamut] = useState<'sRGB' | 'Display P3' | 'Rec.2020'>('Display P3');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newSub: CommunitySubmission = {
      id: `sub-${Date.now()}`,
      title,
      author,
      authorHandle: handle,
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
      colors,
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
      <div 
        className="w-full max-w-lg bg-[#181C24] border border-white/[0.12] rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
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
            <label className="text-xs font-mono text-[#94A3B8] block mb-1">Título da Paleta:</label>
            <input
              type="text"
              required
              placeholder="Ex: Aurora Boreal Cibernética"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-[#94A3B8] block mb-1">Cores da Paleta (5 colunas):</label>
            <div className="h-12 rounded-lg overflow-hidden flex shadow-inner border border-white/10 mb-2">
              {colors.map((c, i) => (
                <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {colors.map((c, i) => (
                <input
                  key={i}
                  type="text"
                  value={c}
                  onChange={(e) => {
                    const next = [...colors];
                    next[i] = e.target.value.toUpperCase();
                    setColors(next);
                  }}
                  className="bg-[#111827] border border-white/[0.1] rounded px-1.5 py-1 text-[11px] font-mono text-center text-white"
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-[#94A3B8] block mb-1">Gamut Alvo:</label>
            <select
              value={gamut}
              onChange={(e) => setGamut(e.target.value as any)}
              className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
            >
              <option value="Display P3">Display P3 (Apple Wide Gamut)</option>
              <option value="Rec.2020">Rec.2020 (Ultra HD Cinema)</option>
              <option value="sRGB">sRGB (Standard Web)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-[#94A3B8] block mb-1">Tags (separadas por vírgula):</label>
            <input
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
      </div>
    </div>
  );
};
