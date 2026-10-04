-- ============================================================================
-- Hardening: privilégios EXECUTE nas funções SECURITY DEFINER
-- ----------------------------------------------------------------------------
-- O Supabase aplica `ALTER DEFAULT PRIVILEGES` concedendo EXECUTE diretamente
-- aos papéis `anon`, `authenticated` e `service_role` em funções criadas no
-- schema `public`. Por isso, `REVOKE ... FROM PUBLIC` sozinho NÃO remove o
-- acesso: é preciso revogar também dos papéis nomeados.
--
-- Resultado esperado após esta migration:
--   · funções de trigger  → sem EXECUTE para anon/authenticated
--   · resolvedores de papel → somente authenticated
--   · RPCs de contadores   → somente authenticated
--   · `current_user_role()` → apenas service_role (uso administrativo)
-- ============================================================================

-- 1. Funções de TRIGGER: jamais devem ser invocáveis via /rest/v1/rpc (anon/authenticated).
--    O EXECUTE do trigger precisa ser mantido para postgres, service_role e supabase_auth_admin.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_user_email_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_profile_privileged_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_palette_system_columns() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role, supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_user_email_change() TO postgres, service_role, supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.guard_profile_privileged_columns() TO postgres, service_role, supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.guard_palette_system_columns() TO postgres, service_role, supabase_auth_admin;

-- 2. `current_user_role()` não é usada por nenhuma policy: reservada ao
--    service_role para ferramentas administrativas do lado do servidor.
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO service_role;

-- 3. Resolvedores de papel: usados pelas policies TO authenticated.
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_editorial_team() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_editorial_team() TO authenticated;

-- 4. RPCs de negócio com efeitos colaterais: somente sessão autenticada.
REVOKE ALL ON FUNCTION public.recount_palette_likes(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.recount_palette_forks(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.toggle_palette_like(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recount_palette_likes(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recount_palette_forks(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_palette_like(TEXT) TO authenticated;

-- 5. RPCs de governança: jamais para anon.
REVOKE ALL ON FUNCTION public.admin_set_profile_role(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_profile_status(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.log_audit_event(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_role(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_status(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, TEXT) TO authenticated;

-- 6. Separa a leitura de artigos por papel.
--    A policy anterior (TO anon, authenticated) referenciava is_editorial_team(),
--    o que obrigava `anon` a ter EXECUTE na função. Com a divisão, o papel
--    anônimo enxerga somente o conteúdo publicado e não depende de função
--    alguma com privilégio elevado.
DROP POLICY IF EXISTS "artigos: leitura pública do publicado" ON public.cms_articles;

CREATE POLICY "artigos: anon lê apenas o publicado"
  ON public.cms_articles FOR SELECT TO anon
  USING (status = 'Publicado');

CREATE POLICY "artigos: autenticado lê publicado ou curadoria"
  ON public.cms_articles FOR SELECT TO authenticated
  USING (status = 'Publicado' OR (SELECT public.is_editorial_team()));