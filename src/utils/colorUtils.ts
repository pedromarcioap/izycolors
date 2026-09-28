import { ColorDetails, ColorItem } from '../types';

// Convert HEX to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '').trim();
  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = Number.parseInt(fullHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

// Convert RGB to HEX
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Convert HSL to RGB
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = (h % 360) / 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

// Convert RGB to HSV
export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100)
  };
}

// Convert RGB to CMYK
export function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }
  const c = (1 - rNorm - k) / (1 - k);
  const m = (1 - gNorm - k) / (1 - k);
  const y = (1 - bNorm - k) / (1 - k);
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100)
  };
}

// Convert RGB to LAB (CIE-L*a*b*)
export function rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
  // sRGB to linear
  let rLin = r / 255;
  let gLin = g / 255;
  let bLin = b / 255;
  rLin = rLin > 0.04045 ? Math.pow((rLin + 0.055) / 1.055, 2.4) : rLin / 12.92;
  gLin = gLin > 0.04045 ? Math.pow((gLin + 0.055) / 1.055, 2.4) : gLin / 12.92;
  bLin = bLin > 0.04045 ? Math.pow((bLin + 0.055) / 1.055, 2.4) : bLin / 12.92;

  // Linear sRGB to CIE XYZ (D65)
  const x = (rLin * 0.4124 + gLin * 0.3576 + bLin * 0.1805) * 100;
  const y = (rLin * 0.2126 + gLin * 0.7152 + bLin * 0.0722) * 100;
  const z = (rLin * 0.0193 + gLin * 0.1192 + bLin * 0.9505) * 100;

  // XYZ to Lab (reference white D65)
  const xRef = 95.047;
  const yRef = 100.0;
  const zRef = 108.883;

  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : (7.787 * t) + (16 / 116);
  const fx = f(x / xRef);
  const fy = f(y / yRef);
  const fz = f(z / zRef);

  const l = (116 * fy) - 16;
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return {
    l: Math.round(l * 10) / 10,
    a: Math.round(a * 10) / 10,
    b: Math.round(bVal * 10) / 10
  };
}

// Convert LAB to LCH
export function labToLch(l: number, a: number, b: number): { l: number; c: number; h: number } {
  const c = Math.hypot(a, b);
  let h = Math.atan2(b, a) * (180 / Math.PI);
  if (h < 0) h += 360;
  return {
    l: Math.round(l * 10) / 10,
    c: Math.round(c * 10) / 10,
    h: Math.round(h * 10) / 10
  };
}

// Convert RGB to OKLCH (Perceptually Uniform Color Space)
export function rgbToOklch(r: number, g: number, b: number): { l: number; c: number; h: number } {
  // Linearize sRGB
  const toLinear = (c: number) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const rLin = toLinear(r);
  const gLin = toLinear(g);
  const bLin = toLinear(b);

  // Convert to LMS
  const lPrime = Math.cbrt(0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin);
  const mPrime = Math.cbrt(0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin);
  const sPrime = Math.cbrt(0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin);

  // Oklab L, a, b
  const L = 0.2104542553 * lPrime + 0.7936177850 * mPrime - 0.0040720468 * sPrime;
  const a = 1.9779984951 * lPrime - 2.4285922050 * mPrime + 0.4505937099 * sPrime;
  const bLab = 0.0259040371 * lPrime + 0.7827717662 * mPrime - 0.8086757660 * sPrime;

  const C = Math.hypot(a, bLab);
  let H = Math.atan2(bLab, a) * (180 / Math.PI);
  if (H < 0) H += 360;

  return {
    l: Math.round(L * 100) / 100,
    c: Math.round(C * 1000) / 1000,
    h: Math.round(H * 10) / 10
  };
}

// Calculate relative luminance for WCAG 2.1
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Calculate WCAG 2.1 contrast ratio between two colors
export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  const ratio = (brightest + 0.05) / (darkest + 0.05);
  return Math.round(ratio * 100) / 100;
}

// Get full color details object
export function getColorDetails(hex: string): ColorDetails {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
  const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
  const lch = labToLch(lab.l, lab.a, lab.b);
  const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
  const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);

  return {
    hex: hex.toUpperCase(),
    rgb,
    hsl,
    hsv,
    cmyk,
    lab,
    lch,
    oklch,
    luminance,
    isLight: luminance > 0.45
  };
}

// Get relative hue offsets for each harmony rule
export function getHarmonyOffsets(harmonyType: string, count: number = 5): number[] {
  switch (harmonyType) {
    case 'analogous':
      return Array.from({ length: count }, (_, i) => (i - Math.floor(count / 2)) * 25);
    case 'monochromatic':
      return Array.from({ length: count }, () => 0);
    case 'triad':
      return [0, 120, 240, 40, 160].slice(0, count);
    case 'complementary':
      return [0, 180, 20, 200, 340].slice(0, count);
    case 'split-complementary':
      return [0, 150, 210, 30, 180].slice(0, count);
    case 'tetradic':
      return [0, 60, 180, 240, 300].slice(0, count);
    default:
      return Array.from({ length: count }, (_, i) => Math.round((i * 360) / count));
  }
}

// Generate color harmonies from a base hue with customizable saturation and lightness
export function generateHarmonies(
  baseHue: number,
  count: number = 5,
  harmonyType: string = 'analogous',
  baseSaturation: number = 75,
  baseLightness: number = 50
): string[] {
  const baseH = (baseHue % 360 + 360) % 360;
  const offsets = getHarmonyOffsets(harmonyType, count);
  const hues = offsets.map(offset => (baseH + offset + 3600) % 360);

  return hues.slice(0, count).map((h, i) => {
    let s: number;
    let l: number;
    if (harmonyType === 'monochromatic') {
      s = Math.max(10, Math.min(100, baseSaturation - i * 6));
      l = Math.max(15, Math.min(88, (baseLightness - 20) + (i * (45 / Math.max(1, count - 1)))));
    } else {
      const lightnessDeltas = [0, -12, 12, -22, 18];
      const satDeltas = [0, -6, 4, -10, -3];
      l = Math.max(15, Math.min(88, baseLightness + (lightnessDeltas[i % lightnessDeltas.length] || 0)));
      s = Math.max(10, Math.min(100, baseSaturation + (satDeltas[i % satDeltas.length] || 0)));
    }
    const rgb = hslToRgb(h, s, l);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  });
}

function getRandomFloat(): number {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  if (cryptoObj?.getRandomValues) {
    const buf = new Uint32Array(1);
    cryptoObj.getRandomValues(buf);
    return buf[0] / 4294967296;
  }
  return (Date.now() % 1000) / 1000;
}

// Generate random harmonious palette for the Spacebar generator
export function generateRandomHarmoniousPalette(count: number = 5): string[] {
  const modes = ['analogous', 'triad', 'complementary', 'split-complementary', 'tetradic', 'coolors-smart'];
  const mode = modes[Math.floor(getRandomFloat() * modes.length)];
  const randomHue = Math.floor(getRandomFloat() * 360);

  if (mode === 'coolors-smart') {
    // Generates a curated, high-aesthetic color scheme with deep contrast
    const baseH = randomHue;
    const saturation = 65 + getRandomFloat() * 25;
    const colors: string[] = [
      // Primary deep/dark anchor
      rgbToHex(...Object.values(hslToRgb(baseH, 40, 18)) as [number, number, number]),
      // Secondary bright hue
      rgbToHex(...Object.values(hslToRgb((baseH + 40) % 360, saturation, 56)) as [number, number, number]),
      // Vivid accent
      rgbToHex(...Object.values(hslToRgb((baseH + 160) % 360, saturation + 10, 60)) as [number, number, number]),
      // Contrast lighter tone
      rgbToHex(...Object.values(hslToRgb((baseH + 210) % 360, 70, 72)) as [number, number, number]),
      // Soft tint or dark plum
      rgbToHex(...Object.values(hslToRgb((baseH + 280) % 360, 55, 85)) as [number, number, number])
    ];

    return colors.slice(0, count);
  }

  return generateHarmonies(randomHue, count, mode);
}

// -------------------------------------------------------------
// INTELLIGENT & SEMANTIC PALETTE GENERATION (SEED & TEXT-TO-PALETTE)
// -------------------------------------------------------------

export interface MoodHslConfig {
  hueRange?: [number, number];
  presetHues?: number[];
  saturationRange: [number, number];
  lightnessRange: [number, number];
  harmonyMode?: string;
  description: string;
}

// Map keywords/moods to HSL rules
export function parseMoodToHslRules(prompt: string): MoodHslConfig {
  const norm = prompt.toLowerCase().trim();

  // Cyberpunk / Neon
  if (/neon|cyberpunk|synthwave|futur|elétric|eletric|vibrant/.test(norm)) {
    return {
      presetHues: [300, 180, 210, 100, 55], // Magenta, Cyan, Blue, Electric Lime, Neon Yellow
      saturationRange: [85, 100],
      lightnessRange: [48, 65],
      harmonyMode: 'split-complementary',
      description: 'Cores vibrantes de altíssima saturação e contraste elétrico'
    };
  }

  // Melancholic / Autumn / Melancólico / Outono / Dark
  if (/melancól|melancol|outono|autumn|sad|triste|sombrio|dark|gót|goti/.test(norm)) {
    return {
      hueRange: [15, 45], // Earthy warm browns, burnt orange, deep terracotta
      presetHues: [25, 18, 35, 205, 215], // Warm amber, deep soil, slate accents
      saturationRange: [22, 48],
      lightnessRange: [18, 45],
      harmonyMode: 'analogous',
      description: 'Tons terrosos, baixa saturação e curvas de luminosidade suaves'
    };
  }

  // Corporate / Clean / Minimalist / Professional
  if (/corporat|clean|minimal|profissional|tech|saás|saas|business|empresa/.test(norm)) {
    return {
      presetHues: [215, 200, 190, 225, 210], // Corporate blues, slates, crisp teal
      saturationRange: [45, 70],
      lightnessRange: [15, 90], // High contrast spread for accessibility
      harmonyMode: 'monochromatic',
      description: 'Paleta sóbria em escala corporativa de alto contraste e acessibilidade'
    };
  }

  // Sunset / Pôr do Sol / Summer / Beach / Tropical
  if (/pôr do sol|por do sol|sunset|praia|beach|verão|verao|summer|tropic|quente/.test(norm)) {
    return {
      presetHues: [350, 15, 38, 52, 280], // Red, Crimson, Orange, Gold, Twilight Violet
      saturationRange: [75, 95],
      lightnessRange: [40, 75],
      harmonyMode: 'triad',
      description: 'Gradiente térmico aquecido inspirado em crepúsculos tropicais'
    };
  }

  // Pastel / Soft / Candy / Momo / Suave
  if (/pastel|soft|suave|doce|candy|infantil|momo|delicad/.test(norm)) {
    return {
      saturationRange: [35, 60],
      lightnessRange: [72, 88],
      harmonyMode: 'analogous',
      description: 'Paleta delicada com alta luminosidade e saturação aveludada'
    };
  }

  // Forest / Nature / Eco / Green / Bio
  if (/nature|floresta|forest|eco|bio|verde|green|folha|jardim/.test(norm)) {
    return {
      hueRange: [85, 160], // Moss, Emerald, Leaf, Sage
      presetHues: [120, 140, 95, 35, 155], // Greens with wood brown accent
      saturationRange: [35, 75],
      lightnessRange: [25, 70],
      harmonyMode: 'analogous',
      description: 'Tons botânicos e folhagens com acentos orgânicos de madeira'
    };
  }

  // Coffee / Cozy / Café / Aconchegante
  if (/café|cafe|coffee|cozy|aconchegante|quente|chocolate/.test(norm)) {
    return {
      presetHues: [25, 32, 20, 42, 15],
      saturationRange: [30, 65],
      lightnessRange: [15, 82], // Deep espresso to creamy beige
      harmonyMode: 'monochromatic',
      description: 'Aroma de café torrado, tons de espresso e creme aveludado'
    };
  }

  // Deterministic String Hash fallback for any custom prompt:
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = (norm.codePointAt(i) ?? 0) + ((hash << 5) - hash);
  }
  const baseH = Math.abs(hash) % 360;
  const satMod = 50 + (Math.abs(hash >> 3) % 40); // 50 - 90
  const lightMod = 35 + (Math.abs(hash >> 7) % 35); // 35 - 70

  return {
    hueRange: [baseH, (baseH + 120) % 360],
    saturationRange: [satMod - 10, satMod + 10],
    lightnessRange: [lightMod - 15, lightMod + 20],
    harmonyMode: 'split-complementary',
    description: `Paleta gerada semanticamente para "${prompt}"`
  };
}

// Convert textual prompt into an array of 5 HEX colors (respecting locked items if passed)
export function convertPromptToPalette(
  prompt: string,
  existingColors: ColorItem[] = []
): string[] {
  const config = parseMoodToHslRules(prompt);
  const count = existingColors.length > 0 ? existingColors.length : 5;
  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    const item = existingColors[i];
    if (item?.locked) {
      result.push(item.hex);
      continue;
    }

    let h = 0;
    if (config.presetHues && config.presetHues.length > 0) {
      h = config.presetHues[i % config.presetHues.length];
    } else if (config.hueRange) {
      const minH = config.hueRange[0];
      const maxH = config.hueRange[1];
      const span = maxH >= minH ? maxH - minH : maxH + 360 - minH;
      h = (minH + (i * span) / Math.max(1, count - 1)) % 360;
    } else {
      h = (i * (360 / count) + (getRandomFloat() * 20 - 10)) % 360;
    }

    const minS = config.saturationRange[0];
    const maxS = config.saturationRange[1];
    const s = Math.round(minS + getRandomFloat() * (maxS - minS));

    const minL = config.lightnessRange[0];
    const maxL = config.lightnessRange[1];
    const lightSpread = [minL, minL + (maxL - minL) * 0.4, minL + (maxL - minL) * 0.75, minL + (maxL - minL) * 0.25, maxL];
    const l = Math.round(lightSpread[i % lightSpread.length]);

    const rgb = hslToRgb((h + 360) % 360, s, l);
    result.push(rgbToHex(rgb.r, rgb.g, rgb.b));
  }

  return result;
}

// Generate smart palette based on seed / locked colors in existing columns
export function generateSeedBasedPalette(
  colors: ColorItem[],
  harmonyType: string = 'analogous'
): string[] {
  const count = colors.length;
  const lockedIndices = colors.map((c, idx) => c.locked ? idx : -1).filter(idx => idx !== -1);

  if (lockedIndices.length === 0) {
    return generateRandomHarmoniousPalette(count);
  }

  // Extract details of locked colors
  const lockedDetails = lockedIndices.map(idx => ({
    index: idx,
    details: getColorDetails(colors[idx].hex)
  }));

  const result: string[] = colors.map(c => c.hex);

  if (lockedIndices.length === 1) {
    // 1 Locked Color: Generate chromatic harmonies centered around this seed
    const seed = lockedDetails[0].details;
    const baseH = seed.hsl.h;
    const offsets = getHarmonyOffsets(harmonyType === 'smart' ? 'analogous' : harmonyType, count);

    colors.forEach((col, idx) => {
      if (col.locked) return;
      const offset = offsets[idx % offsets.length];
      const newH = (baseH + offset + 3600) % 360;

      // Calculate harmonious lightness and saturation steps
      const lightnessDeltas = [0, -18, 16, -28, 22];
      const satDeltas = [0, -10, 8, -15, -4];

      const newS = Math.max(15, Math.min(95, seed.hsl.s + (satDeltas[idx % satDeltas.length] || 0)));
      const newL = Math.max(12, Math.min(88, seed.hsl.l + (lightnessDeltas[idx % lightnessDeltas.length] || 0)));

      const rgb = hslToRgb(newH, newS, newL);
      result[idx] = rgbToHex(rgb.r, rgb.g, rgb.b);
    });

    return result;
  }

  // 2 to 4 Locked Colors: Fill missing slots by calculating hue gaps and complementary relationships
  const lockedHues = lockedDetails.map(d => d.details.hsl.h);
  const avgSat = Math.round(lockedDetails.reduce((acc, d) => acc + d.details.hsl.s, 0) / lockedDetails.length);
  const avgLight = Math.round(lockedDetails.reduce((acc, d) => acc + d.details.hsl.l, 0) / lockedDetails.length);

  colors.forEach((col, idx) => {
    if (col.locked) return;

    // Determine target hue for this unlocked slot based on surrounding locked colors or complementary angle
    let targetHue: number;
    if (lockedHues.length === 2) {
      // Complementary or triad offset from primary locked hues
      const h1 = lockedHues[0];
      const h2 = lockedHues[1];
      const midpoint = (h1 + h2) / 2;
      targetHue = (midpoint + (idx * 120)) % 360;
    } else {
      // Find maximum gap between locked hues
      const sortedHues = [...lockedHues].sort((a, b) => a - b);
      let maxGap = 0;
      let gapStart = sortedHues[0];
      for (let g = 0; g < sortedHues.length; g++) {
        const nextH = sortedHues[(g + 1) % sortedHues.length];
        const gap = nextH >= sortedHues[g] ? nextH - sortedHues[g] : (nextH + 360) - sortedHues[g];
        if (gap > maxGap) {
          maxGap = gap;
          gapStart = sortedHues[g];
        }
      }
      targetHue = (gapStart + maxGap / 2 + (idx * 25)) % 360;
    }

    // Varied lightness and saturation for dynamic balance
    const altL = (idx % 2 === 0) ? Math.max(15, avgLight - 20) : Math.min(85, avgLight + 25);
    const altS = Math.max(25, Math.min(95, avgSat + (idx % 2 === 0 ? 10 : -10)));

    const rgb = hslToRgb((targetHue + 360) % 360, altS, altL);
    result[idx] = rgbToHex(rgb.r, rgb.g, rgb.b);
  });

  return result;
}

// Skeleton for AI LLM Palette Generation (OpenAI / Vercel AI SDK Integration)
export async function generatePaletteFromPromptAI(
  prompt: string,
  existingColors: ColorItem[] = []
): Promise<string[]> {
  /*
   * ESQUELETO DE INTEGRAÇÃO COM LLM (OpenAI / Vercel AI SDK)
   * 
   * Exemplo de payload para OpenAI GPT-4o-mini ou Vercel AI SDK:
   * 
   * const response = await fetch('https://api.openai.com/v1/chat/completions', {
   *   method: 'POST',
   *   headers: {
   *     'Content-Type': 'application/json',
   *     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
   *   },
   *   body: JSON.stringify({
   *     model: 'gpt-4o-mini',
   *     messages: [
   *       {
   *         role: 'system',
   *         content: 'Você é um especialista em Design System e teoria das cores. Retorne estritamente um JSON com uma array de 5 códigos HEX perfeitos para o conceito fornecido.'
   *       },
   *       { role: 'user', content: `Conceito/Mood: "${prompt}"` }
   *     ],
   *     response_format: { type: "json_object" }
   *   })
   * });
   */

  // Simulação assíncrona local com fallback para o motor semântico HSL
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(convertPromptToPalette(prompt, existingColors));
    }, 300);
  });
}

// Color blindness simulation algorithms (Brettel, Vienot, Mollon 1997 / Machado 2009 approximation)
export type DeficiencyType = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

export function simulateColorBlindness(hex: string, type: DeficiencyType): string {
  if (type === 'normal') return hex;
  const { r, g, b } = hexToRgb(hex);

  // Linear sRGB conversion
  const toLinear = (c: number) => Math.pow(c / 255, 2.2);
  const toGamma = (c: number) => Math.min(255, Math.max(0, Math.round(Math.pow(c, 1 / 2.2) * 255)));

  const rLin = toLinear(r);
  const gLin = toLinear(g);
  const bLin = toLinear(b);

  let simR = rLin;
  let simG = gLin;
  let simB = bLin;

  switch (type) {
    case 'protanopia': // No red
      simR = 0.56667 * rLin + 0.43333 * gLin;
      simG = 0.55833 * rLin + 0.44167 * gLin;
      simB = 0.24167 * gLin + 0.75833 * bLin;
      break;
    case 'deuteranopia': // No green
      simR = 0.625 * rLin + 0.375 * gLin;
      simG = 0.700 * rLin + 0.300 * gLin;
      simB = 0.300 * gLin + 0.700 * bLin;
      break;
    case 'tritanopia': // No blue
      simR = 0.950 * rLin + 0.050 * gLin;
      simG = 0.43333 * gLin + 0.56667 * bLin;
      simB = 0.475 * gLin + 0.525 * bLin;
      break;
    case 'achromatopsia': { // Monochromacy
      const gray = 0.299 * rLin + 0.587 * gLin + 0.114 * bLin;
      simR = gray;
      simG = gray;
      simB = gray;
      break;
    }
  }

  return rgbToHex(toGamma(simR), toGamma(simG), toGamma(simB));
}

// Generate CSS Variables token string
export function exportCssTokens(colors: string[], prefix: string = 'color'): string {
  return `:root {\n` + colors.map((c, idx) => `  --${prefix}-${idx + 1}: ${c};`).join('\n') + `\n}`;
}

// Generate Tailwind Config snippet
export function exportTailwindConfig(colors: string[]): string {
  const entries = colors.map((c, idx) => `        'palette-${idx + 1}': '${c}',`).join('\n');
  return `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${entries}\n      }\n    }\n  }\n};`;
}

// Generate JSON Design Tokens
export function exportJsonTokens(colors: string[]): string {
  const tokens: Record<string, { value: string; type: string }> = {};
  colors.forEach((c, idx) => {
    tokens[`palette_${idx + 1}`] = {
      value: c,
      type: 'color'
    };
  });
  return JSON.stringify(tokens, null, 2);
}

// Generate SVG Palette Swatch
export function exportSvgSwatches(colors: string[], width: number = 800, height: number = 240): string {
  const colWidth = width / colors.length;
  const rects = colors.map((c, i) => {
    const x = i * colWidth;
    return `  <g>
    <rect x="${x}" y="0" width="${colWidth}" height="${height}" fill="${c}" />
    <text x="${x + colWidth / 2}" y="${height - 24}" font-family="monospace" font-size="14" font-weight="600" fill="${getColorDetails(c).isLight ? '#0B0F17' : '#FFFFFF'}" text-anchor="middle">${c}</text>
  </g>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${rects}
</svg>`;
}

function sampleImagePixels(ctx: CanvasRenderingContext2D, sampleSize: number): { r: number; g: number; b: number }[] {
  const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
  const pixels: { r: number; g: number; b: number }[] = [];

  for (let i = 0; i < imgData.length; i += 16) {
    if (imgData[i + 3] > 128) {
      pixels.push({ r: imgData[i], g: imgData[i + 1], b: imgData[i + 2] });
    }
  }
  return pixels;
}

function runKMeans(pixels: { r: number; g: number; b: number }[], colorCount: number): string[] {
  const step = Math.floor(pixels.length / colorCount);
  let centroids = Array.from({ length: colorCount }, (_, idx) => ({ ...pixels[idx * step] }));

  for (let iter = 0; iter < 5; iter++) {
    const clusters: { r: number; g: number; b: number }[][] = Array.from({ length: colorCount }, () => []);

    for (const p of pixels) {
      let minDist = Infinity;
      let closestIdx = 0;
      for (let k = 0; k < centroids.length; k++) {
        const c = centroids[k];
        const dist = (p.r - c.r) ** 2 + (p.g - c.g) ** 2 + (p.b - c.b) ** 2;
        if (dist < minDist) {
          minDist = dist;
          closestIdx = k;
        }
      }
      clusters[closestIdx].push(p);
    }

    centroids = centroids.map((c, idx) => {
      const cluster = clusters[idx];
      if (cluster.length === 0) return c;
      const sum = cluster.reduce((acc, curr) => ({ r: acc.r + curr.r, g: acc.g + curr.g, b: acc.b + curr.b }), { r: 0, g: 0, b: 0 });
      return {
        r: Math.round(sum.r / cluster.length),
        g: Math.round(sum.g / cluster.length),
        b: Math.round(sum.b / cluster.length)
      };
    });
  }

  const result = centroids.map(c => rgbToHex(c.r, c.g, c.b));
  result.sort((a, b) => getColorDetails(a).luminance - getColorDetails(b).luminance);
  return result;
}

// Quantize colors from HTML image element (K-Means simplified sampling)
export function extractPaletteFromImage(imgElement: HTMLImageElement, colorCount: number = 5): string[] {
  const defaultPalette = ['#0B1B2B', '#1E3A5F', '#08BBD9', '#FF2A85', '#E2E8F0'];
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return defaultPalette;
    }

    const sampleSize = 120;
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    ctx.drawImage(imgElement, 0, 0, sampleSize, sampleSize);

    const pixels = sampleImagePixels(ctx, sampleSize);
    if (pixels.length === 0) {
      return defaultPalette;
    }

    return runKMeans(pixels, colorCount);
  } catch (err) {
    console.warn('Canvas image sampling failed, falling back to preset', err);
    return defaultPalette;
  }
}

// -------------------------------------------------------------
// ILLUSTRATOR & SWATCHES EXPORTERS
// -------------------------------------------------------------

/**
 * Generate Illustrator JSX ExtendScript
 * Allows users to run File > Scripts > Other Script... in Illustrator
 * to immediately generate native swatches grouped by palette title.
 */
export function exportIllustratorScript(colors: string[], paletteTitle: string = 'Izy Colors Swatches'): string {
  const safeTitle = paletteTitle.replaceAll('"', String.raw`\"`);
  const colorItems = colors.map((hex, idx) => {
    const rgb = hexToRgb(hex);
    const details = getColorDetails(hex);
    const cmyk = details.cmyk;
    return `    {
      name: "${safeTitle} - ${hex} (Token ${idx + 1})",
      hex: "${hex}",
      r: ${rgb.r},
      g: ${rgb.g},
      b: ${rgb.b},
      c: ${cmyk.c},
      m: ${cmyk.m},
      y: ${cmyk.y},
      k: ${cmyk.k}
    }`;
  }).join(',\n');

  return `/**
 * IZY COLORS - ILLUSTRATOR SWATCH SCRIPT
 * Paleta: "${safeTitle}" (${colors.length} Cores)
 * 
 * INSTRUÇÕES NO ILLUSTRATOR:
 * 1. Abra o Illustrator
 * 2. Acesse: Arquivo > Scripts > Outro Script... (File > Scripts > Other Script...)
 * 3. Selecione este arquivo .jsx
 * 4. O grupo de amostras "${safeTitle}" será criado no painel de Amostras (Swatches)!
 */

#target illustrator

(function() {
  if (app.documents.length === 0) {
    app.documents.add(DocumentColorSpace.RGB);
  }

  var doc = app.activeDocument;
  var groupName = "${safeTitle}";
  var targetGroup = null;

  // Procura se o grupo já existe
  for (var g = 0; g < doc.swatchGroups.length; g++) {
    if (doc.swatchGroups[g].name === groupName) {
      targetGroup = doc.swatchGroups[g];
      break;
    }
  }

  // Se não existir, cria o novo grupo
  if (!targetGroup) {
    targetGroup = doc.swatchGroups.add();
    targetGroup.name = groupName;
  }

  var colorDefinitions = [
${colorItems}
  ];

  var createdCount = 0;

  for (var i = 0; i < colorDefinitions.length; i++) {
    var item = colorDefinitions[i];
    var swatchName = item.name;

    // Remove amostra anterior com mesmo nome para evitar duplicata
    try {
      var existing = doc.swatches.getByName(swatchName);
      if (existing) {
        existing.remove();
      }
    } catch(e) {}

    // Cria nova amostra RGB
    var newSwatch = doc.swatches.add();
    newSwatch.name = swatchName;

    var rgbColor = new RGBColor();
    rgbColor.red = item.r;
    rgbColor.green = item.g;
    rgbColor.blue = item.b;

    newSwatch.color = rgbColor;

    try {
      targetGroup.addSwatch(newSwatch);
      createdCount++;
    } catch(err) {
      // Swatch adicionada ao painel global
    }
  }

  alert("Izy Colors: " + createdCount + " amostras foram importadas com sucesso para o grupo '" + groupName + "' no Illustrator!");
})();
`;
}

/**
 * Generate binary Swatch Exchange (.ase) file
 * Compatible with Illustrator, Photoshop, InDesign, and Figma plugins.
 */
export function generateAseBlob(colors: string[], paletteTitle: string = 'Izy Colors'): Blob {
  // Swatch Exchange format:

  // Helper to push uint16 big-endian
  const pushU16 = (val: number, arr: number[]) => {
    arr.push((val >> 8) & 0xff, val & 0xff);
  };

  // Helper to push uint32 big-endian
  const pushU32 = (val: number, arr: number[]) => {
    arr.push((val >> 24) & 0xff, (val >> 16) & 0xff, (val >> 8) & 0xff, val & 0xff);
  };

  // Helper to push IEEE 754 32-bit float big-endian
  const pushFloat32 = (val: number, arr: number[]) => {
    const fBuf = new ArrayBuffer(4);
    const fView = new DataView(fBuf);
    fView.setFloat32(0, val, false); // false = big-endian
    arr.push(fView.getUint8(0), fView.getUint8(1), fView.getUint8(2), fView.getUint8(3));
  };

  // Helper to encode string to UTF-16BE with null terminator
  const encodeUtf16BE = (str: string): number[] => {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      const code = str.codePointAt(i) ?? 0;
      bytes.push((code >> 8) & 0xff, code & 0xff);
    }
    // Null terminator (2 bytes 0x00, 0x00)
    bytes.push(0x00, 0x00);
    return bytes;
  };

  const headerBytes: number[] = [
    0x41, 0x53, 0x45, 0x46, // 'ASEF'
    0x00, 0x01,             // Major version 1
    0x00, 0x00              // Minor version 0
  ];
  pushU32(colors.length, headerBytes); // Number of blocks

  const bodyBytes: number[] = [];

  colors.forEach((hex, idx) => {
    const colorName = `${paletteTitle} ${idx + 1} (${hex})`;
    const nameBytes = encodeUtf16BE(colorName);
    const nameLengthInChars = colorName.length + 1;

    const blockData: number[] = [];
    pushU16(nameLengthInChars, blockData);
    blockData.push(...nameBytes, 0x52, 0x47, 0x42, 0x20);

    const rgb = hexToRgb(hex);
    pushFloat32(rgb.r / 255, blockData);
    pushFloat32(rgb.g / 255, blockData);
    pushFloat32(rgb.b / 255, blockData);

    // Swatch type: 0 = Global Swatch (standard in Illustrator)
    pushU16(0x0000, blockData);

    // Block header: type 0x0001 (color), length uint32
    pushU16(0x0001, bodyBytes);
    pushU32(blockData.length, bodyBytes);
    bodyBytes.push(...blockData);
  });

  const fullData = new Uint8Array([...headerBytes, ...bodyBytes]);
  return new Blob([fullData], { type: 'application/octet-stream' });
}

// WCAG quick summary statuses used by the WorkflowDock accessibility badge
export type WcagSummaryStatus = 'pass' | 'warning' | 'fail';

export interface WcagSummary {
  status: WcagSummaryStatus;
  label: string;
  detail: string;
}

// Compute a quick WCAG 2.1 compliance signal for a palette without running the full audit.
// Green ("pass") when every color is text-safe against white or black (>= 4.5:1) and the
// worst adjacent pair reaches the 3.0:1 UI threshold. Otherwise amber ("warning") for a
// pending contrast check, or red ("fail") when adjacent pairs drop below 2.0:1.
export function computeWcagSummary(colors: string[]): WcagSummary {
  if (!colors || colors.length < 2) {
    return {
      status: 'warning',
      label: 'Contraste pendente',
      detail: 'Adicione ao menos 2 cores para auditar'
    };
  }

  let minAdjacent = Number.POSITIVE_INFINITY;
  for (let i = 0; i < colors.length - 1; i++) {
    const ratio = getContrastRatio(colors[i], colors[i + 1]);
    if (ratio < minAdjacent) minAdjacent = ratio;
  }

  let allTextSafe = true;
  for (const hex of colors) {
    const best = Math.max(getContrastRatio(hex, '#FFFFFF'), getContrastRatio(hex, '#000000'));
    if (best < 4.5) allTextSafe = false;
  }

  if (allTextSafe && minAdjacent >= 3.0) {
    return {
      status: 'pass',
      label: 'WCAG AA Aprovado',
      detail: `Menor contraste adjacente ${minAdjacent.toFixed(1)}:1`
    };
  }

  if (minAdjacent >= 2.0) {
    return {
      status: 'warning',
      label: 'Contraste pendente',
      detail: `Menor contraste adjacente ${minAdjacent.toFixed(1)}:1 — ajuste pares para AA`
    };
  }

  return {
    status: 'fail',
    label: 'Contraste insuficiente',
    detail: `Menor contraste adjacente ${minAdjacent.toFixed(1)}:1`
  };
}
