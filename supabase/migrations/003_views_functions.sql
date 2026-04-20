-- =====================================================================
-- H3 Dashboard — Migration 003: Materialized Views e Funções SQL
-- =====================================================================

-- =====================================================================
-- MATERIALIZED VIEW: Aggregação diária por Conta (Home View)
-- Refresh: pg_cron a cada hora
-- =====================================================================

CREATE MATERIALIZED VIEW public.mv_account_daily AS
SELECT
  account_id,
  metric_date,
  SUM(spend)       AS total_spend,
  SUM(impressions) AS total_impressions,
  SUM(clicks)      AS total_clicks,
  COUNT(DISTINCT campaign_id) AS active_campaigns
FROM public.fact_ad_metrics_daily
GROUP BY account_id, metric_date
WITH DATA;

CREATE UNIQUE INDEX idx_mv_account_daily
  ON public.mv_account_daily(account_id, metric_date);

-- =====================================================================
-- MATERIALIZED VIEW: Aggregação diária por Objetivo
-- =====================================================================

CREATE MATERIALIZED VIEW public.mv_objective_daily AS
SELECT
  f.account_id,
  c.objective_id,
  f.metric_date,
  SUM(f.spend)       AS total_spend,
  SUM(f.impressions) AS total_impressions,
  SUM(f.clicks)      AS total_clicks,
  COUNT(DISTINCT f.campaign_id) AS campaign_count
FROM public.fact_ad_metrics_daily f
JOIN public.campaigns c ON c.id = f.campaign_id
GROUP BY f.account_id, c.objective_id, f.metric_date
WITH DATA;

CREATE UNIQUE INDEX idx_mv_objective_daily
  ON public.mv_objective_daily(account_id, objective_id, metric_date);

-- =====================================================================
-- MATERIALIZED VIEW: Aggregação diária por Campanha
-- Usado na Visão Campanha e ranking de criativos
-- =====================================================================

CREATE MATERIALIZED VIEW public.mv_campaign_daily AS
SELECT
  account_id,
  campaign_id,
  metric_date,
  SUM(spend)       AS total_spend,
  SUM(impressions) AS total_impressions,
  SUM(clicks)      AS total_clicks
FROM public.fact_ad_metrics_daily
GROUP BY account_id, campaign_id, metric_date
WITH DATA;

CREATE UNIQUE INDEX idx_mv_campaign_daily
  ON public.mv_campaign_daily(account_id, campaign_id, metric_date);

-- =====================================================================
-- FUNÇÃO: Refresh all MVs (chamada pelo pg_cron)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.refresh_all_mvs()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_account_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_objective_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_campaign_daily;
END;
$$;

-- pg_cron: refresh a cada hora (ajustar conforme uso)
SELECT cron.schedule(
  'refresh-mvs-hourly',
  '0 * * * *',
  'SELECT public.refresh_all_mvs()'
);

-- =====================================================================
-- FUNÇÃO: Spend total de uma Conta em um período
-- Usada como base para todas as queries de ROAS na API
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_account_spend(
  p_account_id UUID,
  p_from       DATE,
  p_to         DATE
)
RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(SUM(total_spend), 0)
  FROM public.mv_account_daily
  WHERE account_id = p_account_id
    AND metric_date BETWEEN p_from AND p_to;
$$;

-- =====================================================================
-- FUNÇÃO: Receita confirmada de uma Conta em um período (first_sale)
-- Considera apenas status = 'confirmed'
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_account_revenue_first_sale(
  p_account_id         UUID,
  p_from               DATE,
  p_to                 DATE,
  p_attribution_window INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_revenue NUMERIC,
  sales_count   BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    COALESCE(SUM(s.amount), 0) AS total_revenue,
    COUNT(*)                   AS sales_count
  FROM public.sales s
  JOIN public.leads l ON l.id = s.lead_id
  WHERE s.account_id = p_account_id
    AND s.status = 'confirmed'
    -- lead entrou no período
    AND l.first_contact_at::date BETWEEN p_from AND p_to
    -- venda ocorreu dentro da janela de atribuição
    AND s.confirmed_at <= l.first_contact_at + (p_attribution_window || ' days')::INTERVAL;
$$;

-- =====================================================================
-- FUNÇÃO: Funil de uma Campanha em um período
-- Retorna impressões → cliques → leads → leads qualificados → vendas
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_campaign_funnel(
  p_campaign_id UUID,
  p_from        DATE,
  p_to          DATE
)
RETURNS TABLE (
  impressions       BIGINT,
  clicks            BIGINT,
  leads             BIGINT,
  leads_qualified   BIGINT,
  sales             BIGINT,
  spend             NUMERIC
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    (SELECT COALESCE(SUM(total_impressions), 0) FROM public.mv_campaign_daily
     WHERE campaign_id = p_campaign_id AND metric_date BETWEEN p_from AND p_to) AS impressions,
    (SELECT COALESCE(SUM(total_clicks), 0)      FROM public.mv_campaign_daily
     WHERE campaign_id = p_campaign_id AND metric_date BETWEEN p_from AND p_to) AS clicks,
    (SELECT COUNT(*) FROM public.leads
     WHERE campaign_id = p_campaign_id
       AND first_contact_at::date BETWEEN p_from AND p_to)                     AS leads,
    (SELECT COUNT(*) FROM public.leads
     WHERE campaign_id = p_campaign_id
       AND status IN ('qualificado', 'negociacao', 'ganho')
       AND first_contact_at::date BETWEEN p_from AND p_to)                     AS leads_qualified,
    (SELECT COUNT(*) FROM public.sales
     WHERE campaign_id = p_campaign_id
       AND status = 'confirmed'
       AND confirmed_at::date BETWEEN p_from AND p_to)                         AS sales,
    (SELECT COALESCE(SUM(total_spend), 0) FROM public.mv_campaign_daily
     WHERE campaign_id = p_campaign_id AND metric_date BETWEEN p_from AND p_to) AS spend;
$$;

-- =====================================================================
-- FUNÇÃO: Receita atribuída a uma Campanha (cross-objetivo)
-- Qualquer campanha pode gerar receita, independente do objetivo declarado
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_campaign_attributed_revenue(
  p_campaign_id        UUID,
  p_from               DATE,
  p_to                 DATE,
  p_attribution_window INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_revenue NUMERIC,
  sales_count   BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    COALESCE(SUM(s.amount), 0) AS total_revenue,
    COUNT(*)                   AS sales_count
  FROM public.sales s
  JOIN public.leads l ON l.id = s.lead_id
  WHERE s.campaign_id = p_campaign_id
    AND s.status = 'confirmed'
    AND l.first_contact_at::date BETWEEN p_from AND p_to
    AND s.confirmed_at <= l.first_contact_at + (p_attribution_window || ' days')::INTERVAL;
$$;

-- =====================================================================
-- FUNÇÃO: Upsert de métrica diária de Ad (chamada pelos workers)
-- Garante idempotência: reprocessar o mesmo dia não duplica dados
-- =====================================================================

CREATE OR REPLACE FUNCTION public.upsert_ad_metric(
  p_account_id          UUID,
  p_campaign_id         UUID,
  p_ad_set_id           UUID,
  p_creative_id         UUID,
  p_platform            public.ad_platform,
  p_metric_date         DATE,
  p_spend               NUMERIC,
  p_impressions         BIGINT,
  p_clicks              BIGINT,
  p_platform_conversions INTEGER DEFAULT 0,
  p_platform_conversion_value NUMERIC DEFAULT 0,
  p_source_checksum     VARCHAR DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.fact_ad_metrics_daily (
    account_id, campaign_id, ad_set_id, creative_id,
    platform, metric_date,
    spend, impressions, clicks,
    platform_conversions, platform_conversion_value,
    source_checksum
  ) VALUES (
    p_account_id, p_campaign_id, p_ad_set_id, p_creative_id,
    p_platform, p_metric_date,
    p_spend, p_impressions, p_clicks,
    p_platform_conversions, p_platform_conversion_value,
    p_source_checksum
  )
  ON CONFLICT (account_id, campaign_id, metric_date, platform)
  DO UPDATE SET
    spend                     = EXCLUDED.spend,
    impressions               = EXCLUDED.impressions,
    clicks                    = EXCLUDED.clicks,
    platform_conversions      = EXCLUDED.platform_conversions,
    platform_conversion_value = EXCLUDED.platform_conversion_value,
    source_checksum           = EXCLUDED.source_checksum,
    ingested_at               = NOW();
END;
$$;
