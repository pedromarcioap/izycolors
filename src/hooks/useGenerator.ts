import { useState, useCallback, useEffect } from 'react';
import { ColorItem } from '../types';
import {
  generateRandomHarmoniousPalette,
  generateHarmonies,
  generateSeedBasedPalette,
  convertPromptToPalette,
  getColorDetails,
  hslToRgb,
  rgbToHex
} from '../utils/colorUtils';

const getRandomNumber = (): number => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] / (0xFFFFFFFF + 1);
};

export interface UseGeneratorOptions {
  initialColors?: string[];
}

export function useGenerator(options: UseGeneratorOptions = {}) {
  const { initialColors } = options;

  const [colors, setColors] = useState<ColorItem[]>(() => {
    const seed = initialColors && initialColors.length > 0
      ? initialColors
      : ['#0E1726', '#08BBD9', '#3B82F6', '#9354F5', '#FF2A85'];
    return seed.map((hex, i) => ({
      id: `col-${i}-${Date.now()}`,
      hex: hex.toUpperCase(),
      name: `Color ${i + 1}`,
      locked: false
    }));
  });

  const [moodKeyword, setMoodKeyword] = useState<string>('');
  const [harmonyMode, setHarmonyMode] = useState<string>('smart');
  const [activeFormat, setActiveFormat] = useState<'HEX' | 'RGB' | 'HSL' | 'OKLCH'>('HEX');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Undo / Redo history state
  const [history, setHistory] = useState<ColorItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // Sync initial colors if passed from outside (e.g., when opening a saved palette)
  useEffect(() => {
    if (initialColors && initialColors.length > 0) {
      setColors(initialColors.map((hex, i) => ({
        id: `col-${i}-${Date.now()}`,
        hex: hex.toUpperCase(),
        name: `Color ${i + 1}`,
        locked: false
      })));
    }
  }, [initialColors]);

  // Compute currently locked colors
  const lockedColors = colors.filter(c => c.locked);

  // Unified generation function taking seed colors, mood keywords & harmony rules into account
  const generatePalette = useCallback((overrideMood?: string) => {
    const activeMood = overrideMood !== undefined ? overrideMood : moodKeyword;

    setColors(prev => {
      let newHexes: string[] = [];

      if (activeMood && activeMood.trim().length > 0) {
        // Text-to-Palette semantic generation
        newHexes = convertPromptToPalette(activeMood, prev);
      } else {
        const lockedCount = prev.filter(c => c.locked).length;
        if (lockedCount > 0) {
          // Seed-based chromatic harmony generation
          newHexes = generateSeedBasedPalette(prev, harmonyMode);
        } else if (harmonyMode === 'smart') {
          newHexes = generateRandomHarmoniousPalette(prev.length);
        } else {
          const baseH = Math.floor(getRandomNumber() * 360);
          newHexes = generateHarmonies(baseH, prev.length, harmonyMode);
        }
      }

      // Save current state to history
      setHistory(h => [...h.slice(0, historyIndex + 1), prev]);
      setHistoryIndex(i => i + 1);

      return prev.map((item, idx) => {
        if (item.locked) return item;
        return {
          ...item,
          hex: (newHexes[idx] || rgbToHex(getRandomNumber() * 255, getRandomNumber() * 255, getRandomNumber() * 255)).toUpperCase()
        };
      });
    });
  }, [moodKeyword, harmonyMode, historyIndex]);

  // Set new mood keyword and immediately generate matching colors
  const setMoodAndGenerate = useCallback((keyword: string) => {
    setMoodKeyword(keyword);
    generatePalette(keyword);
  }, [generatePalette]);

  // Clear mood prompt
  const clearMood = useCallback(() => {
    setMoodKeyword('');
  }, []);

  // Toggle lock on column
  const toggleLock = useCallback((index: number) => {
    setColors(prev => prev.map((col, i) => {
      if (i === index) {
        const nextLocked = !col.locked;
        if (nextLocked && editingIndex === index) {
          setEditingIndex(null);
        }
        return { ...col, locked: nextLocked };
      }
      return col;
    }));
  }, [editingIndex]);

  // Move column position
  const moveColumn = useCallback((index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    setColors(prev => {
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  }, []);

  // Add column
  const addColumn = useCallback((atIndex: number) => {
    setColors(prev => {
      if (prev.length >= 8) {
        showToast('Limite de 8 colunas atingido.');
        return prev;
      }
      const leftHex = prev[atIndex].hex;
      const details = getColorDetails(leftHex);
      const nextH = (details.hsl.h + 30) % 360;
      const rgb = hslToRgb(nextH, details.hsl.s, details.hsl.l);
      const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);

      const next = [...prev];
      next.splice(atIndex + 1, 0, {
        id: `col-${Date.now()}-${getRandomNumber()}`,
        hex: newHex,
        name: `Color ${next.length + 1}`,
        locked: false
      });
      return next;
    });
  }, [showToast]);

  // Delete column
  const deleteColumn = useCallback((index: number) => {
    setColors(prev => {
      if (prev.length <= 2) {
        showToast('A paleta deve conter no mínimo 2 cores.');
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
    setEditingIndex(prev => prev === index ? null : prev);
  }, [showToast]);

  // Update specific color from picker
  const handleColorUpdate = useCallback((index: number, newHex: string) => {
    setColors(prev => prev.map((col, i) => {
      if (i === index) {
        if (col.locked) return col;
        return { ...col, hex: newHex.toUpperCase() };
      }
      return col;
    }));
  }, []);

  // Copy color code
  const copyColor = useCallback((index: number, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
    showToast(`Copiado: ${val}`);
  }, [showToast]);

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
    if (historyIndex >= 0) {
      const targetState = history[historyIndex];
      setColors(targetState);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setColors(history[nextIndex]);
      setHistoryIndex(nextIndex);
    }
  }, [history, historyIndex]);

  return {
    colors,
    setColors,
    lockedColors,
    moodKeyword,
    setMoodKeyword,
    setMoodAndGenerate,
    clearMood,
    harmonyMode,
    setHarmonyMode,
    activeFormat,
    setActiveFormat,
    editingIndex,
    setEditingIndex,
    copiedIndex,
    isFullscreen,
    setIsFullscreen,
    isFocusMode,
    setIsFocusMode,
    toastMessage,
    showToast,
    historyIndex,
    historyLength: history.length,
    generatePalette,
    toggleLock,
    moveColumn,
    addColumn,
    deleteColumn,
    handleColorUpdate,
    copyColor,
    handleUndo,
    handleRedo
  };
}
