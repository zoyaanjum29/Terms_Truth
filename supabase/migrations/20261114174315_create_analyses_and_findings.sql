/*
# Create analyses and findings tables (single-tenant, no auth)

1. New Tables
- `analyses`: stores each Terms of Service analysis run
  - `id` (uuid, primary key)
  - `title` (text, name/label for the analyzed document)
  - `source_text` (text, the full ToS text that was analyzed)
  - `score` (integer, overall fairness score 0-100)
  - `grade` (text, letter grade A-F)
  - `summary` (text, short plain-English summary of the analysis)
  - `word_count` (integer, number of words in the source text)
  - `critical_count` (integer, number of critical findings)
  - `warning_count` (integer, number of warning findings)
  - `info_count` (integer, number of informational findings)
  - `created_at` (timestamptz, when the analysis was created)
- `findings`: stores individual red-flag findings from each analysis
  - `id` (uuid, primary key)
  - `analysis_id` (uuid, foreign key to analyses, cascade delete)
  - `category` (text, category of the finding e.g. "Data Privacy")
  - `severity` (text, "critical" | "warning" | "info")
  - `title` (text, short title of the finding)
  - `description` (text, plain-English explanation of the issue)
  - `excerpt` (text, relevant snippet from the source text)
  - `recommendation` (text, what the user should be aware of / do)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on both tables.
- Grant CRUD to `anon` + `authenticated` so the no-auth frontend can operate.
- All data is intentionally public/shared (single-tenant app with no sign-in).

3. Indexes
- Index on `findings.analysis_id` for efficient joins.
- Index on `analyses.created_at` for sorted history listing.
*/

CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  source_text text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  grade text NOT NULL DEFAULT 'F',
  summary text NOT NULL DEFAULT '',
  word_count integer NOT NULL DEFAULT 0,
  critical_count integer NOT NULL DEFAULT 0,
  warning_count integer NOT NULL DEFAULT 0,
  info_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  category text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  title text NOT NULL,
  description text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  recommendation text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_findings_analysis_id ON findings(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON analyses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON findings TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_analyses" ON analyses;
CREATE POLICY "anon_select_analyses" ON analyses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_analyses" ON analyses;
CREATE POLICY "anon_insert_analyses" ON analyses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_analyses" ON analyses;
CREATE POLICY "anon_update_analyses" ON analyses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_analyses" ON analyses;
CREATE POLICY "anon_delete_analyses" ON analyses FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_findings" ON findings;
CREATE POLICY "anon_select_findings" ON findings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_findings" ON findings;
CREATE POLICY "anon_insert_findings" ON findings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_findings" ON findings;
CREATE POLICY "anon_update_findings" ON findings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_findings" ON findings;
CREATE POLICY "anon_delete_findings" ON findings FOR DELETE
  TO anon, authenticated USING (true);
