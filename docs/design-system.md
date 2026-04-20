# H3 Dashboard — Design System

**Metodologia:** Atomic Design (Brad Frost)  
**Stack:** Next.js 15 + Tailwind CSS + TypeScript  
**Acessibilidade:** WCAG 2.1 AA  
**Tipografia:** Space Grotesk (sans) · IBM Plex Mono (mono)

---

## Tokens de Design

Todos os tokens vivem em `apps/web/tailwind.config.ts` e são espelhados em `apps/web/src/lib/design-tokens.ts` para uso dinâmico.

### Cores

#### Superfícies
| Token | Hex | Uso |
|---|---|---|
| `canvas` | `#0D0D0D` | Fundo global da página |
| `surface` | `#141414` | Cards, sidebars, painéis |
| `surface-elevated` | `#1C1C1C` | Dropdowns, tooltips, hover states |
| `border` | `#2A2A2A` | Bordas padrão |
| `border-focus` | `#FFB800` | Borda de foco (amber) |

#### Texto
| Token | Hex | Uso |
|---|---|---|
| `text-primary` | `#F0F0F0` | Corpo, títulos |
| `text-secondary` | `#9A9A9A` | Labels, subtítulos |
| `text-tertiary` | `#5C5C5C` | Placeholders, metadados |
| `text-inverse` | `#0D0D0D` | Texto sobre fundo âmbar |

#### Âmbar (brand)
| Token | Hex | Uso |
|---|---|---|
| `amber-500` | `#FFB800` | Accent primário, ROAS highlight |
| `amber-400` | `#FFC933` | Hover, active nav |
| `amber-900` | `#2A1F00` | Fundo de badge âmbar |

#### Semânticas
| Token | Uso |
|---|---|
| `success` / `success-bg` | Métricas positivas, status ativo |
| `error` / `error-bg` | Erros, métricas negativas |
| `warning` / `warning-bg` | Alertas, cohortes instáveis |
| `info` / `info-bg` | Informativos |

#### Plataformas
| Token | Cor | Plataforma |
|---|---|---|
| `platform-meta` | `#1877F2` | Meta Ads |
| `platform-google` | `#34A853` | Google Ads |

---

### Tipografia

#### Famílias
- **`font-sans`** → Space Grotesk — UI, corpo, labels
- **`font-mono`** → IBM Plex Mono — métricas, fórmulas, badges de código

#### Escala semântica
| Classe | Tamanho | Família | Uso |
|---|---|---|---|
| `text-metric-hero` | 72px | Mono | KPI principal de tela |
| `text-metric-large` | 48px | Mono | KPI destaque em card |
| `text-metric-med` | 32px | Mono | Métricas de card padrão |
| `text-metric-sm` | 20px | Mono | Métricas inline |
| `text-heading-lg` | 30px | Sans | Títulos de página |
| `text-heading` | 24px | Sans | Títulos de seção |
| `text-heading-sm` | 18px | Sans | Subtítulos |
| `text-body-lg` | 16px | Sans | Corpo destaque |
| `text-body` | 14px | Sans | Corpo padrão |
| `text-body-sm` | 13px | Sans | Labels, navegação |
| `text-caption` | 12px | Sans | Captions, badges |
| `text-formula` | 11px | Mono | `FormulaLabel` — obrigatório com ROAS |
| `text-label-upper` | 11px | Mono | `UpperLabel` — uppercase + tracking |

---

### Espaçamento

Base: 4px. Escala: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24.

---

### Bordas

| Token | Valor | Uso |
|---|---|---|
| `rounded-chip` | 2px | Badges, chips |
| `rounded-sm` | 4px | Cards, inputs, botões |
| `rounded-md` | 8px | Modais |

---

### Sombras

| Token | Uso |
|---|---|
| `shadow-sm` | Cards |
| `shadow-md` | Dropdowns |
| `shadow-xl` | Modais |
| `shadow-focus-amber` | Foco em inputs/botões âmbar |

---

### Animações

| Classe | Uso |
|---|---|
| `animate-fade-in` | Entrada de views |
| `animate-skeleton` | Pulse de Skeleton |
| `animate-demo-bar-flash` | Fita âmbar MODO DEMO |

---

## Componentes

### Átomos

#### Button
5 variantes: `primary` · `secondary` · `ghost` · `danger` · `outline`  
4 tamanhos: `sm` · `md` · `lg` · `icon`

```tsx
<Button variant="primary" size="md">Confirmar</Button>
<Button variant="ghost" size="icon" aria-label="Fechar"><X size={16} /></Button>
<Button variant="primary" loading>Salvando...</Button>
```

**✅ Fazer:** Sempre passar `aria-label` em botões `icon`.  
**❌ Não fazer:** Usar `primary` para ações destrutivas — use `danger`.

---

#### Input
Slots: `leftElement` · `rightElement`  
Estados: default · focus (ring âmbar) · error · disabled

```tsx
<Input label="E-mail" placeholder="email@exemplo.com" type="email" />
<Input label="Busca" leftElement={<Search size={14} />} />
<Input label="URL" error="URL inválida" />
```

---

#### Badge
7 variantes: `default` · `amber` · `success` · `error` · `warning` · `info` · `demo`

```tsx
<Badge variant="success">Ativo</Badge>
<Badge variant="demo">DEMO</Badge>
<Badge variant="amber" icon={<Zap size={10} />}>ROAS 4.2x</Badge>
```

---

#### Typography

```tsx
<Heading level={1} size="hero">Visão Geral</Heading>
<Heading level={2} size="md">Por Objetivo</Heading>
<Text size="sm" variant="secondary">Última atualização: 14:32</Text>
<Metric size="med" amber>4.2x</Metric>
<FormulaLabel label="ROAS first_sale · janela 30d · fonte: H3 CRM" />
<UpperLabel>Receita total</UpperLabel>
```

**Regra crítica:** Todo número de ROAS deve ser acompanhado de `<FormulaLabel>`. Nunca exiba um ROAS sem metodologia.

---

#### Skeleton
Presets prontos para os padrões mais comuns:

```tsx
<Skeleton className="h-3 w-32" />
<SkeletonText lines={3} />
<SkeletonMetricCard />
<SkeletonTableRow cols={5} />
```

---

### Moléculas

#### MetricCard
O componente mais usado no dashboard. Inclui slot obrigatório para `FormulaLabel` quando exibir ROAS.

```tsx
<MetricCard
  label="ROAS Total"
  value="4.2x"
  formulaLabel="ROAS first_sale · janela 30d · fonte: H3 CRM"
  trend={{ value: 12.3, period: '30d' }}
  subtitle="R$ 84.000 receita · R$ 20.000 spend"
  loading={false}
/>
```

**Props:**
- `label` — UpperLabel acima da métrica
- `value` — ReactNode (use `<Metric>` para números, string para outros)
- `formulaLabel` — obrigatório para ROAS; torna o valor âmbar automaticamente
- `trend` — badge de variação percentual com cor automática (verde/vermelho)
- `loading` — exibe `SkeletonMetricCard`

---

#### PlatformBadge / ObjectiveBadge

```tsx
<PlatformBadge platform="meta" />
<PlatformBadge platform="google" size="sm" />
<ObjectiveBadge objective="conversion" />
<ObjectiveBadge objective="lead_gen" size="sm" />
```

Plataformas: `meta` · `google` · `crm` · `organic`  
Objetivos: `awareness` · `consideration` · `conversion` · `lead_gen` · `retention` · `upsell`

---

#### StatGroup
Métricas inline separadas por divisores verticais.

```tsx
<StatGroup
  stats={[
    { label: 'Impressões', value: '1.2M' },
    { label: 'Cliques', value: '48K' },
    { label: 'ROAS', value: '4.2x', formulaLabel: 'first_sale · 30d', amber: true },
  ]}
  orientation="horizontal"
/>
```

---

#### DateRangePicker
Presets: 7d · 30d · 90d. Exibe o intervalo selecionado em pt-BR.

```tsx
<DateRangePicker value={dateRange} onChange={setDateRange} />
```

---

#### AccountSelector
Dropdown acessível (listbox) com indicador DEMO.

```tsx
<AccountSelector
  accounts={accounts}
  value={activeAccountId}
  onChange={setActiveAccountId}
  loading={loadingAccounts}
/>
```

---

### Organismos

#### DemoBar
Fita âmbar não-dispensável no topo da página quando a conta ativa é demo.

```tsx
{account.is_demo && <DemoBar accountName={account.name} />}
```

**Regra:** O backend retorna `is_demo: true` no objeto Account. O frontend é responsável por renderizar o `DemoBar` — nunca ocultar ou tornar dispensável.

---

#### Sidebar
Navegação lateral com suporte a modo colapsado.

```tsx
<Sidebar
  activeHref="/dashboard/campaigns"
  accountName="Clínica Fernanda"
  isDemo={true}
  userEmail="fernanda@clinica.com"
  onSignOut={handleSignOut}
/>
```

---

#### Topbar
Barra de controles: seletor de conta + período + refresh.

```tsx
<Topbar
  accounts={accounts}
  activeAccountId={activeAccountId}
  onAccountChange={setActiveAccountId}
  dateRange={dateRange}
  onDateRangeChange={setDateRange}
  lastSync={lastSyncDate}
  syncing={isSyncing}
  onRefresh={handleRefresh}
/>
```

---

#### DataTable
Tabela genérica com suporte a sort, skeleton e estado vazio.

```tsx
<DataTable
  columns={[
    { key: 'name', header: 'Campanha', cell: (row) => row.name },
    { key: 'spend', header: 'Spend', cell: (row) => formatCurrency(row.spend), align: 'right', sortable: true },
    { key: 'roas', header: 'ROAS', cell: (row) => <Metric size="sm" amber>{row.roas}x</Metric>, align: 'right', sortable: true },
    { key: 'platform', header: 'Plataforma', cell: (row) => <PlatformBadge platform={row.platform} size="sm" /> },
  ]}
  rows={campaigns}
  getRowKey={(row) => row.id}
  loading={loading}
  sort={sort}
  onSort={handleSort}
  caption="Tabela de campanhas"
/>
```

---

#### Modal
Usa a API nativa `<dialog>` para acessibilidade.

```tsx
<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirmar ação"
  description="Esta ação não pode ser desfeita."
  footer={
    <>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
      <Button variant="danger" onClick={handleConfirm}>Confirmar</Button>
    </>
  }
>
  <Text>Tem certeza que deseja continuar?</Text>
</Modal>
```

---

### Templates

#### DashboardLayout
Layout completo: DemoBar (condicional) + Sidebar + Topbar + `<main>`.

```tsx
<DashboardLayout
  accounts={accounts}
  activeAccountId={activeAccountId}
  onAccountChange={setActiveAccountId}
  activeHref="/dashboard"
  userEmail={user.email}
  onSignOut={signOut}
  lastSync={lastSync}
  syncing={syncing}
  onRefresh={refreshData}
>
  <OverviewPage />
</DashboardLayout>
```

---

#### AuthLayout
Layout centralizado para login e onboarding.

```tsx
<AuthLayout title="Entrar" subtitle="Acesse o painel H3 Dashboard">
  <LoginForm />
</AuthLayout>
```

---

## Acessibilidade

- Todos os botões e inputs têm `aria-label` ou label visível
- `DataTable` usa `role="grid"`, `aria-sort`, `scope="col"`
- `Modal` usa `<dialog>` nativa com `aria-labelledby` e `aria-describedby`
- `DemoBar` tem `role="status"` e `aria-label`
- `NavigationItem` usa `aria-current="page"` no item ativo
- `AccountSelector` implementa padrão `listbox` com `aria-selected`
- `Skeleton` e ícones decorativos têm `aria-hidden="true"`
- `Spinner` tem `role="status"` e `aria-label` em pt-BR
- Foco visível em todos os elementos interativos (`shadow-focus-amber`)
- Contraste mínimo 4.5:1 em texto sobre fundos de superfície

---

## Contribuição

### Adicionando um novo componente

1. Determine o nível atômico: átomo → molécula → organismo → template
2. Crie o arquivo na pasta correspondente: `atoms/` · `molecules/` · `organisms/` · `templates/`
3. Exporte pelo `index.ts` da pasta
4. Nenhum comentário desnecessário — nomes de componentes e props devem ser auto-documentáveis
5. Props opcionais com `= ''` ou `= false` como padrão (nunca `undefined` sem fallback)
6. Loading state obrigatório para componentes que consomem dados async
7. Variante `aria-*` obrigatória para componentes interativos

### Convenções de nomenclatura

- Componentes: PascalCase
- Props: camelCase
- Classes Tailwind: ordem — layout → spacing → colors → typography → states
- Tokens: sempre `text-text-primary` (não `text-[#F0F0F0]`)

---

## Governança

| Decisão | Responsável |
|---|---|
| Novos tokens de cor | Founder (Gleisson) — validar contra identidade H3 |
| Novos átomos | Qualquer dev — PR com screenshot |
| Novos organismos | Revisão obrigatória de acessibilidade |
| Breaking changes | Semver — bump minor para novos componentes, major para API changes |
| Depreciação | Comentário `@deprecated` + manter por 1 release antes de remover |

### Versão atual: `0.1.0` (design system inicial — pré-produção)
