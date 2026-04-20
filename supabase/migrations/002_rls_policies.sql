-- =====================================================================
-- H3 Dashboard — Migration 002: Row Level Security
-- Duas camadas de isolamento:
--   1. Middleware da API (tenant-scope.ts) — primeira linha
--   2. RLS Supabase — safety net obrigatório
-- =====================================================================

-- Habilita RLS em todas as tabelas sensíveis
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_account_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_sets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creatives           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_ad_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_jobs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log           ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- Função auxiliar: verifica se usuário é H3 interno
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_h3_staff()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('h3_admin', 'h3_analyst')
    AND is_active = TRUE
  );
$$;

-- ─────────────────────────────────────────────
-- Função auxiliar: contas acessíveis pelo usuário
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.my_account_ids()
RETURNS SETOF UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT account_id
  FROM public.user_account_access
  WHERE user_id = auth.uid();
$$;

-- =====================================================================
-- PROFILES — usuário vê apenas o próprio perfil
-- =====================================================================

CREATE POLICY profiles_select ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR public.is_h3_staff()
  );

CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- =====================================================================
-- ACCOUNTS — H3 staff vê tudo; cliente vê só as suas
-- =====================================================================

CREATE POLICY accounts_select ON public.accounts
  FOR SELECT USING (
    public.is_h3_staff()
    OR id IN (SELECT public.my_account_ids())
  );

-- Apenas h3_admin pode criar/modificar contas
CREATE POLICY accounts_insert ON public.accounts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'h3_admin'
    )
  );

CREATE POLICY accounts_update ON public.accounts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'h3_admin'
    )
  );

-- =====================================================================
-- USER_ACCOUNT_ACCESS
-- =====================================================================

CREATE POLICY uaa_select ON public.user_account_access
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_h3_staff()
  );

-- =====================================================================
-- OBJETIVOS, CAMPANHAS, AD SETS, CRIATIVOS, PRODUTOS
-- Política uniforme: H3 staff tudo, cliente só suas contas
-- =====================================================================

CREATE POLICY objectives_select ON public.objectives
  FOR SELECT USING (
    public.is_h3_staff()
    OR account_id IN (SELECT public.my_account_ids())
  );

CREATE POLICY campaigns_select ON public.campaigns
  FOR SELECT USING (
    public.is_h3_staff()
    OR account_id IN (SELECT public.my_account_ids())
  );

CREATE POLICY ad_sets_select ON public.ad_sets
  FOR SELECT USING (
    public.is_h3_staff()
    OR account_id IN (SELECT public.my_account_ids())
  );

CREATE POLICY creatives_select ON public.creatives
  FOR SELECT USING (
    public.is_h3_staff()
    OR account_id IN (SELECT public.my_account_ids())
  );

CREATE POLICY products_select ON public.products
  FOR SELECT USING (
    public.is_h3_staff()
    OR account_id IN (SELECT public.my_account_ids())
  );

-- =====================================================================
-- LEADS — dados com PII; acesso auditado via audit_log
-- =====================================================================

CREATE POLICY leads_select ON public.leads
  FOR SELECT USING (
    public.is_h3_staff()
    OR account_id IN (SELECT public.my_account_ids())
  );

-- =====================================================================
-- SALES
-- =====================================================================

CREATE POLICY sales_select ON public.sales
  FOR SELECT USING (
    public.is_h3_staff()
    OR account_id IN (SELECT public.my_account_ids())
  );

-- =====================================================================
-- FACT_AD_METRICS_DAILY
-- =====================================================================

CREATE POLICY fact_metrics_select ON public.fact_ad_metrics_daily
  FOR SELECT USING (
    public.is_h3_staff()
    OR account_id IN (SELECT public.my_account_ids())
  );

-- =====================================================================
-- INGESTION_JOBS — apenas H3 staff
-- =====================================================================

CREATE POLICY ingestion_select ON public.ingestion_jobs
  FOR SELECT USING (public.is_h3_staff());

CREATE POLICY ingestion_insert ON public.ingestion_jobs
  FOR INSERT WITH CHECK (public.is_h3_staff());

CREATE POLICY ingestion_update ON public.ingestion_jobs
  FOR UPDATE USING (public.is_h3_staff());

-- =====================================================================
-- AUDIT_LOG — cada usuário vê apenas os próprios registros; H3 vê tudo
-- =====================================================================

CREATE POLICY audit_select ON public.audit_log
  FOR SELECT USING (
    public.is_h3_staff()
    OR user_id = auth.uid()
  );

-- =====================================================================
-- SERVICE ROLE: bypassa RLS automaticamente no Supabase
-- O apps/workers usa a SUPABASE_SERVICE_ROLE_KEY → acesso total sem policy
-- Não é necessário criar políticas de INSERT/UPDATE para workers:
-- elas rodam como service_role que ignora RLS.
-- =====================================================================
