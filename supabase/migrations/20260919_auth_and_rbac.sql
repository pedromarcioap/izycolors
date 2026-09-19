-- Migration SQL para Supabase: Autenticação & Níveis de Acesso (RBAC)
-- Suporta os níveis: admin (Administrador), moderator (Moderador), editor (Editor/Curador), user (Usuário Comum), pro (Pro), guest (Visitante)

-- 1. Criar tabela public.profiles vinculada ao auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'editor', 'pro', 'user', 'guest')),
  avatar TEXT,
  bio TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politica 1: Leitura pública de perfis ativos
CREATE POLICY "Leitura de perfis ativos" 
ON public.profiles 
FOR SELECT 
USING (status = 'active' OR auth.uid() = id);

-- Politica 2: Atualização do próprio perfil (dados cadastrais apenas)
-- As colunas de privilegio (role/status) sao protegidas pelo trigger guard_profile_privileged_columns.
CREATE POLICY "Usuários atualizam próprio perfil"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Politica 3: Administradores possuem controle total
CREATE POLICY "Admins gerenciam todos os perfis" 
ON public.profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 2. Trigger para criar perfil automaticamente na inscrição (auth.users)
-- Regra de negocio: todo cadastro pelo portal nasce como 'user' (Usuario Comum).
-- O campo raw_user_meta_data->>'role' e ignorado de proposito: cargos de privilegio
-- so podem ser atribuidos por um Administrador no Painel de Usuarios.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, handle, role, avatar, bio)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'handle', '@' || split_part(NEW.email, '@', 1)),
    'user',
    COALESCE(NEW.raw_user_meta_data->>'avatar', 'https://api.dicebear.com/7.x/initials/svg?seed=' || encode(NEW.email::bytea, 'hex')),
    COALESCE(NEW.raw_user_meta_data->>'bio', 'Criador Izy Colors')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associar trigger à tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Guarda de privilegios: apenas Administradores alteram role/status de usuarios
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS TRIGGER AS $$
DECLARE
  requester_is_admin BOOLEAN := FALSE;
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT (role = 'admin') INTO requester_is_admin
    FROM public.profiles
    WHERE id = auth.uid();

    IF COALESCE(requester_is_admin, FALSE) IS NOT TRUE THEN
      -- Reverte silenciosamente as colunas de privilegio para o valor anterior
      NEW.role := OLD.role;
      NEW.status := OLD.status;
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS guard_profile_privileged_columns ON public.profiles;
CREATE TRIGGER guard_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_columns();
