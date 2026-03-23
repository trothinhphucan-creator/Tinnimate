import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chat/suggestions
 * Returns personalized chat suggestions based on user profile and history
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || 'vi';
    const messageCount = parseInt(searchParams.get('messageCount') || '0');

    // Get user ID from header (for mobile) or session
    const userIdHeader = req.headers.get('X-User-ID');
    let userId: string | null = null;

    if (userIdHeader) {
      userId = userIdHeader;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    }

    // If no user, return generic suggestions
    if (!userId) {
      return getGuestSuggestions(lang);
    }

    // Fetch user profile and history in parallel
    const [
      { data: profile },
      { data: latestAssessment },
      { data: todayCheckin },
      { data: recentSessions },
      { data: templates },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase
        .from('assessments')
        .select('*')
        .eq('user_id', userId)
        .eq('quiz_type', 'THI')
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date().toISOString().split('T')[0])
        .single(),
      supabase
        .from('therapy_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('suggestion_templates')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false }),
    ]);

    // Build user context
    const context = {
      isNewUser: !profile || new Date(profile.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      hasAssessment: !!latestAssessment,
      thiScoreHigh: latestAssessment && latestAssessment.score >= 38, // Moderate to severe
      hasCheckinToday: !!todayCheckin,
      hasRecentSessions: (recentSessions || []).length > 0,
      messageCount,
      lang,
    };

    // Generate personalized suggestions
    const suggestions = generateSuggestions(templates || [], context);

    return NextResponse.json({
      suggestions: suggestions.slice(0, 6), // Return top 6
      context,
    });

  } catch (error) {
    console.error('Chat suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}

/**
 * Generate personalized suggestions based on templates and user context
 */
function generateSuggestions(
  templates: any[],
  context: {
    isNewUser: boolean;
    hasAssessment: boolean;
    thiScoreHigh: boolean;
    hasCheckinToday: boolean;
    hasRecentSessions: boolean;
    messageCount: number;
    lang: string;
  }
) {
  const scored: Array<{ text: string; score: number; category: string }> = [];

  for (const template of templates) {
    const conditions = template.conditions || {};
    let score = template.priority || 0;

    // Apply condition matching
    if (conditions.show_if_new_user && context.isNewUser) score += 50;
    if (conditions.show_if_no_assessment && !context.hasAssessment) score += 100;
    if (conditions.show_if_thi_score_high && context.thiScoreHigh) score += 80;
    if (conditions.show_if_no_checkin_today && !context.hasCheckinToday) score += 90;
    if (conditions.show_after_messages && context.messageCount >= conditions.show_after_messages) score += 30;
    if (conditions.show_always) score += 20;

    // Negative scoring (don't show)
    if (conditions.show_if_no_assessment && context.hasAssessment) score = 0;
    if (conditions.show_if_no_checkin_today && context.hasCheckinToday) score = 0;

    if (score > 0) {
      scored.push({
        text: context.lang === 'vi' ? template.text_vi : template.text_en,
        score,
        category: template.category,
      });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.map(s => ({
    text: s.text,
    category: s.category,
  }));
}

/**
 * Return generic suggestions for guest users
 */
function getGuestSuggestions(lang: string) {
  const suggestions = lang === 'vi' ? [
    { text: 'Làm bài đánh giá THI để biết mức độ ù tai của mình', category: 'assessment' },
    { text: 'Bật âm thanh white noise giúp tôi', category: 'therapy' },
    { text: 'Tôi muốn kiểm tra thính lực', category: 'assessment' },
    { text: 'Ù tai là gì và tại sao tôi bị?', category: 'education' },
    { text: 'Hôm nay ù tai của tôi như thế này', category: 'checkin' },
    { text: 'Hướng dẫn tôi bài tập hít thở', category: 'therapy' },
  ] : [
    { text: 'Do the THI assessment to know my tinnitus severity', category: 'assessment' },
    { text: 'Play white noise to help me', category: 'therapy' },
    { text: 'I want to take a hearing test', category: 'assessment' },
    { text: 'What is tinnitus and why do I have it?', category: 'education' },
    { text: 'Here is how my tinnitus is today', category: 'checkin' },
    { text: 'Guide me through breathing exercises', category: 'therapy' },
  ];

  return NextResponse.json({ suggestions, context: { isGuest: true } });
}
