-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/_/sql/new

-- ─── Shared knowledge base ─────────────────────────────────────────────
create table if not exists knowledge_base (
  id         uuid default gen_random_uuid() primary key,
  type       text not null check (type in ('pattern','hook','cta','trigger')),
  content    text not null,
  category   text not null default 'ерөнхий',
  score      int  not null default 1,
  created_at timestamptz default now()
);

-- Index for fast lookups by type + score
create index if not exists idx_kb_type_score on knowledge_base (type, score desc);

-- ─── Scripts ──────────────────────────────────────────────────────────
create table if not exists scripts (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users on delete set null,
  script_text text not null,
  category    text not null default 'ерөнхий',
  performance text not null default 'unknown' check (performance in ('high','medium','low','unknown')),
  analysis    jsonb,
  created_at  timestamptz default now()
);

create index if not exists idx_scripts_created on scripts (created_at desc);

-- ─── RLS (Row Level Security) ──────────────────────────────────────────
-- knowledge_base: anyone can read, only authenticated can write
alter table knowledge_base enable row level security;
create policy "Anyone can read knowledge" on knowledge_base for select using (true);
create policy "Authenticated can insert knowledge" on knowledge_base for insert with check (auth.role() = 'authenticated' or auth.role() = 'anon');
create policy "Authenticated can update knowledge" on knowledge_base for update using (true);

-- scripts: anyone can insert (анон хэрэглэгч ч script оруулж болно)
alter table scripts enable row level security;
create policy "Anyone can insert scripts" on scripts for insert with check (true);
create policy "Anyone can read scripts" on scripts for select using (true);
