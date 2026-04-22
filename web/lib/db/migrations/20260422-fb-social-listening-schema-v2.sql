-- ============================================================================
-- Migration: Facebook Social Listening Schema v2
-- Date: 2026-04-22
-- Purpose: Add missing columns and fb_comments table omitted from v1 migration.
--          Root cause: fb_replies.classification missing → pipeline inserts fail
--          → review queue always appears empty.
-- ============================================================================

-- ============================================================================
-- New enum: fb_comment_status
-- ============================================================================

do $$ begin
  create type fb_comment_status as enum ('NEW', 'CLASSIFIED', 'SKIPPED', 'REPLY_DRAFTED', 'REPLIED');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- New table: fb_comments
-- Comments scraped from posts; dedupe on (post_id, fb_comment_id)
-- ============================================================================

create table if not exists public.fb_comments (
  id                uuid primary key default gen_random_uuid(),
  post_id           uuid not null references public.fb_posts(id) on delete cascade,
  fb_comment_id     text not null,
  parent_fb_id      text,                  -- null = top-level comment
  author_name       text,
  author_fb_id      text,
  content           text not null default '',
  comment_url       text,
  needs_reply       boolean,
  intent            text,
  urgency           text,
  classification    jsonb,
  status            fb_comment_status not null default 'NEW',
  posted_at         timestamptz,
  scraped_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (post_id, fb_comment_id)
);

create index if not exists idx_fb_comments_status    on public.fb_comments(status);
create index if not exists idx_fb_comments_post      on public.fb_comments(post_id);
create index if not exists idx_fb_comments_needs_reply on public.fb_comments(needs_reply) where needs_reply = true;

do $$ begin
  create trigger trg_fb_comments_updated before update on public.fb_comments
    for each row execute procedure public.fb_set_updated_at();
exception when duplicate_object then null; end $$;

alter table public.fb_comments enable row level security;

do $$ begin
  create policy fb_comments_admin_all on public.fb_comments
    for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

-- ============================================================================
-- Alter fb_replies: add missing columns
-- ============================================================================

-- classification jsonb — AI output stored on the reply (pipeline insert + queue page display)
alter table public.fb_replies
  add column if not exists classification jsonb;

-- comment_id — nullable FK to fb_comments (reply is responding to a specific comment)
alter table public.fb_replies
  add column if not exists comment_id uuid references public.fb_comments(id) on delete set null;

create index if not exists idx_fb_replies_comment on public.fb_replies(comment_id) where comment_id is not null;

-- last_error — stores rollback error message on failed approve
alter table public.fb_replies
  add column if not exists last_error text;

-- posted_at — timestamp when comment was successfully posted on FB
alter table public.fb_replies
  add column if not exists posted_at timestamptz;

-- ============================================================================
-- Alter fb_target_sources: add page_id
-- Links a monitored source (group/page) to the fanpage used for reply posting.
-- ============================================================================

alter table public.fb_target_sources
  add column if not exists page_id uuid references public.fb_pages(id) on delete set null;

create index if not exists idx_fb_sources_page on public.fb_target_sources(page_id) where page_id is not null;

-- ============================================================================
-- Alter fb_pages: add fb_page_url
-- Canonical Facebook URL of the fanpage (needed to switch Page context in browser).
-- ============================================================================

alter table public.fb_pages
  add column if not exists fb_page_url text;
