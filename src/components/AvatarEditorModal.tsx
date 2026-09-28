import React, { useEffect, useRef, useState } from 'react';
import {
    AlertTriangle,
    Camera,
    ImagePlus,
    Loader2,
    Trash2,
    X
} from 'lucide-react';
import { getAvatarFileError } from '../services/avatarService';

interface AvatarEditorModalProps {
    isOpen: boolean;
    currentAvatar: string;
    userName: string;
    onClose: () => void;
    onSaveAvatar: (file: File) => Promise<void>;
    onRemoveAvatar: () => Promise<void>;
}

type BusyState = 'idle' | 'saving' | 'removing';

export const AvatarEditorModal: React.FC<AvatarEditorModalProps> = ({
    isOpen,
    currentAvatar,
    userName,
    onClose,
    onSaveAvatar,
    onRemoveAvatar
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState<BusyState>('idle');
    const [confirmRemove, setConfirmRemove] = useState(false);

    // Reset internal state and move focus into the dialog whenever it opens.
    useEffect(() => {
        if (!isOpen) return;

        setSelectedFile(null);
        setPreviewUrl(null);
        setError(null);
        setBusy('idle');
        setConfirmRemove(false);

        const dialog = dialogRef.current;
        if (dialog && !dialog.open) {
            dialog.showModal();
        }

        const focusTimer = window.setTimeout(() => {
            closeButtonRef.current?.focus();
        }, 0);

        return () => window.clearTimeout(focusTimer);
    }, [isOpen]);

    // Revoke the object URL when it changes or when the component unmounts.
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // Close on Escape (only while idle, so an in-flight operation is never lost).
    // A modal <dialog> fires a cancelable `cancel` event when Escape is pressed;
    // prevent the native close and let React own the open state.
    useEffect(() => {
        if (!isOpen) return;

        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleCancel = (event: Event) => {
            event.preventDefault();
            if (busy === 'idle') {
                onClose();
            }
        };

        dialog.addEventListener('cancel', handleCancel);
        return () => dialog.removeEventListener('cancel', handleCancel);
    }, [isOpen, busy, onClose]);

    if (!isOpen) return null;

    const isBusy = busy !== 'idle';

    const clearSelection = () => {
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setConfirmRemove(false);
    };

    const handleSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        // Allow re-selecting the same file after a failed attempt.
        event.target.value = '';

        if (!file) return;

        setError(null);
        setConfirmRemove(false);

        const validationError = getAvatarFileError(file);
        if (validationError) {
            setSelectedFile(null);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }
            setError(validationError);
            return;
        }

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleConfirm = async () => {
        if (!selectedFile || isBusy) return;

        setError(null);
        setBusy('saving');

        try {
            await onSaveAvatar(selectedFile);
            clearSelection();
            onClose();
        } catch (err: unknown) {
            const message =
                err instanceof Error && err.message
                    ? err.message
                    : 'Falha ao atualizar o avatar. Tente novamente.';
            setError(message);
            setBusy('idle');
        }
    };

    const handleRemove = async () => {
        if (isBusy) return;

        if (!confirmRemove) {
            setError(null);
            setConfirmRemove(true);
            return;
        }

        setError(null);
        setBusy('removing');

        try {
            await onRemoveAvatar();
            clearSelection();
            onClose();
        } catch (err: unknown) {
            const message =
                err instanceof Error && err.message
                    ? err.message
                    : 'Falha ao remover o avatar. Tente novamente.';
            setError(message);
            setBusy('idle');
        }
    };

    const previewSrc = previewUrl || currentAvatar;

    return (
        <dialog
            ref={dialogRef}
            className="fixed inset-0 z-[60] m-0 h-full w-full max-h-none max-w-none border-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            aria-labelledby="avatar-editor-title"
            aria-describedby="avatar-editor-description"
            aria-busy={isBusy}
        >
            <div className="w-full max-w-md bg-[#181C24] border border-white/[0.12] rounded-2xl p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                        <h3
                            id="avatar-editor-title"
                            className="text-base font-semibold text-white font-['Geist']"
                        >
                            Alterar Foto do Perfil
                        </h3>
                        <p
                            id="avatar-editor-description"
                            className="text-xs text-[#94A3B8] mt-1 leading-relaxed"
                        >
                            JPEG, PNG ou WebP • máx. 5 MB • redimensionada para 256×256.
                        </p>
                    </div>

                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        disabled={isBusy}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Fechar"
                        title="Fechar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex flex-col items-center gap-5">
                    {/* Avatar preview */}
                    <div className="relative">
                        <img
                            src={previewSrc}
                            alt={`Prévia do avatar de ${userName}`}
                            className="w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover border-2 border-white/20 shadow-2xl bg-[#111827]"
                        />

                        {isBusy && (
                            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-[#06B6D4] animate-spin" />
                                <span className="sr-only">
                                    {busy === 'saving' ? 'Enviando avatar' : 'Removendo avatar'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Error message */}
                    {error && (
                        <div
                            role="alert"
                            className="w-full p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-start gap-2"
                        >
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Loading status */}
                    {busy === 'saving' && (
                        <p className="text-xs text-[#94A3B8] animate-pulse" aria-live="polite">
                            Enviando e processando a imagem...
                        </p>
                    )}
                    {busy === 'removing' && (
                        <p className="text-xs text-[#94A3B8] animate-pulse" aria-live="polite">
                            Removendo o avatar...
                        </p>
                    )}

                    <div className="w-full flex flex-col gap-2.5">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleSelectFile}
                            className="sr-only"
                            id="avatar-file-input"
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isBusy}
                            className="h-10 w-full bg-[#262A33] hover:bg-[#31353E] border border-white/[0.08] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ImagePlus className="w-4 h-4 text-[#06B6D4]" />
                            <span>Selecionar Nova Imagem</span>
                        </button>

                        {selectedFile && (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    disabled={isBusy}
                                    className="h-10 flex-1 bg-[#6366F1] hover:bg-[#5254E0] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30"
                                >
                                    {busy === 'saving' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Camera className="w-4 h-4" />
                                    )}
                                    <span>{busy === 'saving' ? 'Salvando...' : 'Confirmar Avatar'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    disabled={isBusy}
                                    className="h-10 px-4 bg-transparent text-[#94A3B8] hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleRemove}
                            disabled={isBusy}
                            className={`h-10 w-full rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${confirmRemove
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                                : 'bg-transparent text-red-400 border border-red-500/30 hover:bg-red-500/10'
                                }`}
                        >
                            {busy === 'removing' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                            <span>
                                {confirmRemove ? 'Clique novamente para confirmar a remoção' : 'Remover Avatar'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </dialog>
    );
};
