
CREATE TABLE public.shared_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id text UNIQUE NOT NULL DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  title text NOT NULL DEFAULT 'Analysis',
  code text NOT NULL,
  question text,
  output text NOT NULL,
  source text NOT NULL DEFAULT 'paste',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shared analyses"
  ON public.shared_analyses FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert shared analyses"
  ON public.shared_analyses FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
