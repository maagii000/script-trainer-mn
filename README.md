# Script Trainer AI — Mongul Agency

Монгол UGC script AI trainer. Hormozi $100M Hooks + Гайхамшигт Дэгээ + Notion-ийн бодит script-үүд.

## Stack
- Next.js 14 (App Router)
- Supabase (Postgres + Auth)
- Claude API (claude-sonnet-4-20250514)
- Tailwind CSS
- Vercel deploy

## Setup

### 1. Install
```bash
npm install
```

### 2. Supabase
1. [supabase.com](https://supabase.com) → New project үүсгэ
2. SQL Editor → `supabase-schema.sql` файлыг paste хийж Run хий
3. Settings → API → URL болон anon key-г copy хий

### 3. Environment variables
```bash
cp .env.local.example .env.local
```
`.env.local` файлд:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Run
```bash
npm run dev
# → http://localhost:3000
```

## Deploy to Vercel
```bash
npx vercel
# Environment variables-уудаа Vercel dashboard-д оруул
```

## localStorage → Supabase migration
Өмнөх HTML файлаас localStorage өгөгдөл зөөж авах:
1. `script-trainer-v2.html` нээ
2. Console: `JSON.parse(localStorage.getItem('mongul_kb_v2'))`
3. Copy хийгдсэн data-г шинэ app-д import хийж болно

## API Routes
- `POST /api/train` — script analyze → Supabase-д хадгал
- `POST /api/generate` — knowledge fetch → Claude generate
- `GET  /api/knowledge` — patterns, hooks, CTAs унших
