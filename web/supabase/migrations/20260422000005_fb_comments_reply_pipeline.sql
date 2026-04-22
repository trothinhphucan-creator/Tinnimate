-- ============================================================================
-- Phase 1: Comment Scraping & LLM Reply Pipeline
-- fb_comments table + extend fb_replies with comment_id
-- ============================================================================

-- Status enum cho comments (reuse fb_post_status pattern)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fb_comment_status') THEN
    CREATE TYPE public.fb_comment_status AS ENUM (
      'NEW',           -- scraped, chưa classify
      'CLASSIFIED',    -- đã classify bởi LLM
      'REPLY_DRAFTED', -- đã có draft reply
      'REPLIED',       -- đã post reply thành công
      'SKIPPED'        -- bỏ qua (không cần reply / off-topic)
    );
  END IF;
END $$;

-- ============================================================================
-- Table: fb_comments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.fb_comments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid NOT NULL REFERENCES public.fb_posts(id) ON DELETE CASCADE,

  -- Facebook identifiers
  fb_comment_id   text NOT NULL,
  parent_fb_id    text,          -- NULL = top-level comment, else ID of parent comment

  -- Author info
  author_name     text,
  author_fb_id    text,

  -- Content
  content         text NOT NULL,
  comment_url     text,
  posted_at       timestamptz,

  -- Metadata
  scraped_at      timestamptz NOT NULL DEFAULT now(),
  status          public.fb_comment_status NOT NULL DEFAULT 'NEW',

  -- LLM classification
  needs_reply     boolean,       -- NULL = not yet classified
  intent          text,          -- 'seeking_info' | 'asking_question' | 'sharing_experience' | 'complaining' | 'other'
  urgency         text,          -- 'high' | 'medium' | 'low'
  classification  jsonb,         -- full LLM classification output

  -- Dedupe
  CONSTRAINT uq_fb_comment_per_post UNIQUE (post_id, fb_comment_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fb_comments_post      ON public.fb_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_fb_comments_status    ON public.fb_comments(status);
CREATE INDEX IF NOT EXISTS idx_fb_comments_needs     ON public.fb_comments(needs_reply) WHERE needs_reply = true;
CREATE INDEX IF NOT EXISTS idx_fb_comments_scraped   ON public.fb_comments(scraped_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============================================================================
-- Extend fb_replies: add comment_id (NULL = reply to post, NOT NULL = reply to comment)
-- ============================================================================
ALTER TABLE public.fb_replies
  ADD COLUMN IF NOT EXISTS comment_id uuid REFERENCES public.fb_comments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_fb_replies_comment ON public.fb_replies(comment_id) WHERE comment_id IS NOT NULL;

-- ============================================================================
-- RLS policies
-- ============================================================================
ALTER TABLE public.fb_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fb_comments' AND policyname = 'fb_comments_admin_all'
  ) THEN
    CREATE POLICY fb_comments_admin_all ON public.fb_comments
      FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

-- ============================================================================
-- Enable Realtime for live status updates
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.fb_comments;

COMMENT ON TABLE public.fb_comments IS 'Facebook comments scraped from posts; LLM-classified for reply intent';
COMMENT ON COLUMN public.fb_comments.needs_reply IS 'LLM decision: true = needs a Fanpage reply';
COMMENT ON COLUMN public.fb_replies.comment_id IS 'If set, this reply is a reply-to-comment (not reply-to-post)';
