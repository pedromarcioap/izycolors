import React, { useState } from 'react';
import { Check, X, Eye, Sparkles, ArrowLeftRight, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getContrastRatio, simulateColorBlindness, getColorDetails } from '../utils/colorUtils';
import { ColorBlindnessType } from '../types';

interface AccessibilityViewProps {
  initialColors?: string[];
  onOpenInGenerator: (colors: string[]) => void;
}

export const AccessibilityView: React.FC<AccessibilityViewProps> = ({
  initialColors = ['#0E1726', '#08BBD9', '#3B82F6', '#9354F5', '#FF2A85'],
  onOpenInGenerator
}) => {
  const [fgColor, setFgColor] = useState('#08BBD9');
  const [bgColor, setBgColor] = useState('#0E1726');
  const [activeDeficiency, setActiveDeficiency] = useState<ColorBlindnessType>('protanopia');

  const ratio = getContrastRatio(fgColor, bgColor);

  // WCAG 2.1 Criteria checks
  const normalAa = ratio >= 4.5;
  const normalAaa = ratio >= 7.0;
  const largeAa = ratio >= 3.0;
  const largeAaa = ratio >= 4.5;
  const uiAa = ratio >= 3.0;

  // Swap FG & BG
  const handleSwap = () => {
    const temp = fgColor;
    setFgColor(bgColor);
    setBgColor(temp);
  };

  const deficiencies: { id: ColorBlindnessType; label: string; desc: string; prevalence: string }[] = [
    { id: 'protanopia', label: 'Protanopia', desc: 'Deficiência nos cones L (vermelho reduzido)', prevalence: '~1.3% da população masculina' },
    { id: 'deuteranopia', label: 'Deuteranopia', desc: 'Deficiência nos cones M (verde reduzido)', prevalence: '~5.0% da população masculina' },
    { id: 'tritanopia', label: 'Tritanopia', desc: 'Deficiência nos cones S (azul reduzido)', prevalence: '~0.003% da população global' },
    { id: 'achromatopsia', label: 'Achromatopsia', desc: 'Monocromacia total (apenas bastonetes)', prevalence: '~0.0001% (visão em escala de cinza)' }
  ];

  // Simulating initialColors
  const simulatedPalette = initialColors.map(c => simulateColorBlindness(c, activeDeficiency));

  return (
    <div className="flex-1 bg-[#0B0F17] text-[#DFE2EE] p-4 sm:p-8 max-w-[1500px] mx-auto w-full pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/[0.08] pb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#06B6D4] flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
            Acessibilidade WCAG 2.1 / 3.0 & Visão Humana
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Geist'] mt-1">
            Auditoria de Acessibilidade & Daltonismo
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Verificação rigorosa de razões de contraste, conformidade AA/AAA e matrizes de simulação óptica.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenInGenerator([fgColor, bgColor, '#10B981', '#F59E0B', '#EF4444'])}
            className="h-9 px-4 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Remixar no Gerador</span>
          </button>
        </div>
      </div>

      {/* WCAG Contrast Checker Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
        {/* Left: Interactive Tester Inputs */}
        <div className="lg:col-span-5 bg-[#181C24] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] font-semibold mb-4">
              Pares Cromáticos em Teste
            </h2>

            {/* Foreground Input */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">
                  Cor do Texto (Foreground):
                </label>
                <div className="flex items-center gap-2 bg-[#111827] border border-white/[0.08] p-2 rounded-lg">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-8 h-8 rounded border border-white/20 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="flex-1 bg-transparent font-mono text-sm text-white uppercase focus:outline-none"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center py-1">
                <button
                  onClick={handleSwap}
                  className="p-1.5 rounded-full bg-[#262A33] hover:bg-[#31353E] border border-white/[0.08] text-[#94A3B8] hover:text-white transition-colors"
                  title="Inverter Texto e Fundo"
                >
                  <ArrowLeftRight className="w-4 h-4 rotate-90" />
                </button>
              </div>

              {/* Background Input */}
              <div>
                <label className="text-xs font-mono text-[#94A3B8] block mb-1">
                  Cor de Fundo (Background):
                </label>
                <div className="flex items-center gap-2 bg-[#111827] border border-white/[0.08] p-2 rounded-lg">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded border border-white/20 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 bg-transparent font-mono text-sm text-white uppercase focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <span className="text-xs text-[#94A3B8] font-mono block mb-2">Pares Recomendados:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { fg: '#08BBD9', bg: '#0E1726', name: 'Dark Obsidian + Ciano' },
                { fg: '#FFFFFF', bg: '#6366F1', name: 'Indigo + Branco' },
                { fg: '#0B0F17', bg: '#FAFBF7', name: 'Off-White + Preto' }
              ].map(p => (
                <button
                  key={p.name}
                  onClick={() => { setFgColor(p.fg); setBgColor(p.bg); }}
                  className="px-2 py-1 rounded bg-[#111827] border border-white/[0.06] text-[11px] text-[#94A3B8] hover:text-white"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Contrast Verdict & Live UI Previews */}
        <div className="lg:col-span-7 bg-[#181C24] border border-white/[0.08] rounded-xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-xs font-mono text-[#94A3B8]">Razão de Contraste Calculada:</span>
                <div className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight mt-1 flex items-baseline gap-2">
                  <span>{ratio.toFixed(2)} : 1</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    normalAaa 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                      : normalAa 
                      ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {normalAaa ? 'WCAG AAA Pronto' : normalAa ? 'WCAG AA Aprovado' : 'Falha WCAG'}
                  </span>
                </div>
              </div>

              <div className="text-right font-mono text-xs text-[#64748B]">
                APCA Lc: ~{Math.round(ratio * 11.2)}
              </div>
            </div>

            {/* Checklist Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="p-3 rounded-lg bg-[#111827] border border-white/[0.06]">
                <div className="flex items-center justify-between text-xs font-medium text-white mb-1">
                  <span>Texto Normal (16px)</span>
                  {normalAa ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
                </div>
                <span className="text-[11px] font-mono text-[#64748B] block">Exige 4.5:1 (AA) / 7.0:1 (AAA)</span>
                <span className={`text-[10px] font-mono font-bold mt-1 inline-block ${normalAaa ? 'text-emerald-400' : normalAa ? 'text-[#06B6D4]' : 'text-rose-400'}`}>
                  {normalAaa ? 'Passa AAA' : normalAa ? 'Passa AA' : 'Reprovado'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#111827] border border-white/[0.06]">
                <div className="flex items-center justify-between text-xs font-medium text-white mb-1">
                  <span>Texto Grande (18px+)</span>
                  {largeAa ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
                </div>
                <span className="text-[11px] font-mono text-[#64748B] block">Exige 3.0:1 (AA) / 4.5:1 (AAA)</span>
                <span className={`text-[10px] font-mono font-bold mt-1 inline-block ${largeAaa ? 'text-emerald-400' : largeAa ? 'text-[#06B6D4]' : 'text-rose-400'}`}>
                  {largeAaa ? 'Passa AAA' : largeAa ? 'Passa AA' : 'Reprovado'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#111827] border border-white/[0.06]">
                <div className="flex items-center justify-between text-xs font-medium text-white mb-1">
                  <span>Componentes de UI</span>
                  {uiAa ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
                </div>
                <span className="text-[11px] font-mono text-[#64748B] block">Ícones, bordas e botões</span>
                <span className={`text-[10px] font-mono font-bold mt-1 inline-block ${uiAa ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {uiAa ? 'Passa 3.0:1 (AA)' : 'Reprovado'}
                </span>
              </div>
            </div>

            {/* Live Typography Preview Canvas */}
            <div 
              className="p-6 rounded-xl border border-white/10 shadow-inner"
              style={{ backgroundColor: bgColor }}
            >
              <h4 className="text-xl sm:text-2xl font-bold tracking-tight mb-2" style={{ color: fgColor }}>
                Exemplo de Título em {fgColor}
              </h4>
              <p className="text-sm leading-relaxed" style={{ color: fgColor }}>
                Este parágrafo renderiza texto regular a 16px. A legibilidade óptica e a fadiga visual dependem diretamente da diferença de luminância relativa calculada no espaço sRGB.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Color Blindness Simulation Studio Section */}
      <div className="bg-[#181C24] border border-white/[0.08] rounded-xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#06B6D4] font-semibold">
              Simulador de Daltonismo Digital
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight font-['Geist'] mt-0.5">
              Visão sob Anomalias Ópticas
            </h2>
            <p className="text-xs text-[#94A3B8] mt-1">
              Veja como sua paleta ativa se comporta sob filtros perceptuais de daltonismo.
            </p>
          </div>

          {/* Deficiency Selector Tabs */}
          <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-lg border border-white/[0.06] overflow-x-auto scrollbar-none">
            {deficiencies.map(d => (
              <button
                key={d.id}
                onClick={() => setActiveDeficiency(d.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  activeDeficiency === d.id
                    ? 'bg-[#6366F1] text-white font-semibold'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Deficiency Description */}
        <div className="p-3 bg-[#111827] rounded-lg border border-white/[0.06] mb-6 flex items-center justify-between text-xs font-mono">
          <span className="text-[#DFE2EE]">
            {deficiencies.find(d => d.id === activeDeficiency)?.desc}
          </span>
          <span className="text-[#06B6D4]">
            Prevalência: {deficiencies.find(d => d.id === activeDeficiency)?.prevalence}
          </span>
        </div>

        {/* Side-by-side comparison: Normal vs Simulated */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Normal Vision */}
          <div>
            <span className="text-xs font-mono text-[#94A3B8] block mb-2">Visão Tricromática Padrão:</span>
            <div className="h-32 rounded-xl overflow-hidden flex shadow-lg border border-white/10">
              {initialColors.map((hex, i) => (
                <div 
                  key={i} 
                  className="flex-1 h-full flex flex-col justify-end p-2 text-center" 
                  style={{ backgroundColor: hex }}
                >
                  <span className="text-[10px] font-mono bg-black/50 text-white px-1 py-0.5 rounded">
                    {hex}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Simulated Vision */}
          <div>
            <span className="text-xs font-mono text-[#06B6D4] block mb-2">
              Visão Simulada ({deficiencies.find(d => d.id === activeDeficiency)?.label}):
            </span>
            <div className="h-32 rounded-xl overflow-hidden flex shadow-lg border border-white/10">
              {simulatedPalette.map((hex, i) => (
                <div 
                  key={i} 
                  className="flex-1 h-full flex flex-col justify-end p-2 text-center" 
                  style={{ backgroundColor: hex }}
                >
                  <span className="text-[10px] font-mono bg-black/50 text-white px-1 py-0.5 rounded">
                    {hex}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
