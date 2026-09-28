import React from 'react';
import {
    Sparkles,
    SlidersHorizontal,
    ShieldCheck,
    Download,
    Bookmark,
    ChevronRight,
    Palette as PaletteIcon
} from 'lucide-react';
import { StudioStage } from '../types';
import { computeWcagSummary, WcagSummary } from '../utils/colorUtils';

interface WorkflowDockProps {
    colors: string[];
    activeStage: StudioStage;
    onStageChange: (stage: StudioStage) => void;
    onSave: () => void;
    onExport: () => void;
    isSidebarExpanded: boolean;
}

interface StageDefinition {
    id: StudioStage;
    index: number;
    label: string;
    subLabel: string;
    icon: React.ElementType;
}

const STAGES: StageDefinition[] = [
    { id: 'generate', index: 1, label: 'Criar', subLabel: 'Gerar & Extrair', icon: Sparkles },
    { id: 'refine', index: 2, label: 'Refinar', subLabel: 'Roda & Lab', icon: SlidersHorizontal },
    { id: 'audit', index: 3, label: 'Auditar', subLabel: 'WCAG', icon: ShieldCheck },
    { id: 'export', index: 4, label: 'Salvar/Exportar', subLabel: 'Tokens', icon: Download }
];

const getContextualAction = (stage: StudioStage): { label: string; target: StudioStage } | null => {
    switch (stage) {
        case 'generate':
            return { label: 'Refinar Cores →', target: 'refine' };
        case 'refine':
            return { label: 'Validar Acessibilidade →', target: 'audit' };
        case 'audit':
            return { label: 'Salvar / Exportar →', target: 'export' };
        case 'export':
            return null;
    }
};

const getBadgeClasses = (summary: WcagSummary): string => {
    switch (summary.status) {
        case 'pass':
            return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
        case 'fail':
            return 'bg-rose-500/15 text-rose-400 border-rose-500/40';
        default:
            return 'bg-amber-500/15 text-amber-300 border-amber-400/40';
    }
};

export const WorkflowDock: React.FC<WorkflowDockProps> = ({
    colors,
    activeStage,
    onStageChange,
    onSave,
    onExport,
    isSidebarExpanded
}) => {
    const summary = computeWcagSummary(colors);
    const contextual = getContextualAction(activeStage);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#0D111A]/95 backdrop-blur-md border-t border-white/[0.08] shadow-[0_-8px_30px_rgba(0,0,0,0.45)] select-none">
            <div
                className={`h-16 flex items-center justify-between gap-4 px-4 sm:px-6 transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'pl-64' : 'pl-16'
                    }`}
            >
                {/* Active Palette Thumbnail */}
                <div className="flex items-center gap-3 shrink-0 min-w-0">
                    <div className="flex items-center gap-1.5 text-[#64748B]">
                        <PaletteIcon className="w-3.5 h-3.5" />
                        <span className="hidden md:inline text-[10px] font-mono uppercase tracking-wider">Paleta Ativa</span>
                    </div>
                    <div className="flex h-8 rounded-lg overflow-hidden border border-white/10 shadow-inner">
                        {colors.map((hex, i) => (
                            <div
                                key={`${hex}-${i}`}
                                className="w-7 sm:w-9 h-full cursor-pointer transition-transform hover:scale-110 relative group"
                                style={{ backgroundColor: hex }}
                                title={hex}
                            >
                                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold opacity-0 group-hover:opacity-100 bg-black/60 text-white transition-opacity">
                                    {hex}
                                </span>
                            </div>
                        ))}
                    </div>
                    <span className="hidden sm:inline text-[10px] font-mono text-[#64748B]">{colors.length} cores</span>
                </div>

                {/* Sequential Stage Buttons */}
                <div className="flex items-center gap-1 bg-[#141A24] border border-white/[0.08] rounded-xl p-1">
                    {STAGES.map((stage, idx) => {
                        const Icon = stage.icon;
                        const isActive = activeStage === stage.id;
                        const isNext = STAGES[STAGES.findIndex(s => s.id === activeStage) + 1]?.id === stage.id;
                        return (
                            <div key={stage.id} className="flex items-center">
                                {idx > 0 && <div className="w-px h-6 bg-white/[0.08] mx-1" />}
                                <button
                                    onClick={() => {
                                        onStageChange(stage.id);
                                        if (stage.id === 'export') onSave();
                                    }}
                                    className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer group ${isActive
                                            ? 'bg-[#6366F1] text-white shadow-md shadow-indigo-600/30'
                                            : isNext
                                                ? 'bg-white/[0.04] text-white hover:bg-white/[0.08]'
                                                : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
                                        }`}
                                    title={`${stage.index}. ${stage.label} — ${stage.subLabel}`}
                                >
                                    <span
                                        className={`w-4 h-4 rounded-full text-[10px] font-mono font-bold flex items-center justify-center ${isActive ? 'bg-white/20 text-white' : 'bg-[#262A33] text-[#06B6D4]'
                                            }`}
                                    >
                                        {stage.index}
                                    </span>
                                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#94A3B8] group-hover:text-[#06B6D4]'}`} />
                                    <span className="hidden sm:flex flex-col items-start leading-none">
                                        <span className="text-[11px] font-semibold">{stage.label}</span>
                                        <span className={`text-[9px] font-mono mt-0.5 ${isActive ? 'text-white/70' : 'text-[#64748B]'}`}>
                                            {stage.subLabel}
                                        </span>
                                    </span>
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* WCAG Quick Badge + Contextual Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <div
                        className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-mono font-semibold ${getBadgeClasses(summary)}`}
                        title={summary.detail}
                    >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{summary.label}</span>
                    </div>

                    <button
                        onClick={onExport}
                        className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#181C24] hover:bg-[#262A33] border border-white/[0.08] text-xs text-[#DFE2EE] transition-colors cursor-pointer"
                        title="Exportar tokens (.jsx / .ase / CSS / Tailwind / JSON / SVG)"
                    >
                        <Download className="w-3.5 h-3.5 text-[#06B6D4]" />
                        <span>Exportar</span>
                    </button>

                    <button
                        onClick={onSave}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#262A33] hover:bg-[#31353E] border border-white/[0.08] text-xs text-white transition-colors cursor-pointer"
                        title="Salvar a paleta ativa no Cofre, Projeto ou Coleção"
                    >
                        <Bookmark className="w-3.5 h-3.5 text-[#06B6D4]" />
                        <span className="hidden sm:inline">Salvar</span>
                    </button>

                    {contextual && (
                        <button
                            onClick={() => onStageChange(contextual.target)}
                            className="hidden lg:flex items-center gap-1 h-8 px-3 rounded-lg bg-[#6366F1]/15 hover:bg-[#6366F1]/25 border border-[#6366F1]/40 text-[#C7D2FE] text-xs font-semibold transition-colors cursor-pointer"
                            title={`Avançar para a etapa ${contextual.target}`}
                        >
                            <span>{contextual.label}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
