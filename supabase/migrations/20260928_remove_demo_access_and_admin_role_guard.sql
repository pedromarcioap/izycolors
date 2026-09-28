-- Migration: remoção do Acesso Demo e reforço do guard de criação de administradores.
-- 1) Remove o papel 'guest' (Visitante/Demonstração) do domínio de cargos.
-- 2) Normaliza qualquer resíduo do perfil demo 'guest' para 'user'.
-- 3) Adiciona função RPC SECURITY INVOKER que só permite a administradores conceder cargos
--    (verificação obrigatória de autorização no backend).

-- 1. Normalizar resíduos do antigo perfil demo 'guest'
UPDATE public.profiles SET role = 'user' WHERE role = 'guest';

-- 2. Remover 'guest' do CHECK de role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'moderator', 'editor', 'pro', 'user'));

-- 3. Função de concessão de cargo restrita a administradores (verificação no backend)
CREATE OR REPLACE FUNCTION public.admin_set_profile_role(p_email TEXT, p_role TEXT)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
  target public.profiles;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

  IF caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: somente administradores podem conceder cargos.';
  END IF;

  IF p_role NOT IN ('admin', 'moderator', 'editor', 'pro', 'user') THEN
    RAISE EXCEPTION 'Cargo inválido: %', p_role;
  END IF;

  UPDATE public.profiles
  SET role = p_role, updated_at = NOW()
  WHERE lower(email) = lower(p_email)
  RETURNING * INTO target;

  IF target.id IS NULL THEN
    RAISE EXCEPTION 'Perfil não encontrado para o e-mail informado.';
  END IF;

  RETURN target;
END;
$$;

-- Expor a função apenas para usuários autenticados (e nunca para anon/PUBLIC).
REVOKE ALL ON FUNCTION public.admin_set_profile_role(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_role(TEXT, TEXT) TO authenticated;
