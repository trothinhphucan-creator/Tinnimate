-- ============================================================================
-- Migration: Facebook Social Listening (Phase 01)
-- Date: 2026-04-21
-- Purpose: Tables for FB scraper, multi-fanpage auth, post analysis, reply queue
-- ============================================================================

-- Enable required extensions (if not already)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- Enums
-- ============================================================================

do $$ begin
  create type fb_page_status as enum ('IDLE', 'CONNECTING', 'ONLINE', 'ERROR', 'LOGGED_OUT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fb_source_type as enum ('GROUP', 'PAGE', 'KEYWORD_SEARCH');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fb_post_status as enum ('NEW', 'ANALYZED', 'REPLY_DRAFTED', 'REPLIED', 'SKIPPED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fb_reply_status as enum ('DRAFT', 'APPROVED', 'POSTED', 'REJECTED', 'FAILED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fb_job_status as enum ('QUEUED', 'RUNNING', 'DONE', 'FAILED');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- Table: fb_pages
-- Fanpage Facebook đã đăng nhập, cookie mã hóa AES-256-GCM
-- ============================================================================

create table if not exists public.fb_pages (
  id                   uuid primary key default gen_random_uuid(),
  label                text not null,
  fb_user_id           text,
  session_cookie_enc   bytea,                -- AES-256-GCM ciphertext (iv||tag||data)
  status               fb_page_status not null default 'IDLE',
  last_active_at       timestamptz,
  last_error           text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_fb_pages_status on public.fb_pages(status);

-- ============================================================================
-- Table: fb_target_sources
-- Nhóm/page/keyword-search theo dõi
-- ============================================================================

create table if not exists public.fb_target_sources (
  id                uuid primary key default gen_random_uuid(),
  type              fb_source_type not null,
  fb_url            text,                      -- null nếu KEYWORD_SEARCH
  label             text not null,
  keywords          text[] not null default '{}',
  enabled           bool not null default true,
  last_scraped_at   timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_fb_sources_enabled on public.fb_target_sources(enabled);

-- ============================================================================
-- Table: fb_posts
-- Bài viết thu thập; dedupe theo fb_post_id
-- ============================================================================

create table if not exists public.fb_posts (
  id                uuid primary key default gen_random_uuid(),
  source_id         uuid not null references public.fb_target_sources(id) on delete cascade,
  fb_post_id        text not null,
  fb_post_url       text,
  author_name       text,
  author_fb_id      text,
  content           text not null default '',
  image_urls        text[] not null default '{}',
  posted_at         timestamptz,
  relevance_score   float,                     -- 0..1 từ Gemini classify
  classification    jsonb,                     -- {topic, urgency, intent, lang, crisis_flag}
  status            fb_post_status not null default 'NEW',
  scraped_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (fb_post_id)
);

create index if not exists idx_fb_posts_status on public.fb_posts(status);
create index if not exists idx_fb_posts_source on public.fb_posts(source_id);
create index if not exists idx_fb_posts_scraped on public.fb_posts(scraped_at desc);
create index if not exists idx_fb_posts_relevance on public.fb_posts(relevance_score desc) where status = 'ANALYZED';

-- ============================================================================
-- Table: fb_replies
-- Bản nháp trả lời do Gemini sinh
-- ============================================================================

create table if not exists public.fb_replies (
  id                     uuid primary key default gen_random_uuid(),
  post_id                uuid not null references public.fb_posts(id) on delete cascade,
  page_id                uuid references public.fb_pages(id) on delete set null,
  draft_text             text not null,
  mcp_sources            jsonb not null default '[]',   -- [{title, score, source}]
  confidence             float,
  status                 fb_reply_status not null default 'DRAFT',
  reviewer_id            uuid references auth.users(id),
  reviewed_at            timestamptz,
  posted_fb_comment_id   text,
  post_error             text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists idx_fb_replies_status on public.fb_replies(status);
create index if not exists idx_fb_replies_post on public.fb_replies(post_id);
create index if not exists idx_fb_replies_page on public.fb_replies(page_id);

-- ============================================================================
-- Table: fb_scrape_jobs
-- Audit log cho từng scrape job
-- ============================================================================

create table if not exists public.fb_scrape_jobs (
  id            uuid primary key default gen_random_uuid(),
  source_id     uuid references public.fb_target_sources(id) on delete set null,
  page_id       uuid references public.fb_pages(id) on delete set null,
  status        fb_job_status not null default 'QUEUED',
  posts_found   int not null default 0,
  posts_new     int not null default 0,
  error         text,
  started_at    timestamptz,
  finished_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_fb_jobs_status on public.fb_scrape_jobs(status);
create index if not exists idx_fb_jobs_created on public.fb_scrape_jobs(created_at desc);

-- ============================================================================
-- Updated-at trigger
-- ============================================================================

create or replace function public.fb_set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger trg_fb_pages_updated before update on public.fb_pages
    for each row execute procedure public.fb_set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_fb_sources_updated before update on public.fb_target_sources
    for each row execute procedure public.fb_set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_fb_posts_updated before update on public.fb_posts
    for each row execute procedure public.fb_set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_fb_replies_updated before update on public.fb_replies
    for each row execute procedure public.fb_set_updated_at();
exception when duplicate_object then null; end $$;

-- ============================================================================
-- RLS: chỉ service_role và admin được truy cập.
-- Admin detect qua auth.users.raw_user_meta_data->>'role' = 'admin'
-- ============================================================================

alter table public.fb_pages           enable row level security;
alter table public.fb_target_sources  enable row level security;
alter table public.fb_posts           enable row level security;
alter table public.fb_replies         enable row level security;
alter table public.fb_scrape_jobs     enable row level security;

-- Helper: is_admin()
create or replace function public.is_admin() returns boolean as $$
  select coalesce(
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
    or (auth.jwt()->'app_metadata'->>'role') = 'admin',
    false
  );
$$ language sql stable;

-- Policies: admin full access
do $$ begin
  create policy fb_pages_admin_all on public.fb_pages for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy fb_sources_admin_all on public.fb_target_sources for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy fb_posts_admin_all on public.fb_posts for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy fb_replies_admin_all on public.fb_replies for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy fb_jobs_admin_all on public.fb_scrape_jobs for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

-- service_role bypasses RLS by default in Supabase, no explicit policy needed.
