-- S4: Performance indexes for social listening queries
-- fb_replies.status is queried heavily (WHERE status='DRAFT')
CREATE INDEX IF NOT EXISTS idx_fb_replies_status
  ON public.fb_replies(status);

-- fb_replies.page_id for join queries
CREATE INDEX IF NOT EXISTS idx_fb_replies_page_id
  ON public.fb_replies(page_id);

-- fb_posts.scraped_at for ordering recent posts
CREATE INDEX IF NOT EXISTS idx_fb_posts_scraped_at
  ON public.fb_posts(scraped_at DESC);

-- fb_target_sources.enabled for filtering active sources
CREATE INDEX IF NOT EXISTS idx_fb_target_sources_enabled
  ON public.fb_target_sources(enabled);
