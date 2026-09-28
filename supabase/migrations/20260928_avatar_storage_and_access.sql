-- Migration: Bucket de avatares + controle de acesso via RLS.
-- 1) Cria o bucket público "avatars" (leitura pública, escrita restrita ao dono).
-- 2) Adiciona políticas de escrita restritas à pasta do próprio usuário (auth.uid()).
--
-- Padrão de caminho dos objetos: <auth.uid()>/avatar.webp
-- A escrita (INSERT/UPDATE/DELETE) só é permitida quando o primeiro segmento do
-- caminho é igual ao id do usuário autenticado, garantindo o controle de acesso.

-- 1. Garantir a existência do bucket (idempotente)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Leitura do próprio avatar (defense in depth; bucket público já permite leitura)
DROP POLICY IF EXISTS "Avatares: leitura do próprio objeto" ON storage.objects;
CREATE POLICY "Avatares: leitura do próprio objeto"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Inserção restrita à própria pasta
DROP POLICY IF EXISTS "Avatares: inserir o próprio avatar" ON storage.objects;
CREATE POLICY "Avatares: inserir o próprio avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Substituição (upsert) restrita à própria pasta
DROP POLICY IF EXISTS "Avatares: substituir o próprio avatar" ON storage.objects;
CREATE POLICY "Avatares: substituir o próprio avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Remoção restrita à própria pasta
DROP POLICY IF EXISTS "Avatares: remover o próprio avatar" ON storage.objects;
CREATE POLICY "Avatares: remover o próprio avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
