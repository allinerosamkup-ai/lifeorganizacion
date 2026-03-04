# CLAUDE.md — LifeOrganizer AI

> AI-assistant guidelines for the **LifeOrganizer AI** codebase.
> Codebase language: **Portuguese (Brazilian)**. This file is in English for AI tooling compatibility.

---

## Project Overview

**LifeOrganizer AI** is an adaptive personal-operating-system that tracks menstrual cycles, sleep quality, and daily mood to generate AI-powered task suggestions. It learns the user's biological rhythm and schedules tasks at optimal energy windows.

**Current Status:** 🚧 In Development — Phase 4 (Frontend)
**Version:** 0.1.0
**Last Updated:** February 2026

---

## Architecture: 3-Layer Model

```
Layer 1 — Directives   (directives/)        Markdown SOPs defining objectives & processes
Layer 2 — Orchestration (workflows/)        n8n TypeScript workflows with decision logic
Layer 3 — Execution    (execution/)         Deterministic Python scripts
```

The frontend and Supabase backend sit alongside this orchestration layer.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite 7 |
| Styling | TailwindCSS 3.4 + custom design tokens |
| Icons | lucide-react |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| Edge Runtime | Deno (TypeScript) |
| Automations | n8n Cloud 2.9.2 (TypeScript decorator format) |
| AI (Edge Fns) | OpenAI GPT-4o |
| AI (n8n) | Claude API (Anthropic) |
| Payments | Stripe |
| Deploy | Vercel |
| Scripts | Python 3.8+ |

---

## Directory Structure

```
lifeorganizacion/
├── directives/                  # Markdown SOPs and process guides
│   ├── setup-infra.md           # Infrastructure setup guide
│   ├── supabase-setup.md        # Supabase configuration guide
│   ├── edge-functions.md        # Edge Functions development guide
│   ├── layouts-guide.md         # HTML → React conversion guide
│   ├── references-guide.md      # How to use reference repos
│   └── exemplo_diretiva.md      # Template for new directives
│
├── execution/                   # Python utility scripts
│   ├── setup_dev_environment.py # Verify dev environment (Git, Node, Python)
│   ├── clone_references.py      # Clone reference GitHub repos
│   ├── setup_supabase.py        # Supabase initial setup
│   ├── verify_supabase_setup.py # Verify Supabase tables and connection
│   ├── apply_migration.py       # Apply SQL migrations
│   └── test_supabase_connection.py
│
├── frontend/
│   ├── app/                     # Main React/Vite application (PRIMARY)
│   │   ├── src/
│   │   │   ├── main.tsx         # Entry point (React root + AuthProvider)
│   │   │   ├── App.tsx          # Root component with view routing
│   │   │   ├── index.css        # Global styles, Tailwind base
│   │   │   ├── pages/           # Page-level components
│   │   │   └── lib/             # Shared utilities and context
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── tsconfig.json
│   ├── stitch_base2/            # UI design references (Stitch exports)
│   └── LifeOrganization/        # HTML mockups from Lovable.dev
│
├── supabase/
│   ├── migrations/              # SQL schema migrations
│   │   ├── 20240220000001_initial_schema.sql
│   │   ├── 20240226000000_create_rpc_functions.sql
│   │   └── 99999999999999_backend_infrastructure.sql
│   ├── functions/               # Supabase Edge Functions (Deno/TypeScript)
│   │   ├── calculate-cycle-phase/index.ts
│   │   ├── process-checkin/index.ts
│   │   ├── generate-daily-suggestions/index.ts
│   │   ├── update-weekly-learning/index.ts
│   │   ├── chat-ai/index.ts
│   │   └── stripe-webhook/index.ts
│   └── types_remote.ts          # Generated TypeScript types from Supabase
│
├── workflows/                   # n8n automation workflows
│   └── n8n_n8n_vaax5y_easypanel_host_alline izabel_r/personal/
│       ├── LifeOrganizer — 01 Welcome Workflow.workflow.ts
│       ├── LifeOrganizer — 02 Daily Check-in Reminder.workflow.ts
│       ├── LifeOrganizer — 03 Cycle Phase Alert.workflow.ts
│       ├── LifeOrganizer — 04 Weekly Insights Digest.workflow.ts
│       ├── LifeOrganizer — 05 Stripe Billing Events.workflow.ts
│       ├── LifeOrganizer — 06 Weekly Learning Engine.workflow.ts
│       ├── [LifeOrganizer] Reflexão Semanal.workflow.ts
│       ├── [LifeOrganizer] Sugestão Diária.workflow.ts
│       └── tsconfig.json
│
├── layouts/                     # Static HTML layout references
├── .tmp/                        # Intermediate files (always regeneratable)
├── requirements.txt             # Python dependencies
├── AGENTS.md                    # n8n workflow engineering guidelines
├── README.md                    # Project overview (Portuguese)
└── PRÓXIMOS_PASSOS.md           # Next steps / roadmap
```

---

## Frontend Application

### Routing

The app uses **view-based navigation** via React `useState` — not `react-router-dom` URL routes.

```tsx
// In App.tsx
const [view, setView] = useState('login');

// Navigate by calling setView
navigate('home')        // from child components
setView('cycle')        // from App itself
```

**View flow:**

```
login → onboarding-1 → onboarding-2 → onboarding-3 → sanctuary → home
home ↔ agenda / cycle / chat / focus / profile
```

Auth state drives which view is actually rendered via `useMemo` — if not authenticated, users always land on `login`; if authenticated but onboarding incomplete, always on `onboarding-1`.

### Pages

| File | View key | Purpose |
|------|----------|---------|
| `Login.tsx` | `login` | Email/password + Google OAuth |
| `Onboarding1.tsx` | `onboarding-1` | First onboarding step |
| `Onboarding2.tsx` | `onboarding-2` | Second onboarding step |
| `Onboarding3.tsx` | `onboarding-3` | Final step, writes profile data |
| `Sanctuary.tsx` | `sanctuary` | Post-onboarding welcome |
| `Home.tsx` | `home` | Main dashboard + daily check-in |
| `CycleTracker.tsx` | `cycle` | Menstrual cycle tracking |
| `AIChat.tsx` | `chat` | AI conversation interface |
| `FocusSession.tsx` | `focus` | Pomodoro/focus timer |
| `Profile.tsx` | `profile` | User profile management |
| `Agenda.tsx` | `agenda` | Task agenda |
| `BottomNav.tsx` | (overlay) | Mobile bottom navigation |

### Shared Library (`src/lib/`)

- **`supabase.ts`** — Initializes and exports the Supabase client. Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **`AuthContext.tsx`** — React Context providing: `session`, `user`, `profile`, `loading`, `signInWithGoogle()`, `signInWithEmail()`, `signUpWithEmail()`, `signOut()`, `refreshProfile()`.

### Design System

Custom Tailwind tokens (in `tailwind.config.js`):

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#D946EF` | Primary actions, brand |
| `secondary` | `#D0A9D9` | Secondary elements |
| `action` | `#C07A92` | CTA buttons |
| `accent` | `#FDE2D6` | Highlights, cards |
| `background-light` | `#FFF5F5` | Page background |
| `background-dark` | `#1F1824` | Dark mode background |
| `soft-purple` | `#E9D5FF` | Tags, badges |
| `accent-teal` | `#2DD4BF` | Success states |
| `accent-rose` | `#FB7185` | Alerts, warnings |

**Fonts:** `DM Serif Display` (display/headings), `Nunito` (body)
**Dark mode:** Class-based (`darkMode: "class"`)
**Border radius:** `1rem` default, `1.5rem` xl, `2rem` 2xl
**Shadow presets:** `soft`, `glow`, `3d`, `3d-pressed`, `glass`, `glass-inset`

### Frontend Dev Commands

```bash
cd frontend/app

npm run dev       # Start dev server (localhost:5173)
npm run build     # Production build: tsc -b && vite build
npm run lint      # ESLint
npm run preview   # Preview production build
```

---

## Database (Supabase/PostgreSQL)

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User data, plan (free/pro/enterprise), Stripe ID, cycle settings |
| `check_ins` | Daily mood/energy/sleep records with AI analysis (1 per user/day) |
| `tasks` | Tasks with subtasks (JSONB), energy level, AI insights |
| `cycle_data` | Historical menstrual cycle records for phase calculation |
| `ai_suggestions` | Daily AI-generated task suggestions (1 per user/day) |
| `weekly_learnings` | Pattern analysis: success rate, peak hour, avg energy (1 per user/week) |
| `focus_sessions` | Focus timer sessions linked to tasks |

### Key Schema Notes

- **RLS enabled** on all tables — every query is automatically scoped to `auth.uid()`.
- `profiles.id` is the Supabase `auth.users.id` (UUID). A trigger auto-creates a profile on sign-up.
- `check_ins`, `ai_suggestions`, `weekly_learnings` have `UNIQUE(user_id, date/week_start)` constraints.
- `tasks.subtasks` is JSONB (array of subtask objects).
- `updated_at` columns auto-update via triggers.

### Cycle Phase Logic

Phases: `menstrual` → `follicular` → `ovulatory` → `luteal`

- **Menstrual:** High rest, low-energy tasks
- **Follicular:** High creativity, complex tasks
- **Ovulatory:** Peak energy, social/collaborative tasks
- **Luteal:** Routine tasks, reduced complexity

### Applying Migrations

```bash
# Via Supabase CLI
supabase login
supabase link --project-ref bmvqtzxdrnbioxhiiosr
supabase db push

# Via SQL Editor (Supabase Dashboard)
# Paste contents of supabase/migrations/20240220000001_initial_schema.sql

# Verify
python execution/verify_supabase_setup.py
```

---

## Supabase Edge Functions

Located in `supabase/functions/<name>/index.ts`. Written in **Deno TypeScript**.

| Function | Trigger | Purpose |
|----------|---------|---------|
| `calculate-cycle-phase` | HTTP | Returns current phase, day of cycle, days until next |
| `process-checkin` | HTTP | Saves check-in, runs AI analysis, generates suggestions |
| `generate-daily-suggestions` | HTTP / Scheduled | Generates 3–5 task suggestions from cycle + sleep context |
| `update-weekly-learning` | Scheduled | Computes weekly patterns and upserts `weekly_learnings` |
| `chat-ai` | HTTP | Conversational AI using OpenAI GPT-4o |
| `stripe-webhook` | Stripe webhook | Handles billing events, updates `profiles.plan` |

### Edge Function Pattern

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    // ...auth validation, business logic, response
})
```

All functions:

1. Handle `OPTIONS` preflight for CORS.
2. Require `Authorization: Bearer <user-token>` header.
3. Create a Supabase client scoped to the user's JWT so RLS applies automatically.

### Deploying Edge Functions

```bash
supabase functions deploy calculate-cycle-phase
supabase functions deploy process-checkin
supabase functions deploy generate-daily-suggestions
supabase functions deploy update-weekly-learning
supabase functions deploy chat-ai
supabase functions deploy stripe-webhook
```

### Edge Function Secrets (set in Supabase Dashboard → Settings → Edge Functions)

```
OPENAI_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
EVOLUTION_API_URL       # WhatsApp (optional)
EVOLUTION_API_KEY
EVOLUTION_INSTANCE
```

---

## n8n Workflows

Workflows are stored as **TypeScript files** using the `@n8n-as-code/core` decorator format. See `AGENTS.md` for the full n8n engineering guidelines.

### Active Workflows

| File | Purpose |
|------|---------|
| `01 Welcome Workflow` | Fires on new user registration; sends welcome message via Claude |
| `02 Daily Check-in Reminder` | Scheduled reminder for daily check-in |
| `03 Cycle Phase Alert` | Notifies user of phase transitions |
| `04 Weekly Insights Digest` | Weekly summary of patterns and insights |
| `05 Stripe Billing Events` | Handles Stripe webhooks in n8n |
| `06 Weekly Learning Engine` | Triggers weekly learning computation |
| `Reflexão Semanal` | Weekly reflection prompt |
| `Sugestão Diária` | Daily suggestion generation trigger |

### Workflow File Format

```typescript
// <workflow-map>
// Workflow : Workflow Name
// Nodes   : N  |  Connections: M
// NODE INDEX ...
// ROUTING MAP ...
// </workflow-map>

import { workflow, node, links } from '@n8n-as-code/core';

@workflow({ name: 'LifeOrganizer — 01 Welcome Workflow', active: true })
export class WelcomeWorkflow {
    @node({ name: 'Webhook Trigger', type: 'n8n-nodes-base.webhook', version: 2 })
    WebhookTrigger = { /* parameters */ };

    @links()
    defineRouting() {
        this.WebhookTrigger.out(0).to(this.NextNode.in(0));
    }
}
```

### n8n Tooling

```bash
# ALWAYS start with search before writing any node
./n8nac-skills search "google sheets"

# Get EXACT schema for a node
./n8nac-skills get googleSheets

# Search community workflows for inspiration
./n8nac-skills workflows search "stripe webhook"

# Validate before committing
./n8nac-skills validate workflow.workflow.ts
```

**Critical n8n rules (from AGENTS.md):**

- Node `type` must have full package prefix: `"n8n-nodes-base.switch"` not `"switch"`.
- Always use the **highest** `typeVersion` from the schema.
- Never guess parameter names — always run `./n8nac-skills get <node>` first.
- Use modern expressions: `{{ $json.fieldName }}` not legacy `{{ $node["Name"].json.field }}`.
- AI sub-node connections use `.uses()` not `.out().to()`.

---

## Python Scripts

```bash
# Install dependencies
pip install -r requirements.txt

# Verify dev environment
python execution/setup_dev_environment.py

# Clone reference repos (for study)
python execution/clone_references.py

# Verify Supabase is fully set up
python execution/verify_supabase_setup.py

# Apply SQL migration manually
python execution/apply_migration.py
```

**Dependencies:** `python-dotenv>=1.0.0`, `requests>=2.31.0`

---

## Environment Variables

### Frontend (`frontend/app/.env`)

```env
VITE_SUPABASE_URL=https://bmvqtzxdrnbioxhiiosr.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

### Root `.env` (Python scripts + n8n)

```env
SUPABASE_URL=https://bmvqtzxdrnbioxhiiosr.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # NEVER expose to frontend
CLAUDE_API_KEY=<anthropic-key>
OPENAI_API_KEY=<openai-key>
STRIPE_SECRET_KEY=<stripe-key>
```

**Security rules:**

- `.env` is gitignored — **never commit it**.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — never expose it client-side.
- Frontend only uses the `ANON_KEY` (prefixed with `VITE_`).

---

## Key Conventions

### React / Frontend

- **View navigation:** Always use `setView('view-key')` (or the `navigate` prop). Never use `window.location` or `<Link>`.
- **Auth access:** Use the `useAuth()` hook from `lib/AuthContext.tsx`. Never call `supabase.auth` directly in pages.
- **Supabase queries:** Import `supabase` from `lib/supabase.ts`. Keep queries in the component or a dedicated lib file; do not scatter client initialization.
- **Styling:** Use Tailwind utility classes with the custom design tokens (e.g., `bg-background-light`, `text-primary`, `font-display`). Avoid arbitrary values unless absolutely necessary.
- **Mobile-first:** Max container width is `max-w-md` (448px). All UI should work on a 390px-wide screen.
- **Dark mode:** Use `dark:` variants. Dark mode is class-based (toggle via `document.documentElement.classList`).

### Database / Supabase

- Every new table must have RLS enabled with a policy scoped to `auth.uid()`.
- Use `user_id UUID REFERENCES profiles(id) ON DELETE CASCADE` for user-owned tables.
- Keep business logic in Edge Functions or RPC functions, not in the client.
- Migrations are append-only; never edit an already-applied migration file — create a new one.

### n8n Workflows

- Always consult `./n8nac-skills` before writing any node configuration.
- Read the `<workflow-map>` block first before opening the full workflow file.
- Name nodes as "Action Resource" (e.g., "Get User Profile", "Send Welcome Email").
- Use `CLAUDE_API_KEY` for Claude API calls and `OPENAI_API_KEY` for OpenAI calls.

### Git

- Branch naming: `claude/<description>-<session-id>`.
- Commit messages follow conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
- Never commit `.env` files or files containing API keys.

---

## Development Workflow

### Starting Fresh

```bash
# 1. Install Python deps
pip install -r requirements.txt

# 2. Verify environment
python execution/setup_dev_environment.py

# 3. Set up frontend
cd frontend/app
npm install
cp .env.example .env   # Fill in Supabase keys

# 4. Start frontend dev server
npm run dev
```

### Adding a New Page

1. Create `frontend/app/src/pages/MyPage.tsx`.
2. Add import to `App.tsx`.
3. Add a case to `renderView()` in `App.tsx`: `case 'my-page': return <MyPage navigate={setView} />;`.
4. Add navigation entry to `BottomNav.tsx` if needed.

### Adding a New Database Table

1. Create a new migration file in `supabase/migrations/` with timestamp prefix.
2. Enable RLS and add user-scoped policy.
3. Deploy: `supabase db push`.
4. Update `supabase/types_remote.ts` if needed.

### Adding a New Edge Function

1. Create `supabase/functions/<name>/index.ts` following the CORS + auth pattern above.
2. Deploy: `supabase functions deploy <name>`.
3. Set any required secrets in Supabase Dashboard.

### Adding a New n8n Workflow

1. Create `workflows/.../MyWorkflow.workflow.ts`.
2. Follow the research protocol: `search` → `get schema` → `write` → `validate`.
3. Sync to n8n instance.

---

## Testing

**No test framework is currently configured.** The project relies on manual verification scripts:

```bash
python execution/verify_supabase_setup.py   # Checks tables, RLS, connection
python execution/test_supabase_connection.py # Basic connectivity
```

Frontend testing infrastructure (Jest/Vitest) has not been set up yet. When adding tests, use Vitest (consistent with Vite).

---

## Phase Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| 1 - Infrastructure | ✅ Done | Git, Python, Node, repo setup |
| 2 - Supabase Setup | ✅ Done | DB schema, RLS, migrations applied |
| 3 - Edge Functions | ✅ Done | 4 core functions deployed |
| 4 - Design System & Frontend | 🔄 In Progress | React componentization from Stitch/HTML |
| 5 - Frontend Features | ⏳ Pending | Full feature implementation |
| 6 - Payments | ⏳ Pending | Stripe integration end-to-end |
| 7 - Advanced AI | ⏳ Pending | Adaptive learning, personalization |

---

## Reference Repositories

These repos are used for pattern reference (cloned via `python execution/clone_references.py`):

| Repo | Purpose |
|------|---------|
| `theaiautomators/insights-lm-public` | Lovable + Supabase + n8n patterns |
| `KolbySisk/next-supabase-stripe-starter` | Auth + Stripe + Supabase template |
| `IraSoro/peri` | Menstrual cycle calculation algorithm |
| `ShenSeanChen/launch-mvp-stripe-nextjs-supabase` | pg_net triggers + Edge Functions |
