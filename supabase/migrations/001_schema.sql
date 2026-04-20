-- =====================================================================
-- H3 Dashboard — Migration 001: Schema completo
-- Executa em ordem. Supabase aplica via `supabase db push`.
-- =====================================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- =====================================================================
-- ENUMS
-- =====================================================================

CREATE TYPE public.revenue_model AS ENUM (
  'first_sale',
  'cohort_ltv',
  'multi_product'
);

CREATE TYPE public.objective_type AS ENUM (
  'captacao',
  'venda_direta',
  'alcance',
  'seguidores'
);

CREATE TYPE public.ad_platform AS ENUM (
  'meta',
  'google',
  'tiktok',
  'instagram_organic'
);

CREATE TYPE public.lead_status AS ENUM (
  'novo',
  'qualificado',
  'negociacao',
  'ganho',
  'perdido'
);

CREATE TYPE public.lead_entry_point AS ENUM (
  'form',
  'whatsapp',
  'landing_page',
  'direct',
  'organic'
);

CREATE TYPE public.sale_status AS ENUM (
  'confirmed',
  'refunded',
  'chargeback'
);

CREATE TYPE public.ingestion_job_type AS ENUM (
  'daily_sync',
  'backfill',
  'incremental'
);

CREATE TYPE public.ingestion_job_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'partial'
);

CREATE TYPE public.user_role AS ENUM (
  'h3_admin',
  'h3_analyst',
  'client'
);

CREATE TYPE public.account_role AS ENUM (
  'viewer',
  'analyst',
  'admin'
);

-- =====================================================================
-- PERFIS (extensão de auth.users do Supabase)
-- =====================================================================

CREATE TABLE public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        VARCHAR(255),
  role        public.user_role NOT NULL DEFAULT 'client',
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: cria profile automaticamente ao criar usuário no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- ORGANIZAÇÕES E CONTAS
-- =====================================================================

CREATE TABLE public.organizations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.accounts (
  id                      UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID              NOT NULL REFERENCES public.organizations(id),
  name                    VARCHAR(255)      NOT NULL,
  slug                    VARCHAR(100)      NOT NULL,

  -- Modelo de receita → determina a fórmula de ROAS
  revenue_model           public.revenue_model NOT NULL DEFAULT 'first_sale',

  -- Config first_sale
  attribution_window_days INTEGER           NOT NULL DEFAULT 30,

  -- Config cohort_ltv
  cohort_avg_months       NUMERIC(5,2),
  cohort_margin           NUMERIC(5,4),

  -- Multi-tenancy
  is_demo                 BOOLEAN           NOT NULL DEFAULT FALSE,
  is_internal             BOOLEAN           NOT NULL DEFAULT FALSE,

  -- Referência no H3 CRM
  crm_account_id          VARCHAR(255),

  is_active               BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_account_slug UNIQUE (organization_id, slug),
  CONSTRAINT chk_cohort_config CHECK (
    revenue_model != 'cohort_ltv'
    OR (cohort_avg_months IS NOT NULL AND cohort_margin IS NOT NULL)
  )
);

CREATE INDEX idx_accounts_org     ON public.accounts(organization_id);
CREATE INDEX idx_accounts_is_demo ON public.accounts(is_demo) WHERE is_demo = TRUE;

-- Acesso usuário <-> Conta
CREATE TABLE public.user_account_access (
  user_id     UUID               NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id  UUID               NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  role        public.account_role NOT NULL DEFAULT 'viewer',
  granted_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  granted_by  UUID               REFERENCES public.profiles(id),

  PRIMARY KEY (user_id, account_id)
);

CREATE INDEX idx_uaa_account ON public.user_account_access(account_id);

-- =====================================================================
-- HIERARQUIA DE CAMPANHAS
-- =====================================================================

CREATE TABLE public.objectives (
  id          UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID                  NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  type        public.objective_type NOT NULL,
  name        VARCHAR(255)          NOT NULL,
  description TEXT,
  is_active   BOOLEAN               NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_objectives_account ON public.objectives(account_id);

CREATE TABLE public.campaigns (
  id                   UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id           UUID               NOT NULL REFERENCES public.accounts(id),
  objective_id         UUID               NOT NULL REFERENCES public.objectives(id),

  platform             public.ad_platform NOT NULL,
  platform_campaign_id VARCHAR(255)       NOT NULL,

  name                 VARCHAR(500)       NOT NULL,
  status               VARCHAR(50)        NOT NULL DEFAULT 'ACTIVE',

  platform_created_at  TIMESTAMPTZ,
  created_at           TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_campaign_platform UNIQUE (platform, platform_campaign_id)
);

CREATE INDEX idx_campaigns_account   ON public.campaigns(account_id);
CREATE INDEX idx_campaigns_objective ON public.campaigns(objective_id);

CREATE TABLE public.ad_sets (
  id                 UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id        UUID               NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  account_id         UUID               NOT NULL REFERENCES public.accounts(id),

  platform_ad_set_id VARCHAR(255)       NOT NULL,
  name               VARCHAR(500)       NOT NULL,
  status             VARCHAR(50)        NOT NULL DEFAULT 'ACTIVE',
  targeting_summary  JSONB,

  created_at         TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_adset_platform UNIQUE (campaign_id, platform_ad_set_id)
);

CREATE INDEX idx_adsets_account ON public.ad_sets(account_id);

CREATE TABLE public.creatives (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_set_id            UUID        NOT NULL REFERENCES public.ad_sets(id) ON DELETE CASCADE,
  campaign_id          UUID        NOT NULL REFERENCES public.campaigns(id),
  account_id           UUID        NOT NULL REFERENCES public.accounts(id),

  platform_creative_id VARCHAR(255) NOT NULL,
  name                 VARCHAR(500) NOT NULL,
  status               VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
  format               VARCHAR(50),
  thumbnail_url        TEXT,

  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_creative_platform UNIQUE (ad_set_id, platform_creative_id)
);

CREATE INDEX idx_creatives_account  ON public.creatives(account_id);
CREATE INDEX idx_creatives_campaign ON public.creatives(campaign_id);

-- =====================================================================
-- PRODUTOS
-- =====================================================================

CREATE TABLE public.products (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id     UUID         NOT NULL REFERENCES public.accounts(id),
  name           VARCHAR(255) NOT NULL,
  price          NUMERIC(12,2),
  currency       CHAR(3)      NOT NULL DEFAULT 'BRL',
  crm_product_id VARCHAR(255),
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_account ON public.products(account_id);

-- =====================================================================
-- LEADS E VENDAS (fonte: H3 CRM)
-- =====================================================================

CREATE TABLE public.leads (
  id             UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id     UUID                    NOT NULL REFERENCES public.accounts(id),
  crm_lead_id    VARCHAR(255)            NOT NULL,

  -- Atribuição
  campaign_id    UUID                    REFERENCES public.campaigns(id),
  ad_set_id      UUID                    REFERENCES public.ad_sets(id),
  creative_id    UUID                    REFERENCES public.creatives(id),

  -- UTMs (colunas dedicadas — query-heavy)
  utm_source     VARCHAR(255),
  utm_medium     VARCHAR(255),
  utm_campaign   VARCHAR(255),
  utm_content    VARCHAR(255),
  utm_term       VARCHAR(255),

  -- WhatsApp
  entry_point          public.lead_entry_point,
  whatsapp_number_hash VARCHAR(64),

  status         public.lead_status NOT NULL DEFAULT 'novo',

  -- PII criptografado at-rest (AES-256-GCM na camada de aplicação)
  -- Estes campos armazenam bytes encrypted via packages/shared/src/crypto
  name_enc       BYTEA,
  email_enc      BYTEA,
  phone_hash     VARCHAR(64),

  first_contact_at  TIMESTAMPTZ NOT NULL,
  qualified_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_lead_crm UNIQUE (account_id, crm_lead_id)
);

CREATE INDEX idx_leads_account      ON public.leads(account_id);
CREATE INDEX idx_leads_campaign     ON public.leads(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_leads_utm_campaign ON public.leads(utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX idx_leads_status       ON public.leads(account_id, status);
CREATE INDEX idx_leads_contact_at   ON public.leads(account_id, first_contact_at);

CREATE TABLE public.sales (
  id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID              NOT NULL REFERENCES public.accounts(id),
  lead_id           UUID              NOT NULL REFERENCES public.leads(id),
  product_id        UUID              REFERENCES public.products(id),
  crm_sale_id       VARCHAR(255)      NOT NULL,

  -- Atribuição herdada do Lead (desnormalizado para performance)
  campaign_id       UUID              REFERENCES public.campaigns(id),
  ad_set_id         UUID              REFERENCES public.ad_sets(id),
  creative_id       UUID              REFERENCES public.creatives(id),

  amount            NUMERIC(12,2)     NOT NULL,
  currency          CHAR(3)           NOT NULL DEFAULT 'BRL',

  -- cohort_ltv: recorrência
  is_recurring      BOOLEAN           NOT NULL DEFAULT FALSE,
  subscription_month INTEGER,

  status            public.sale_status NOT NULL DEFAULT 'confirmed',
  confirmed_at      TIMESTAMPTZ        NOT NULL,

  created_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_sale_crm UNIQUE (account_id, crm_sale_id)
);

CREATE INDEX idx_sales_account       ON public.sales(account_id);
CREATE INDEX idx_sales_campaign_date ON public.sales(campaign_id, confirmed_at) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_sales_account_date  ON public.sales(account_id, confirmed_at);
CREATE INDEX idx_sales_lead          ON public.sales(lead_id);
CREATE INDEX idx_sales_confirmed     ON public.sales(account_id, confirmed_at) WHERE status = 'confirmed';

-- =====================================================================
-- FATO: Métricas diárias de Ads
-- Particionada por mês via pg_partman (configurado abaixo)
-- =====================================================================

CREATE TABLE public.fact_ad_metrics_daily (
  account_id          UUID               NOT NULL REFERENCES public.accounts(id),
  campaign_id         UUID               NOT NULL REFERENCES public.campaigns(id),
  ad_set_id           UUID               REFERENCES public.ad_sets(id),
  creative_id         UUID               REFERENCES public.creatives(id),
  platform            public.ad_platform NOT NULL,
  metric_date         DATE               NOT NULL,

  spend               NUMERIC(14,4)      NOT NULL DEFAULT 0,
  impressions         BIGINT             NOT NULL DEFAULT 0,
  clicks              BIGINT             NOT NULL DEFAULT 0,

  -- Métricas declaradas pela plataforma (NÃO usadas no ROAS H3)
  platform_conversions      INTEGER DEFAULT 0,
  platform_conversion_value NUMERIC(14,4) DEFAULT 0,

  -- Métricas derivadas (GENERATED STORED)
  ctr  NUMERIC(10,8) GENERATED ALWAYS AS (
    CASE WHEN impressions > 0 THEN clicks::numeric / impressions ELSE 0 END
  ) STORED,
  cpc  NUMERIC(12,4) GENERATED ALWAYS AS (
    CASE WHEN clicks > 0 THEN spend / clicks ELSE 0 END
  ) STORED,
  cpm  NUMERIC(12,4) GENERATED ALWAYS AS (
    CASE WHEN impressions > 0 THEN (spend / impressions) * 1000 ELSE 0 END
  ) STORED,

  ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_checksum VARCHAR(64),

  PRIMARY KEY (account_id, campaign_id, metric_date, platform)
) PARTITION BY RANGE (metric_date);

-- Partições iniciais (2024 + 2025 + 2026)
DO $$
DECLARE
  yr INT;
  mo INT;
  start_date DATE;
  end_date DATE;
  tbl_name TEXT;
BEGIN
  FOR yr IN 2024..2026 LOOP
    FOR mo IN 1..12 LOOP
      start_date := make_date(yr, mo, 1);
      end_date   := start_date + INTERVAL '1 month';
      tbl_name   := format('fact_ad_metrics_daily_%s_%s', yr, lpad(mo::text, 2, '0'));
      EXECUTE format(
        'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.fact_ad_metrics_daily FOR VALUES FROM (%L) TO (%L)',
        tbl_name, start_date, end_date
      );
    END LOOP;
  END LOOP;
END;
$$;

CREATE INDEX idx_fact_account_date  ON public.fact_ad_metrics_daily(account_id, metric_date);
CREATE INDEX idx_fact_campaign_date ON public.fact_ad_metrics_daily(campaign_id, metric_date);

-- =====================================================================
-- CONTROLE DE INGESTÃO
-- =====================================================================

CREATE TABLE public.ingestion_jobs (
  id                UUID                         PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID                         NOT NULL REFERENCES public.accounts(id),
  platform          public.ad_platform           NOT NULL,
  job_type          public.ingestion_job_type    NOT NULL,

  date_start        DATE                         NOT NULL,
  date_end          DATE                         NOT NULL,

  status            public.ingestion_job_status  NOT NULL DEFAULT 'pending',
  records_fetched   INTEGER                      NOT NULL DEFAULT 0,
  records_processed INTEGER                      NOT NULL DEFAULT 0,
  records_failed    INTEGER                      NOT NULL DEFAULT 0,

  last_error        TEXT,
  retry_count       SMALLINT                     NOT NULL DEFAULT 0,

  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ                  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ingestion_status ON public.ingestion_jobs(account_id, status, created_at DESC);

-- =====================================================================
-- AUDITORIA (LGPD)
-- =====================================================================

CREATE TABLE public.audit_log (
  id            BIGSERIAL    PRIMARY KEY,
  user_id       UUID         REFERENCES public.profiles(id),
  account_id    UUID         REFERENCES public.accounts(id),
  action        VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id   UUID,
  ip_address    INET,
  user_agent    TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE public.audit_log_2025 PARTITION OF public.audit_log
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE public.audit_log_2026 PARTITION OF public.audit_log
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE public.audit_log_2027 PARTITION OF public.audit_log
  FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

CREATE INDEX idx_audit_user    ON public.audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_account ON public.audit_log(account_id, created_at DESC);

-- =====================================================================
-- UPDATED_AT automático (trigger genérico)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'profiles', 'organizations', 'accounts', 'objectives',
    'campaigns', 'ad_sets', 'creatives', 'products', 'leads', 'sales'
  ]) LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      tbl
    );
  END LOOP;
END;
$$;
