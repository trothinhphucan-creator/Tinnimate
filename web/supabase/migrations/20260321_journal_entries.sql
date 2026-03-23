-- journal_entries: user mood & tinnitus daily journal
CREATE TABLE IF NOT EXISTS journal_entries (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood           int CHECK (mood BETWEEN 1 AND 5) NOT NULL,
  tinnitus_level int CHECK (tinnitus_level BETWEEN 1 AND 10),
  text           text NOT NULL,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS journal_entries_user_idx ON journal_entries(user_id, created_at DESC);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_own_all"
  ON journal_entries FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
