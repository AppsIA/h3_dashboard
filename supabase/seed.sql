-- =====================================================================
-- H3 Dashboard — Seed: Dados Demo Reprodutíveis
-- Conta DEMO com dados sintéticos coerentes para pitches e testes.
-- Seed fixo: mesmos dados toda vez que rodar (UUIDs hardcoded).
-- =====================================================================

-- ─────────────────────────────────────────────
-- ORGANIZAÇÃO E CONTA DEMO
-- ─────────────────────────────────────────────

INSERT INTO public.organizations (id, name, slug) VALUES
  ('00000000-0000-0000-0000-000000000001', 'H3 Labs Demo', 'h3-labs-demo')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.accounts (
  id, organization_id, name, slug,
  revenue_model, attribution_window_days,
  is_demo, is_internal, crm_account_id
) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Clínica Estética Fernanda — DEMO',
    'clinica-fernanda-demo',
    'first_sale',
    30,
    TRUE, FALSE,
    'crm-demo-001'
  )
ON CONFLICT (id) DO NOTHING;

-- Conta interna H3 (não demo)
INSERT INTO public.accounts (
  id, organization_id, name, slug,
  revenue_model, attribution_window_days,
  is_demo, is_internal
) VALUES
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'H3 Labs — Interno',
    'h3-labs-interno',
    'multi_product',
    45,
    FALSE, TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- OBJETIVOS DA CONTA DEMO
-- ─────────────────────────────────────────────

INSERT INTO public.objectives (id, account_id, type, name) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'captacao',     'Captação de Leads'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'venda_direta',  'Venda Direta'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'alcance',       'Alcance e Autoridade'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'seguidores',    'Crescimento de Seguidores')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- CAMPANHAS
-- ─────────────────────────────────────────────

INSERT INTO public.campaigns (id, account_id, objective_id, platform, platform_campaign_id, name, status) VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'meta',   'demo-meta-001', 'Captação — Harmonização Facial [V1]', 'ACTIVE'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'meta',   'demo-meta-002', 'Captação — Botox Preventivo [V1]',    'ACTIVE'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'google', 'demo-ggl-001',  'Captação — Search Estética Facial',   'ACTIVE'),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'meta',   'demo-meta-003', 'Venda — Pacote Premium',             'ACTIVE'),
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'meta',   'demo-meta-004', 'Autoridade — Antes e Depois',         'PAUSED')
ON CONFLICT (platform, platform_campaign_id) DO NOTHING;

-- ─────────────────────────────────────────────
-- PRODUTOS
-- ─────────────────────────────────────────────

INSERT INTO public.products (id, account_id, name, price) VALUES
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Harmonização Facial Completa',  2800.00),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Botox Preventivo',               900.00),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Pacote Premium 3 Procedimentos', 5500.00)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- MÉTRICAS DIÁRIAS (últimos 90 dias sintéticos)
-- ─────────────────────────────────────────────

DO $$
DECLARE
  d DATE;
  base_date DATE := CURRENT_DATE - 90;
  i INT;
  spend_factor NUMERIC;
  camp_id UUID;
  acc_id UUID := '10000000-0000-0000-0000-000000000001'::UUID;
  campaigns UUID[] := ARRAY[
    '30000000-0000-0000-0000-000000000001'::UUID,
    '30000000-0000-0000-0000-000000000002'::UUID,
    '30000000-0000-0000-0000-000000000003'::UUID,
    '30000000-0000-0000-0000-000000000004'::UUID
  ];
BEGIN
  FOR i IN 0..89 LOOP
    d := base_date + i;
    -- Mais gasto no meio da semana, menos no fim de semana
    spend_factor := CASE EXTRACT(DOW FROM d)
      WHEN 0 THEN 0.6  -- Domingo
      WHEN 6 THEN 0.7  -- Sábado
      ELSE 1.0
    END;

    FOREACH camp_id IN ARRAY campaigns LOOP
      INSERT INTO public.fact_ad_metrics_daily (
        account_id, campaign_id, platform, metric_date,
        spend, impressions, clicks
      ) VALUES (
        acc_id,
        camp_id,
        CASE camp_id
          WHEN '30000000-0000-0000-0000-000000000003'::UUID THEN 'google'::public.ad_platform
          ELSE 'meta'::public.ad_platform
        END,
        d,
        -- spend varia por campanha e dia
        ROUND(
          CASE camp_id
            WHEN '30000000-0000-0000-0000-000000000001'::UUID THEN 180 * spend_factor
            WHEN '30000000-0000-0000-0000-000000000002'::UUID THEN 120 * spend_factor
            WHEN '30000000-0000-0000-0000-000000000003'::UUID THEN 90  * spend_factor
            WHEN '30000000-0000-0000-0000-000000000004'::UUID THEN 60  * spend_factor
            ELSE 50 * spend_factor
          END
          -- leve variação aleatória deterministicamente baseada no dia
          + ((i % 7) - 3) * 5.0,
          2
        ),
        -- impressões
        CASE camp_id
          WHEN '30000000-0000-0000-0000-000000000001'::UUID THEN 4200 + (i % 5) * 100
          WHEN '30000000-0000-0000-0000-000000000002'::UUID THEN 3100 + (i % 4) * 80
          WHEN '30000000-0000-0000-0000-000000000003'::UUID THEN 1800 + (i % 3) * 60
          WHEN '30000000-0000-0000-0000-000000000004'::UUID THEN 2200 + (i % 6) * 70
          ELSE 1500
        END,
        -- cliques (CTR ~2%)
        CASE camp_id
          WHEN '30000000-0000-0000-0000-000000000001'::UUID THEN 84 + (i % 5) * 2
          WHEN '30000000-0000-0000-0000-000000000002'::UUID THEN 62 + (i % 4) * 2
          WHEN '30000000-0000-0000-0000-000000000003'::UUID THEN 54 + (i % 3) * 2
          WHEN '30000000-0000-0000-0000-000000000004'::UUID THEN 44 + (i % 6) * 2
          ELSE 30
        END
      )
      ON CONFLICT (account_id, campaign_id, metric_date, platform) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────
-- LEADS DEMO (sem PII real — dados fictícios)
-- ─────────────────────────────────────────────

DO $$
DECLARE
  i INT;
  d DATE;
  base_date DATE := CURRENT_DATE - 90;
  camp_ids UUID[] := ARRAY[
    '30000000-0000-0000-0000-000000000001'::UUID,
    '30000000-0000-0000-0000-000000000002'::UUID,
    '30000000-0000-0000-0000-000000000003'::UUID
  ];
  camp_id UUID;
  lead_id UUID;
  lead_status public.lead_status;
  acc_id UUID := '10000000-0000-0000-0000-000000000001'::UUID;
BEGIN
  FOR i IN 1..450 LOOP
    d := base_date + (i % 90);
    camp_id := camp_ids[1 + (i % 3)];
    lead_id := gen_random_uuid();

    lead_status := CASE
      WHEN i % 10 = 0 THEN 'ganho'::public.lead_status
      WHEN i % 7  = 0 THEN 'perdido'::public.lead_status
      WHEN i % 5  = 0 THEN 'negociacao'::public.lead_status
      WHEN i % 3  = 0 THEN 'qualificado'::public.lead_status
      ELSE 'novo'::public.lead_status
    END;

    INSERT INTO public.leads (
      id, account_id, crm_lead_id,
      campaign_id,
      utm_source, utm_medium, utm_campaign,
      entry_point, status, first_contact_at
    ) VALUES (
      lead_id,
      acc_id,
      'demo-lead-' || i,
      camp_id,
      CASE camp_id
        WHEN '30000000-0000-0000-0000-000000000003'::UUID THEN 'google'
        ELSE 'facebook'
      END,
      'paid',
      CASE camp_id
        WHEN '30000000-0000-0000-0000-000000000001'::UUID THEN 'captacao-harmonizacao-v1'
        WHEN '30000000-0000-0000-0000-000000000002'::UUID THEN 'captacao-botox-v1'
        ELSE 'captacao-search-facial'
      END,
      CASE (i % 2)
        WHEN 0 THEN 'whatsapp'::public.lead_entry_point
        ELSE 'form'::public.lead_entry_point
      END,
      lead_status,
      (d || ' ' || lpad((8 + i % 12)::text, 2, '0') || ':00:00')::TIMESTAMPTZ
    )
    ON CONFLICT (account_id, crm_lead_id) DO NOTHING;

    -- Para leads ganhos, cria venda
    IF lead_status = 'ganho' THEN
      INSERT INTO public.sales (
        account_id, lead_id, product_id, crm_sale_id,
        campaign_id,
        amount, is_recurring, status, confirmed_at
      ) VALUES (
        acc_id,
        lead_id,
        CASE (i % 3)
          WHEN 0 THEN '50000000-0000-0000-0000-000000000001'::UUID
          WHEN 1 THEN '50000000-0000-0000-0000-000000000002'::UUID
          ELSE       '50000000-0000-0000-0000-000000000003'::UUID
        END,
        'demo-sale-' || i,
        camp_id,
        CASE (i % 3)
          WHEN 0 THEN 2800.00
          WHEN 1 THEN 900.00
          ELSE 5500.00
        END,
        FALSE,
        'confirmed',
        (d + (i % 15 + 1) || ' days')::TIMESTAMPTZ
      )
      ON CONFLICT (account_id, crm_sale_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Refresh MVs após seed
SELECT public.refresh_all_mvs();
