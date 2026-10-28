-- ============================================================================
-- Correção de Permissões: Hardening Compatível com RLS
-- ----------------------------------------------------------------------------
-- Motivo:
--   O Supabase Linter (regra 0029) avisa sobre funções SECURITY DEFINER no schema
--   public que podem ser executadas por 'authenticated'.
--   Ao revogar 'EXECUTE' cegamente, as policies de RLS que chamam 'is_editorial_team()'
--   passam a falhar com erro 42501 (permission denied for function is_editorial_team),
--   fazendo com que a aplicação não consiga carregar artigos, submissões ou dados do usuário.
--
-- Solução:
--   1. 'is_editorial_team()': convertido para SECURITY INVOKER (STABLE comum).
--      Como ele apenas lê o próprio registro do usuário em public.profiles (que o RLS
--      já autoriza ler), não precisa de privilégios elevados.
--   2. 'guard_profile_privileged_columns()' e 'guard_palette_system_columns()':
--      convertidos para SECURITY INVOKER, eliminando os avisos de SECURITY DEFINER do Linter.
--   3. Conceder permissão de EXECUTE aos papéis 'authenticated', 'postgres' e 'service_role'.
-- ============================================================================

-- 1. is_editorial_team: SECURITY INVOKER com grant para authenticated
CREATE OR REPLACE FUNCTION public.is_editorial_team()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE((SELECT p.role IN ('admin','editor','moderator') FROM public.profiles p WHERE p.id = (SELECT auth.uid())), false);
$$;

REVOKE ALL ON FUNCTION public.is_editorial_team() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_editorial_team() TO authenticated;

-- 2. guard_profile_privileged_columns: SECURITY INVOKER trigger
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE requester_is_admin BOOLEAN;
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT (p.role = 'admin') INTO requester_is_admin FROM public.profiles p WHERE p.id = (SELECT auth.uid());
    IF COALESCE(requester_is_admin, FALSE) IS NOT TRUE THEN
      NEW.role := OLD.role;
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_profile_privileged_columns() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guard_profile_privileged_columns() TO authenticated, postgres, service_role, supabase_auth_admin;

-- 3. guard_palette_system_columns: SECURITY INVOKER trigger
CREATE OR REPLACE FUNCTION public.guard_palette_system_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE requester_is_team BOOLEAN;
BEGIN
  SELECT public.is_editorial_team() INTO requester_is_team;
  IF COALESCE(requester_is_team, FALSE) IS NOT TRUE THEN
    IF OLD.staff_pick IS DISTINCT FROM NEW.staff_pick THEN NEW.staff_pick := OLD.staff_pick; END IF;
    IF (SELECT auth.uid()) IS NOT NULL THEN
      IF OLD.likes IS DISTINCT FROM NEW.likes THEN NEW.likes := OLD.likes; END IF;
      IF OLD.forks IS DISTINCT FROM NEW.forks THEN NEW.forks := OLD.forks; END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_palette_system_columns() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guard_palette_system_columns() TO authenticated, postgres, service_role, supabase_auth_admin;
