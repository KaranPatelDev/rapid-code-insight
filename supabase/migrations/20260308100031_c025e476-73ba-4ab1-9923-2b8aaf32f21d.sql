
-- Create daily usage tracking table
CREATE TABLE public.daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  analysis_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, usage_date)
);

ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage"
  ON public.daily_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own usage"
  ON public.daily_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON public.daily_usage FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix shared_analyses: restrict INSERT to authenticated only (was USING true for anon)
DROP POLICY IF EXISTS "Anyone can insert shared analyses" ON public.shared_analyses;
CREATE POLICY "Authenticated users can insert shared analyses"
  ON public.shared_analyses FOR INSERT
  TO authenticated
  WITH CHECK (true);
