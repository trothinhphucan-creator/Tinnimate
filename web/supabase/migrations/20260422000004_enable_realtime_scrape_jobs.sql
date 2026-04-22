-- Enable Supabase Realtime for fb_scrape_jobs
-- Required for real-time scrape status page

ALTER PUBLICATION supabase_realtime ADD TABLE public.fb_scrape_jobs;
