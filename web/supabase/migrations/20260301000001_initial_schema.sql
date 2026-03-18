-- Enable pgvector for RAG embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- USER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text,
  name text,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro')),
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- TINNITUS PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS tinnitus_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text,           -- ringing | buzzing | hissing | clicking | roaring | pulsatile
  side text,           -- left | right | both | in_head
  duration text,       -- under_3m | 3_12m | over_1y
  cause text,          -- noise | stress | medication | trauma | unknown
  severity int,        -- 1-10
  pitch_hz float,      -- matched tinnitus frequency from hearing test
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content text NOT NULL,
  tool_call jsonb,
  tool_result jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- ASSESSMENTS (Quiz Results)
-- ============================================================
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  quiz_type text NOT NULL,   -- THI | TFI | PHQ9 | GAD7 | ISI
  answers jsonb NOT NULL,
  score int NOT NULL,
  interpretation text,
  ai_analysis text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- AUDIOGRAMS (Hearing Test Results)
-- ============================================================
CREATE TABLE IF NOT EXISTS audiograms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  frequencies jsonb NOT NULL,   -- { hz: threshold_db }
  tinnitus_pitch_hz float,
  ear text DEFAULT 'both',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- THERAPY SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS therapy_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sound_type text,
  duration_sec int,
  mood_before int,    -- 1-10
  mood_after int,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- DAILY CHECK-INS
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mood int,           -- 1-10
  sleep_quality int,  -- 1-10
  tinnitus_loudness int, -- 1-10
  tinnitus_distress int, -- 1-10
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  status text,        -- active | canceled | past_due
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- ADMIN: CONFIG (singleton row)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_model text DEFAULT 'gemini-2.5-flash',
  temperature float DEFAULT 0.7,
  max_tokens int DEFAULT 2048,
  tool_config jsonb DEFAULT '{"diagnosis":true,"quiz":true,"therapy":true,"hearing_test":true,"relaxation":true,"progress":true,"checkin":true}',
  rate_limits jsonb DEFAULT '{"free":{"chat":5,"quiz":1,"hearing_test":1},"premium":{"chat":-1,"quiz":-1,"hearing_test":-1},"pro":{"chat":-1,"quiz":-1,"hearing_test":-1}}',
  updated_at timestamptz DEFAULT now()
);

-- Insert default config row
INSERT INTO admin_config DEFAULT VALUES ON CONFLICT DO NOTHING;

-- ============================================================
-- ADMIN: SYSTEM PROMPTS (versioned)
-- ============================================================
CREATE TABLE IF NOT EXISTS system_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,           -- main | empathy | diagnosis | therapy | safety
  content text NOT NULL,
  version int DEFAULT 1,
  is_active boolean DEFAULT false,
  notes text,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- ADMIN: KNOWLEDGE BASE (RAG)
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  embedding vector(768),        -- Gemini text-embedding-004 dimension
  category text DEFAULT 'general' CHECK (category IN ('medical', 'therapy', 'faq', 'general')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Vector similarity search index
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx
  ON knowledge_base USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================
-- ADMIN: FEW-SHOT EXAMPLES
-- ============================================================
CREATE TABLE IF NOT EXISTS few_shot_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_message text NOT NULL,
  ai_response text NOT NULL,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- ADMIN: TRAINING SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  messages jsonb NOT NULL DEFAULT '[]',
  feedback jsonb DEFAULT '{}',
  notes text,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper: check admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true',
    false
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: users see own row
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "admin_all_profiles" ON profiles FOR ALL USING (is_admin());

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_conversations" ON conversations FOR ALL USING (auth.uid() = user_id);

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_messages" ON messages FOR ALL
  USING (conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid()));

-- Assessments
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_assessments" ON assessments FOR ALL USING (auth.uid() = user_id);

-- Audiograms
ALTER TABLE audiograms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_audiograms" ON audiograms FOR ALL USING (auth.uid() = user_id);

-- Therapy sessions
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_therapy" ON therapy_sessions FOR ALL USING (auth.uid() = user_id);

-- Daily checkins
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_checkins" ON daily_checkins FOR ALL USING (auth.uid() = user_id);

-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_subscriptions" ON subscriptions FOR ALL USING (auth.uid() = user_id);

-- Admin tables: admin only
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_only_config" ON admin_config FOR ALL USING (is_admin());
-- Allow read for server-side (service role key bypasses RLS)

ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_only_prompts" ON system_prompts FOR ALL USING (is_admin());

ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_kb" ON knowledge_base FOR ALL USING (is_admin());
CREATE POLICY "server_read_kb" ON knowledge_base FOR SELECT USING (true); -- service role reads for RAG

ALTER TABLE few_shot_examples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_examples" ON few_shot_examples FOR ALL USING (is_admin());
CREATE POLICY "server_read_examples" ON few_shot_examples FOR SELECT USING (true);

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_only_training" ON training_sessions FOR ALL USING (is_admin());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Never block user creation due to profile insert failure
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
