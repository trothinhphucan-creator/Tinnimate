import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/supabase/require-admin';

// GET /api/admin/mobile-analytics
export async function GET(request: Request) {
  try {
    const { error, status } = await requireAdmin();
    if (error) return Response.json({ error }, { status });

    const client = createServiceClient();
    const url    = new URL(request.url);
    const days   = parseInt(url.searchParams.get('days') ?? '7');
    const since  = new Date(Date.now() - days * 86400_000).toISOString();

    const [sessionsRes, screenRes, activeRes, topUsersRes] = await Promise.all([
      // Daily session count + avg duration
      client
        .from('mobile_sessions')
        .select('id, duration_secs, platform, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: true }),

      // Top screens
      client
        .from('screen_views')
        .select('screen')
        .gte('viewed_at', since),

      // Unique active users (last 24h)
      client
        .from('mobile_sessions')
        .select('user_id', { count: 'estimated', head: true })
        .gte('created_at', new Date(Date.now() - 86400_000).toISOString()),

      // Top users by session count
      client
        .from('mobile_sessions')
        .select('user_id')
        .gte('created_at', since)
        .not('user_id', 'is', null),
    ]);

    const sessions   = sessionsRes.data ?? [];
    const screenViews = screenRes.data ?? [];

    // Screen frequency
    const screenFreq: Record<string, number> = {};
    for (const { screen } of screenViews) {
      screenFreq[screen] = (screenFreq[screen] ?? 0) + 1;
    }
    const topScreens = Object.entries(screenFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([screen, count]) => ({ screen, count }));

    // Platform split
    const platforms = sessions.reduce<Record<string, number>>((acc, s) => {
      const p = s.platform ?? 'unknown';
      acc[p] = (acc[p] ?? 0) + 1;
      return acc;
    }, {});

    // Avg session duration
    const durations = sessions.filter(s => s.duration_secs > 0).map(s => s.duration_secs);
    const avgDuration = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    // Daily sessions grouped by date
    const byDate: Record<string, number> = {};
    for (const s of sessions) {
      const day = s.created_at.slice(0, 10);
      byDate[day] = (byDate[day] ?? 0) + 1;
    }
    const dailySessions = Object.entries(byDate)
      .sort()
      .map(([date, count]) => ({ date, count }));

    return Response.json({
      totalSessions: sessions.length,
      activeUsers24h: activeRes.count ?? 0,
      avgDurationSecs: avgDuration,
      platforms,
      topScreens,
      dailySessions,
    });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
