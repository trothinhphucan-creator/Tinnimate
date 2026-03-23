import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/supabase/require-admin';

// ── Public endpoint — mobile app fetches this on startup ──────────────────
// GET /api/mobile-config  (no auth required — RLS allows public read)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('mobile_config')
      .select('key, value, updated_at')
      .order('key');

    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Convert array to key→value map for easy consumption
    const config = (data ?? []).reduce<Record<string, unknown>>((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    return Response.json(config, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
