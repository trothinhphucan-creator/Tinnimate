-- Migration: Add page_id to fb_target_sources
-- Links a scraped group/source back to the FB Page that joined it

ALTER TABLE public.fb_target_sources
  ADD COLUMN IF NOT EXISTS page_id uuid
    REFERENCES public.fb_pages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_fb_sources_page
  ON public.fb_target_sources(page_id);

COMMENT ON COLUMN public.fb_target_sources.page_id IS
  'FK to fb_pages — which fanpage this source was scanned from';
