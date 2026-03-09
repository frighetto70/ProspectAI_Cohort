# Strategic Reset Prospector — System Architecture

## 1. Architecture Overview

### 1.1 System Type

**Serverless fullstack** — Next.js App Router deployado na Vercel com Turso (SQLite cloud) como banco de dados. Sem servidores gerenciados, sem containers. Acessível via browser de qualquer lugar.

### 1.2 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     VERCEL (Edge/Serverless)                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  Next.js App Router                     │ │
│  │                                                         │ │
│  │  ┌─────────────────┐    ┌───────────────────────────┐  │ │
│  │  │ Server Components│    │     Route Handlers        │  │ │
│  │  │ (SSR pages)      │    │     (API endpoints)       │  │ │
│  │  │                  │    │                           │  │ │
│  │  │ - Dashboard      │    │  /api/prospects           │  │ │
│  │  │ - Prospect Detail│    │  /api/scrape              │  │ │
│  │  │ - Templates      │    │  /api/templates           │  │ │
│  │  │ - Settings       │    │  /api/export              │  │ │
│  │  └────────┬─────────┘    └──────────┬────────────────┘  │ │
│  │           │                          │                   │ │
│  │           │    ┌─────────────────┐   │                   │ │
│  │           └───►│  Server Actions  │◄──┘                  │ │
│  │                │  (mutations)     │                       │ │
│  │                └────────┬─────────┘                      │ │
│  └─────────────────────────┼────────────────────────────────┘ │
│                            │                                  │
└────────────────────────────┼──────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────▼──────┐ ┌────▼─────┐ ┌──────▼──────┐
       │    Turso     │ │  Apify   │ │  Gemini API │
       │  (libSQL)    │ │ REST API │ │  (Google)   │
       │  SQLite cloud│ │          │ │             │
       └─────────────┘ └──────────┘ └─────────────┘
```

### 1.3 Design Principles

- **Serverless-first** — zero servidores para gerenciar, escala automática
- **Type-safe end-to-end** — TypeScript + Drizzle + Zod
- **Server Components por padrão** — Client Components apenas para interatividade
- **Custo zero** — free tiers: Vercel Hobby, Turso Free, Gemini Free, Apify Free
- **Simplicidade** — Next.js unifica frontend e backend, sem stack separada

---

## 2. Technology Stack

| Layer | Technology | Justificativa |
|-------|-----------|---------------|
| **Framework** | Next.js 15 (App Router) | Fullstack, SSR, Server Components, deploy Vercel nativo |
| **Runtime** | Node.js 20 (Vercel) | Runtime padrão Vercel |
| **Database** | Turso (libSQL) + Drizzle ORM | SQLite cloud, type-safe, free tier 9GB |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Utility-first + componentes acessíveis prontos |
| **Drag & Drop** | @dnd-kit | Leve, acessível, perfeito para Kanban |
| **AI** | @google/generative-ai | SDK oficial do Gemini |
| **Scraping** | Apify REST API v2 (fetch) | Chamadas HTTP diretas, sem SDK |
| **Validation** | Zod | Schema validation para inputs e env vars |
| **Testing** | Vitest | Rápido, ESM nativo, compatível Next.js |
| **Deploy** | Vercel | Zero-config para Next.js, preview deploys |
| **Language** | TypeScript 5.7 | Strict mode, full-stack |

### 2.1 Dependências

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@libsql/client": "^0.14.0",
    "drizzle-orm": "^0.39.0",
    "@google/generative-ai": "^0.21.0",
    "zod": "^3.23.0",
    "@dnd-kit/core": "^6.0.0",
    "@dnd-kit/sortable": "^8.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tailwindcss": "^4.0.0",
    "drizzle-kit": "^0.30.0",
    "vitest": "^3.0.0",
    "@types/react": "^19.0.0",
    "@types/node": "^22.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

**Nota:** shadcn/ui não é dependência — são componentes copiados via CLI (`npx shadcn@latest add`).

---

## 3. Project Structure

```
strategic-reset-prospector/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (nav, providers)
│   ├── page.tsx                      # Dashboard (Kanban + Metrics)
│   ├── loading.tsx                   # Loading skeleton
│   ├── prospects/
│   │   └── [id]/
│   │       └── page.tsx              # Prospect detail + messages
│   ├── templates/
│   │   └── page.tsx                  # Template management
│   ├── settings/
│   │   └── page.tsx                  # ICP config + scrape control
│   └── api/
│       ├── health/
│       │   └── route.ts              # GET /api/health
│       ├── prospects/
│       │   ├── route.ts              # GET, POST /api/prospects
│       │   ├── bulk-generate/
│       │   │   └── route.ts          # POST /api/prospects/bulk-generate
│       │   └── [id]/
│       │       ├── route.ts          # GET, PATCH, DELETE /api/prospects/:id
│       │       └── generate-message/
│       │           └── route.ts      # POST /api/prospects/:id/generate-message
│       ├── scrape/
│       │   ├── route.ts              # POST /api/scrape
│       │   └── [jobId]/
│       │       └── route.ts          # GET /api/scrape/:jobId
│       ├── templates/
│       │   ├── route.ts              # GET, POST /api/templates
│       │   └── [id]/
│       │       └── route.ts          # PATCH, DELETE /api/templates/:id
│       ├── metrics/
│       │   └── route.ts              # GET /api/metrics
│       └── export/
│           └── csv/
│               └── route.ts          # GET /api/export/csv
│
├── components/                       # React components
│   ├── ui/                           # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── kanban/
│   │   ├── kanban-board.tsx          # Board container
│   │   ├── kanban-column.tsx         # Status column
│   │   └── prospect-card.tsx         # Draggable card
│   ├── prospects/
│   │   ├── prospect-table.tsx        # Table view (fallback)
│   │   ├── prospect-profile.tsx      # LinkedIn data display
│   │   └── search-filters.tsx        # Status + text filters
│   ├── messages/
│   │   ├── message-generator.tsx     # Side-by-side generate UI
│   │   ├── message-editor.tsx        # Editable textarea
│   │   └── template-selector.tsx     # Template dropdown
│   ├── metrics-bar.tsx               # Top metrics strip
│   ├── interaction-timeline.tsx      # Chronological history
│   └── nav.tsx                       # Sidebar navigation
│
├── lib/                              # Shared utilities
│   ├── db/
│   │   ├── index.ts                  # Drizzle client (Turso connection)
│   │   ├── schema.ts                 # Drizzle schema definitions
│   │   └── seed.ts                   # Default templates
│   ├── services/
│   │   ├── prospect.service.ts       # Prospect CRUD logic
│   │   ├── scraper.service.ts        # Apify REST API calls
│   │   ├── message.service.ts        # Gemini prompt + generation
│   │   └── export.service.ts         # CSV generation
│   ├── apify.ts                      # Apify REST API client (fetch wrapper)
│   ├── gemini.ts                     # Gemini client singleton
│   ├── config.ts                     # Env vars validation (Zod)
│   ├── types.ts                      # Domain types
│   └── constants.ts                  # Status enums, defaults
│
├── actions/                          # Server Actions
│   ├── prospect-actions.ts           # Update status, add note
│   ├── scrape-actions.ts             # Trigger scrape
│   └── message-actions.ts            # Generate, regenerate
│
├── drizzle/
│   └── migrations/                   # SQL migrations (auto-generated)
│
├── tests/
│   ├── services/
│   │   ├── prospect.service.test.ts
│   │   ├── scraper.service.test.ts
│   │   └── message.service.test.ts
│   └── api/
│       └── routes.test.ts
│
├── middleware.ts                      # Auth middleware (password check)
├── drizzle.config.ts                 # Drizzle Kit config
├── next.config.ts                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── tsconfig.json                     # TypeScript config
├── package.json
├── .env.local                        # API keys (gitignored)
├── .env.example                      # Template
├── .gitignore
└── docs/
    ├── prd.md
    └── architecture.md
```

---

## 4. Database Schema (Drizzle + Turso)

```typescript
// lib/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const prospects = sqliteTable('prospects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  title: text('title'),
  company: text('company'),
  industry: text('industry'),
  linkedinUrl: text('linkedin_url').unique(),
  headline: text('headline'),
  summary: text('summary'),
  location: text('location'),
  profileImageUrl: text('profile_image_url'),
  status: text('status', {
    enum: ['new', 'message_generated', 'sent', 'replied', 'converted', 'discarded']
  }).default('new').notNull(),
  rawData: text('raw_data'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const interactions = sqliteTable('interactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  prospectId: integer('prospect_id').references(() => prospects.id, { onDelete: 'cascade' }).notNull(),
  type: text('type', {
    enum: ['message_generated', 'message_sent', 'reply', 'note']
  }).notNull(),
  content: text('content').notNull(),
  templateId: integer('template_id').references(() => messageTemplates.id),
  metadata: text('metadata'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messageTemplates = sqliteTable('message_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type', {
    enum: ['connection_request', 'follow_up', 'inmail']
  }).notNull(),
  systemPrompt: text('system_prompt').notNull(),
  userPromptTemplate: text('user_prompt_template').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const scrapeJobs = sqliteTable('scrape_jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  apifyRunId: text('apify_run_id'),
  criteria: text('criteria').notNull(),
  status: text('status', {
    enum: ['pending', 'running', 'completed', 'failed']
  }).default('pending').notNull(),
  prospectsFound: integer('prospects_found').default(0),
  prospectsNew: integer('prospects_new').default(0),
  error: text('error'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  completedAt: text('completed_at'),
});
```

### 4.1 Turso Connection

```typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
```

---

## 5. API Design

### 5.1 Route Handlers

```
BASE: https://{app}.vercel.app/api

Health
  GET    /api/health                                → { status: "ok" }

Prospects
  GET    /api/prospects?status=X&search=Y&page=1    → { data: Prospect[], total: number }
  POST   /api/prospects                              → Prospect
  GET    /api/prospects/[id]                         → Prospect (with interactions)
  PATCH  /api/prospects/[id]                         → Prospect
  DELETE /api/prospects/[id]                         → { deleted: true }

Scraping
  POST   /api/scrape                                → { jobId, status: "running" }
  GET    /api/scrape/[jobId]                        → ScrapeJob

Messages
  POST   /api/prospects/[id]/generate-message       → Interaction
  POST   /api/prospects/bulk-generate               → { queued: number }

Templates
  GET    /api/templates                              → Template[]
  POST   /api/templates                              → Template
  PATCH  /api/templates/[id]                         → Template
  DELETE /api/templates/[id]                         → { deleted: true }

Metrics
  GET    /api/metrics                                → { total, byStatus, responseRate, conversionRate }

Export
  GET    /api/export/csv?status=X&search=Y          → CSV file (Content-Disposition: attachment)
```

### 5.2 Server Actions

```typescript
// actions/prospect-actions.ts
'use server'

export async function updateProspectStatus(id: number, status: ProspectStatus) { ... }
export async function addProspectNote(id: number, content: string) { ... }
export async function discardProspect(id: number) { ... }

// actions/message-actions.ts
'use server'

export async function generateMessage(prospectId: number, templateId: number) { ... }
export async function bulkGenerateMessages(prospectIds: number[], templateId: number) { ... }

// actions/scrape-actions.ts
'use server'

export async function startScrape(criteria: ScrapeCriteria) { ... }
```

---

## 6. Integration Architecture

### 6.1 Apify REST API Integration

```typescript
// lib/apify.ts — REST API client (NO SDK)

const APIFY_BASE = 'https://api.apify.com/v2';

export async function runActor(actorId: string, input: Record<string, unknown>) {
  const res = await fetch(`${APIFY_BASE}/acts/${actorId}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.APIFY_TOKEN}`,
    },
    body: JSON.stringify(input),
  });
  return res.json(); // { data: { id: runId, status, ... } }
}

export async function getRunStatus(runId: string) {
  const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}`, {
    headers: { 'Authorization': `Bearer ${process.env.APIFY_TOKEN}` },
  });
  return res.json();
}

export async function getDatasetItems(datasetId: string) {
  const res = await fetch(`${APIFY_BASE}/datasets/${datasetId}/items`, {
    headers: { 'Authorization': `Bearer ${process.env.APIFY_TOKEN}` },
  });
  return res.json();
}
```

**Fluxo de scraping:**
1. `POST /api/scrape` → chama `runActor()` → salva job com status `running`
2. Frontend faz polling `GET /api/scrape/[jobId]` → chama `getRunStatus()`
3. Quando `status === 'SUCCEEDED'` → chama `getDatasetItems()` → parse + dedupe + save
4. Job atualizado para `completed` com contadores

### 6.2 Gemini API Integration

```typescript
// lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateProspectMessage(
  prospect: Prospect,
  template: MessageTemplate,
  customContext?: string
) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent({
    systemInstruction: template.systemPrompt,
    contents: [{
      role: 'user',
      parts: [{ text: buildUserPrompt(prospect, template, customContext) }],
    }],
  });

  return {
    content: result.response.text(),
    metadata: {
      model: 'gemini-2.0-flash',
      tokensUsed: result.response.usageMetadata?.totalTokenCount,
    },
  };
}
```

**Default System Prompt:**
```
Você é um consultor estratégico sênior especializado em transformação
corporativa. Escreva mensagens de prospecção no LinkedIn que sejam:
- Pessoais e específicas ao contexto do prospect
- Tom de colega estratégico, NUNCA de vendedor
- Curtas (máx 300 caracteres para connection request)
- Mencione algo específico do perfil do prospect
- Apresente o conceito 'Strategic Reset' de forma natural
- Sem emojis, sem exclamações excessivas, sem clichês de vendas
```

---

## 7. Authentication

Autenticação simples via middleware Next.js — password única armazenada como env var.

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip health check
  if (request.nextUrl.pathname === '/api/health') {
    return NextResponse.next();
  }

  // Check auth cookie
  const auth = request.cookies.get('auth');
  if (auth?.value === process.env.APP_PASSWORD) {
    return NextResponse.next();
  }

  // Redirect to login
  if (!request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

Tela `/login` simples com campo de password. Ao acertar, seta cookie `auth` com o valor.

---

## 8. Frontend Architecture

### 8.1 Rendering Strategy

| Page | Strategy | Rationale |
|------|----------|-----------|
| `/` (Dashboard) | Server Component + Client islands | Métricas SSR, Kanban board é Client Component (drag) |
| `/prospects/[id]` | Server Component + Client islands | Dados SSR, message editor é Client Component |
| `/templates` | Server Component + Client islands | Lista SSR, editor é Client Component |
| `/settings` | Client Component | Formulário interativo completo |

### 8.2 Client Components (interatividade)

Apenas estes componentes precisam ser Client Components (`'use client'`):

- `KanbanBoard` — drag-and-drop (@dnd-kit)
- `MessageGenerator` — geração assíncrona + edição
- `MessageEditor` — textarea editável
- `SearchFilters` — filtros interativos com URL search params
- `ScrapeForm` — formulário + polling de status
- `TemplateEditor` — formulário CRUD

Tudo o mais é Server Component por padrão.

### 8.3 Routing

```
/                    → Dashboard (Kanban + Metrics)
/prospects/[id]      → Prospect Detail (profile + messages + timeline)
/templates           → Template Management (CRUD)
/settings            → ICP Configuration + Scrape Control
/login               → Password authentication
```

---

## 9. Environment Variables

```bash
# .env.example

# Database (Turso)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# APIs
APIFY_TOKEN=your-apify-token
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash

# Auth
APP_PASSWORD=your-secure-password

# App
NODE_ENV=development
```

Validação via Zod no startup — app não inicia sem variáveis obrigatórias.

```typescript
// lib/config.ts
import { z } from 'zod';

const envSchema = z.object({
  TURSO_DATABASE_URL: z.string().url(),
  TURSO_AUTH_TOKEN: z.string().min(1),
  APIFY_TOKEN: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  APP_PASSWORD: z.string().min(8),
});

export const env = envSchema.parse(process.env);
```

---

## 10. Cross-Cutting Concerns

### 10.1 Error Handling

- **Route Handlers:** Try/catch com formato padronizado `{ error: { code, message } }`
- **Server Actions:** Return `{ success: false, error: string }` pattern
- **Client:** Toast notifications via shadcn/ui toast
- **APIs externas:** Retry com backoff para Apify e Gemini (max 3 tentativas)

### 10.2 Logging

- `console.log/error` em dev — Vercel captura automaticamente em produção
- Log de todas as chamadas ao Apify e Gemini com duração e status

### 10.3 Security

- **Autenticação:** Password via cookie (middleware Next.js)
- **Input validation:** Zod schemas em todos os Route Handlers
- **SQL injection:** Impossível com Drizzle ORM (prepared statements)
- **API keys:** Apenas server-side via `process.env`, nunca expostas ao client
- **CORS:** Não necessário — mesma origin (Next.js serve tudo)

---

## 11. Deployment

### 11.1 Vercel

```bash
# Deploy automático via Git
git push origin main  # Vercel detecta e deploya

# Ou manual
npx vercel
```

**Vercel Config:**
- Framework: Next.js (auto-detected)
- Node.js: 20.x
- Environment Variables: configurar no Vercel Dashboard
- Build: `next build`
- Output: `.next/`

### 11.2 Turso Setup

```bash
# Instalar CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Criar database
turso db create strategic-reset-prospector

# Obter URL e token
turso db show strategic-reset-prospector --url
turso db tokens create strategic-reset-prospector
```

### 11.3 Free Tier Limits

| Service | Free Tier | Sufficient? |
|---------|-----------|-------------|
| **Vercel Hobby** | 100GB bandwidth, serverless functions | Sim — operação solo |
| **Turso Free** | 9GB storage, 500M rows read/mês | Sim — milhares de prospects |
| **Apify Free** | $5/mês em créditos, 30 actor runs/dia | Sim — prospecção semanal |
| **Gemini Free** | 15 RPM, 1M tokens/min | Sim — geração unitária |

---

## 12. Architecture Decision Records (ADR)

### ADR-1: Next.js App Router (fullstack)

**Decision:** Next.js App Router ao invés de backend separado (Fastify/Express) + React SPA.
**Rationale:** Stack obrigatória. Unifica frontend e backend em um projeto. Server Components eliminam necessidade de API calls para leitura. Route Handlers substituem Express routes. Deploy nativo na Vercel com zero config.

### ADR-2: Turso (libSQL) instead of local SQLite

**Decision:** Turso ao invés de better-sqlite3 local.
**Rationale:** SQLite local não funciona em Vercel (serverless = filesystem efêmero). Turso é SQLite hospedado, wire-compatible, funciona com Drizzle, free tier generoso (9GB). Mesma linguagem SQL, mesma semântica, acessível de serverless functions.

### ADR-3: Apify REST API instead of SDK

**Decision:** Chamadas HTTP diretas (fetch) ao invés de Apify Client SDK.
**Rationale:** Stack obrigatória. REST API é mais leve (sem dependência extra), funciona em qualquer runtime (Edge, Node), e a API do Apify é simples (3 endpoints: run actor, get status, get dataset).

### ADR-4: shadcn/ui for UI components

**Decision:** shadcn/ui ao invés de Material UI, Chakra, ou componentes custom.
**Rationale:** Componentes são copiados (não dependência npm), totalmente customizáveis, acessíveis por padrão, built on Radix UI, perfeito para Tailwind CSS. Zero runtime overhead.

### ADR-5: Server Actions for mutations

**Decision:** Server Actions ao invés de fetch para mutations (update status, add note).
**Rationale:** Server Actions eliminam boilerplate de API calls para mutations simples. Revalidação automática de cache. Type-safe end-to-end. Fallback para Route Handlers em operações complexas (scraping, message generation).

### ADR-6: Password auth instead of OAuth

**Decision:** Password simples via env var ao invés de NextAuth/OAuth.
**Rationale:** Operação solo, sem multi-tenancy. OAuth adiciona complexidade desnecessária. Password via middleware + cookie é suficiente para proteger o dashboard de acesso público.

### ADR-7: scrape_jobs table

**Decision:** Tabela `scrape_jobs` adicionada ao schema (não no PRD original).
**Rationale:** Rastrear execuções do Apify é essencial: evita re-runs acidentais, habilita polling de status, registra métricas de eficiência. Custo zero, valor alto.

---

*Architecture designed by Aria (Architect Agent) — 2026-03-06 v2.0*
