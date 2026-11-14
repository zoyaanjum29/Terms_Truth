/*
# Add AI analysis fields to findings table

1. Modified Tables
- `findings`: added new columns to support AI-powered analysis from the Gemini edge function
  - `why_it_matters` (text, explains the practical impact on the user)
  - `attention_level` (text, "High" | "Medium" | "Low" — AI-assigned attention level)
  - `certainty` (text, "Explicit" | "Uncertain" — whether the clause is directly stated or inferred)
  - `missing_information` (text, nullable — notes what the agreement does NOT specify)

2. Security
- No changes to existing RLS policies or grants. New columns are covered by the existing
  table-level grants to anon + authenticated.

3. Important Notes
- All new columns are nullable or have defaults so existing findings rows remain valid.
- The `attention_level` CHECK constraint ensures only valid values.
- The `certainty` CHECK constraint ensures only valid values.
- The existing `severity` column is kept and still populated (mapped from attention_level)
  so the existing UI components continue to work without redesign.
*/

ALTER TABLE findings
  ADD COLUMN IF NOT EXISTS why_it_matters text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS attention_level text DEFAULT NULL CHECK (attention_level IN ('High', 'Medium', 'Low')),
  ADD COLUMN IF NOT EXISTS certainty text DEFAULT NULL CHECK (certainty IN ('Explicit', 'Uncertain')),
  ADD COLUMN IF NOT EXISTS missing_information text;
