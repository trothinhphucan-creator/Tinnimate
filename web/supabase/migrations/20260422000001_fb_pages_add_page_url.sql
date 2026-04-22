-- Add fb_page_url column to fb_pages for Page identity switching
-- This URL is used by the worker to switch comment identity to the Page

alter table public.fb_pages
  add column if not exists fb_page_url text;

comment on column public.fb_pages.fb_page_url is
  'Facebook Page URL (e.g. https://www.facebook.com/tinnimate). Used to switch comment identity from personal to Page.';
