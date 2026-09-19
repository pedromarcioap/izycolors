import React, { useState } from 'react';
import { X, Check, Copy, Download, Code, FileCode, Sliders, Palette as PaletteIcon, Sparkles } from 'lucide-react';
import { 
  exportCssTokens, 
  exportTailwindConfig, 
  exportJsonTokens, 
  exportSvgSwatches,
  exportIllustratorScript,
  generateAseBlob
} from '../utils/colorUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  colors: string[];
  paletteTitle?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  colors,
  paletteTitle = 'Izy Colors System Palette'
}) => {
  const [format, setFormat] = useState<'illustrator' | 'ase' | 'css' | 'tailwind' | 'json' | 'svg' | 'scss'>('illustrator');
  const [copied, setCopied] = useState(false);
  const [prefix, setPrefix] = useState(() => {
    try {
      const prefs = localStorage.getItem('chromatica_token_prefs');
      if (prefs) return JSON.parse(prefs).variablePrefix || 'color';
      const user = localStorage.getItem('chromatica_user_profile');
      if (user) return JSON.parse(user).exportPreferences?.variablePrefix || 'color';
    } catch {}
    return 'color';
  });

  if (!isOpen) return null;

  let exportContent = '';
  let fileName = `${paletteTitle.toLowerCase().replace(/\s+/g, '-')}.${format}`;

  switch (format) {
    case 'illustrator':
      exportContent = exportIllustratorScript(colors, paletteTitle);
      fileName = `${paletteTitle.toLowerCase().replace(/\s+/g, '-')}-illustrator.jsx`;
      break;
    case 'ase':
      exportContent = `// ADOBE SWATCH EXCHANGE (.ASE) BINARY FILE
// Formato binário proprietário da Adobe Systems para Adobe Illustrator, InDesign e Photoshop.
// 
// Total de cores: ${colors.length} amostras calibradas
${colors.map((c, i) => `// [Amostra ${i + 1}] ${paletteTitle} ${i + 1}: ${c}`).join('\n')}
// 
// CLIQUE NO BOTÃO "BAIXAR ARQUIVO (.ASE)" ABAIXO PARA OBTER O ARQUIVO BINÁRIO NATIVO.
// 
// INSTRUÇÕES DE IMPORTAÇÃO NO ADOBE ILLUSTRATOR:
// 1. No Adobe Illustrator, abra o painel "Amostras" (Janela > Amostras / Window > Swatches)
// 2. Clique no menu de opções no canto superior direito do painel
// 3. Selecione "Abrir Biblioteca de Amostras" > "Outra Biblioteca..." (Open Swatch Library > Other Library...)
// 4. Selecione o arquivo .ase baixado. Todas as amostras estarão prontas para uso vetorial!`;
      fileName = `${paletteTitle.toLowerCase().replace(/\s+/g, '-')}.ase`;
      break;
    case 'css':
      exportContent = exportCssTokens(colors, prefix);
      fileName = 'tokens.css';
      break;
    case 'tailwind':
      exportContent = exportTailwindConfig(colors);
      fileName = 'tailwind.config.js';
      break;
    case 'json':
      exportContent = exportJsonTokens(colors);
      fileName = 'tokens.json';
      break;
    case 'svg':
      exportContent = exportSvgSwatches(colors);
      fileName = 'palette.svg';
      break;
    case 'scss':
      exportContent = colors.map((c, i) => `$${prefix}-${i + 1}: ${c};`).join('\n');
      fileName = 'palette.scss';
      break;
  }

  const handleCopy = () => {
    if (format === 'ase') {
      handleDownload();
      return;
    }
    navigator.clipboard.writeText(exportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (format === 'ase') {
      // Generate real binary ASE blob
      const blob = generateAseBlob(colors, paletteTitle);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${paletteTitle.toLowerCase().replace(/\s+/g, '-')}.ase`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="w-full max-w-4xl bg-[#111827] border border-white/[0.12] rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#141A24]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
              <span className="text-[10px] font-mono text-[#06B6D4] uppercase tracking-wider font-semibold">
                Exportação de Amostras & Design Tokens
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white font-['Geist'] mt-0.5 flex items-center gap-2">
              <Code className="w-4 h-4 text-[#6366F1]" />
              Exportar para Adobe Illustrator & Código
            </h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Amostras nativas para Illustrator (.ase / .jsx), Design Systems, Tailwind, CSS nativo e Figma.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Fechar Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Color Preview Bar */}
        <div className="px-5 py-3 bg-[#0B0F17] border-b border-white/[0.06] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] font-mono">Paleta ativa ({colors.length}):</span>
            <span className="text-xs text-white font-semibold">{paletteTitle}</span>
          </div>
          <div className="w-48 sm:w-64 h-6 rounded overflow-hidden flex shadow-inner border border-white/10">
            {colors.map((c, i) => (
              <div 
                key={i} 
                className="flex-1 h-full relative group cursor-pointer transition-transform hover:scale-105" 
                style={{ backgroundColor: c }}
                title={`${c}`}
              />
            ))}
          </div>
        </div>

        {/* Format Selectors and Configuration */}
        <div className="p-3 sm:p-4 bg-[#181C24] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-[#0B0F17] p-1 rounded-lg border border-white/[0.06]">
            {[
              { id: 'illustrator', label: 'Adobe Illustrator (.jsx)', highlight: true },
              { id: 'ase', label: 'Adobe Swatches (.ase)', highlight: true },
              { id: 'css', label: 'CSS Variables' },
              { id: 'tailwind', label: 'Tailwind Config' },
              { id: 'json', label: 'Tokens JSON' },
              { id: 'svg', label: 'SVG Swatches' },
              { id: 'scss', label: 'SCSS' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFormat(tab.id as any)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  format === tab.id
                    ? 'bg-[#6366F1] text-white shadow-sm font-semibold'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {tab.highlight && <Sparkles className="w-3 h-3 text-[#06B6D4]" />}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {(format === 'css' || format === 'scss') && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#94A3B8] font-mono">Prefixo:</span>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="w-24 bg-[#0B0F17] border border-white/[0.1] rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#6366F1]"
              />
            </div>
          )}
        </div>

        {/* Format Specific Notice / Guidance */}
        {format === 'illustrator' && (
          <div className="px-5 py-2.5 bg-indigo-950/40 border-b border-indigo-500/20 text-xs text-indigo-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono">
              <PaletteIcon className="w-3.5 h-3.5 text-[#06B6D4]" />
              <strong>Script para Adobe Illustrator:</strong> Execute em <em>Arquivo &gt; Scripts &gt; Outro Script...</em> para criar o grupo de amostras com precisão CMYK/RGB.
            </span>
          </div>
        )}

        {format === 'ase' && (
          <div className="px-5 py-2.5 bg-cyan-950/40 border-b border-cyan-500/20 text-xs text-cyan-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
              <strong>Adobe Swatch Exchange (.ase):</strong> Arquivo binário compatível com Illustrator, Photoshop, InDesign e Figma.
            </span>
          </div>
        )}

        {/* Code View Body */}
        <div className="flex-1 p-4 sm:p-5 bg-[#0B0F17] overflow-auto min-h-[280px] font-mono text-xs text-[#E2E8F0]">
          <pre className="selection:bg-[#6366F1]/40 whitespace-pre-wrap leading-relaxed">
            {exportContent}
          </pre>
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-[#181C24] border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-[#64748B] font-mono">
            {colors.length} amostras prontas para Adobe Illustrator & Design Systems
          </span>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {format !== 'ase' && (
              <button
                onClick={handleCopy}
                className="h-9 px-4 rounded-lg bg-[#262A33] hover:bg-[#31353E] text-white text-xs font-medium flex items-center gap-1.5 transition-colors border border-white/[0.08] cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado para o Clipboard!' : 'Copiar Código'}</span>
              </button>
            )}
            <button
              onClick={handleDownload}
              className="h-9 px-4 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-indigo-600/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {format === 'ase' ? 'Baixar Amostras .ASE' : format === 'illustrator' ? 'Baixar Script .JSX' : `Baixar (${format.toUpperCase()})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
