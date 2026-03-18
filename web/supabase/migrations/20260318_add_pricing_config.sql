-- Add pricing_config jsonb column to admin_config table
ALTER TABLE admin_config 
ADD COLUMN IF NOT EXISTS pricing_config jsonb DEFAULT '{
  "plans": [
    {
      "tier": "free",
      "name": "Free",
      "emoji": "🆓",
      "price_usd": 0,
      "price_vnd": 0,
      "stripe_price_id": "",
      "features_en": ["5 messages/day", "3 basic sounds", "Hearing test", "1 quiz/month", "Knowledge blog"],
      "features_vi": ["5 tin nhắn/ngày", "3 âm thanh cơ bản", "Kiểm tra thính lực", "1 bộ câu hỏi/tháng", "Blog kiến thức"],
      "highlighted": false
    },
    {
      "tier": "premium",
      "name": "Premium",
      "emoji": "⭐",
      "price_usd": 4.99,
      "price_vnd": 99000,
      "stripe_price_id": "",
      "features_en": ["Unlimited chat", "All 11+ sounds", "All quizzes", "Sound Mixer", "Notch Therapy", "Sleep Mode", "Full CBT-i", "Progress charts", "PDF export"],
      "features_vi": ["Chat không giới hạn", "Toàn bộ 11+ âm thanh", "Tất cả bộ câu hỏi", "Sound Mixer", "Notch Therapy", "Chế độ ngủ", "CBT-i đầy đủ", "Biểu đồ tiến triển", "Xuất PDF"],
      "highlighted": true
    },
    {
      "tier": "pro",
      "name": "Pro",
      "emoji": "💎",
      "price_usd": 9.99,
      "price_vnd": 199000,
      "stripe_price_id": "",
      "features_en": ["Everything in Premium", "Priority AI", "ENT specialist connect", "Priority support 24/7", "Family plan (3 users)"],
      "features_vi": ["Tất cả Premium", "AI ưu tiên", "Kết nối bác sĩ TMH", "Hỗ trợ 24/7", "Family plan (3 người)"],
      "highlighted": false
    }
  ],
  "gateways": {
    "stripe": { "enabled": true, "secret_key": "", "webhook_secret": "" },
    "momo": { "enabled": false, "partner_code": "", "access_key": "", "secret_key": "", "endpoint": "https://test-payment.momo.vn/v2/gateway/api/create" },
    "vnpay": { "enabled": false, "tmn_code": "", "hash_secret": "", "endpoint": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html" }
  },
  "trial_days": 7,
  "yearly_discount": 20
}'::jsonb;
