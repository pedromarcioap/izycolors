-- Migration de correção: reforço das regras de RBAC
-- 1) Cadastro realizado pelo portal SEMPRE cria perfil no nível 'user' (Usuário Comum).
-- 2) Somente Administradores podem alterar cargo (role) ou status de usuários.
--
-- Idempotente: pode ser aplicada com segurança inclusive em bancos onde a
-- migration 20260919_auth_and_rbac.sql já foi executada.

-- 1. Recriar o trigger de criação de perfil forçando o nível 'user'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, handle, role, avatar, bio)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'handle', '@' || split_part(NEW.email, '@', 1)),
    'user', -- raw_user_meta_data->>'role' ignorado: cargo é fixo no autocadastro
    COALESCE(NEW.raw_user_meta_data->>'avatar', 'https://api.dicebear.com/7.x/initials/svg?seed=' || encode(NEW.email::bytea, 'hex')),
    COALESCE(NEW.raw_user_meta_data->>'bio', 'Criador Izy Colors')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Guarda de privilégios: usuário comum não altera o próprio role/status
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
      -- Reverte silenciosamente as colunas de privilégio
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

-- 3. Reforçar a policy de atualização do próprio perfil
DROP POLICY IF EXISTS "Usuários atualizam próprio perfil" ON public.profiles;
CREATE POLICY "Usuários atualizam próprio perfil"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
