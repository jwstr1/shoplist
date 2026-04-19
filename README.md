# Jagus Shoplist

A family shopping list PWA with AI suggestions, receipt scanning, and live Woolworths/Coles price tracking. Runs entirely on free infrastructure (Supabase + Vercel + GitHub).

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  iPhone (Safari → Add to Home Screen)               │
│  Next.js 14 PWA  ·  Tailwind CSS  ·  TypeScript     │
│  Offline support via service worker                 │
└──────────────┬──────────────────┬───────────────────┘
               │                  │
      Vercel (free)        Supabase Realtime
      API Routes           (live list sync)
               │
    ┌──────────┴──────────┐
    │      Supabase        │
    │  PostgreSQL + Auth   │
    │  Edge Functions      │
    │  Row Level Security  │
    └──────────┬──────────┘
               │
    ┌──────────┴──────────┐
    │  External services  │
    │  Claude API (Haiku) │  ← receipt parsing
    │  AGPD price data    │  ← nightly price sync
    │  Woolworths API     │  ← store locator
    └─────────────────────┘
```

## Features

- **Shared lists** — real-time sync across all family members' phones
- **AI suggestions** — items you probably need based on purchase history
- **Receipt import** — photo → Claude AI → parsed items + prices in DB
- **Price tracking** — nightly sync from AGPD (Woolworths + Coles prices)
- **Store selector** — set your home store, switch when travelling
- **Aisle ordering** — items grouped by supermarket category
- **Price comparison** — see which store had the cheaper price last time
- **PWA** — installs to iPhone home screen, works offline

---

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Choose a region (Australia: `ap-southeast-2`)
3. Note your **Project URL** and **API keys** (Settings → API)

### 2. Run the database migration

In your Supabase dashboard → SQL Editor, paste and run:

```
supabase/migrations/001_initial.sql
```

This creates all tables, indexes, and RLS policies.

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required values:
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase → Settings → API → anon key
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase → Settings → API → service_role key
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env vars in Vercel dashboard (Settings → Environment Variables)
# or via CLI: vercel env add ANTHROPIC_API_KEY
```

Or connect your GitHub repo to Vercel for automatic deploys on push.

### 5. Deploy Supabase Edge Functions

```bash
# Install Supabase CLI
npm i -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy sync-agpd
supabase functions deploy suggest-items

# Schedule nightly price sync (Supabase dashboard → Edge Functions → sync-agpd → Schedule)
# Cron: 0 3 * * *  (3am UTC daily)
```

### 6. Generate PWA icons

Create PNG icons at `public/icons/icon-192.png` and `public/icons/icon-512.png`.
You can use any square image (shopping cart, grocery bag, etc.) and resize it.

---

## Inviting family members

1. Go to **Settings** in the app
2. Tap **Invite family member** and enter their email
3. They sign up at your app URL with that email
4. Currently: share your **Household ID** with them and they can join via the join flow (full invite email flow can be added with Supabase Auth email templates)

---

## How receipt import works

1. Tap **Receipts** → camera icon
2. Take a photo of your receipt (or upload from photo library)
3. The image is sent to Claude API (claude-3-5-haiku) with a structured prompt
4. Claude returns: store name, date, total, and line items with prices
5. Items are saved to `receipts` and `purchase_history` tables
6. The purchase data improves future AI suggestions

**Supported stores:** Woolworths, Coles, Aldi, IGA, and most AU supermarkets.

---

## How AGPD price sync works

The [aus_grocery_price_database](https://github.com/PhiHo-eng/aus_grocery_price_database) project scrapes Woolworths and Coles prices daily. A Supabase Edge Function (`sync-agpd`) runs nightly at 3am UTC to:

1. Fetch current prices from AGPD's public Grafana/InfluxDB endpoint
2. Upsert into your `market_prices` table
3. Clean up records older than 7 days

**If AGPD is unavailable:** The function skips silently. Your app falls back to receipt-imported prices (from your own purchase history). The app still works — you just won't have live market prices until the next successful sync.

---

## Development setup

```bash
# Clone and install
git clone https://github.com/jwstr1/shoplist
cd shoplist
npm install

# Set up env vars
cp .env.example .env.local
# Fill in your Supabase + Anthropic keys

# Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For local Supabase development:
```bash
supabase start
# Updates .env.local with local URLs automatically
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript |
| Styling | Tailwind CSS |
| Auth | Supabase Auth (email/password) |
| Database | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime channels |
| Edge Functions | Supabase Edge Functions (Deno) |
| Hosting | Vercel (free hobby tier) |
| AI (receipts) | Anthropic Claude 3.5 Haiku |
| Price data | AGPD (aus_grocery_price_database) |
| CI/CD | GitHub → Vercel auto-deploy |
