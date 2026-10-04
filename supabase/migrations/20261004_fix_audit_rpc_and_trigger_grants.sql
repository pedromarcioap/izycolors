-- ============================================================================
-- Correção de Permissões: RPC de Auditoria e Triggers de Tabela
-- ----------------------------------------------------------------------------
-- 1. log_audit_event: deve ser SECURITY DEFINER para conseguir inserir na tabela
--    audit_logs que possui RLS bloqueando inserts diretos do cliente.
-- 2. Permissões de EXECUTE em triggers de atualização (guard_profile_privileged_columns,
--    guard_palette_system_columns) para authenticated para permitir updates legítimos.
-- ============================================================================

-- 1. Corrige a função de auditoria para SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_details TEXT DEFAULT '',
  p_type TEXT DEFAULT 'system'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid UUID := (SELECT auth.uid());
  new_id UUID;
BEGIN
  INSERT INTO public.audit_logs (actor_id, actor_name, actor_role, action, details, type)
  VALUES (
    uid,
    COALESCE((SELECT p.name FROM public.profiles p WHERE p.id = uid), 'Sessão desconhecida'),
    COALESCE((SELECT p.role FROM public.profiles p WHERE p.id = uid), 'user'),
    p_action,
    p_details,
    p_type
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Concede execução da RPC para usuários autenticados e anônimos (eventos de login/logout/registro)
REVOKE ALL ON FUNCTION public.log_audit_event(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, TEXT) TO authenticated, anon;

-- 2. Garante permissão de execução nos triggers de integridade e timestamps
GRANT EXECUTE ON FUNCTION public.guard_profile_privileged_columns() TO authenticated, postgres, service_role, supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.guard_palette_system_columns() TO authenticated, postgres, service_role, supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO authenticated, anon, postgres, service_role;
