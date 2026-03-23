import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/supabase/require-admin';

// GET /api/admin/mobile-config — list all keys with metadata
export async function GET() {
  try {
    const { error, status } = await requireAdmin();
    if (error) return Response.json({ error }, { status });

    const client = createServiceClient();
    const { data, error: dbError } = await client
      .from('mobile_config')
      .select('*')
      .order('key');

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 });
    return Response.json(data);
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/mobile-config — update a single key's value
export async function PUT(request: Request) {
  try {
    const { error, status } = await requireAdmin();
    if (error) return Response.json({ error }, { status });

    const { key, value } = await request.json() as { key: string; value: unknown };
    if (!key || value === undefined) {
      return Response.json({ error: 'key and value required' }, { status: 400 });
    }

    const client = createServiceClient();
    const { error: dbError } = await client
      .from('mobile_config')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 });
    return Response.json({ success: true, key });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/mobile-config — insert a new key
export async function POST(request: Request) {
  try {
    const { error, status } = await requireAdmin();
    if (error) return Response.json({ error }, { status });

    const { key, value, description } = await request.json() as {
      key: string; value: unknown; description?: string;
    };
    if (!key || value === undefined) {
      return Response.json({ error: 'key and value required' }, { status: 400 });
    }

    const client = createServiceClient();
    const { error: dbError } = await client
      .from('mobile_config')
      .upsert({ key, value, description, updated_at: new Date().toISOString() });

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 });
    return Response.json({ success: true, key });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
