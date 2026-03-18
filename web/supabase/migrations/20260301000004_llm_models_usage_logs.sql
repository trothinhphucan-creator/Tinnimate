-- LLM model registry — admin-managed list of available models
CREATE TABLE llm_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  model_id text NOT NULL UNIQUE,
  provider text NOT NULL CHECK (provider IN ('gemini', 'openai', 'anthropic')),
  api_key_env text,
  api_key_override text,
  context_window int DEFAULT 32768,
  max_output_tokens int DEFAULT 8192,
  input_cost_per_1m float DEFAULT 0,
  output_cost_per_1m float DEFAULT 0,
  is_active boolean DEFAULT true,
  notes text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Seed default Gemini models
INSERT INTO llm_models (name, model_id, provider, api_key_env, input_cost_per_1m, output_cost_per_1m, sort_order)
VALUES
  ('Gemini 2.5 Flash', 'gemini-2.5-flash', 'gemini', 'GEMINI_API_KEY', 0.075, 0.30, 1),
  ('Gemini 2.5 Pro',   'gemini-2.5-pro',   'gemini', 'GEMINI_API_KEY', 1.25,  5.00, 2),
  ('Gemini 2.0 Flash', 'gemini-2.0-flash', 'gemini', 'GEMINI_API_KEY', 0.10,  0.40, 3);

-- Per-request usage log (cost calculated at insert time in route handler)
CREATE TABLE usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  model_id text NOT NULL,
  provider text NOT NULL,
  input_tokens int DEFAULT 0,
  output_tokens int DEFAULT 0,
  input_cost_usd float DEFAULT 0,
  output_cost_usd float DEFAULT 0,
  is_training boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX usage_logs_created_at_idx ON usage_logs (created_at DESC);
CREATE INDEX usage_logs_model_id_idx ON usage_logs (model_id);

-- RLS for llm_models: admin write, public read (needed by server-side config loader)
ALTER TABLE llm_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_write_llm_models" ON llm_models FOR ALL
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
  ));
CREATE POLICY "server_read_llm_models" ON llm_models FOR SELECT USING (true);

-- RLS for usage_logs: admin only
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_only_usage_logs" ON usage_logs FOR ALL
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
  ));
