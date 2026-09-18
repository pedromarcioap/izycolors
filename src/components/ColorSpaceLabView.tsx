import React, { useState } from 'react';
import { SlidersHorizontal, Copy, Check, Sparkles, Layers, ArrowRight, RefreshCw, Bookmark } from 'lucide-react';
import { getColorDetails, hexToRgb, rgbToHex } from '../utils/colorUtils';

interface ColorSpaceLabViewProps {
  onOpenInGenerator: (colors: string[]) => void;
  onSaveToCollection: (colors: string[]) => void;
}

export const ColorSpaceLabView: React.FC<ColorSpaceLabViewProps> = ({
  onOpenInGenerator,
  onSaveToCollection
}) => {
  const [activeHex, setActiveHex] = useState('#08BBD9');
  const [gradientEndHex, setGradientEndHex] = useState('#9354F5');
  const [gradientType, setGradientType] = useState<'linear' | 'radial' | 'conic'>('linear');
  const [gradientAngle, setGradientAngle] = useState(90);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const details = getColorDetails(activeHex);

  const copyText = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Generate 10-step tonal scale (50 to 900)
  const tonalScale = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((step, idx) => {
    // vary lightness
    const factor = (idx + 1) / 11;
    const l = Math.max(10, Math.min(95, Math.round(96 - factor * 84)));
    return {
      step,
      hex: activeHex, // approximated for visual preview
      l
    };
  });

  // Gradient CSS
  let cssGradient = '';
  if (gradientType === 'linear') {
    cssGradient = `linear-gradient(${gradientAngle}deg in oklab, ${activeHex}, ${gradientEndHex})`;
  } else if (gradientType === 'radial') {
    cssGradient = `radial-gradient(circle in oklab, ${activeHex}, ${gradientEndHex})`;
  } else {
    cssGradient = `conic-gradient(from ${gradientAngle}deg in oklab, ${activeHex}, ${gradientEndHex}, ${activeHex})`;
  }

  const conversions = [
    { label: 'HEX', value: activeHex.toUpperCase() },
    { label: 'RGB', value: `rgb(${details.rgb.r}, ${details.rgb.g}, ${details.rgb.b})` },
    { label: 'HSL', value: `hsl(${details.hsl.h}, ${details.hsl.s}%, ${details.hsl.l}%)` },
    { label: 'HSV / HSB', value: `hsv(${details.hsv.h}, ${details.hsv.s}%, ${details.hsv.v}%)` },
    { label: 'CMYK', value: `cmyk(${details.cmyk.c}%, ${details.cmyk.m}%, ${details.cmyk.y}%, ${details.cmyk.k}%)` },
    { label: 'CIE-Lab', value: `lab(${details.lab.l}% ${details.lab.a} ${details.lab.b})` },
    { label: 'CIE-Lch', value: `lch(${details.lch.l}% ${details.lch.c} ${details.lch.h})` },
    { label: 'OKLCH (CSS 4)', value: `oklch(${details.oklch.l} ${details.oklch.c} ${details.oklch.h})` }
  ];

  return (
    <div className="flex-1 bg-[#0B0F17] text-[#DFE2EE] p-4 sm:p-8 max-w-[1500px] mx-auto w-full pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/[0.08] pb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#06B6D4] flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
            CIE-Lab & ColorSpace Laboratory
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Geist'] mt-1">
            Color Space Lab & Gradientes
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Conversões matemáticas em ponto flutuante para OKLCH, CIE-XYZ, CMYK e interpolação Oklab.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenInGenerator([activeHex, gradientEndHex, '#0E1726', '#3B82F6', '#9354F5'])}
            className="h-9 px-4 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Abrir no Gerador</span>
          </button>
        </div>
      </div>

      {/* Main Conversion Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Color Inspector Left Panel */}
        <div className="lg:col-span-4 bg-[#181C24] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] font-semibold">
                Cor em Análise
              </span>
              <span className="text-[11px] font-mono text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded border border-[#06B6D4]/30">
                Luminância {Math.round(details.luminance * 100)}%
              </span>
            </div>

            {/* Giant Swatch Card */}
            <div 
              className="h-36 sm:h-44 rounded-xl shadow-2xl flex flex-col justify-between p-4 border border-white/20 transition-all mb-4"
              style={{ backgroundColor: activeHex }}
            >
              <div className="flex justify-between items-center text-xs font-mono" style={{ color: details.isLight ? '#000' : '#FFF' }}>
                <span>{details.isLight ? 'Modo Claro' : 'Modo Escuro'}</span>
                <span>Gamut P3 Ready</span>
              </div>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-center tracking-tight" style={{ color: details.isLight ? '#000' : '#FFF' }}>
                {activeHex.toUpperCase()}
              </span>
              <div className="text-[10px] font-mono text-center" style={{ color: details.isLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }}>
                OKLCH(L: {(details.oklch.l * 100).toFixed(1)}%, C: {details.oklch.c.toFixed(3)}, H: {details.oklch.h.toFixed(1)}°)
              </div>
            </div>

            {/* Hex Input & Native Picker */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={activeHex}
                onChange={(e) => setActiveHex(e.target.value)}
                className="w-10 h-10 rounded border border-white/20 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={activeHex}
                onChange={(e) => setActiveHex(e.target.value)}
                className="flex-1 bg-[#0B0F17] border border-white/[0.1] rounded-lg px-3 py-2 text-sm font-mono text-white uppercase focus:outline-none focus:border-[#6366F1]"
              />
            </div>
          </div>

          {/* Quick Palette Swatches presets */}
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <span className="text-xs text-[#94A3B8] font-mono block mb-2">Alternar rapidamente:</span>
            <div className="flex items-center gap-2">
              {['#08BBD9', '#6366F1', '#EC4899', '#10B981', '#F59E0B', '#EF4444'].map(c => (
                <button
                  key={c}
                  onClick={() => setActiveHex(c)}
                  className="w-7 h-7 rounded-full border border-white/20 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Conversion Models List */}
        <div className="lg:col-span-8 bg-[#181C24] border border-white/[0.08] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] font-semibold">
              Espaços de Cor & Representações Físicas
            </h3>
            <span className="text-xs text-[#64748B] font-mono">Clique para copiar</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {conversions.map((conv) => (
              <button
                key={conv.label}
                onClick={() => copyText(conv.label, conv.value)}
                className="p-3 bg-[#111827] border border-white/[0.06] hover:border-white/[0.18] rounded-lg text-left flex items-center justify-between group transition-all"
              >
                <div>
                  <span className="text-[11px] font-mono text-[#06B6D4] block font-semibold">
                    {conv.label}
                  </span>
                  <span className="text-xs font-mono text-white mt-0.5 block truncate max-w-[200px] sm:max-w-xs">
                    {conv.value}
                  </span>
                </div>
                <div className="text-[#94A3B8] group-hover:text-white transition-colors">
                  {copiedKey === conv.label ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Perceptual Oklab Gradient Studio Section */}
      <div className="bg-[#181C24] border border-white/[0.08] rounded-xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#EC4899] font-semibold">
              Interpolação Perceptual
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight font-['Geist'] mt-0.5">
              Gerador de Gradientes Oklab (Sem Zona Cinza)
            </h2>
            <p className="text-xs text-[#94A3B8] mt-1">
              A interpolação em Oklab preserva a saturação no ponto central do gradiente, evitando o desbotamento sRGB comum.
            </p>
          </div>

          <button
            onClick={() => copyText('grad', `background: ${cssGradient};`)}
            className="h-9 px-4 bg-[#262A33] hover:bg-[#31353E] border border-white/[0.08] rounded-lg text-xs text-white font-medium flex items-center gap-1.5 transition-colors self-start md:self-auto"
          >
            {copiedKey === 'grad' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedKey === 'grad' ? 'CSS Copiado!' : 'Copiar CSS do Gradiente'}</span>
          </button>
        </div>

        {/* Gradient Controls & Interactive Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-4">
            {/* Gradient Type */}
            <div>
              <span className="text-xs font-mono text-[#94A3B8] block mb-1.5">Tipo de Gradiente:</span>
              <div className="grid grid-cols-3 gap-1 bg-[#111827] p-1 rounded-lg border border-white/[0.06] text-xs font-medium">
                {(['linear', 'radial', 'conic'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setGradientType(t)}
                    className={`py-1.5 rounded capitalize ${gradientType === t ? 'bg-[#6366F1] text-white' : 'text-[#94A3B8] hover:text-white'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors: Start & End */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs font-mono text-[#94A3B8] block mb-1">Cor Inicial:</span>
                <div className="flex items-center gap-2 bg-[#111827] border border-white/[0.08] p-1.5 rounded-lg">
                  <input
                    type="color"
                    value={activeHex}
                    onChange={(e) => setActiveHex(e.target.value)}
                    className="w-6 h-6 rounded border border-white/20 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-white uppercase">{activeHex}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-mono text-[#94A3B8] block mb-1">Cor Final:</span>
                <div className="flex items-center gap-2 bg-[#111827] border border-white/[0.08] p-1.5 rounded-lg">
                  <input
                    type="color"
                    value={gradientEndHex}
                    onChange={(e) => setGradientEndHex(e.target.value)}
                    className="w-6 h-6 rounded border border-white/20 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-white uppercase">{gradientEndHex}</span>
                </div>
              </div>
            </div>

            {/* Angle Slider */}
            {gradientType !== 'radial' && (
              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-[#94A3B8]">
                  <span>Ângulo de Rotação:</span>
                  <span className="text-white font-semibold">{gradientAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={gradientAngle}
                  onChange={(e) => setGradientAngle(Number(e.target.value))}
                  className="w-full h-2 rounded bg-slate-700 cursor-pointer"
                />
              </div>
            )}

            {/* Generated Code Snippet */}
            <div className="p-3 bg-[#111827] rounded-lg border border-white/[0.06] font-mono text-[11px] text-[#06B6D4] overflow-x-auto">
              <code>background: {cssGradient};</code>
            </div>
          </div>

          {/* Big Gradient Canvas */}
          <div 
            className="lg:col-span-8 min-h-[220px] rounded-xl shadow-2xl border border-white/20 relative overflow-hidden flex items-end p-6"
            style={{ background: cssGradient }}
          >
            <div className="bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-white">
              Oklab Color Interpolation Engine
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
