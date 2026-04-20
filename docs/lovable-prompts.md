# H3 Dashboard — Prompts para Lovable

> Use estes prompts em sequência no Lovable para construir toda a UI do H3 Dashboard.
> Antes de começar: conecte o Lovable ao Supabase (Settings → Supabase → colar URL + anon key).
> O design e os componentes visuais são definidos aqui. Lógica de dados já existe no backend.

---

## Configuração Inicial (rodar antes de qualquer prompt de tela)

```
Crie um projeto Next.js 15 com TypeScript para o H3 Dashboard — um produto de observabilidade 
de receita e performance de anúncios para a H3 Labs.

Design System (aplicar globalmente em todos os componentes):

CORES:
- Background principal: #0D0D0D (quase preto)
- Background de card/surface: #141414
- Background de card elevado: #1A1A1A
- Cor de acento principal: #FFB800 (Âmbar-Métrica)
- Texto primário: #F5F5F5
- Texto secundário: #8A8A8A
- Texto de label/meta: #5A5A5A
- Borda sutil: #242424
- Verde positivo: #22C55E
- Vermelho negativo: #EF4444
- Azul informativo: #3B82F6

TIPOGRAFIA:
- Fonte display/UI: Space Grotesk (Google Fonts)
- Fonte de dados/métricas/números: IBM Plex Mono (Google Fonts)
- Tamanhos: 
  - Hero number (ROAS principal): 72px bold, Space Grotesk
  - Headline de seção: 18px semibold, Space Grotesk
  - Corpo/labels: 14px regular, Space Grotesk
  - Valores de métrica: 24-32px medium, IBM Plex Mono
  - Metadados de fórmula: 11px regular, IBM Plex Mono, cor #5A5A5A

ESTILO:
- Sem bordas arredondadas excessivas: border-radius 4px para cards, 2px para chips
- Sombras muito sutis (sem elevation agressivo)
- Sem gradientes — superfícies lisas
- Separadores: linhas 1px #242424
- Ícones: Lucide React (pacote já incluído no Next.js)
- Animações: apenas fade-in suave (300ms) e skeleton loading

PADRÃO DE CARD DE MÉTRICA:
- Background #141414, borda 1px #242424
- Label do indicador: uppercase, 11px, letter-spacing 0.1em, cor #5A5A5A
- Valor principal: IBM Plex Mono, cor #FFB800 para ROAS, #F5F5F5 para outros
- Metadado de fórmula (obrigatório em todo número de ROAS): 
  texto em IBM Plex Mono 11px, cor #5A5A5A
  ex: "ROAS first_sale · janela 30d · fonte: H3 CRM"

Configure também:
- next.config com variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL
- Importação das fontes Space Grotesk e IBM Plex Mono via next/font/google
- Layout base com sidebar fixa à esquerda
- Tailwind CSS configurado com as cores customizadas acima como tokens
```

---

## Prompt 1 — Layout Base + Sidebar

```
Crie o layout base do H3 Dashboard com:

SIDEBAR (fixa, 240px, fundo #0D0D0D, borda-direita 1px #242424):
- Logo H3 Labs no topo (texto "H3 Dashboard" em Space Grotesk 16px semibold, âmbar #FFB800, 
  com ícone de barra gráfica à esquerda em âmbar)
- Navegação principal com ícones Lucide + labels:
  - LayoutDashboard → "Visão Geral" (rota /)
  - Target → "Por Objetivo" (rota /objectives)
  - Megaphone → "Campanhas" (rota /campaigns)
  - TrendingUp → "Receita" (rota /revenue)
  - Settings → "Configurações" (rota /settings)
- Na parte inferior da sidebar:
  - Seletor de conta: dropdown com o nome da conta ativa, ícone ChevronDown
    (quando is_demo=true, mostrar chip âmbar "DEMO" ao lado do nome)
  - Seletor de período: "Últimos 30 dias" como default, com ícone Calendar
  - Avatar do usuário com iniciais + nome + role em texto pequeno
- Item ativo: fundo #1A1A1A, borda-esquerda 2px #FFB800, texto #F5F5F5
- Items inativos: texto #8A8A8A, hover background #141414

TOPBAR (altura 56px, fundo #0D0D0D, borda-inferior 1px #242424):
- Breadcrumb à esquerda (ex: "Visão Geral")
- À direita: botão de atualizar dados (ícone RefreshCw) + indicador de última atualização 
  em texto 12px #5A5A5A (ex: "Atualizado há 3 min")
- FITA DEMO: quando is_demo=true, mostrar barra horizontal âmbar #FFB800 de 28px de altura
  acima da topbar, com texto centralizado "MODO DEMO — Dados fictícios para demonstração" 
  em 12px semibold preto. Esta fita NÃO pode ser fechada.

CONTEÚDO: área principal com padding 24px, fundo #0D0D0D.

Crie os componentes:
- components/layout/Sidebar.tsx
- components/layout/Topbar.tsx
- components/layout/DemoBar.tsx
- app/layout.tsx usando estes componentes
```

---

## Prompt 2 — Visão Geral (Home View)

```
Crie a página principal do H3 Dashboard em app/page.tsx — a "Visão Geral" de uma Conta.

Esta página consome o endpoint: GET /accounts/:accountId/overview?from=&to=
O hook useOverview() já existe em src/hooks/useRoas.ts.

ESTRUTURA DA PÁGINA:

1. HERO SECTION (topo, largura total):
   Card com fundo #141414, padding 32px.
   Layout: três colunas.
   
   COLUNA ESQUERDA (40%):
   - Label "ROAS REAL" em 11px uppercase âmbar, letra-spacing 0.15em
   - O valor do ROAS em 72px bold Space Grotesk, cor #FFB800
     ex: "3.42"
   - Logo abaixo, em IBM Plex Mono 11px #5A5A5A:
     "ROAS first_sale · janela 30d · fonte: H3 CRM"
     (ESTE METADADO É OBRIGATÓRIO — nunca omitir)
   - Chip de variação: "+12% vs período anterior" em verde #22C55E ou vermelho #EF4444
   
   COLUNA CENTRAL (30%):
   Stack vertical de 3 mini-métricas:
   - "INVESTIMENTO" → R$ 15.000 (IBM Plex Mono)
   - "RECEITA" → R$ 51.300 (IBM Plex Mono, verde #22C55E)
   - "CONVERSÃO LEAD→VENDA" → 8.44% (IBM Plex Mono)
   Cada linha: label 10px #5A5A5A uppercase + valor 20px #F5F5F5
   
   COLUNA DIREITA (30%):
   - Total de Leads: número grande IBM Plex Mono 32px
   - Total de Vendas: número IBM Plex Mono 32px âmbar
   - CPV (custo por venda): label + valor

2. GRÁFICO DE TENDÊNCIA (abaixo do hero, largura total):
   Card #141414. 
   - Título: "Investimento × Receita" com seletor de granularidade 
     (pills: "Diário" | "Semanal" | "Mensal")
   - Gráfico de linha dupla: linha âmbar para spend, linha verde para revenue
   - Eixo Y: valores em BRL, IBM Plex Mono 11px
   - Eixo X: datas, IBM Plex Mono 11px
   - Use Recharts (instalar: npm i recharts)
   - Tooltip customizado: fundo #1A1A1A, borda #242424, 
     mostra data + spend + revenue + ROAS do dia
   - Skeleton loading enquanto carrega (linhas cinzas animadas)

3. BREAKDOWN POR OBJETIVO (grid 2x2):
   Cada card de objetivo:
   - Chip colorido com tipo do objetivo (captacao=âmbar, venda_direta=verde, 
     alcance=azul, seguidores=roxo)
   - Nome do objetivo em 14px semibold
   - Métrica primária grande (CPL para captação, CPM para alcance, etc.)
   - ROAS atribuído + metadado de fórmula em mono 11px #5A5A5A
   - Barra de progresso horizontal mostrando % do investimento total neste objetivo
   - Número de campanhas ativas
   - Hover: borda âmbar, cursor pointer → navega para /objectives/:id

4. TOP CAMPANHAS (tabela, abaixo dos objetivos):
   Colunas: Campanha | Objetivo | Plataforma | Investimento | Leads | CPL | ROAS atribuído
   - Plataforma: badge com cor (Meta=azul, Google=vermelho, TikTok=preto)
   - ROAS: cor âmbar com mini-metadado abaixo em 10px mono
   - Linhas alternadas #141414 e #141414 (sem zebra forte)
   - Hover: linha com fundo #1A1A1A
   - Click na linha: navega para /campaigns/:id/attribution

Estados necessários:
- Loading: skeleton de cada seção
- Error: card vermelho com mensagem + botão "Tentar novamente"
- Empty: ilustração simples + "Nenhum dado para o período selecionado"

Crie também: components/metrics/RoasHero.tsx, components/metrics/MetricCard.tsx,
components/charts/SpendRevenueChart.tsx, components/objectives/ObjectiveCard.tsx
```

---

## Prompt 3 — Visão por Objetivo

```
Crie a página app/objectives/page.tsx — Visão por Objetivo.

Consome: GET /accounts/:accountId/objectives?from=&to=

LAYOUT:
- Header da página: título "Por Objetivo" + seletor de período
- Grid de 4 cards grandes (um por tipo de objetivo: captação, venda direta, alcance, seguidores)
  Se algum objetivo não existir na conta, mostrar o card em estado "inativo" com texto 
  "Nenhuma campanha neste objetivo"

CARD DE OBJETIVO (expandido, não o mini da home):
Fundo #141414, padding 24px, borda 1px #242424.

Header do card:
- Badge colorido com ícone do tipo + nome do objetivo
- Número de campanhas ativas à direita

Métricas principais (grid 3 colunas):
- Para captação: Investimento | CPL | Total de Leads
- Para venda_direta: Investimento | ROAS | Receita Direta
- Para alcance: Investimento | CPM | Impressões
- Para seguidores: Investimento | Custo/Seguidor | Seguidores Ganhos

ROAS atribuído (seção separada com borda-topo 1px #242424):
- Título "Receita Atribuída" com tooltip explicando o conceito de cross-objetivo
  (ícone Info → tooltip: "Toda campanha pode gerar receita, independente do objetivo declarado")
- Valor de ROAS atribuído em âmbar + metadado de fórmula obrigatório

Lista de campanhas deste objetivo (collapsible, fechada por padrão):
- Toggle "Ver campanhas (N)" com ícone ChevronDown
- Tabela compacta: Nome | Status | Investimento | Leads/Conversões | ROAS
- Click → navega para /campaigns/:id/attribution

Crie: components/objectives/ObjectiveDetailCard.tsx
```

---

## Prompt 4 — Visão de Campanha (Drill-Down)

```
Crie a página app/campaigns/[campaignId]/page.tsx — Drill-down de Campanha.

Consome: GET /accounts/:accountId/campaigns/:campaignId/attribution?from=&to=

ESTRUTURA:

1. HEADER DA CAMPANHA:
- Breadcrumb: Visão Geral → [Nome do Objetivo] → [Nome da Campanha]
- Badge de plataforma (Meta/Google/TikTok) + badge de status (Ativo/Pausado)
- Badge do objetivo declarado (ex: "Captação" em âmbar)

2. PAINEL DE FUNIL (destaque visual, fundo #141414):
Funil visual horizontal com 5 estágios:
Impressões → Cliques → Leads → Leads Qualificados → Vendas

Para cada estágio:
- Número grande IBM Plex Mono âmbar/branco
- Taxa de conversão entre estágios em 12px verde/vermelho
  ex: "CTR 2.0%" entre Impressões e Cliques
  ex: "Click→Lead 5.6%" entre Cliques e Leads

Visual: blocos decrescentes (simulação de funil) com linhas conectoras.
Cor dos blocos: do âmbar escuro (#3D2A00) ao âmbar (#FFB800).

3. MÉTRICAS DE PERFORMANCE (grid 4 colunas):
Investimento | Impressões | Cliques | CTR
CPL | Leads | Leads Qualificados | Taxa Qualificação

4. RECEITA ATRIBUÍDA (destaque com borda âmbar esquerda 4px):
- Título "Receita Atribuída a esta Campanha"
- ROAS em 48px âmbar IBM Plex Mono
- Metadado de fórmula obrigatório abaixo
- Receita total + Número de vendas
- Nota em 12px #8A8A8A: "Esta campanha tem objetivo '${objetivo}' mas gerou receita 
  via atribuição first-touch. Leads desta campanha compraram dentro da janela de atribuição."
  (mostrar apenas quando objetivo != venda_direta)

5. RANKING DE CRIATIVOS (tabela):
Colunas: Thumbnail | Nome | Investimento | Impressões | CTR | Leads | ROAS Atribuído

- Linha #1 em destaque (borda âmbar esquerda)
- Thumbnail: caixa 48x48px cinza com ícone Image se não houver thumbnail
- ROAS Atribuído: âmbar + mini-metadado

6. SÉRIE TEMPORAL (apenas para cohort_ltv):
Se account.revenue_model === 'cohort_ltv':
Mostrar gráfico de linha mostrando evolução do LTV da coorte mês a mês.
Card separado com título "Evolução da Coorte" + badge "Em formação" se isStable=false.

Crie: components/campaigns/FunnelVisualization.tsx, components/campaigns/CreativeRanking.tsx
```

---

## Prompt 5 — Autenticação

```
Crie o fluxo de autenticação do H3 Dashboard.

PÁGINA DE LOGIN (app/login/page.tsx):
- Fundo #0D0D0D, conteúdo centralizado, card #141414 400px de largura
- Logo H3 Dashboard no topo (texto "H3" grande em âmbar + "Dashboard" em branco)
- Tagline abaixo: "Sistemas previsíveis de crescimento" em #8A8A8A 14px
- Separador 1px #242424
- DOIS modos de acesso:

MODO 1 — Time H3 Labs:
Botão grande "Entrar com Google" (ícone Google + texto)
Fundo #1A1A1A, borda #242424, hover fundo #242424
Chama: supabase.auth.signInWithOAuth({ provider: 'google' })

MODO 2 — Cliente:
Form com campos Email + Senha
Labels em 12px #8A8A8A
Inputs: fundo #1A1A1A, borda #242424, texto #F5F5F5, focus borda #FFB800
Botão "Entrar" fundo #FFB800 texto preto
Chama: supabase.auth.signInWithPassword({ email, password })

Separador entre os dois modos: linha com texto "ou acesse como cliente" em 12px #5A5A5A

Link abaixo: "Acessar modo demo →" (texto âmbar, sem underline)
Ao clicar: chama POST /auth/demo → salva token → redireciona para / com conta demo ativa

Estados:
- Loading: botões com spinner
- Error: mensagem de erro em vermelho abaixo do campo

PÁGINA DE CALLBACK (app/auth/callback/page.tsx):
Processa o código OAuth do Supabase e redireciona para /.

MIDDLEWARE (middleware.ts):
Protege todas as rotas exceto /login e /auth/callback.
Usa @supabase/ssr para verificar sessão no servidor.

Crie: app/login/page.tsx, app/auth/callback/page.tsx, middleware.ts
```

---

## Prompt 6 — Componentes Compartilhados

```
Crie os componentes utilitários compartilhados do H3 Dashboard:

1. components/ui/MetricCard.tsx
Props: label, value, subValue?, trend?, formulaLabel?, accentColor?
- formulaLabel (obrigatório quando exibindo ROAS): texto mono 11px #5A5A5A abaixo do valor
- trend: objeto { value: number, label: string } → mostra chip verde/vermelho
- accentColor: padrão '#FFB800' para ROAS, '#F5F5F5' para outros

2. components/ui/PlatformBadge.tsx
Props: platform: 'meta' | 'google' | 'tiktok' | 'instagram_organic'
- Meta: fundo #1A2A4A texto '#4267B2'
- Google: fundo #2A1A1A texto '#EA4335'
- TikTok: fundo #1A1A1A texto '#F5F5F5'

3. components/ui/ObjectiveBadge.tsx
Props: type: 'captacao' | 'venda_direta' | 'alcance' | 'seguidores'
- captacao: âmbar com ícone Users
- venda_direta: verde com ícone ShoppingBag
- alcance: azul com ícone Eye
- seguidores: roxo com ícone Heart

4. components/ui/DateRangePicker.tsx
Seletor de período com opções rápidas:
- Últimos 7 dias
- Últimos 30 dias (padrão)
- Últimos 90 dias
- Este mês
- Mês passado
- Personalizado (date pickers)
Ao selecionar, atualiza o contexto global de período.

5. components/ui/AccountSelector.tsx
Dropdown com lista de contas do usuário.
- Badge "DEMO" âmbar para conta demo
- Badge "INTERNO" cinza para conta H3
Ao trocar: redireciona para / e invalida cache local.

6. components/ui/SkeletonMetric.tsx
Skeleton de um card de métrica (animação pulse Tailwind).

7. components/ui/EmptyState.tsx
Props: message, icon?
Card centralizado com ícone grande #5A5A5A + mensagem.

8. contexts/DashboardContext.tsx
Context global com:
- activeAccountId: string
- setActiveAccountId: (id: string) => void
- dateRange: { from: string; to: string }
- setDateRange: (range) => void
- isDemo: boolean

Disponível em toda a aplicação via Provider no layout.
```

---

## Prompt 7 — Página de Receita

```
Crie a página app/revenue/page.tsx — Visão de Receita.

ESTRUTURA:

1. MÉTRICAS HERO (grid 4 colunas):
- Receita Total (período): grande, verde
- Número de Vendas: IBM Plex Mono
- Ticket Médio: IBM Plex Mono
- Taxa de Conversão: IBM Plex Mono + trend

2. GRÁFICO DE RECEITA ACUMULADA:
Área chart (Recharts AreaChart) mostrando receita acumulada dia a dia.
Cor de preenchimento: gradiente de âmbar transparente para âmbar.

3. RECEITA POR PRODUTO (tabela):
Colunas: Produto | Vendas | Receita | % do Total | Ticket Médio
Barra de progresso visual no % do Total.

4. RECEITA POR CAMPANHA (tabela):
Colunas: Campanha | Objetivo | Vendas | Receita Atribuída | ROAS
- Para cada linha: o metadado de fórmula em 10px mono cinza abaixo do ROAS

5. FUNIL GLOBAL DA CONTA:
Mini-funil mostrando: Leads Totais → Qualificados → Negociação → Ganhos
Com taxas de conversão entre cada estágio.

Nota importante: todos os números de receita vêm do H3 CRM, não das plataformas de ads.
Mostrar badge "Fonte: H3 CRM" discreto no topo direito da página.
```

---

## Prompt 8 — Responsividade Mobile

```
Adapte o H3 Dashboard para funcionar em telas mobile (min-width: 320px):

MOBILE (< 768px):
- Sidebar: ocultar. Substituir por bottom navigation bar com 4 ícones:
  Home, Objetivo, Campanhas, Menu (abre drawer com opções restantes)
- Hero ROAS: empilhar verticalmente, ROAS em 56px (não 72px)
- Grids: tudo em 1 coluna
- Tabelas: scrollável horizontalmente com indicador visual de "arraste →"
- Topbar: mostrar apenas logo + ícone de avatar

TABLET (768px - 1024px):
- Sidebar: collapsível (ícones apenas, hover expande)
- Grids: 2 colunas
- Tabelas: visíveis normalmente

DESKTOP (> 1024px):
- Layout atual (sidebar fixa 240px)

Aplique as mudanças usando Tailwind responsive prefixes (sm:, md:, lg:).
Todos os componentes criados nos prompts anteriores devem ser atualizados.
```

---

## Prompt 9 — Estado de Carregamento e Erros

```
Implemente estados de loading e error consistentes em todo o dashboard:

SKELETON LOADING:
- Usar Tailwind's animate-pulse em todos os componentes
- Criar SkeletonHero.tsx: imita o Hero ROAS com retângulos cinzas
- Criar SkeletonTable.tsx: 5 linhas de placeholder
- Criar SkeletonChart.tsx: área retangular com animação
- Regra: nunca mostrar dados parciais — ou skeleton completo ou dados completos

ERROR STATES:
- Criar ErrorBoundary global em app/error.tsx
- Em cada seção/card: se a query falhar, mostrar mini error card com:
  - Ícone AlertTriangle vermelho
  - Mensagem de erro em 13px #8A8A8A
  - Botão "Tentar novamente" (refetch)
- Nunca propagar erro de uma seção para toda a página

TOAST NOTIFICATIONS:
- Instalar: npm i sonner
- Configurar Toaster com tema dark (background #141414, border #242424)
- Usar para: dados atualizados, erros de sync, sessão expirando

EMPTY STATE:
- Quando não há dados para o período: ilustração simples + texto orientativo
  ex: "Nenhum dado de investimento para este período. 
      Verifique se há campanhas ativas ou selecione um período diferente."

DEMO BANNER:
- Verificar que DemoBar.tsx está sempre visível quando is_demo=true
- A fita âmbar não pode ser removida, fechada ou escondida em modo demo
```

---

## Prompt 10 — Configurações

```
Crie a página app/settings/page.tsx — Configurações da Conta.

ABAS:
1. Conta
2. Integrações
3. Acesso (apenas h3_admin)

ABA CONTA:
- Nome da conta (readonly)
- Modelo de receita: readonly + explicação em tooltip
  (o modelo é definido pela H3 — não é editável pelo cliente)
- Janela de atribuição: input number (dias), apenas para admin H3
- Parâmetros cohort_ltv (se aplicável): avg_months e margin
- Botão "Salvar" chamando PATCH /accounts/:id

ABA INTEGRAÇÕES:
Cards para cada integração:
- Meta Ads: badge "Conectado/Desconectado" + data do último sync + botão "Reconectar"
- Google Ads: idem
- H3 CRM: status + timestamp do último webhook recebido
- Cada card mostra: registros processados hoje, último erro (se houver)

ABA ACESSO (h3_admin only):
- Tabela de usuários com acesso à conta
- Colunas: Nome | Email | Role | Acesso desde
- Botão "Convidar usuário" → modal com email + role selector
- Botão de remoção por linha

VISUAL:
- Tabs: linha âmbar sob a aba ativa
- Formulários: mesmo padrão dos componentes de auth
- Campos disabled: fundo #0D0D0D, texto #5A5A5A

Nota: Esta página é apenas para time H3 e admins de conta.
Clientes com role 'viewer' não veem esta rota (proteger no middleware).
```

---

## Ordem de Execução no Lovable

Execute os prompts nesta sequência:

1. **Configuração Inicial** — design system e next.config
2. **Prompt 6** — componentes compartilhados (dependência dos outros)
3. **Prompt 5** — autenticação (necessária para tudo)
4. **Prompt 1** — layout base com sidebar
5. **Prompt 2** — Home View (mais importante)
6. **Prompt 3** — Por Objetivo
7. **Prompt 4** — Drill-down de Campanha
8. **Prompt 7** — Receita
9. **Prompt 9** — Loading/Erros
10. **Prompt 8** — Responsividade
11. **Prompt 10** — Configurações

---

## Notas para o Agente de Design

Ao usar estes prompts no Lovable:

1. **Conecte o Supabase primeiro** — sem isso, auth não funciona
2. **Defina a variável `NEXT_PUBLIC_API_URL`** para apontar para o apps/api rodando
3. **O metadado de fórmula do ROAS é inegociável** — deve aparecer em TODOS os números de ROAS
4. **A fita "MODO DEMO"** nunca pode ser removível pelo usuário
5. **Todos os números financeiros** usam Intl.NumberFormat para BRL: 
   `new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)`
6. **Sem dados mockados** — sempre usar os hooks reais (useOverview, useRoasSeries, etc.)
7. **Paleta fechada** — não criar novas cores além das definidas no design system

---

## Variáveis de Ambiente para o Lovable

Configure no Lovable → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=         # URL do seu projeto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Chave anon pública do Supabase
NEXT_PUBLIC_API_URL=              # URL do apps/api (Railway staging ou localhost)
```
