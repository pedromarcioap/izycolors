import React, { useEffect, useRef, useState } from 'react';
import {
    Sparkles,
    X,
    Link2,
    Plus,
    Trash2,
    ImagePlus,
    UploadCloud,
    Loader2,
    Check,
    AlertTriangle
} from 'lucide-react';
import {
    generateAiArticle,
    AiArticleResponse,
    AiArticleReference,
    ArticleTone,
    ArticleLength
} from '../services/aiArticleService';

interface ArticleAiAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (result: AiArticleResponse) => void;
}

interface PendingImage {
    id: string;
    name: string;
    mimeType: string;
    base64: string;
}

type GenerationPhase = 'idle' | 'analyzing' | 'writing' | 'success';

const TONE_OPTIONS: ArticleTone[] = ['Técnico', 'Analítico', 'Didático'];
const LENGTH_OPTIONS: ArticleLength[] = ['Curto', 'Médio', 'Longo'];

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGES = 6;
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const newId = (prefix: string): string =>
    `${prefix}-${Date.now()}-${crypto.randomUUID()}`;

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            resolve({ base64, mimeType: file.type || 'image/png' });
        };
        reader.onerror = () => reject(new Error('Falha ao ler a imagem.'));
        reader.readAsDataURL(file);
    });
}

const StepIndicator: React.FC<{ active: boolean; done: boolean; label: string }> = ({
    active,
    done,
    label
}) => {
    let dotClassName = 'bg-white/[0.04] border-white/10 text-[#64748B]';
    let labelClassName = 'text-[#64748B]';
    let icon: React.ReactNode = null;

    if (done) {
        dotClassName = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400';
        labelClassName = 'text-emerald-400';
        icon = <Check className="w-2.5 h-2.5" />;
    } else if (active) {
        dotClassName = 'bg-[#6366F1]/20 border-[#6366F1]/50 text-[#06B6D4]';
        labelClassName = 'text-white';
        icon = <Loader2 className="w-2.5 h-2.5 animate-spin" />;
    }

    return (
        <div className="flex items-center gap-1.5">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center border text-[9px] ${dotClassName}`}>
                {icon}
            </span>
            <span className={`text-[10px] font-mono ${labelClassName}`}>
                {label}
            </span>
        </div>
    );
};

export const ArticleAiAssistantModal: React.FC<ArticleAiAssistantModalProps> = ({
    isOpen,
    onClose,
    onApply
}) => {
    const [theme, setTheme] = useState('');
    const [thesis, setThesis] = useState('');
    const [references, setReferences] = useState<AiArticleReference[]>([
        { id: newId('ref'), value: '' }
    ]);
    const [images, setImages] = useState<PendingImage[]>([]);
    const [tone, setTone] = useState<ArticleTone>('Técnico');
    const [length, setLength] = useState<ArticleLength>('Médio');

    const [phase, setPhase] = useState<GenerationPhase>('idle');
    const [error, setError] = useState<string | null>(null);
    const [generatedTitle, setGeneratedTitle] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset the form whenever the modal is closed.
    useEffect(() => {
        if (!isOpen) {
            setTheme('');
            setThesis('');
            setReferences([{ id: newId('ref'), value: '' }]);
            setImages([]);
            setTone('Técnico');
            setLength('Médio');
            setPhase('idle');
            setError(null);
            setGeneratedTitle(null);
            setIsDragging(false);
        }
    }, [isOpen]);

    // Close on Escape (only when not busy generating).
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && phase !== 'analyzing' && phase !== 'writing') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, phase, onClose]);

    const canGenerate =
        theme.trim().length > 0 ||
        thesis.trim().length > 0 ||
        references.some(ref => ref.value.trim().length > 0);

    const isBusy = phase === 'analyzing' || phase === 'writing';

    const updateReference = (id: string, value: string) => {
        setReferences(prev => prev.map(ref => (ref.id === id ? { ...ref, value } : ref)));
    };

    const addReference = () => {
        setReferences(prev => [...prev, { id: newId('ref'), value: '' }]);
    };

    const removeReference = (id: string) => {
        setReferences(prev => (prev.length > 1 ? prev.filter(ref => ref.id !== id) : prev));
    };

    const removeImage = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    const addFiles = async (incoming: File[]) => {
        const newImages: PendingImage[] = [];
        const errors: string[] = [];

        for (const file of incoming) {
            if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
                errors.push(`"${file.name}" não é uma imagem válida (use JPEG, PNG, WebP ou GIF).`);
                continue;
            }
            if (file.size > MAX_IMAGE_SIZE_BYTES) {
                errors.push(`"${file.name}" excede o limite de 4 MB.`);
                continue;
            }
            if (images.length + newImages.length >= MAX_IMAGES) {
                errors.push('Limite de 6 imagens atingido.');
                break;
            }
            try {
                const { base64, mimeType } = await fileToBase64(file);
                newImages.push({
                    id: newId('img'),
                    name: file.name,
                    mimeType,
                    base64
                });
            } catch {
                errors.push(`Falha ao ler "${file.name}".`);
            }
        }

        if (newImages.length > 0) {
            setImages(prev => [...prev, ...newImages]);
        }
        if (errors.length > 0) {
            setError(errors.join(' '));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        void addFiles(files);
        e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        // Only clear the dragging state when the pointer actually leaves the
        // dropzone, not when it crosses over child elements.
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files || []);
        if (files.length > 0) {
            void addFiles(files);
        }
    };

    const handleGenerate = async (e?: React.SyntheticEvent<HTMLFormElement>) => {
        if (e) e.preventDefault();
        if (isBusy || !canGenerate) return;

        setError(null);
        setPhase('analyzing');

        try {
            const analyzeDelay = delay(2200);
            const request = generateAiArticle({
                theme: theme.trim(),
                thesis: thesis.trim(),
                references: references.filter(ref => ref.value.trim().length > 0),
                images,
                tone,
                length
            });

            await analyzeDelay;
            setPhase('writing');
            const result = await request;

            setGeneratedTitle(result.title);
            setPhase('success');
            await delay(700);

            onApply(result);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha ao gerar o artigo. Tente novamente.');
            setPhase('idle');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-[#181C24] border border-white/[0.12] rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto relative">
                {/* Subtle top glow */}
                <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#6366F1] to-transparent opacity-70" />

                {/* Header */}
                <div className="sticky top-0 bg-[#181C24]/95 backdrop-blur-md border-b border-white/[0.08] px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6366F1]/20 to-[#06B6D4]/20 border border-[#6366F1]/30 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-[#06B6D4]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white font-['Geist']">
                                Assistente Editorial IA
                            </h3>
                            <p className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider">
                                Criação semiautomatizada de artigos
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isBusy}
                        className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Fechar (Esc)"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {isBusy && (
                    /* ------------------------- LOADING STATE ------------------------- */
                    <div className="px-6 py-12 flex flex-col items-center justify-center gap-6">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6366F1]/20 to-[#06B6D4]/20 border border-[#6366F1]/30 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-[#06B6D4] animate-spin" />
                            </div>
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#06B6D4] animate-ping" />
                        </div>

                        <div className="text-center">
                            <p className="text-sm font-semibold text-white font-['Geist']">
                                {phase === 'analyzing' ? 'Analisando imagens e referências...' : 'Redigindo artigo...'}
                            </p>
                            <p className="text-xs text-[#94A3B8] mt-1 max-w-sm leading-relaxed">
                                {phase === 'analyzing'
                                    ? 'Extraindo dados visuais, gráficos e insights dos insumos fornecidos.'
                                    : 'Estruturando título, SEO e conteúdo em Markdown para publicação.'}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <StepIndicator
                                active={phase === 'analyzing'}
                                done={phase === 'writing'}
                                label="Análise"
                            />
                            <div className="w-8 h-px bg-white/10" />
                            <StepIndicator active={phase === 'writing'} done={false} label="Redação" />
                        </div>

                        <div className="w-full max-w-sm space-y-2.5">
                            <div className="h-3 rounded bg-white/10 animate-pulse" />
                            <div className="h-3 rounded bg-white/10 animate-pulse w-3/4" />
                            <div className="h-3 rounded bg-white/10 animate-pulse w-1/2" />
                            <div className="h-3 rounded bg-white/10 animate-pulse w-2/3" />
                        </div>
                    </div>
                )}
                {!isBusy && phase === 'success' && (
                    /* ------------------------- SUCCESS STATE ------------------------- */
                    <div className="px-6 py-14 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
                            <Check className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white font-['Geist']">
                                Artigo gerado com sucesso
                            </p>
                            <p className="text-xs text-[#94A3B8] mt-1 max-w-md leading-relaxed">
                                Preenchendo o formulário do CMS com{' '}
                                <span className="text-[#DFE2EE] font-mono">"{generatedTitle}"</span>...
                            </p>
                        </div>
                    </div>
                )}
                {!isBusy && phase !== 'success' && (
                    /* ------------------------- FORM STATE ------------------------- */
                    <form onSubmit={handleGenerate} className="px-6 py-5 space-y-5">
                        {error && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs leading-relaxed">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Tema central e tese */}
                        <div className="space-y-3">
                            <div>
                                <label htmlFor="ai-theme" className="text-xs font-mono text-[#94A3B8] block mb-1">
                                    Tema Central
                                </label>
                                <input
                                    id="ai-theme"
                                    type="text"
                                    placeholder="Ex: Contrastes acessíveis em interfaces dark mode"
                                    value={theme}
                                    onChange={e => setTheme(e.target.value)}
                                    className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#6366F1]"
                                />
                            </div>

                            <div>
                                <label htmlFor="ai-thesis" className="text-xs font-mono text-[#94A3B8] block mb-1">
                                    Tese & Diretrizes do Autor
                                </label>
                                <textarea
                                    id="ai-thesis"
                                    rows={3}
                                    placeholder="Descreva as ideias principais, o argumento central e o que o artigo deve provar ou ensinar..."
                                    value={thesis}
                                    onChange={e => setThesis(e.target.value)}
                                    className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#6366F1] resize-y"
                                />
                            </div>
                        </div>

                        {/* Links e referências */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-mono text-[#94A3B8] flex items-center gap-1.5">
                                    <Link2 className="w-3.5 h-3.5 text-[#06B6D4]" />
                                    Links & Referências
                                </label>
                                <button
                                    type="button"
                                    onClick={addReference}
                                    className="h-7 px-2.5 rounded-lg bg-[#262A33] hover:bg-[#31353E] border border-white/[0.08] text-[#DFE2EE] text-[11px] font-medium flex items-center gap-1 transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                    Adicionar
                                </button>
                            </div>
                            <div className="space-y-2">
                                {references.map(ref => (
                                    <div key={ref.id} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Cole uma URL ou um trecho/transcrição..."
                                            value={ref.value}
                                            onChange={e => updateReference(ref.id, e.target.value)}
                                            className="flex-1 bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#6366F1]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeReference(ref.id)}
                                            disabled={references.length <= 1}
                                            className="p-2 rounded-lg text-[#64748B] hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Remover referência"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Upload de imagens */}
                        <div>
                            <label className="text-xs font-mono text-[#94A3B8] flex items-center gap-1.5 mb-2">
                                <ImagePlus className="w-3.5 h-3.5 text-[#06B6D4]" />
                                Upload de Imagens (análise multimodal)
                            </label>

                            <label
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`cursor-pointer rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 transition-all ${isDragging
                                    ? 'border-[#06B6D4] bg-[#06B6D4]/5'
                                    : 'border-white/15 hover:border-white/30 hover:bg-white/[0.02]'
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    aria-label="Enviar imagens"
                                    className="sr-only"
                                    onChange={handleInputChange}
                                />
                                <UploadCloud className={`w-6 h-6 ${isDragging ? 'text-[#06B6D4]' : 'text-[#64748B]'}`} />
                                <p className="text-xs text-[#94A3B8] text-center">
                                    Arraste capturas de tela, gráficos ou diagramas, ou{' '}
                                    <span className="text-[#06B6D4] font-medium">clique para selecionar</span>
                                </p>
                                <p className="text-[10px] font-mono text-[#64748B]">
                                    JPEG · PNG · WebP · GIF — até 4 MB cada (máx. {MAX_IMAGES})
                                </p>
                            </label>

                            {images.length > 0 && (
                                <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
                                    {images.map(img => (
                                        <div
                                            key={img.id}
                                            className="relative group rounded-lg overflow-hidden border border-white/10 aspect-square bg-[#111827]"
                                        >
                                            <img
                                                src={`data:${img.mimeType};base64,${img.base64}`}
                                                alt={img.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(img.id)}
                                                className="absolute top-1 right-1 p-1 rounded bg-black/70 text-white/80 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title={`Remover ${img.name}`}
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Estilo e formato */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="ai-tone" className="text-xs font-mono text-[#94A3B8] block mb-1">
                                    Tom de Voz
                                </label>
                                <select
                                    id="ai-tone"
                                    value={tone}
                                    onChange={e => setTone(e.target.value as ArticleTone)}
                                    className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                                >
                                    {TONE_OPTIONS.map(option => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="ai-length" className="text-xs font-mono text-[#94A3B8] block mb-1">
                                    Extensão do Conteúdo
                                </label>
                                <select
                                    id="ai-length"
                                    value={length}
                                    onChange={e => setLength(e.target.value as ArticleLength)}
                                    className="w-full bg-[#111827] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                                >
                                    {LENGTH_OPTIONS.map(option => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-2 pt-1 pb-1">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-2 rounded-lg text-xs text-[#94A3B8] hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={!canGenerate}
                                className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#06B6D4] hover:opacity-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                Gerar Artigo com IA
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
