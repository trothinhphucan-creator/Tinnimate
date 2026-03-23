-- mobile_config: Remote feature flags and content for the mobile app
-- Admin can update these without releasing a new app build

CREATE TABLE IF NOT EXISTS mobile_config (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key         text UNIQUE NOT NULL,
  value       jsonb NOT NULL,
  description text,
  updated_at  timestamptz DEFAULT now()
);

-- Seed default values
INSERT INTO mobile_config (key, value, description) VALUES
  (
    'features',
    '{"zentitone": true, "notch_therapy": true, "breathing": true, "cbti": false, "journal": false, "sleep": false}',
    'Feature flags — bật/tắt màn hình trên mobile'
  ),
  (
    'audio_tracks',
    '[
      {"id": "rain",    "name": "Tiếng Mưa",  "emoji": "🌧️", "color": "#06B6D4", "enabled": true},
      {"id": "ocean",   "name": "Sóng Biển",  "emoji": "🌊", "color": "#0EA5E9", "enabled": true},
      {"id": "wind",    "name": "Gió Núi",    "emoji": "🌬️", "color": "#8B5CF6", "enabled": true},
      {"id": "fire",    "name": "Lửa Trại",   "emoji": "🔥", "color": "#F97316", "enabled": true},
      {"id": "white",   "name": "White Noise", "emoji": "⬜", "color": "#94A3B8", "enabled": true},
      {"id": "forest",  "name": "Rừng Đêm",   "emoji": "🌲", "color": "#16A34A", "enabled": true},
      {"id": "zen",     "name": "Zen Bells",  "emoji": "🔔", "color": "#A855F7", "enabled": true},
      {"id": "tone528", "name": "Tone 528Hz", "emoji": "✨", "color": "#6366F1", "enabled": true}
    ]',
    'Danh sách track âm thanh — admin có thể bật/tắt hoặc thêm track mới'
  ),
  (
    'app_banner',
    '{"active": false, "text": "", "color": "#4F46E5", "link": ""}',
    'Banner thông báo hiển thị trên Dashboard'
  ),
  (
    'tinni_greeting',
    '{"messages": ["Tinni đang ở đây cùng bạn 💙", "Hôm nay bạn cảm thấy thế nào?", "Hãy thử 5 phút White Noise trước khi ngủ nhé!"]}',
    'Tinni suggestion messages xuất hiện trên Dashboard'
  ),
  (
    'maintenance',
    '{"active": false, "message": "Tinnimate đang bảo trì, vui lòng thử lại sau."}',
    'Bật để hiện màn hình bảo trì trên toàn bộ app'
  )
ON CONFLICT (key) DO NOTHING;

-- RLS: anon/authenticated can read (public read), only service_role can write
ALTER TABLE mobile_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mobile_config_public_read"
  ON mobile_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "mobile_config_service_write"
  ON mobile_config FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
