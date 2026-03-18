-- Training notes: AI saves important knowledge/guidelines during training sessions
CREATE TABLE IF NOT EXISTS training_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general' CHECK (category IN ('medical', 'behavioral', 'faq', 'general')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE training_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_only_training_notes" ON training_notes FOR ALL USING (is_admin());
