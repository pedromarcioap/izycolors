import { getSupabaseClient } from './supabase';

export const AVATAR_BUCKET = 'avatars';
export const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const AVATAR_TARGET_SIZE = 256; // 256 x 256 px
export const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const AVATAR_FILENAME = 'avatar.webp';

export interface AvatarRules {
    maxSizeBytes: number;
    targetSize: number;
    allowedTypes: string[];
}

export function getAvatarRules(): AvatarRules {
    return {
        maxSizeBytes: AVATAR_MAX_SIZE_BYTES,
        targetSize: AVATAR_TARGET_SIZE,
        allowedTypes: [...AVATAR_ALLOWED_TYPES]
    };
}

/** Retorna uma mensagem de erro clara ou null quando o arquivo é válido. */
export function getAvatarFileError(file: File): string | null {
    if (!file) {
        return 'Nenhum arquivo selecionado.';
    }

    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
        return 'Formato inválido. Envie uma imagem JPEG, PNG ou WebP.';
    }

    if (file.size > AVATAR_MAX_SIZE_BYTES) {
        return 'O arquivo excede o limite de 5 MB. Escolha uma imagem menor.';
    }

    return null;
}

function loadImageFromFile(file: File): Promise<{ image: HTMLImageElement; objectUrl: string }> {
    const objectUrl = URL.createObjectURL(file);

    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ image, objectUrl });
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Não foi possível ler a imagem. O arquivo pode estar corrompido.'));
        };
        image.src = objectUrl;
    });
}

/**
 * Redimensiona e comprime a imagem para 256x256 (recorte central "cover")
 * e devolve um Blob WebP otimizado para envio.
 */
export async function processAvatarImage(file: File): Promise<Blob> {
    let objectUrl = '';
    try {
        const { image, objectUrl: loadedUrl } = await loadImageFromFile(file);
        objectUrl = loadedUrl;

        const canvas = document.createElement('canvas');
        canvas.width = AVATAR_TARGET_SIZE;
        canvas.height = AVATAR_TARGET_SIZE;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Seu navegador não suporta processamento de imagens (Canvas).');
        }

        // Recorte central proporcional (cover) para preencher o quadrado 256x256.
        const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
        const sourceWidth = canvas.width / scale;
        const sourceHeight = canvas.height / scale;
        const sourceX = (image.naturalWidth - sourceWidth) / 2;
        const sourceY = (image.naturalHeight - sourceHeight) / 2;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = '#0B0F17';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            canvas.width,
            canvas.height
        );

        return await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Falha ao comprimir a imagem para WebP.'));
                }
            }, 'image/webp', 0.85);
        });
    } finally {
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }
    }
}

/** Converte um Blob em Data URL para persistência local (fallback sem Supabase). */
export function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const { result } = reader;
            if (typeof result === 'string') {
                resolve(result);
            } else {
                reject(new Error('Falha ao ler a imagem processada.'));
            }
        };
        reader.onerror = () => reject(new Error('Falha ao ler a imagem processada.'));
        reader.readAsDataURL(blob);
    });
}

/** Gera o avatar de iniciais usado quando o usuário não possui foto. */
export function getInitialsAvatarUrl(seed: string): string {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
}

async function requireSupabaseUser() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase não está configurado. Configure as credenciais para usar o avatar na nuvem.');
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
        throw new Error('Sessão expirada ou inexistente. Faça login novamente para alterar seu avatar.');
    }

    return { supabase, userId: data.user.id };
}

function buildAvatarPath(userId: string): string {
    return `${userId}/${AVATAR_FILENAME}`;
}

/**
 * Valida, redimensiona e envia o avatar para o bucket "avatars",
 * substituindo a imagem anterior (upsert). Retorna a URL pública.
 */
export async function uploadUserAvatar(file: File): Promise<string> {
    const validationError = getAvatarFileError(file);
    if (validationError) {
        throw new Error(validationError);
    }

    const { supabase, userId } = await requireSupabaseUser();
    const blob = await processAvatarImage(file);
    const path = buildAvatarPath(userId);

    const { error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, blob, {
            contentType: 'image/webp',
            upsert: true,
            cacheControl: '3600'
        });

    if (error) {
        throw new Error(error.message || 'Falha ao enviar a imagem para o servidor.');
    }

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

/** Remove o avatar do bucket "avatars" (somente o arquivo do próprio usuário). */
export async function removeUserAvatar(): Promise<void> {
    const { supabase, userId } = await requireSupabaseUser();
    const path = buildAvatarPath(userId);

    const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    if (error) {
        throw new Error(error.message || 'Falha ao remover a imagem do servidor.');
    }
}

/**
 * Atualiza a coluna avatar do perfil no Supabase (com RLS limitando ao próprio dono).
 * Use null para remover a referência do avatar.
 */
export async function updateProfileAvatar(publicUrl: string | null): Promise<void> {
    const { supabase, userId } = await requireSupabaseUser();

    const { error } = await supabase
        .from('profiles')
        .update({ avatar: publicUrl })
        .eq('id', userId);

    if (error) {
        throw new Error(error.message || 'Falha ao atualizar o perfil no servidor.');
    }
}
