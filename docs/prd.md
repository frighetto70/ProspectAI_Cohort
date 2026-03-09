# Strategic Reset Prospector — Product Requirements Document (PRD)

## 1. Goals and Background Context

### 1.1 Goals

- **Automatizar prospecção no LinkedIn** — eliminar trabalho manual de busca e qualificação de gestores C-level de grandes corporações
- **Gerar mensagens hiperpersonalizadas com IA** — usar Gemini API para criar abordagens que ressoem com a dor de cada prospect (medo da estagnação, necessidade de transformação)
- **Centralizar pipeline de leads** — dashboard web para visualizar, gerenciar e acompanhar o funil de prospecção do serviço "Strategic Reset"
- **Aumentar taxa de conversão** — posicionar o ticket de R$7,5k com mensagens que comuniquem valor premium de forma natural
- **Escalar operação solo** — permitir que um consultor individual opere prospecção em volume sem equipe comercial
- **Acessar de qualquer lugar** — dashboard deployado na Vercel, acessível via browser sem precisar de máquina local rodando

### 1.2 Background Context

O serviço "Strategic Reset" atende gestores de alta cúpula de grandes corporações que enfrentam a pressão de mudanças exponenciais no mercado — sabem que a estagnação é condenação, mas não têm clareza sobre como transformar seus produtos e operações. O posicionamento como Thinker estratégico exige uma abordagem de prospecção que transmita sofisticação e relevância, não volume genérico.

Atualmente, a prospecção no LinkedIn é manual e não escalável. Este sistema automatiza o ciclo completo: descoberta de prospects via Apify REST API, armazenamento estruturado em SQLite (Turso), geração de mensagens personalizadas com Gemini API, e um dashboard Next.js deployado na Vercel para gestão visual do pipeline. A stack é serverless-first para custo operacional próximo de zero (free tiers).

### 1.3 Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-06 | 1.0 | Initial PRD | Morgan (PM) |
| 2026-03-06 | 2.0 | Stack revision: Next.js + Vercel + Turso + Apify REST | Aria (Architect) |

---

## 2. Requirements

### 2.1 Functional Requirements

- **FR1:** O sistema deve buscar prospects no LinkedIn via Apify REST API, filtrando por cargo (C-level, diretores, VPs), empresa (grandes corporações), e localização
- **FR2:** O sistema deve armazenar prospects em banco SQLite (Turso/libSQL) com campos: nome, cargo, empresa, setor, URL do perfil, headline, resumo, data de captura
- **FR3:** O sistema deve gerar mensagens de prospecção personalizadas via Gemini API, usando dados do perfil do prospect e o posicionamento "Strategic Reset"
- **FR4:** O sistema deve oferecer templates de mensagem configuráveis (connection request, follow-up, InMail) que o Gemini usa como base
- **FR5:** O sistema deve apresentar um dashboard web com visão do pipeline de leads por status (novo, mensagem gerada, enviado, respondeu, converteu, descartado)
- **FR6:** O sistema deve permitir revisar e editar mensagens geradas pela IA antes do envio
- **FR7:** O sistema deve registrar histórico de interações por prospect (mensagens enviadas, respostas, notas manuais)
- **FR8:** O sistema deve permitir exportar leads e mensagens em CSV
- **FR9:** O sistema deve suportar filtros e busca no dashboard (por empresa, cargo, status, data)
- **FR10:** O sistema deve permitir configurar os critérios de busca do Apify (ICP) via interface

### 2.2 Non-Functional Requirements

- **NFR1:** Stack serverless — Next.js na Vercel + Turso (SQLite cloud), sem servidores gerenciados
- **NFR2:** Custo operacional limitado aos free tiers (Vercel Hobby, Turso Free, Apify Free, Gemini Free) — zero no MVP
- **NFR3:** Mensagens geradas devem soar naturais e premium — tom de consultor sênior, não de vendedor
- **NFR4:** Dashboard deve ser responsivo (desktop-first, funcional em mobile)
- **NFR5:** Aplicação protegida por autenticação simples (password env var) — acessível via internet
- **NFR6:** O sistema deve suportar operação por um único usuário (sem multi-tenancy)
- **NFR7:** Tempo de geração de mensagem via Gemini < 10 segundos por prospect

---

## 3. User Interface Design Goals

### 3.1 Overall UX Vision

Interface minimalista e profissional que reflete o posicionamento premium do serviço "Strategic Reset". O dashboard deve transmitir controle e clareza — o usuário deve entender o estado do pipeline em segundos. Prioridade é eficiência operacional: menos cliques para as ações mais frequentes (revisar mensagem, aprovar, mudar status).

### 3.2 Key Interaction Paradigms

- **Pipeline Kanban** — visualização principal dos leads por estágio (Novo → Mensagem Gerada → Enviado → Respondeu → Converteu / Descartado)
- **Inline editing** — editar mensagens geradas diretamente no card do lead sem abrir modais
- **Bulk actions** — selecionar múltiplos prospects para gerar mensagens em lote
- **One-click copy** — copiar mensagem aprovada para clipboard (colar manualmente no LinkedIn)

### 3.3 Core Screens and Views

- **Dashboard Principal** — visão Kanban do pipeline com métricas resumidas (total de leads, taxa de resposta, conversões)
- **Prospect Detail** — perfil completo do lead, histórico de mensagens, notas, ações disponíveis
- **Gerador de Mensagens** — interface para gerar/regenerar mensagens com preview lado a lado (dados do prospect + mensagem)
- **Configuração de Busca** — formulário para definir critérios ICP do Apify (cargos, empresas, localização, keywords)
- **Templates** — gerenciador de templates de mensagem com variáveis e preview

### 3.4 Accessibility

WCAG AA — contraste adequado, navegação por teclado, labels em formulários.

### 3.5 Branding

Visual clean e corporativo. Paleta neutra (cinza, branco, navy) com accent color para CTAs. Tipografia sans-serif moderna. Sem elementos lúdicos — o sistema é uma ferramenta de trabalho premium, não um produto consumer.

### 3.6 Target Platforms

Web Responsive (desktop-first). Uso primário em desktop (workflow de prospecção), funcional em tablet/mobile para consultas rápidas ao pipeline.

---

## 4. Technical Assumptions

### 4.1 Mandatory Stack

| Layer | Technology | Constraint |
|-------|-----------|------------|
| **Scraping** | Apify REST API | OBRIGATÓRIO |
| **Database** | SQLite (Turso/libSQL) | OBRIGATÓRIO |
| **AI** | Gemini API | OBRIGATÓRIO |
| **Framework** | Next.js | OBRIGATÓRIO |
| **Deploy** | Vercel | OBRIGATÓRIO |

### 4.2 Service Architecture

**Next.js fullstack** — App Router com Server Components, Route Handlers para API, Server Actions para mutations. Deploy serverless na Vercel. Database SQLite via Turso (libSQL hospedado, compatível wire-level com SQLite).

### 4.3 Testing Requirements

**Unit + Integration** — testes unitários para lógica de negócio (geração de mensagens, parsing de dados do Apify) e testes de integração para Route Handlers. Sem E2E automatizado no MVP.

- **Framework:** Vitest
- **Coverage mínimo:** Lógica de geração de mensagens e parsing de dados do Apify

### 4.4 Additional Technical Assumptions

- **Apify:** REST API via fetch (não SDK) — chamadas diretas aos endpoints da Apify API v2
- **Gemini Model:** `gemini-2.0-flash` para geração de mensagens (balanço custo/qualidade)
- **Autenticação:** Password simples via env var (middleware Next.js) — app é acessível via internet
- **Rate limiting:** Implementar throttling nas chamadas ao Gemini para respeitar limites da API
- **Persistência:** Turso (libSQL) — SQLite hospedado, free tier: 9GB storage, 500M rows read/mês
- **Envio de mensagens:** Manual (copiar do dashboard e colar no LinkedIn) — sem automação de envio para evitar ban da conta

---

## 5. Epic List

- **Epic 1: Foundation & Data Pipeline** — Estabelecer projeto Next.js, banco Turso, e integração Apify REST API para captura automatizada de prospects do LinkedIn
- **Epic 2: AI Message Generation** — Integrar Gemini API para gerar mensagens personalizadas com templates configuráveis e revisão pré-envio
- **Epic 3: Dashboard & Pipeline Management** — Visualização Kanban, gestão de leads, métricas, filtros, e exportação

---

## 6. Epic Details

### Epic 1: Foundation & Data Pipeline

**Goal:** Criar a base do sistema e o pipeline de dados completo — do scraping do LinkedIn ao armazenamento estruturado no Turso. Ao final deste epic, o usuário pode buscar prospects e visualizá-los em uma interface mínima, deployada na Vercel.

#### Story 1.1: Project Setup & Infrastructure

> As a consultant,
> I want the project initialized with Next.js and deployed to Vercel,
> so that I have a working foundation accessible from anywhere.

**Acceptance Criteria:**

1. Projeto Next.js 15 (App Router) criado com TypeScript
2. Tailwind CSS configurado
3. Vitest configurado com script `npm test` funcional
4. ESLint configurado
5. `.gitignore` inclui `node_modules/`, `.env.local`
6. `.env.example` documenta variáveis: `APIFY_TOKEN`, `GEMINI_API_KEY`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `APP_PASSWORD`
7. Route Handler `GET /api/health` retorna `{ status: "ok" }`
8. Deploy funcional na Vercel (pode ser preview deploy)
9. Middleware de autenticação simples (password via env var)

#### Story 1.2: Database Schema & Prospect Model

> As a consultant,
> I want prospects stored in a structured database,
> so that I can query and manage my lead pipeline efficiently.

**Acceptance Criteria:**

1. Turso database configurado com Drizzle ORM (libSQL driver)
2. Tabela `prospects` com campos: id, name, title, company, industry, linkedin_url (unique), headline, summary, location, status (enum: new/message_generated/sent/replied/converted/discarded), raw_data (JSON backup), created_at, updated_at
3. Tabela `interactions` com campos: id, prospect_id (FK), type (enum: message_generated/message_sent/reply/note), content, template_id (FK nullable), metadata (JSON), created_at
4. Tabela `message_templates` com campos: id, name, type (enum: connection_request/follow_up/inmail), system_prompt, user_prompt_template, is_active, created_at, updated_at
5. Tabela `scrape_jobs` com campos: id, apify_run_id, criteria (JSON), status (enum: pending/running/completed/failed), prospects_found, prospects_new, error, created_at, completed_at
6. Migrations versionadas via Drizzle Kit
7. Seed com 3 templates default (Connection Request, Follow-up, InMail)
8. Route Handlers CRUD para prospects: `GET/POST /api/prospects`, `GET/PATCH/DELETE /api/prospects/[id]`
9. Filtros na listagem: status, company, search (query params)
10. Testes unitários para operações de banco

#### Story 1.3: Apify Integration & LinkedIn Scraping

> As a consultant,
> I want to search for prospects on LinkedIn using configurable criteria,
> so that I can build a qualified lead list matching my ICP.

**Acceptance Criteria:**

1. Integração com Apify REST API v2 via fetch usando `APIFY_TOKEN`
2. Route Handler `POST /api/scrape` aceita parâmetros: titles, companies, locations, keywords, maxResults
3. Sistema chama Actor do Apify Store via REST API para LinkedIn scraping
4. Resultados são parseados e salvos na tabela `prospects` (deduplicação por linkedin_url)
5. Scrape job registrado na tabela `scrape_jobs` com status tracking
6. Route Handler `GET /api/scrape/[jobId]` para polling de status
7. Tratamento de erros: token inválido, Actor indisponível, timeout
8. Testes para parsing de dados do Apify e deduplicação

#### Story 1.4: Basic Prospect List UI

> As a consultant,
> I want to see my prospects in a simple web interface,
> so that I can verify the scraping results and browse my leads.

**Acceptance Criteria:**

1. Página `/` lista prospects em tabela com colunas: nome, cargo, empresa, status, data
2. Server Components para data fetching (SSR)
3. Filtro por status (dropdown) funcional
4. Campo de busca por texto (nome, empresa) funcional
5. Clicar em prospect navega para `/prospects/[id]` com detalhes completos
6. Página `/settings` com formulário de busca (cargos, empresas, localização) + botão "Buscar Prospects"
7. Feedback visual durante scraping (loading state)
8. Layout base com navegação (shadcn/ui) e paleta neutra/corporativa

---

### Epic 2: AI Message Generation

**Goal:** Integrar Gemini API para transformar dados de prospects em mensagens de prospecção personalizadas e premium. O consultor pode gerar, revisar, editar e aprovar mensagens antes de copiá-las para envio manual no LinkedIn.

#### Story 2.1: Gemini API Integration & Message Generation

> As a consultant,
> I want personalized prospecting messages generated by AI,
> so that each outreach feels crafted and relevant to the prospect's context.

**Acceptance Criteria:**

1. Integração com Gemini API via `@google/generative-ai` SDK usando `GEMINI_API_KEY`
2. Route Handler `POST /api/prospects/[id]/generate-message` gera mensagem personalizada
3. Prompt inclui: dados do prospect (nome, cargo, empresa, headline), contexto do serviço "Strategic Reset", tom desejado (consultor sênior, não vendedor)
4. Resposta inclui mensagem gerada e metadata (modelo usado, tokens consumidos)
5. Mensagem salva na tabela `interactions` com type `message_generated`
6. Possibilidade de regenerar com variações (novo request ao mesmo endpoint)
7. Throttling para respeitar rate limits do Gemini
8. Tempo de geração < 10 segundos por mensagem
9. Testes para construção do prompt e parsing da resposta

#### Story 2.2: Message Templates & Configuration

> As a consultant,
> I want configurable message templates for different outreach scenarios,
> so that I can maintain consistent tone while varying approach by context.

**Acceptance Criteria:**

1. 3 templates default criados via seed: Connection Request, Follow-up, InMail
2. Route Handlers CRUD para templates: `GET/POST /api/templates`, `PATCH/DELETE /api/templates/[id]`
3. Geração de mensagem usa template selecionado (default: connection_request)
4. Templates suportam variáveis: `{{prospect_name}}`, `{{company}}`, `{{title}}`, `{{headline}}`
5. Página `/templates` para gerenciar templates com preview
6. Testes para substituição de variáveis e validação de templates

#### Story 2.3: Message Review & Approval UI

> As a consultant,
> I want to review, edit, and approve AI-generated messages before sending,
> so that I maintain quality control over every outreach.

**Acceptance Criteria:**

1. Na página `/prospects/[id]`, layout side-by-side: perfil do prospect (esquerda) + mensagem gerada (direita)
2. Mensagem editável inline com textarea
3. Botão "Regenerar" para gerar nova variação sem perder a anterior
4. Botão "Copiar" que copia mensagem para clipboard com feedback visual (toast)
5. Seletor de template visível na tela de geração
6. Geração em lote: selecionar múltiplos prospects na listagem e gerar mensagens para todos
7. Histórico de mensagens geradas visível na página do prospect

---

### Epic 3: Dashboard & Pipeline Management

**Goal:** Dashboard completo com visualização Kanban do pipeline, métricas de desempenho, e ferramentas de gestão para operar o funil de prospecção de forma eficiente.

#### Story 3.1: Kanban Pipeline View

> As a consultant,
> I want a Kanban board showing my prospects by stage,
> so that I can visualize my entire pipeline at a glance.

**Acceptance Criteria:**

1. Página `/` apresenta visualização Kanban com colunas: Novo → Mensagem Gerada → Enviado → Respondeu → Converteu / Descartado
2. Cards de prospect mostram: nome, cargo, empresa, data da última ação
3. Drag-and-drop para mover prospects entre colunas (atualiza status via Server Action)
4. Contadores por coluna visíveis no header
5. Filtros globais aplicáveis ao Kanban (empresa, data, busca por texto)
6. Responsivo: colunas empilham em telas menores

#### Story 3.2: Metrics Dashboard & Export

> As a consultant,
> I want to see key metrics and export my data,
> so that I can track performance and share results.

**Acceptance Criteria:**

1. Seção de métricas no topo do dashboard: total de prospects, taxa de resposta (%), conversões, mensagens enviadas
2. Métricas calculadas via Server Component (SSR)
3. Route Handler `GET /api/export/csv` exporta prospects com interações em CSV
4. Botão "Exportar CSV" no dashboard
5. Filtros ativos são aplicados na exportação

#### Story 3.3: Prospect Detail & Interaction History

> As a consultant,
> I want a complete view of each prospect with full interaction history,
> so that I can make informed decisions about next steps.

**Acceptance Criteria:**

1. Página `/prospects/[id]` com todas as informações do perfil LinkedIn
2. Timeline de interações em ordem cronológica (mensagens geradas, enviadas, respostas, notas)
3. Formulário para adicionar notas manuais ao prospect (Server Action)
4. Botões de ação rápida: Gerar Mensagem, Alterar Status, Adicionar Nota, Descartar
5. Link direto para o perfil LinkedIn do prospect (abre em nova aba)
6. Navegação entre prospects (anterior/próximo)

---

## 7. Checklist Results Report

_(A ser preenchido após execução do pm-checklist)_

---

## 8. Next Steps

### 8.1 UX Expert Prompt

> @ux-design-expert — Criar o design system e wireframes para o Strategic Reset Prospector usando este PRD como input. Stack: Next.js + shadcn/ui + Tailwind CSS. Foco na visualização Kanban (Story 3.1), tela de geração de mensagens side-by-side (Story 2.3), e formulário de configuração de busca (Story 1.4). Paleta neutra/corporativa, desktop-first.

### 8.2 Architect Prompt

> @architect — Projetar a arquitetura técnica do Strategic Reset Prospector usando este PRD como input. Stack obrigatória: Next.js + Vercel, Turso (libSQL/SQLite), Apify REST API, Gemini API. Foco na estrutura de projeto Next.js App Router, schema Drizzle, integração com APIs externas, e estratégia de prompts para geração de mensagens premium.
