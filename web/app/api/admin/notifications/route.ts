import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/supabase/require-admin';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface SendPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  target?: 'all' | string; // 'all' or user_id
}

// POST /api/admin/notifications — send push notification
export async function POST(request: Request) {
  try {
    const { error, status } = await requireAdmin();
    if (error) return Response.json({ error }, { status });

    // Get current admin user for logging
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { title, body, data, target = 'all' } = await request.json() as SendPayload;
    if (!title || !body) {
      return Response.json({ error: 'title and body required' }, { status: 400 });
    }

    const client = createServiceClient();

    // Fetch push tokens
    let query = client.from('push_tokens').select('token');
    if (target !== 'all') {
      query = query.eq('user_id', target);
    }
    const { data: rows, error: fetchErr } = await query;
    if (fetchErr) return Response.json({ error: fetchErr.message }, { status: 500 });

    const tokens = (rows ?? []).map(r => r.token).filter(Boolean);
    if (tokens.length === 0) {
      return Response.json({ success: true, sent: 0, message: 'No tokens found' });
    }

    // Batch into chunks of 100 (Expo limit)
    const chunks = [];
    for (let i = 0; i < tokens.length; i += 100) {
      chunks.push(tokens.slice(i, i + 100));
    }

    let totalSent = 0;
    for (const chunk of chunks) {
      const messages = chunk.map(to => ({
        to,
        title,
        body,
        data: data ?? {},
        sound: 'default',
        priority: 'high',
      }));

      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages),
      });

      if (res.ok) totalSent += chunk.length;
    }

    // Log the notification
    await client.from('notification_logs').insert({
      title,
      body,
      target,
      sent_count: totalSent,
      sent_by: user?.id,
    });

    return Response.json({ success: true, sent: totalSent });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}

// GET /api/admin/notifications — view notification logs
export async function GET() {
  try {
    const { error, status } = await requireAdmin();
    if (error) return Response.json({ error }, { status });

    const client = createServiceClient();
    const { data, error: dbError } = await client
      .from('notification_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50);

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 });
    return Response.json(data);
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
