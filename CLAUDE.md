# H3 Dashboard — Contexto para Claude Code

## O que é este projeto

**H3 Dashboard** é o produto de observabilidade de receita e performance de aquisição da H3 Labs.
Centraliza dados de Meta Ads, Google Ads e H3 CRM para calcular o **ROAS real** de cada conta cliente.

Repositório monorepo com:
- `apps/api` — Fastify REST API (TypeScript)
- `apps/workers` — BullMQ processors de ingestão (TypeScript)
- `apps/web` — Next.js frontend (gerado via Lovable, sincronizado via GitHub)
- `packages/domain` — lógica de negócio: fórmulas de ROAS, atribuição
- `packages/shared` — tipos TypeScript, crypto PII
- `packages/integrations` — clientes Meta Ads API, Google Ads API, H3 CRM

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Database + Auth | Supabase (Postgres 16 + RLS + Auth) |
| API | Fastify 5 + Drizzle ORM |
| Cache + Queue | Upstash Redis + BullMQ |
| Frontend | Next.js (Lovable) |
| Hosting | Vercel (web) + Railway (api + workers) |

## Regras de negócio críticas

### ROAS nunca é uma coluna — sempre computado
ROAS é calculado na API usando `packages/domain/src/roas/calculator.ts`.
Nunca persistir ROAS como coluna no banco. Cache no Redis: `roas:{accountId}:{method}:{from}:{to}`.

### Três fórmulas de ROAS, tipadas pela Conta
- `first_sale` → `packages/domain/src/roas/first-sale.ts`
- `cohort_ltv` → `packages/domain/src/roas/cohort-ltv.ts`
- `multi_product` → `packages/domain/src/roas/multi-product.ts`

Todo endpoint que retorna ROAS **deve incluir** o campo `formula_label`:
```
"ROAS first_sale · janela 30d · fonte: H3 CRM"
```

### Fonte de verdade da receita = H3 CRM
Plataformas de ads (Meta, Google) fornecem apenas custo e métricas operacionais.
Receita vem **exclusivamente** das tabelas `leads` e `sales` populadas pelo H3 CRM.

### Multi-tenancy — isolamento total entre Contas
- Middleware `apps/api/src/middleware/tenant-scope.ts` é a primeira linha de defesa.
- RLS policies em `supabase/migrations/002_rls_policies.sql` são o safety net.
- Nunca expor dados de uma Conta para usuário de outra Conta. Isso é crítico.

### PII (LGPD)
- `name`, `email`, `phone` dos leads são criptografados at-rest (AES-256-GCM).
- Ver `packages/shared/src/crypto/index.ts` para encrypt/decrypt.
- Logs **nunca** incluem name, email ou phone. Apenas UUIDs.
- Toda visualização de PII gera entrada em `audit_log`.

### Modo demo
Conta com `is_demo = true`. Dados de seed em `supabase/seed.sql`.
Header da UI deve mostrar fita âmbar "MODO DEMO" quando conta ativa é demo.
A API retorna `"is_demo": true` no campo da Conta — frontend é responsável pelo banner.

## Comandos úteis

```bash
# Dev local
pnpm install
supabase start                    # Postgres + Auth local
docker-compose up redis           # Redis local (ou usar Upstash)
pnpm dev                          # API + Workers em paralelo

# Banco
pnpm db:migrate                   # aplica migrations
pnpm db:seed                      # popula dados demo
pnpm db:types                     # gera types TypeScript do schema Supabase

# Build
pnpm build
pnpm typecheck
pnpm lint
```

## Variáveis de ambiente

Ver `.env.example` para a lista completa com comentários.
Nunca commitar `.env` — apenas `.env.example`.

## Estrutura de pastas relevante

```
supabase/migrations/     schema SQL, RLS, views
packages/domain/src/roas/  fórmulas de ROAS
apps/api/src/routes/     endpoints REST
apps/workers/src/processors/  ingestão Meta/Google/CRM
```

## Contato técnico

Gleisson Oliveira — founder@h3labs.com.br
