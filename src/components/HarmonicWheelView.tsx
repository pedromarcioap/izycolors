import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { 
  Sparkles, 
  Sliders, 
  ArrowRight, 
  Download, 
  RefreshCw, 
  Bookmark, 
  Check, 
  RotateCcw, 
  RotateCw, 
  Copy, 
  MousePointer, 
  Move,
  Lock,
  Unlock
} from 'lucide-react';
import { 
  generateHarmonies, 
  getHarmonyOffsets, 
  getColorDetails, 
  hslToRgb, 
  rgbToHex 
} from '../utils/colorUtils';

interface HarmonicWheelViewProps {
  onOpenInGenerator: (colors: string[]) => void;
  onSaveToCollection: (colors: string[]) => void;
}

export const HarmonicWheelView: React.FC<HarmonicWheelViewProps> = ({
  onOpenInGenerator,
  onSaveToCollection
}) => {
  // Harmonic parameters
  const [baseHue, setBaseHue] = useState<number>(210); // initial cyan/blue
  const [harmonyRule, setHarmonyRule] = useState<'analogous' | 'monochromatic' | 'triad' | 'complementary' | 'split-complementary' | 'tetradic'>('analogous');
  const [baseLightness, setBaseLightness] = useState<number>(50);
  const [baseSaturation, setBaseSaturation] = useState<number>(85);

  // Mouse interaction options
  const [adjustSaturationWithRadius, setAdjustSaturationWithRadius] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activeDragNode, setActiveDragNode] = useState<number | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Wheel container reference for bounding rect coordinates
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const activeNodeRef = useRef<number | null>(null);

  const rules = [
    { id: 'analogous', label: 'Análogas', desc: 'Cores vizinhas no círculo cromático (diferença de 25° a 30°)' },
    { id: 'monochromatic', label: 'Monocromática', desc: 'Variações de saturação e luminância na mesma matiz' },
    { id: 'triad', label: 'Tríade', desc: 'Três pontos equidistantes a 120° no círculo' },
    { id: 'complementary', label: 'Complementar', desc: 'Cores diametralmente opostas a 180° com alto contraste' },
    { id: 'split-complementary', label: 'Split-Complementar', desc: 'A cor base e as duas vizinhas de sua complementar' },
    { id: 'tetradic', label: 'Tétrade (Quadrado)', desc: 'Dois pares de cores complementares em 90° e 180°' },
  ];

  // Generate the 5 harmonic colors with live saturation & lightness
  const generatedColors = useMemo(() => {
    return generateHarmonies(baseHue, 5, harmonyRule, baseSaturation, baseLightness);
  }, [baseHue, harmonyRule, baseSaturation, baseLightness]);

  // Relative offsets for current harmony rule
  const offsets = useMemo(() => {
    return getHarmonyOffsets(harmonyRule, 5);
  }, [harmonyRule]);

  // Wheel physical dimensions (scaled for high precision)
  const WHEEL_SIZE = 340;
  const wheelRadius = WHEEL_SIZE / 2;
  const maxNodeRadius = wheelRadius - 24;

  // Calculate coordinates on the wheel circle for each color
  const nodePositions = useMemo(() => {
    return generatedColors.map((hex, index) => {
      const details = getColorDetails(hex);
      const hue = details.hsl.h;
      const sat = details.hsl.s;
      const lum = details.hsl.l;

      // In CSS conic-gradient from 0deg: 0° is top (12 o'clock), 90° is right, 180° is bottom, 270° is left
      const angleRad = (hue * Math.PI) / 180;
      const r = (sat / 100) * maxNodeRadius;
      
      const x = wheelRadius + r * Math.sin(angleRad);
      const y = wheelRadius - r * Math.cos(angleRad);

      return {
        index,
        hex,
        x,
        y,
        hue,
        sat,
        lum,
        isBase: index === 0
      };
    });
  }, [generatedColors, wheelRadius, maxNodeRadius]);

  // Color region name classifier for live readout
  const getColorRegionName = (h: number) => {
    const angle = (h % 360 + 360) % 360;
    if (angle >= 345 || angle < 15) return 'Vermelho';
    if (angle >= 15 && angle < 45) return 'Laranja';
    if (angle >= 45 && angle < 75) return 'Amarelo';
    if (angle >= 75 && angle < 105) return 'Verde-Limão';
    if (angle >= 105 && angle < 150) return 'Verde';
    if (angle >= 150 && angle < 195) return 'Ciano';
    if (angle >= 195 && angle < 225) return 'Azul Celeste';
    if (angle >= 225 && angle < 255) return 'Azul Cobalto';
    if (angle >= 255 && angle < 285) return 'Violeta / Índigo';
    if (angle >= 285 && angle < 320) return 'Magenta';
    return 'Carmim / Rosa';
  };

  // Convert mouse pointer client coordinates to polar (hue, saturation)
  const updateFromPointer = useCallback((clientX: number, clientY: number, nodeIndex: number | null) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Angle clockwise from top (12 o'clock)
    let pointerAngle = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (pointerAngle < 0) pointerAngle += 360;

    // If dragging a secondary node, calculate the base hue that keeps that node under cursor
    let targetBaseHue = pointerAngle;
    if (nodeIndex !== null && nodeIndex > 0 && offsets[nodeIndex] !== undefined) {
      targetBaseHue = (pointerAngle - offsets[nodeIndex] + 3600) % 360;
    }

    setBaseHue(Math.round(targetBaseHue));

    // If saturation adjustment by radius is enabled
    if (adjustSaturationWithRadius) {
      const dist = Math.hypot(dx, dy);
      const currentRadius = rect.width / 2;
      const satRatio = Math.min(1, Math.max(0.1, dist / (currentRadius * 0.88)));
      setBaseSaturation(Math.round(satRatio * 100));
    }
  }, [offsets, adjustSaturationWithRadius]);

  // Pointer Down Handler
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, nodeIndex: number | null = null) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setActiveDragNode(nodeIndex !== null ? nodeIndex : 0);
    activeNodeRef.current = nodeIndex !== null ? nodeIndex : 0;

    // Capture pointer events so dragging outside the wheel element does not release
    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {}
    }

    updateFromPointer(e.clientX, e.clientY, nodeIndex !== null ? nodeIndex : 0);
  };

  // Pointer Move Handler
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    updateFromPointer(e.clientX, e.clientY, activeNodeRef.current);
  };

  // Pointer Up / End Handler
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      setActiveDragNode(null);
      activeNodeRef.current = null;
      if (e.currentTarget.releasePointerCapture) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
    }
  };

  // Global window pointer listeners to guarantee drag tracking even if cursor leaves wheel boundaries
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      updateFromPointer(e.clientX, e.clientY, activeNodeRef.current);
    };

    const handleGlobalPointerUp = () => {
      setIsDragging(false);
      setActiveDragNode(null);
      activeNodeRef.current = null;
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [isDragging, updateFromPointer]);

  // Quick rotation step handlers
  const rotateWheel = (deltaDegrees: number) => {
    setBaseHue((prev) => (prev + deltaDegrees + 3600) % 360);
  };

  const randomizeWheel = () => {
    setBaseHue(Math.floor(Math.random() * 360));
    setBaseSaturation(Math.floor(65 + Math.random() * 30));
  };

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // Degree ticks around the perimeter (every 30 degrees)
  const degreeTicks = useMemo(() => {
    return [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => {
      const rad = (deg * Math.PI) / 180;
      const innerR = wheelRadius - 8;
      const outerR = wheelRadius - 1;
      return {
        deg,
        x1: wheelRadius + innerR * Math.sin(rad),
        y1: wheelRadius - innerR * Math.cos(rad),
        x2: wheelRadius + outerR * Math.sin(rad),
        y2: wheelRadius - outerR * Math.cos(rad),
        labelX: wheelRadius + (wheelRadius + 14) * Math.sin(rad),
        labelY: wheelRadius - (wheelRadius + 14) * Math.cos(rad),
        isCardinal: deg % 90 === 0
      };
    });
  }, [wheelRadius]);

  return (
    <div className="flex-1 bg-[#0B0F17] text-[#DFE2EE] p-4 sm:p-8 max-w-[1500px] mx-auto w-full pb-20 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/[0.08] pb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#06B6D4] flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse" />
            Adobe Color & Munsell Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Geist'] mt-1">
            Roda Cromática Harmônica
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Interaja diretamente com o mouse na roda para girar matizes, arrastar nós e esculpir harmonias proporcionais.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onSaveToCollection(generatedColors)}
            className="h-9 px-3.5 bg-[#181C24] hover:bg-[#262A33] border border-white/[0.08] rounded-lg text-xs text-[#DFE2EE] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Salvar esta paleta no Cofre"
          >
            <Bookmark className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Salvar Coleção</span>
          </button>

          <button
            onClick={() => onOpenInGenerator(generatedColors)}
            className="h-9 px-4 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-colors cursor-pointer"
            title="Transferir esquema para o Gerador Procedural"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Abrir no Gerador</span>
          </button>
        </div>
      </div>

      {/* Main Studio Layout: Controls + Interactive Wheel + Swatches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Rules & Fine-Tuning Column */}
        <div className="lg:col-span-4 bg-[#181C24] border border-white/[0.08] rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] font-semibold">
              Regra de Harmonia
            </h2>
            <span className="text-[10px] font-mono text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded border border-[#06B6D4]/20">
              5 Cores
            </span>
          </div>

          {/* Harmony Rules List */}
          <div className="space-y-1.5">
            {rules.map((rule) => (
              <button
                key={rule.id}
                onClick={() => setHarmonyRule(rule.id as any)}
                className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                  harmonyRule === rule.id
                    ? 'bg-[#262A33] border-[#6366F1] text-white shadow-md'
                    : 'bg-[#111827] border-white/[0.04] text-[#94A3B8] hover:text-white hover:border-white/[0.1]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-medium">
                  <span>{rule.label}</span>
                  {harmonyRule === rule.id && <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />}
                </div>
                <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
                  {rule.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Precision Wheel Controls */}
          <div className="pt-4 border-t border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] font-semibold">
                Controles de Matiz & Raio
              </span>
              <button
                onClick={randomizeWheel}
                className="text-[11px] font-mono text-[#DFE2EE] hover:text-[#06B6D4] flex items-center gap-1 transition-colors cursor-pointer"
                title="Sortear Nova Posição da Roda"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sortear</span>
              </button>
            </div>

            {/* Base Hue Numeric Input & Rotation Steps */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#94A3B8]">Matiz Base (#1):</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#DFE2EE] font-bold">{getColorRegionName(baseHue)}</span>
                  <input
                    type="number"
                    min="0"
                    max="359"
                    value={baseHue}
                    onChange={(e) => setBaseHue((Number(e.target.value) % 360 + 360) % 360)}
                    className="w-14 px-1.5 py-0.5 bg-[#111827] border border-white/[0.1] rounded text-right text-xs font-mono text-[#06B6D4] focus:outline-none focus:border-[#06B6D4]"
                  />
                  <span className="text-[#64748B]">°</span>
                </div>
              </div>

              {/* Slider for Base Hue */}
              <input
                type="range"
                min="0"
                max="359"
                value={baseHue}
                onChange={(e) => setBaseHue(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-cyan-500 via-blue-500 via-purple-500 to-red-500"
              />

              {/* Quick Rotation Buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <button
                  onClick={() => rotateWheel(-15)}
                  className="py-1 px-1.5 bg-[#111827] hover:bg-[#262A33] border border-white/[0.06] rounded text-[10px] font-mono text-[#94A3B8] hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Girar 15° no sentido anti-horário"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>-15°</span>
                </button>
                <button
                  onClick={() => rotateWheel(15)}
                  className="py-1 px-1.5 bg-[#111827] hover:bg-[#262A33] border border-white/[0.06] rounded text-[10px] font-mono text-[#94A3B8] hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Girar 15° no sentido horário"
                >
                  <RotateCw className="w-2.5 h-2.5" />
                  <span>+15°</span>
                </button>
                <button
                  onClick={() => rotateWheel(180)}
                  className="py-1 px-1.5 bg-[#111827] hover:bg-[#262A33] border border-white/[0.06] rounded text-[10px] font-mono text-[#94A3B8] hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Inverter 180° (Oposto)"
                >
                  <span>180°</span>
                </button>
                <button
                  onClick={() => setBaseHue(0)}
                  className="py-1 px-1.5 bg-[#111827] hover:bg-[#262A33] border border-white/[0.06] rounded text-[10px] font-mono text-[#94A3B8] hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Redefinir para 0° (Vermelho)"
                >
                  <span>0°</span>
                </button>
              </div>
            </div>

            {/* Base Saturation Slider */}
            <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#94A3B8]">Saturação Global:</span>
                <span className="text-[#06B6D4] font-semibold">{baseSaturation}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={baseSaturation}
                onChange={(e) => setBaseSaturation(Number(e.target.value))}
                className="w-full h-1.5 bg-[#111827] rounded-lg appearance-none cursor-pointer accent-[#06B6D4]"
              />
            </div>

            {/* Base Lightness Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#94A3B8]">Luminância Central:</span>
                <span className="text-[#06B6D4] font-semibold">{baseLightness}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                value={baseLightness}
                onChange={(e) => setBaseLightness(Number(e.target.value))}
                className="w-full h-1.5 bg-[#111827] rounded-lg appearance-none cursor-pointer accent-[#6366F1]"
              />
            </div>

            {/* Mouse Behavior Toggle */}
            <div className="pt-2 border-t border-white/[0.06]">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-[11px] text-[#94A3B8] group-hover:text-white transition-colors">
                  Ajustar saturação pelo raio do mouse
                </span>
                <input
                  type="checkbox"
                  checked={adjustSaturationWithRadius}
                  onChange={(e) => setAdjustSaturationWithRadius(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-[#111827] border-white/20 text-[#6366F1] focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Center: Interactive Visual Wheel with Full Mouse Dragging */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-[#181C24] border border-white/[0.08] rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
            
            {/* Live Interactive Mouse Feedback Indicator Banner */}
            <div className="w-full flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isDragging ? 'bg-emerald-400 animate-ping' : 'bg-[#06B6D4]'}`} />
                <span className="text-xs font-mono text-[#94A3B8]">
                  {isDragging 
                    ? `Arrastando Nó #${(activeDragNode ?? 0) + 1} • ${baseHue}° (${getColorRegionName(baseHue)})`
                    : 'Clique ou arraste diretamente na roda com o mouse'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-[#64748B]">
                <span>H: <strong className="text-white">{baseHue}°</strong></span>
                <span>S: <strong className="text-white">{baseSaturation}%</strong></span>
                <span>L: <strong className="text-white">{baseLightness}%</strong></span>
              </div>
            </div>

            {/* Interactive Color Wheel Stage */}
            <div className="relative flex items-center justify-center p-6">
              {/* Surrounding Degree Dial */}
              <div 
                ref={wheelRef}
                onPointerDown={(e) => handlePointerDown(e, null)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={`relative rounded-full select-none touch-none transition-shadow ${
                  isDragging ? 'cursor-grabbing ring-2 ring-[#6366F1]' : 'cursor-crosshair hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]'
                }`}
                style={{ 
                  width: `${WHEEL_SIZE}px`, 
                  height: `${WHEEL_SIZE}px` 
                }}
              >
                {/* Continuous Conic Gradient Wheel Surface */}
                <div 
                  className="w-full h-full rounded-full shadow-2xl border-2 border-white/20 overflow-hidden relative"
                  style={{
                    background: 'conic-gradient(from 0deg, #ff0000 0deg, #ffff00 60deg, #00ff00 120deg, #00ffff 180deg, #0000ff 240deg, #ff00ff 300deg, #ff0000 360deg)'
                  }}
                >
                  {/* Radial Desaturation Gradient (Center white falloff mimicking real Munsell / HSL chroma) */}
                  <div 
                    className="w-full h-full rounded-full"
                    style={{
                      background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 35%, rgba(255,255,255,0) 75%, rgba(0,0,0,0.3) 100%)'
                    }}
                  />
                </div>

                {/* SVG Overlay for Coordinates, Guides, Harmonics Geometry and Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Concentric Saturation Rings (25%, 50%, 75%, 100%) */}
                  {[0.25, 0.5, 0.75, 1.0].map((ratio, idx) => (
                    <circle
                      key={idx}
                      cx={wheelRadius}
                      cy={wheelRadius}
                      r={maxNodeRadius * ratio}
                      fill="none"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="1"
                      strokeDasharray={ratio === 1.0 ? 'none' : '3 3'}
                    />
                  ))}

                  {/* Degree Ticks around the Wheel */}
                  {degreeTicks.map((tick) => (
                    <g key={tick.deg}>
                      <line
                        x1={tick.x1}
                        y1={tick.y1}
                        x2={tick.x2}
                        y2={tick.y2}
                        stroke={tick.isCardinal ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)'}
                        strokeWidth={tick.isCardinal ? '2' : '1'}
                      />
                    </g>
                  ))}

                  {/* Connecting Harmonic Polygon Fill */}
                  <polygon
                    points={nodePositions.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="rgba(99, 102, 241, 0.12)"
                    stroke="rgba(99, 102, 241, 0.4)"
                    strokeWidth="1.5"
                  />

                  {/* Radial Ray Lines from Center to Each Node */}
                  {nodePositions.map((pos) => (
                    <line
                      key={pos.index}
                      x1={wheelRadius}
                      y1={wheelRadius}
                      x2={pos.x}
                      y2={pos.y}
                      stroke={pos.isBase ? '#06B6D4' : 'rgba(255,255,255,0.5)'}
                      strokeWidth={pos.isBase ? '2' : '1.5'}
                      strokeDasharray={pos.isBase ? 'none' : '3 3'}
                    />
                  ))}
                </svg>

                {/* Central Anchor Pin */}
                <div 
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/30 border border-white/60 shadow-lg flex items-center justify-center pointer-events-none"
                  title="Centro Acromático (Saturação 0%)"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>

                {/* Draggable Harmonic Node Pins (Mouse-interactive!) */}
                {nodePositions.map((node) => {
                  const isNodeActive = activeDragNode === node.index;
                  return (
                    <div
                      key={node.index}
                      onPointerDown={(e) => handlePointerDown(e, node.index)}
                      className={`absolute -ml-4 -mt-4 rounded-full flex items-center justify-center transition-transform cursor-grab active:cursor-grabbing select-none z-20 ${
                        node.isBase 
                          ? 'w-8 h-8 border-2 border-white ring-4 ring-[#06B6D4]/50 shadow-[0_0_15px_rgba(6,182,212,0.6)]' 
                          : 'w-7 h-7 border-2 border-white shadow-xl'
                      } ${isNodeActive ? 'scale-125 ring-4 ring-indigo-400' : 'hover:scale-115'}`}
                      style={{
                        left: `${node.x}px`,
                        top: `${node.y}px`,
                        backgroundColor: node.hex
                      }}
                      title={`Nó #${node.index + 1} ${node.isBase ? '(BASE / ÂNCORA)' : ''}: ${node.hex} (${node.hue}°) - Arraste com o mouse`}
                    >
                      <span 
                        className={`text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ${
                          node.lum > 50 ? 'text-black bg-white/90' : 'text-white bg-black/70'
                        }`}
                      >
                        {node.index + 1}
                      </span>

                      {/* Small badge tag on the base node */}
                      {node.isBase && (
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold uppercase tracking-wider text-[#06B6D4] bg-[#0E131E]/95 border border-[#06B6D4]/40 px-1 rounded shadow pointer-events-none">
                          BASE
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Mouse Usage Helper */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-[#94A3B8] font-mono">
              <span className="flex items-center gap-1.5">
                <MousePointer className="w-3.5 h-3.5 text-[#06B6D4]" />
                Clique e arraste em qualquer ponto para girar matizes
              </span>
              <span className="text-white/20 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-[#6366F1]" />
                Arraste o nó #1 ou qualquer ponto da constelação
              </span>
            </div>
          </div>

          {/* Generated Swatches Bar with Deep Color Science Metrics & 1-Click Copy */}
          <div className="bg-[#181C24] border border-white/[0.08] rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] font-semibold">
                Esquema Gerado ({harmonyRule.toUpperCase()})
              </h3>
              <span className="text-[11px] font-mono text-[#64748B]">
                Clique em qualquer amostra para copiar o código HEX
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {generatedColors.map((hex, i) => {
                const details = getColorDetails(hex);
                const isCopied = copiedHex === hex;
                const isBase = i === 0;

                return (
                  <div
                    key={i}
                    onClick={() => handleCopy(hex)}
                    className="group rounded-xl overflow-hidden flex flex-col justify-between p-3.5 h-44 sm:h-48 transition-all hover:scale-[1.03] shadow-lg border border-white/[0.06] cursor-pointer relative"
                    style={{ backgroundColor: hex }}
                  >
                    {/* Top Header info */}
                    <div 
                      className="flex justify-between items-center text-[10px] font-mono font-bold" 
                      style={{ color: details.isLight ? '#000' : '#FFF' }}
                    >
                      <span className="flex items-center gap-1">
                        #{i + 1} {isBase && '(Base)'}
                      </span>
                      <span>{details.hsl.h}°</span>
                    </div>

                    {/* Center Hex and Luminance */}
                    <div className="text-center my-auto" style={{ color: details.isLight ? '#000' : '#FFF' }}>
                      <span className="text-sm sm:text-base font-bold font-mono block">
                        {hex}
                      </span>
                      <span className="text-[10px] font-mono opacity-80 block">
                        L: {Math.round(details.luminance * 100)}% • S: {details.hsl.s}%
                      </span>
                    </div>

                    {/* Bottom Metadata & Copy Feedback */}
                    <div 
                      className="text-[10px] font-mono text-center px-1.5 py-1 rounded flex items-center justify-center gap-1 transition-colors"
                      style={{
                        backgroundColor: details.isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.18)',
                        color: details.isLight ? '#000' : '#FFF'
                      }}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <span className="group-hover:hidden">Oklch {details.oklch.l}</span>
                          <span className="hidden group-hover:inline-flex items-center gap-1 font-bold">
                            <Copy className="w-3 h-3" /> Copiar
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
