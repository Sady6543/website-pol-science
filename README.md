# KnowledgeOS

A personal intelligence dashboard for political science and world affairs — built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **Supabase**.

---

## Features

| Area | Description |
|------|-------------|
| **Home** | Live article feed, trending topics, stat ticker |
| **Daily Brief** | Morning / Afternoon / Evening curated briefings |
| **Live Terminal** | Bloomberg-style dashboard with stocks, crypto, FX, weather, USGS earthquakes, space launches |
| **Knowledge Vault** | Bookmarks, notes, saved PDFs, quotes, ideas |
| **Study Mode** | Spaced-repetition flashcards (SM-2), mind-map canvas, thinkers, PYQs |
| **Interactive Map** | Geopolitical SVG world map with article drill-down |
| **Visual Timeline** | Chronological event log with Century/Decade/Year zoom |
| **Progress** | Streak tracker, 52-week knowledge heatmap, weekly review |
| **Settings** | Appearance, account, Markdown/CSV export, cache management |
| **AI Assistant** | Claude-powered sidebar (summarise, compare, generate flashcards) |

---

## Tech Stack

- **Framework**: Next.js 16 with App Router + TypeScript
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Database + Auth**: Supabase (PostgreSQL + Row Level Security)
- **Fonts**: Inter Tight (display), Inter (body), JetBrains Mono (data)
- **Icons**: Lucide React
- **AI**: Anthropic Claude API (server-side only)
- **Deployment**: Vercel (Mumbai region `bom1`)

---

## Environment Variables

Create a `.env.local` file at the project root. **Never commit this file.**

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Anthropic Claude AI (optional — falls back to mock responses)
ANTHROPIC_API_KEY=sk-ant-...

# External data APIs (optional — used by /api/ingest)
NEWS_API_KEY=...
GNEWS_API_KEY=...
ALPHA_VANTAGE_KEY=...
FINNHUB_KEY=...
OPENWEATHER_KEY=...
```

> **Vercel**: Add these in *Project Settings → Environment Variables*. Use the exact same names above. Do **not** hardcode values in source.

---

## Running Locally

### Prerequisites

- **Node.js** ≥ 18.x (recommend 20 LTS)
- **npm** ≥ 9.x
- A **Supabase** project (free tier works)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-username/knowledgeos.git
cd knowledgeos

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Then edit .env.local with your Supabase keys

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Migrations

The Supabase schema is defined in versioned SQL migration files under `supabase/migrations/`.

### Option A — Supabase CLI (recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project (get project-ref from dashboard URL)
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

### Option B — Supabase Dashboard SQL Editor

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of each file in `supabase/migrations/` in order
4. Execute each one

### Seed data

After running migrations, seed the `categories` and `tags` tables by running the seed script:

```bash
# Using Supabase CLI
supabase db seed
```

Or copy `supabase/seed.sql` into the SQL Editor and execute.

---

## Deployment (Vercel)

### First time setup

1. Push code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your GitHub repo
3. Vercel auto-detects Next.js — click **Deploy**
4. Add all environment variables listed above in **Project Settings → Environment Variables**
5. Redeploy after adding variables

### Preview vs Production

- Every `git push` to any branch creates a **preview deployment**
- Only merges to `main` promote to production
- **Never promote to production without reviewing the preview URL first**

### Deploying this phase

```bash
git checkout -b phase-4
git add -A
git commit -m "Phase 4: responsive QA, accessibility, Progress page, Settings page, Vercel config"
git push origin phase-4
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── assistant/     # Claude AI endpoint
│   │   └── ingest/        # Live data ingestion
│   ├── article/[slug]/    # Article detail page
│   ├── auth/              # Login + onboarding
│   ├── brief/[time]/      # Daily briefings
│   ├── categories/[slug]/ # Category browsing
│   ├── live/              # Live terminal dashboard
│   ├── map/               # Interactive world map
│   ├── progress/          # Progress + streaks (NEW)
│   ├── search/            # Global search
│   ├── settings/          # Settings (NEW)
│   ├── study/             # Flashcards + mind maps
│   ├── timeline/          # Event timeline
│   ├── vault/             # Knowledge vault
│   └── page.tsx           # Home dashboard
├── components/
│   ├── ui/
│   │   ├── importance-dot.tsx
│   │   ├── info-card.tsx
│   │   ├── skeleton.tsx   # NEW
│   │   ├── stat-ticker.tsx
│   │   └── topic-pill.tsx
│   ├── auth-provider.tsx
│   ├── command-palette.tsx
│   ├── error-boundary.tsx # NEW
│   ├── global-shell.tsx
│   ├── shell-provider.tsx
│   └── theme-provider.tsx
└── lib/
    └── supabase.ts
supabase/
├── functions/
│   └── ingest-all/        # Deno edge function
└── migrations/            # Versioned SQL files
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Build production bundle |
| `npm run start` | Run production server |
| `npm run lint` | ESLint check |

---

## Accessibility

KnowledgeOS targets **WCAG 2.1 AA**:
- All interactive elements have visible focus rings
- Color is never the only way information is conveyed
- `prefers-reduced-motion` collapses all animations
- `prefers-color-scheme` is respected on first load
- Skip-to-main-content link is the first focusable element
- Full keyboard navigation including command palette

---

## License

Private project. All rights reserved.
