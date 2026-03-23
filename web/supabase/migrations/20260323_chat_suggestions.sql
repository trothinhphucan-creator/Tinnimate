-- ============================================================
-- CHAT SUGGESTIONS
-- ============================================================
-- Stores personalized chat suggestions based on user profile and history

CREATE TABLE IF NOT EXISTS chat_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,

  -- Suggestion content
  text text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'assessment',      -- Quiz, hearing test
    'therapy',         -- Sound therapy, relaxation
    'checkin',         -- Daily mood, symptoms
    'progress',        -- View stats, achievements
    'education',       -- Learn about tinnitus
    'support'          -- Get help, encouragement
  )),

  -- Personalization context
  context jsonb DEFAULT '{}'::jsonb,  -- User data used to generate this
  priority int DEFAULT 0,              -- Higher = show first

  -- Conditions for showing
  show_after_messages int DEFAULT 0,   -- Show after N messages in conversation
  show_if_no_checkin_today boolean DEFAULT false,
  show_if_thi_score_high boolean DEFAULT false,
  show_if_new_user boolean DEFAULT false,

  -- Tracking
  shown_count int DEFAULT 0,
  clicked_count int DEFAULT 0,
  dismissed_count int DEFAULT 0,
  last_shown_at timestamptz,

  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for faster querying
CREATE INDEX idx_chat_suggestions_user_id ON chat_suggestions(user_id);
CREATE INDEX idx_chat_suggestions_category ON chat_suggestions(category);
CREATE INDEX idx_chat_suggestions_priority ON chat_suggestions(priority DESC);
CREATE INDEX idx_chat_suggestions_active ON chat_suggestions(is_active) WHERE is_active = true;

-- ============================================================
-- SUGGESTION TEMPLATES
-- ============================================================
-- Pre-defined templates for generating suggestions

CREATE TABLE IF NOT EXISTS suggestion_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  category text NOT NULL,
  text_vi text NOT NULL,     -- Vietnamese text
  text_en text NOT NULL,     -- English text

  -- Conditions for using this template
  conditions jsonb DEFAULT '{}'::jsonb,  -- JSON rules for when to use

  priority int DEFAULT 0,
  is_active boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_suggestion_templates_category ON suggestion_templates(category);
CREATE INDEX idx_suggestion_templates_active ON suggestion_templates(is_active) WHERE is_active = true;

-- ============================================================
-- SEED DEFAULT TEMPLATES
-- ============================================================

INSERT INTO suggestion_templates (category, text_vi, text_en, priority, conditions) VALUES
  -- Assessment
  ('assessment', '📋 Đánh giá mức độ ù tai (THI)', '📋 Assess tinnitus severity (THI)', 100, '{"show_if_no_assessment": true}'),
  ('assessment', '👂 Kiểm tra thính lực', '👂 Take a hearing test', 90, '{"show_if_no_audiogram": true}'),
  ('assessment', '😊 Đánh giá tâm trạng (PHQ-9)', '😊 Assess your mood (PHQ-9)', 80, '{"show_if_thi_score_high": true}'),

  -- Therapy
  ('therapy', '🎧 Nghe âm thanh trị liệu white noise', '🎧 Listen to white noise therapy', 100, '{"show_always": true}'),
  ('therapy', '🌊 Nghe tiếng sóng biển thư giãn', '🌊 Listen to relaxing ocean sounds', 95, '{"show_if_stress_high": true}'),
  ('therapy', '🧘 Bài tập hít thở sâu 5 phút', '🧘 5-minute breathing exercise', 90, '{"show_if_anxiety_high": true}'),
  ('therapy', '🎵 Nghe nhạc 528Hz chữa lành', '🎵 Listen to 528Hz healing music', 85, '{"show_if_interested_in_frequencies": true}'),

  -- Check-in
  ('checkin', '💊 Ù tai hôm nay thế nào?', '💊 How is your tinnitus today?', 100, '{"show_if_no_checkin_today": true}'),
  ('checkin', '😌 Tâm trạng của bạn ra sao?', '😌 How are you feeling today?', 90, '{"show_if_no_checkin_today": true}'),
  ('checkin', '📝 Ghi nhật ký triệu chứng', '📝 Log your symptoms', 80, '{"show_if_tracking_enabled": true}'),

  -- Progress
  ('progress', '📊 Xem tiến triển tuần này', '📊 View this week''s progress', 70, '{"show_after_messages": 10}'),
  ('progress', '🏆 Xem thành tích của bạn', '🏆 View your achievements', 60, '{"show_if_has_progress": true}'),
  ('progress', '📈 So sánh điểm THI qua các tháng', '📈 Compare THI scores over time', 65, '{"show_if_multiple_assessments": true}'),

  -- Education
  ('education', '📚 Tìm hiểu về ù tai', '📚 Learn about tinnitus', 50, '{"show_if_new_user": true}'),
  ('education', '💡 Mẹo giảm ù tai trong cuộc sống', '💡 Tips to reduce tinnitus in daily life', 55, '{"show_always": true}'),
  ('education', '🔬 Nghiên cứu mới về điều trị ù tai', '🔬 Latest tinnitus treatment research', 45, '{"show_if_interested_in_science": true}'),

  -- Support
  ('support', '💙 Cần hỗ trợ? Tôi luôn ở đây', '💙 Need support? I''m here for you', 100, '{"show_if_thi_score_high": true}'),
  ('support', '🌟 Bạn đang làm rất tốt!', '🌟 You''re doing great!', 75, '{"show_if_consistent_usage": true}'),
  ('support', '🤝 Kết nối với cộng đồng', '🤝 Connect with the community', 70, '{"show_if_feeling_alone": true}')

ON CONFLICT DO NOTHING;

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE chat_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_templates ENABLE ROW LEVEL SECURITY;

-- Users can only see their own suggestions
CREATE POLICY "Users can view own chat suggestions"
  ON chat_suggestions FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own chat suggestions"
  ON chat_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own chat suggestions"
  ON chat_suggestions FOR UPDATE
  USING (auth.uid() = user_id);

-- Everyone can read templates (for generating suggestions)
CREATE POLICY "Anyone can view suggestion templates"
  ON suggestion_templates FOR SELECT
  USING (true);

-- Only admins can modify templates
CREATE POLICY "Admins can manage suggestion templates"
  ON suggestion_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
