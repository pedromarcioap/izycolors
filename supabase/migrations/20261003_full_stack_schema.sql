-- ============================================================================
-- Izy Colors — Migração consolidada para Supabase
-- ----------------------------------------------------------------------------
-- Substitui integralmente o mock/localStorage por persistência real no Postgres.
-- Idempotente: pode ser aplicada com segurança mesmo que as migrations
-- anteriores (20260919, 20260920, 20260928*) já tenham sido executadas.
--
-- Modelo de acesso:
--   · anon            → leitura pública de conteúdo editorial e da comunidade
--   · authenticated   → leitura pública + CRUD dos próprios dados de usuário
--   · admin/editor/   → curadoria editorial (CMS, submissões, taxonomia)
--   · moderator
--   · admin           → governança (perfis/cargos, auditoria, config de IA)
-- ============================================================================

-- ============================================================================
-- 0. Funções auxiliares de trigger
-- ============================================================================

-- Mantém updated_at automaticamente.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 1. Perfis (vinculados a auth.users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  avatar TEXT,
  bio TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Colunas do perfil de criador que antes viviam em localStorage.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_pro BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS figma TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS behance TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badges TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS export_preferences JSONB NOT NULL DEFAULT
  '{"defaultFormat":"OKLCH","variablePrefix":"sys-color","namingConvention":"kebab-case","includeComments":true}'::jsonb;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'moderator', 'editor', 'pro', 'user'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('active', 'suspended'));

-- ---------------------------------------------------------------------------
-- 1.0 Autorização: resolvedores de papel
-- SECURITY DEFINER é necessário para quebrar a recursão entre políticas de
-- `profiles` (uma policy de `profiles` não pode consultar `profiles` diretamente).
-- As funções são somente leitura e sempre vinculadas a auth.uid(), portanto não
-- é possível consultar o cargo de outro usuário. `search_path` vazio evita
-- sequestro de schema via objeto malicioso no public.
-- IMPORTANTE: criadas depois da tabela, pois o corpo SQL é validado no CREATE.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.role FROM public.profiles p WHERE p.id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT p.role = 'admin' FROM public.profiles p WHERE p.id = (SELECT auth.uid())),
    false
  );
$$;

-- Equipe editorial: gerencia o CMS, a curadoria e a taxonomia.
CREATE OR REPLACE FUNCTION public.is_editorial_team()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE((
    SELECT p.role IN ('admin', 'editor', 'moderator')
    FROM public.profiles p WHERE p.id = (SELECT auth.uid())
  ), false);
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_editorial_team() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_editorial_team() TO anon, authenticated;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 1.1 Provisionamento automático de perfil no cadastro
-- Regra de negócio: todo cadastro público nasce como 'user'.
-- O `raw_user_meta_data` é editável pelo cliente, portanto NUNCA é usado para
-- autorização — o cargo é fixado aqui e só muda via RPC restrita a admin.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, handle, role, avatar, bio)
  VALUES (
    NEW.id,
    lower(NEW.email),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1)),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'handle', ''), '@' || split_part(NEW.email, '@', 1)),
    'user',
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'avatar', ''),
      'https://api.dicebear.com/7.x/initials/svg?seed=' || encode(convert_to(split_part(NEW.email, '@', 1), 'UTF8'), 'hex')
    ),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'bio', ''), 'Criador Izy Colors')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sincroniza o e-mail quando o usuário o altera no Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_user_email_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET email = lower(NEW.email), updated_at = now()
  WHERE id = NEW.id AND email <> lower(NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_change();

-- ---------------------------------------------------------------------------
-- 1.2 Guarda de colunas privilegiadas (role/status)
-- Usuários comuns podem editar o próprio perfil, mas nunca se auto-promover.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requester_is_admin BOOLEAN;
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT (p.role = 'admin') INTO requester_is_admin
    FROM public.profiles p WHERE p.id = (SELECT auth.uid());

    IF COALESCE(requester_is_admin, FALSE) IS NOT TRUE THEN
      NEW.role := OLD.role;
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_privileged_columns ON public.profiles;
CREATE TRIGGER guard_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_columns();

-- ============================================================================
-- 2. Comunidade: paletas, likes e forks
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.palettes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_handle TEXT NOT NULL,
  author_avatar TEXT,
  author_pro BOOLEAN NOT NULL DEFAULT false,
  colors TEXT[] NOT NULL DEFAULT '{}',
  likes INTEGER NOT NULL DEFAULT 0,
  forks INTEGER NOT NULL DEFAULT 0,
  wcag_level TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  gamut TEXT,
  staff_pick BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  forked_from_id TEXT REFERENCES public.palettes(id) ON DELETE SET NULL,
  forked_from_title TEXT,
  forked_from_author TEXT,
  forked_from_handle TEXT,
  is_fork BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS palettes_created_at_idx ON public.palettes (created_at DESC);
CREATE INDEX IF NOT EXISTS palettes_author_id_idx ON public.palettes (author_id);
CREATE INDEX IF NOT EXISTS palettes_tags_idx ON public.palettes USING GIN (tags);

CREATE TABLE IF NOT EXISTS public.palette_likes (
  palette_id TEXT NOT NULL REFERENCES public.palettes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (palette_id, user_id)
);

CREATE INDEX IF NOT EXISTS palette_likes_user_id_idx ON public.palette_likes (user_id);

CREATE TABLE IF NOT EXISTS public.palette_forks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_palette_id TEXT NOT NULL REFERENCES public.palettes(id) ON DELETE CASCADE,
  original_title TEXT NOT NULL,
  original_author TEXT NOT NULL,
  colors TEXT[] NOT NULL DEFAULT '{}',
  forked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  forked_by_handle TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS palette_forks_original_idx ON public.palette_forks (original_palette_id);
CREATE INDEX IF NOT EXISTS palette_forks_user_idx ON public.palette_forks (forked_by);

-- ---------------------------------------------------------------------------
-- 2.1 Guarda de colunas de curadoria/contadores em `palettes`
-- `staff_pick`, `likes` e `forks` só mudam pela equipe editorial ou pelas
-- funções RPC dedicadas — nunca por um UPDATE direto do cliente.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_palette_system_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requester_is_team BOOLEAN;
BEGIN
  SELECT public.is_editorial_team() INTO requester_is_team;

  IF COALESCE(requester_is_team, FALSE) IS NOT TRUE THEN
    IF OLD.staff_pick IS DISTINCT FROM NEW.staff_pick THEN
      NEW.staff_pick := OLD.staff_pick;
    END IF;
  END IF;

  -- Contadores são derivados de palette_likes / palette_forks.
  IF (SELECT auth.uid()) IS NOT NULL
     AND COALESCE(requester_is_team, FALSE) IS NOT TRUE THEN
    IF OLD.likes IS DISTINCT FROM NEW.likes THEN
      NEW.likes := OLD.likes;
    END IF;
    IF OLD.forks IS DISTINCT FROM NEW.forks THEN
      NEW.forks := OLD.forks;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_palette_system_columns ON public.palettes;
CREATE TRIGGER guard_palette_system_columns
  BEFORE UPDATE ON public.palettes
  FOR EACH ROW EXECUTE FUNCTION public.guard_palette_system_columns();

-- ============================================================================
-- 3. Cofre privado do usuário
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_or_brand TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  primary_colors TEXT[] NOT NULL DEFAULT '{}',
  secondary_colors TEXT[] NOT NULL DEFAULT '{}',
  neutral_grays TEXT[] NOT NULL DEFAULT '{}',
  semantic_tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.project_palettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  colors TEXT[] NOT NULL DEFAULT '{}',
  role TEXT NOT NULL DEFAULT 'Geral',
  wcag_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_palettes_project_idx ON public.project_palettes (project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_private BOOLEAN NOT NULL DEFAULT true,
  palette_ids TEXT[] NOT NULL DEFAULT '{}',
  cover_colors TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS collections_user_id_idx ON public.collections (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.vault_palettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  colors TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  gamut TEXT,
  wcag_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vault_palettes_user_idx ON public.vault_palettes (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.favorite_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hex TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Amostra personalizada',
  note TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS favorite_colors_user_hex_idx
  ON public.favorite_colors (user_id, lower(hex));
CREATE INDEX IF NOT EXISTS favorite_colors_user_idx ON public.favorite_colors (user_id, created_at DESC);

-- Estado efêmero do Estúdio (paleta ativa / stage) — antes em localStorage.
CREATE TABLE IF NOT EXISTS public.user_workspace_state (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  active_palette TEXT[] NOT NULL DEFAULT '{"#1A1A1A","#2563EB","#38BDF8","#F1F5F9","#FFFFFF"}',
  active_stage TEXT NOT NULL DEFAULT 'generate',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_workspace_state DROP CONSTRAINT IF EXISTS user_workspace_state_stage_check;
ALTER TABLE public.user_workspace_state ADD CONSTRAINT user_workspace_state_stage_check
  CHECK (active_stage IN ('generate', 'refine', 'audit', 'export'));

-- ============================================================================
-- 4. Editorial: CMS, curadoria, taxonomia e imagens curadas
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cms_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  meta_description TEXT,
  content TEXT NOT NULL DEFAULT '',
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT '',
  read_time TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Rascunho',
  featured BOOLEAN NOT NULL DEFAULT false,
  views INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_articles DROP CONSTRAINT IF EXISTS cms_articles_status_check;
ALTER TABLE public.cms_articles ADD CONSTRAINT cms_articles_status_check
  CHECK (status IN ('Publicado', 'Rascunho', 'Em Revisão'));

CREATE INDEX IF NOT EXISTS cms_articles_status_idx ON public.cms_articles (status, published_at DESC);

CREATE TABLE IF NOT EXISTS public.community_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_handle TEXT NOT NULL DEFAULT '',
  author_avatar TEXT,
  colors TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'Pendente',
  suggested_gamut TEXT NOT NULL DEFAULT 'sRGB',
  contrast_score TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.community_submissions DROP CONSTRAINT IF EXISTS community_submissions_status_check;
ALTER TABLE public.community_submissions ADD CONSTRAINT community_submissions_status_check
  CHECK (status IN ('Pendente', 'Aprovado', 'Rejeitado'));

CREATE INDEX IF NOT EXISTS community_submissions_status_idx
  ON public.community_submissions (status, submitted_at DESC);

CREATE TABLE IF NOT EXISTS public.taxonomy_tags (
  name TEXT PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'Geral',
  count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.curated_images (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  tag TEXT NOT NULL DEFAULT 'Curadoria',
  colors TEXT[] NOT NULL DEFAULT '{}',
  is_custom BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. Governança: auditoria e configuração de IA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL DEFAULT '',
  actor_role TEXT NOT NULL DEFAULT 'user',
  action TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_type_check;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_type_check
  CHECK (type IN ('auth', 'palette', 'cms', 'user', 'system'));

CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON public.audit_logs (created_at DESC);

-- Configuração sensível dos provedores de IA.
-- Leitura e escrita EXCLUSIVAMENTE de administradores.
-- As chaves nunca são devolvidas ao navegador: a geração ocorre na Edge Function
-- `ai-generate-article`, que usa a service role no servidor.
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  active_provider TEXT NOT NULL DEFAULT 'gemini',
  gemini_api_key TEXT NOT NULL DEFAULT '',
  gemini_model TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
  openrouter_api_key TEXT NOT NULL DEFAULT '',
  openrouter_model TEXT NOT NULL DEFAULT 'google/gemini-2.0-flash-001',
  openai_api_key TEXT NOT NULL DEFAULT '',
  openai_model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  claude_api_key TEXT NOT NULL DEFAULT '',
  claude_model TEXT NOT NULL DEFAULT 'claude-3-5-sonnet-20241022',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

INSERT INTO public.ai_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. Funções RPC de negócio
-- ============================================================================

-- 6.1 Recalcula o contador de curtidas de forma atômica e confiável.
-- SECURITY DEFINER justificado: o usuário não é dono da linha de `palettes`,
-- portanto não pode escrever em `palettes.likes` diretamente. A guarda
-- auth.uid() impede o uso anônimo.
CREATE OR REPLACE FUNCTION public.recount_palette_likes(p_palette_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  total INTEGER;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: é necessária uma sessão autenticada.';
  END IF;

  SELECT count(*) INTO total FROM public.palette_likes WHERE palette_id = p_palette_id;

  UPDATE public.palettes SET likes = total WHERE id = p_palette_id;
  RETURN total;
END;
$$;

-- 6.2 Idem para o contador de forks (derivado de palette_forks).
CREATE OR REPLACE FUNCTION public.recount_palette_forks(p_palette_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  total INTEGER;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: é necessária uma sessão autenticada.';
  END IF;

  SELECT count(*) INTO total FROM public.palette_forks WHERE original_palette_id = p_palette_id;

  UPDATE public.palettes SET forks = total WHERE id = p_palette_id;
  RETURN total;
END;
$$;

-- 6.3 Alterna a curtida do usuário autenticado (idempotente por PK).
CREATE OR REPLACE FUNCTION public.toggle_palette_like(p_palette_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid UUID := (SELECT auth.uid());
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: é necessária uma sessão autenticada.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.palette_likes WHERE palette_id = p_palette_id AND user_id = uid) THEN
    DELETE FROM public.palette_likes WHERE palette_id = p_palette_id AND user_id = uid;
    PERFORM public.recount_palette_likes(p_palette_id);
    RETURN false;
  ELSE
    INSERT INTO public.palette_likes (palette_id, user_id) VALUES (p_palette_id, uid);
    PERFORM public.recount_palette_likes(p_palette_id);
    RETURN true;
  END IF;
END;
$$;

-- 6.4 Governo de cargos: somente administradores alteram role/status.
-- SECURITY INVOKER — a própria RLS já restringe, mas a verificação explícita
-- no corpo impede regressões caso a policy seja afrouxada futuramente.
CREATE OR REPLACE FUNCTION public.admin_set_profile_role(p_email TEXT, p_role TEXT)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  caller_role TEXT;
  target public.profiles;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: é necessária uma sessão autenticada.';
  END IF;

  SELECT role INTO caller_role FROM public.profiles WHERE id = (SELECT auth.uid());

  IF caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: somente administradores podem conceder cargos.';
  END IF;

  IF p_role NOT IN ('admin', 'moderator', 'editor', 'pro', 'user') THEN
    RAISE EXCEPTION 'Cargo inválido: %', p_role;
  END IF;

  UPDATE public.profiles
  SET role = p_role, updated_at = now()
  WHERE lower(email) = lower(p_email)
  RETURNING * INTO target;

  IF target.id IS NULL THEN
    RAISE EXCEPTION 'Perfil não encontrado para o e-mail informado.';
  END IF;

  RETURN target;
END;
$$;

-- 6.5 Status da conta (ativo/suspenso).
CREATE OR REPLACE FUNCTION public.admin_set_profile_status(p_email TEXT, p_status TEXT)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  caller_role TEXT;
  target public.profiles;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: é necessária uma sessão autenticada.';
  END IF;

  SELECT role INTO caller_role FROM public.profiles WHERE id = (SELECT auth.uid());

  IF caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: somente administradores podem alterar status de contas.';
  END IF;

  IF p_status NOT IN ('active', 'suspended') THEN
    RAISE EXCEPTION 'Status inválido: %', p_status;
  END IF;

  UPDATE public.profiles
  SET status = p_status, updated_at = now()
  WHERE lower(email) = lower(p_email)
  RETURNING * INTO target;

  IF target.id IS NULL THEN
    RAISE EXCEPTION 'Perfil não encontrado para o e-mail informado.';
  END IF;

  RETURN target;
END;
$$;

-- 6.6 Registro de trilha de auditoria.
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

-- Exposições controladas. Nunca para anon/PUBLIC nas funções de administração.
REVOKE ALL ON FUNCTION public.recount_palette_likes(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recount_palette_forks(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toggle_palette_like(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recount_palette_likes(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recount_palette_forks(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_palette_like(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_set_profile_role(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_profile_status(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_audit_event(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_role(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_status(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- 7. Row Level Security
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palette_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.palette_forks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workspace_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomy_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 7.1 profiles
-- Leitura pública apenas de contas ATIVAS; o dono enxerga a própria conta.
DROP POLICY IF EXISTS "perfis: leitura pública de ativos" ON public.profiles;
CREATE POLICY "perfis: leitura pública de ativos"
  ON public.profiles FOR SELECT TO anon, authenticated
  USING (status = 'active' OR (SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "perfis: dono atualiza o próprio perfil" ON public.profiles;
CREATE POLICY "perfis: dono atualiza o próprio perfil"
  ON public.profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "perfis: admin gerencia todos" ON public.profiles;
CREATE POLICY "perfis: admin gerencia todos"
  ON public.profiles FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- INSERT é sempre feito pelo trigger handle_new_user (SECURITY DEFINER).
-- Clientes não criam perfis diretamente: evita forjar cargo/handle de terceiros.
DROP POLICY IF EXISTS "perfis: nenhum insert direto" ON public.profiles;
CREATE POLICY "perfis: nenhum insert direto"
  ON public.profiles FOR INSERT TO anon, authenticated
  WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- 7.2 palettes (conteúdo público da comunidade)
DROP POLICY IF EXISTS "paletas: leitura pública" ON public.palettes;
CREATE POLICY "paletas: leitura pública"
  ON public.palettes FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "paletas: autor publica a própria" ON public.palettes;
CREATE POLICY "paletas: autor publica a própria"
  ON public.palettes FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "paletas: autor edita a própria" ON public.palettes;
CREATE POLICY "paletas: autor edita a própria"
  ON public.palettes FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = author_id OR (SELECT public.is_editorial_team()))
  WITH CHECK ((SELECT auth.uid()) = author_id OR (SELECT public.is_editorial_team()));

DROP POLICY IF EXISTS "paletas: autor ou curadoria remove" ON public.palettes;
CREATE POLICY "paletas: autor ou curadoria remove"
  ON public.palettes FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = author_id OR (SELECT public.is_editorial_team()));

-- ---------------------------------------------------------------------------
-- 7.3 palette_likes / palette_forks
DROP POLICY IF EXISTS "curtidas: leitura pública" ON public.palette_likes;
CREATE POLICY "curtidas: leitura pública"
  ON public.palette_likes FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "curtidas: usuário gerencia as próprias" ON public.palette_likes;
CREATE POLICY "curtidas: usuário gerencia as próprias"
  ON public.palette_likes FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "forks: leitura pública" ON public.palette_forks;
CREATE POLICY "forks: leitura pública"
  ON public.palette_forks FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "forks: autor insere o próprio" ON public.palette_forks;
CREATE POLICY "forks: autor insere o próprio"
  ON public.palette_forks FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = forked_by);

DROP POLICY IF EXISTS "forks: autor remove o próprio" ON public.palette_forks;
CREATE POLICY "forks: autor remove o próprio"
  ON public.palette_forks FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = forked_by);

-- ---------------------------------------------------------------------------
-- 7.4 Cofre privado — estritamente por proprietário (BOLA prevention)
DROP POLICY IF EXISTS "projetos: dono gerencia" ON public.projects;
CREATE POLICY "projetos: dono gerencia"
  ON public.projects FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "paletas de projeto: dono gerencia" ON public.project_palettes;
CREATE POLICY "paletas de projeto: dono gerencia"
  ON public.project_palettes FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_palettes.project_id AND p.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_palettes.project_id AND p.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "coleções: dono gerencia" ON public.collections;
CREATE POLICY "coleções: dono gerencia"
  ON public.collections FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "cofre de paletas: dono gerencia" ON public.vault_palettes;
CREATE POLICY "cofre de paletas: dono gerencia"
  ON public.vault_palettes FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "cores favoritas: dono gerencia" ON public.favorite_colors;
CREATE POLICY "cores favoritas: dono gerencia"
  ON public.favorite_colors FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "estado do estúdio: dono gerencia" ON public.user_workspace_state;
CREATE POLICY "estado do estúdio: dono gerencia"
  ON public.user_workspace_state FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 7.5 Editorial
DROP POLICY IF EXISTS "artigos: leitura pública do publicado" ON public.cms_articles;
CREATE POLICY "artigos: leitura pública do publicado"
  ON public.cms_articles FOR SELECT TO anon, authenticated
  USING (status = 'Publicado' OR (SELECT public.is_editorial_team()));

DROP POLICY IF EXISTS "artigos: curadoria gerencia" ON public.cms_articles;
CREATE POLICY "artigos: curadoria gerencia"
  ON public.cms_articles FOR ALL TO authenticated
  USING ((SELECT public.is_editorial_team()))
  WITH CHECK ((SELECT public.is_editorial_team()));

DROP POLICY IF EXISTS "submissões: autor cria a própria" ON public.community_submissions;
CREATE POLICY "submissões: autor cria a própria"
  ON public.community_submissions FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "submissões: autor lê a própria" ON public.community_submissions;
CREATE POLICY "submissões: autor lê a própria"
  ON public.community_submissions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = author_id OR (SELECT public.is_editorial_team()));

DROP POLICY IF EXISTS "submissões: curadoria revisa" ON public.community_submissions;
CREATE POLICY "submissões: curadoria revisa"
  ON public.community_submissions FOR UPDATE TO authenticated
  USING ((SELECT public.is_editorial_team()))
  WITH CHECK ((SELECT public.is_editorial_team()));

DROP POLICY IF EXISTS "taxonomia: leitura pública" ON public.taxonomy_tags;
CREATE POLICY "taxonomia: leitura pública"
  ON public.taxonomy_tags FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "taxonomia: curadoria gerencia" ON public.taxonomy_tags;
CREATE POLICY "taxonomia: curadoria gerencia"
  ON public.taxonomy_tags FOR ALL TO authenticated
  USING ((SELECT public.is_editorial_team()))
  WITH CHECK ((SELECT public.is_editorial_team()));

DROP POLICY IF EXISTS "imagens curadas: leitura pública" ON public.curated_images;
CREATE POLICY "imagens curadas: leitura pública"
  ON public.curated_images FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "imagens curadas: curadoria gerencia" ON public.curated_images;
CREATE POLICY "imagens curadas: curadoria gerencia"
  ON public.curated_images FOR ALL TO authenticated
  USING ((SELECT public.is_editorial_team()))
  WITH CHECK ((SELECT public.is_editorial_team()));

-- ---------------------------------------------------------------------------
-- 7.6 Governança
DROP POLICY IF EXISTS "auditoria: somente admin lê" ON public.audit_logs;
CREATE POLICY "auditoria: somente admin lê"
  ON public.audit_logs FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

-- Escrita de auditoria passa pela RPC log_audit_event (o ator é o próprio
-- usuário autenticado). Isso evita que um cliente injete autoria de terceiros.
DROP POLICY IF EXISTS "auditoria: nenhum insert direto" ON public.audit_logs;
CREATE POLICY "auditoria: nenhum insert direto"
  ON public.audit_logs FOR INSERT TO anon, authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "auditoria: admin remove" ON public.audit_logs;
CREATE POLICY "auditoria: admin remove"
  ON public.audit_logs FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

-- ai_settings: SOMENTE admin. As chaves nunca chegam ao navegador.
DROP POLICY IF EXISTS "config IA: somente admin" ON public.ai_settings;
CREATE POLICY "config IA: somente admin"
  ON public.ai_settings FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- ============================================================================
-- 8. Storage (avatares) — re-declarado para garantir idempotência total
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatares: leitura do próprio objeto" ON storage.objects;
CREATE POLICY "Avatares: leitura do próprio objeto"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Avatares: inserir o próprio avatar" ON storage.objects;
CREATE POLICY "Avatares: inserir o próprio avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- Upsert exige INSERT + SELECT + UPDATE — as três políticas são necessárias.
DROP POLICY IF EXISTS "Avatares: substituir o próprio avatar" ON storage.objects;
CREATE POLICY "Avatares: substituir o próprio avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Avatares: remover o próprio avatar" ON storage.objects;
CREATE POLICY "Avatares: remover o próprio avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- ============================================================================
-- 9. Grants da Data API
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- NÃO usar "GRANT EXECUTE ON ALL FUNCTIONS ... TO anon": isso reabriria as
-- RPCs administrativas para o papel anônimo. As permissões de função são
-- concedidas individualmente acima (helpers de papel para anon/authenticated,
-- RPCs privileged somente para authenticated).
-- Default privilege cobre apenas funções futuras.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO service_role;

-- ============================================================================
-- 10. Seed de conteúdo público (substitui src/data/initialData.ts)
-- ============================================================================

INSERT INTO public.taxonomy_tags (name, category, count) VALUES
  ('Vibrante', 'Humor', 482),
  ('Dark Mode', 'Tema', 914),
  ('Neon & Cyber', 'Estilo', 320),
  ('Pastel', 'Saturação', 641),
  ('Minimalista', 'Estilo', 785),
  ('Outono & Terra', 'Natureza', 290),
  ('Retrô Vintage', 'Época', 356),
  ('Gradientes', 'Técnica', 412),
  ('Gradiente Bicolor', 'Técnica', 188),
  ('Monocromático Azul', 'Harmonia', 245),
  ('Oklab Calibrado', 'Ciência', 512),
  ('P3 Display Gamut', 'Hardware', 398)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.curated_images (id, name, url, tag, colors, is_custom, created_at) VALUES
  ('cyberpunk-shinjuku', 'Cyberpunk Shinjuku',
   'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
   'Neon & Dark', ARRAY['#0B1B2B','#1E3A5F','#08BBD9','#FF2A85','#E2E8F0'], false, now()),
  ('nordic-fjord-ice', 'Nordic Fjord Ice',
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
   'Glacier Blue', ARRAY['#0A192F','#1E3A8A','#38BDF8','#E0F2FE','#F8FAFC'], false, now()),
  ('duna-terracota', 'Duna Terracota',
   'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&auto=format&fit=crop&q=80',
   'Ocre & Terra', ARRAY['#451A03','#9A3412','#EA580C','#FB923C','#FEF3C7'], false, now()),
  ('floresta-botanica', 'Floresta Botânica',
   'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80',
   'Matcha & Musgo', ARRAY['#14532D','#166534','#22C55E','#86EFAC','#F0FDF4'], false, now()),
  ('arquitetura-suica', 'Arquitetura Suíça',
   'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
   'Concreto & Minimal', ARRAY['#18181B','#3F3F46','#71717A','#D4D4D8','#FAFAFA'], false, now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.palettes (
  id, title, author_name, author_handle, author_avatar, author_pro, colors, likes, forks,
  wcag_level, tags, gamut, staff_pick, description, created_at
) VALUES
  ('midnight-aurora', 'Midnight Aurora', 'Marcus UI', '@marcus_ui',
   'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', true,
   ARRAY['#0E1726','#223249','#08BBD9','#3B82F6','#9354F5'], 3840, 1420,
   'WCAG 2.1 AAA Ready', ARRAY['Dark Mode','Dark Mode Safe','Oklab Calibrado'], 'P3 Display Gamut', true,
   'Paleta balanceada para interfaces escuras com luminescência ciano e violeta.', now() - interval '2 days'),

  ('tokyo-synthwave', 'Tokyo Synthwave', 'Elena Dev', '@elena_dev',
   'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', true,
   ARRAY['#280F3E','#4B1865','#FF2A85','#7A0BC0','#4CD7F6'], 2410, 890,
   'WCAG AAA Ready', ARRAY['Neon & Cyber','P3 Display Gamut','Vibrante'], 'Display P3', false,
   'Gradiente cibernético saturado com inspiração nos letreiros noturnos de Shinjuku.', now() - interval '3 days'),

  ('matcha-latte-cream', 'Matcha Latte & Cream', 'Studio Forma', '@studio_forma',
   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', false,
   ARRAY['#2F4432','#58735A','#A0B89C','#E2EBD3','#FAFBF7'], 1420, 560,
   'WCAG AAA (Text Safe)', ARRAY['Minimalista','Editorial Orgânico','Pastel'], 'sRGB', true,
   'Tons terrosos e botânicos de alta neutralidade estética para design editorial e embalagens.', now() - interval '4 days'),

  ('desert-mirage', 'Desert Mirage', 'Clara Dune', '@clara_dune',
   'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', false,
   ARRAY['#4E2817','#9E4413','#E67E22','#F39C12','#FBE7C6'], 952, 310,
   'WCAG 2.1 AAA Ready', ARRAY['Outuno & Terra','Oklab Calibrado','Quente'], 'Display P3', false,
   'Harmonia análoga em tons ocre, terracota e areia dourada.', now() - interval '5 days'),

  ('deep-ocean-trench', 'Deep Ocean Trench', 'Kael Abyss', '@kael_abyss',
   'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', true,
   ARRAY['#081628','#0B2D52','#0070BA','#00A8E8','#8EE4F5'], 1940, 670,
   'WCAG 2.1 AAA Ready', ARRAY['Monocromático Azul','Dark Mode Safe','Oklch Calibrado'], 'Display P3', false,
   'Degradê abissal com rigorosa transição de luminosidade Oklch Luma.', now() - interval '6 days'),

  ('nordic-glacier-frost', 'Nordic Glacier Frost', 'Astrid Oslo', '@astrid_oslo',
   'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', false,
   ARRAY['#1C232E','#3D4958','#697A8D','#CBD5E1','#F1F5F9'], 1120, 410,
   'WCAG AAA Ready', ARRAY['Minimalista','Clean Slate','Frio'], 'sRGB', false,
   'Tons de ardósia e gelo nórdico com equilíbrio perfeito de cinzas neutros.', now() - interval '7 days'),

  ('velvet-burgundy-sunset', 'Velvet Burgundy Sunset', 'Valentin V', '@valentin_v',
   'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', true,
   ARRAY['#280816','#59112F','#9B1D45','#ED3D63','#FFCAD4'], 3120, 1100,
   'WCAG AAA Ready', ARRAY['Retrô Vintage','Staff Pick','Vinho & Carmim'], 'Rec.2020', true,
   'Paleta luxuosa para moda e e-commerce de alto padrão com carmim veludo.', now() - interval '9 days'),

  ('cyberpunk-limelight', 'Cyberpunk Limelight', 'GLSL Wizard', '@glsl_wizard',
   'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', true,
   ARRAY['#0A200B','#114B15','#1FE365','#8CEE28','#F5BC00'], 874, 230,
   'WCAG AAA Ready', ARRAY['High Frequency','Neon & Cyber','Display P3'], 'Display P3', false,
   'Verdes bio-elétricos e citrino com saturação máxima para arte generativa.', now() - interval '11 days'),

  ('hyper-nordic-cyber', 'Hyper-Nordic Cyber', 'Helena Vance', '@helena.design',
   'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80', true,
   ARRAY['#00B4D8','#48CAE4','#90E0EF','#C77DFF','#FF007F'], 24800, 12100,
   'WCAG 2.1 AAA Ready', ARRAY['WCAG AAA','Cibernético Polar','P3 Gamut'], 'Display P3', true,
   'Gradiente cibernético polar com saturação balanceada para dashboards futuristas.', now() - interval '14 days'),

  ('neural-bioluminescence', 'Neural Bioluminescence', 'Helena Vance', '@helena.design',
   'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80', true,
   ARRAY['#031B28','#073B4C','#06D6A0','#00BBF9','#D8F3DC'], 19200, 8900,
   'WCAG AAA (Text Safe)', ARRAY['OKLCH Curated','Dark Mode Safe','Bio Ocean'], 'Rec.2020', true,
   'Inspirado em profundezas oceânicas com luminescência celular sutil.', now() - interval '21 days'),

  ('deep-ultraviolet-prism', 'Deep Ultraviolet Prism', 'Helena Vance', '@helena.design',
   'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80', true,
   ARRAY['#120078','#240090','#4A0E4E','#5865F2','#8EA7E9'], 31500, 15700,
   'WCAG 2.1 AAA Ready', ARRAY['P3 Gamut','Lavanda & Índigo','UI Dark Mode'], 'Display P3', true,
   'Espectro de lavandas e índigo puro calibrado para SaaS de inteligência artificial.', now() - interval '30 days'),

  ('acid-editorial-gradient', 'Acid Editorial Gradient', 'Helena Vance', '@helena.design',
   'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80', true,
   ARRAY['#440026','#BD005C','#845EC2','#D65DB1','#FFC75F'], 14700, 6400,
   'WCAG AAA Ready', ARRAY['APCA 82','Moda Digital','Vibrante'], 'Display P3', false,
   'Harmonia experimental para publicações de moda digital e pôsteres suíços contemporâneos.', now() - interval '35 days'),

  ('bauhaus-concrete-red', 'Bauhaus Concrete & Red', 'Helena Vance', '@helena.design',
   'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80', true,
   ARRAY['#1A1C20','#343A40','#6C757D','#E9ECEF','#E63946'], 11200, 4900,
   'WCAG 2.1 AAA Ready', ARRAY['Editorial','Brutalismo','Design Suíço'], 'sRGB', true,
   'Monocromático brutalista pontuado por carmesim suíço de alto impacto óptico.', now() - interval '60 days'),

  ('quantum-emerald-clean', 'Quantum Emerald Clean', 'Helena Vance', '@helena.design',
   'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80', true,
   ARRAY['#0A2527','#0F4C5C','#00A896','#02C39A','#72EFDD'], 28100, 13400,
   'WCAG 2.1 AAA Ready', ARRAY['Fintech Pro','Espectro Verde','Clean UI'], 'Display P3', true,
   'Espectro de alta legibilidade criado especialmente para plataformas financeiras e crypto.', now() - interval '75 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cms_articles (
  id, title, slug, category, summary, meta_description, content,
  author_name, read_time, status, featured, views, published_at
) VALUES
  ('a0000000-0000-4000-8000-000000000001',
   'Por que o espaço OKLCH está substituindo o HSL e HEX nos Design Systems modernos',
   'oklch-vs-hsl-design-systems', 'Teoria da Cor',
   'Uma análise matemática sobre uniformidade perceptual, interpolação de gradientes sem áreas cinzas mortas e suporte nativo em CSS com gamuts Display P3.',
   'Entenda por que o espaço perceptual OKLCH substituiu HSL e HEX nos design systems modernos.',
   $md1$O modelo HSL (Hue, Saturation, Lightness), introduzido na computação na década de 1970, foi uma excelente abstração simplificada para programadores, mas possui uma falha fundamental: ele não é perceptualmente uniforme. Um amarelo puro com 50% de lightness no HSL parece exponencialmente mais brilhante aos olhos humanos do que um azul puro com os mesmos 50% de lightness.

O espaço Oklch (desenvolvido por Björn Ottosson em 2020) resolve este problema calculando a luminosidade de acordo com a resposta física dos cones da retina humana. Quando interpolamos dois tons em Oklch ou Oklab, não passamos pelo infame "vale da morte cinzento" onde as cores intermediárias perdem saturação.

## Matriz de Aplicação Sistemática de Cores (Tokens & Gamut)

| Color role | Working hex | Best job | Failure mode |
| --- | --- | --- | --- |
| Cloud Dancer | #F0EEE9 | Large backgrounds, quiet packaging, premium editorial layouts | Beige sameness without a strong typographic anchor |
| Carbon | #1C1B1A | Body text, navigation, media panels, product names | Visual heaviness when used without breathing room |
| Butter | #F4D35C | Labels, highlights, packaging, calls to action | Cheap or juvenile treatment when saturated across large areas |
| Signal Coral | #F05A47 | Beauty, food, launches, urgency, small focal accents | Alarmism and brand sameness after repeated overuse |
| Cobalt | #315CFF | Digital products, links, technology, energetic contrast | Borrowed associations with institutional trust |
| Aubergine | #5A294D | Luxury, depth, editorial fashion, richer dark alternatives | Costume-like purple signaling without restraint |

> **Nota do Editor:** Ao aplicar tokens em telas OLED e Display P3, certifique-se de validar as taxas de contraste no algoritmo APCA para evitar fadiga ocular em leituras prolongadas.$md1$,
   'Helena Vance', '6 min de leitura', 'Publicado', true, 4890, now() - interval '30 days'),

  ('a0000000-0000-4000-8000-000000000002',
   'WCAG 2.1 vs APCA: A nova ciência do contraste perceptual para tipografia digital',
   'wcag-vs-apca-contraste-perceptual', 'Acessibilidade',
   'Como o algoritmo APCA do futuro padrão WCAG 3.0 avalia o peso da fonte, espessura dos traços e polaridade fundo-texto com precisão clínica.',
   'APCA versus WCAG 2.1: entenda a nova ciência do contraste perceptual para tipografia digital.',
   $md2$O clássico teste de razão 4.5:1 do WCAG 2.1 baseia-se em matemática simples de luminância relativa. Porém, qualquer designer sênior já notou o problema: um texto fino em cinza pode passar no teste 4.5:1 e ainda ser quase ilegível, enquanto um texto ultra-negrito com razão 4.0:1 pode ser lido sem esforço.

O Advanced Perceptual Contrast Algorithm (APCA) leva em consideração a frequência espacial, o tamanho da fonte em pixels, o peso (regular, medium, bold) e a polaridade da luz (texto claro em fundo escuro estimula a fóvea diferentemente de texto escuro em fundo claro). No Izy Colors, integramos tanto a checagem oficial WCAG 2.1 AA/AAA quanto a leitura de índice APCA Lc.

### Comparativo de Diretrizes de Acessibilidade

| Norma | Métrica Base | Foco Principal | Status no IzyColors |
| --- | --- | --- | --- |
| WCAG 2.1 | Razão de Luminância (4.5:1 / 7:1) | Contraste Mínimo Universal | Nativo / Suportado |
| WCAG 3.0 (APCA) | Frequência Espacial & Luma | Percepção Visual Real e Peso Tipográfico | Nativo / Recomendado |
| W3C Color Module 4 | Gamut P3 & OKLCH | Fidelidade de Cores em Hardware Moderno | Nativo |$md2$,
   'Helena Vance', '8 min de leitura', 'Publicado', true, 6120, now() - interval '42 days'),

  ('a0000000-0000-4000-8000-000000000003',
   'Guia definitivo para escalas de cinzas cromáticas em interfaces OLED',
   'escalas-cinzas-cromaticas-oled', 'Design Systems',
   'Evite o preto puro #000000 absoluto. Como introduzir 2% a 5% de saturação na matiz primária para enriquecer as superfícies e hierarquia.',
   'Guia para escalas de cinzas cromáticas em interfaces OLED: evite o preto puro e Enriqueça superfícies.',
   $md3$O preto puro (#000000) em telas OLED causa o efeito de pixel smearing (arrasto de pixel) durante a rolagem rápida e cria uma transição de contraste excessivamente violenta para os olhos humanos.

A abordagem suíça e moderna para Dark Mode consiste em utilizar uma cor base neutra escura com 3% a 6% de saturação (como nosso Obsidian #0B0F17 ou Charcoal #111827), alinhada à matiz do produto. Isso cria harmonia óptica entre o fundo da página e os botões primários.$md3$,
   'Marcus UI', '5 min de leitura', 'Publicado', false, 3240, now() - interval '60 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.community_submissions (
  id, title, author_name, author_handle, author_avatar, colors, tags,
  status, suggested_gamut, contrast_score, submitted_at
) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'Neon Tokyo Rain', 'Koji Sato', '@koji_creative',
   'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
   ARRAY['#0D1B2A','#1B263B','#415A77','#00E8C6','#FF0055'], ARRAY['Cyberpunk','Chuva','Dark Mode'],
   'Pendente', 'Display P3', 'WCAG AAA (8.4:1)', now() - interval '2 hours'),

  ('b0000000-0000-4000-8000-000000000002', 'Cerrado Brasileiro Seco', 'Mariana Costa', '@mari_costa_design',
   'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
   ARRAY['#3A2E2B','#7A5C43','#B88B4A','#D9A74A','#EAE0CC'], ARRAY['Outuno & Terra','Brasil','Natureza'],
   'Pendente', 'sRGB', 'WCAG AAA (9.1:1)', now() - interval '1 day'),

  ('b0000000-0000-4000-8000-000000000003', 'Scandinavian Birch Minimal', 'Lars Lindqvist', '@lars_arch',
   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
   ARRAY['#1E2022','#52616B','#C9D6DF','#F0F5F9','#D8B384'], ARRAY['Minimalista','Arquitetura','Nórdico'],
   'Aprovado', 'sRGB', 'WCAG AA (5.2:1)', now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 11. Notas de operação
-- ============================================================================
-- Para promover o primeiro administrador (execute uma única vez no SQL Editor):
--
--   UPDATE public.profiles SET role = 'admin' WHERE email = 'seu@email.com';
--
-- A promotion é feita diretamente no banco porque não existe caminho seguro
-- para concedê-la pela aplicação: qualquer rota de auto-promoção seria
-- explorável por um cliente mal-intencionado.