import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  // Test if column exists
  const { data, error } = await sb.from('fb_target_sources').select('page_id').limit(1)
  if (error?.message?.includes('page_id')) {
    console.log('❌ Column page_id missing!')
    console.log('\n📋 Run this SQL in Supabase Dashboard → SQL Editor:\n')
    console.log('ALTER TABLE public.fb_target_sources')
    console.log('  ADD COLUMN IF NOT EXISTS page_id uuid')
    console.log('  REFERENCES public.fb_pages(id) ON DELETE SET NULL;')
    console.log('\nCREATE INDEX IF NOT EXISTS idx_fb_sources_page')
    console.log('  ON public.fb_target_sources(page_id);')
  } else if (error) {
    console.log('Other error:', error.message)
  } else {
    console.log('✅ Column page_id already exists!')
  }
}
main()
