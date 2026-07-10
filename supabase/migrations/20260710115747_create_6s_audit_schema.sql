/*
# Create 6S Audit application schema (single-tenant, no auth)

1. Purpose
   - The app previously had NO tables in the database. Migrations only ALTERed
     existing tables, but never CREATEd them. As a result every Supabase call
     failed silently and data fell back to localStorage (per-browser, not shared
     across computers). This migration creates the full schema so audit results
     are stored in the cloud and visible from any computer.

2. New Tables
   - `location_groups`: groups of locations (e.g. Bulk, Laverie).
     id (text, PK), name (text), created_at.
   - `locations`: physical locations being audited.
     id (text, PK), name, group_id (FK -> location_groups), created_at.
   - `pillars`: the 6S + Safety + Quality pillars.
     id (text, PK), name, description, created_at.
   - `pillar_questions`: questions for each pillar.
     id (text, PK), pillar_id (FK -> pillars), text, order_index, created_at.
   - `monthly_audits`: one row per month/year audit.
     id (uuid, PK), month (text), year (int), completed (bool), overall_score (numeric), created_at.
     Unique constraint on (month, year).
   - `location_audits`: one row per location within a monthly audit.
     id (uuid, PK), monthly_audit_id (FK -> monthly_audits), location_id (FK -> locations),
     date, completed, overall_score, auditor_visa, created_at.
     Unique constraint on (monthly_audit_id, location_id).
   - `pillar_evaluations`: score + comment + answers for a pillar in a location audit.
     id (uuid, PK), location_audit_id (FK -> location_audits), pillar_id (FK -> pillars),
     score, comment, question_answers (jsonb), created_at.
     Unique constraint on (location_audit_id, pillar_id).
   - `corrective_actions`: corrective actions tied to a pillar evaluation.
     id (uuid, PK), pillar_evaluation_id (FK -> pillar_evaluations), title, description,
     status, completed_at, created_at.
   - `group_scores`: average score per group per monthly audit.
     id (uuid, PK), monthly_audit_id (FK -> monthly_audits), group_id (FK -> location_groups),
     score, created_at.
     Unique constraint on (monthly_audit_id, group_id).

3. Security
   - RLS enabled on every table.
   - This is a single-tenant app with NO sign-in screen, so all policies use
     `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because
     the data is intentionally shared across all users/computers.

4. Notes
   - All tables use IF NOT EXISTS so the migration is idempotent and safe to re-run.
   - Policies are dropped before creation to remain idempotent.
*/

-- location_groups
CREATE TABLE IF NOT EXISTS location_groups (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE location_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_location_groups" ON location_groups;
CREATE POLICY "anon_select_location_groups" ON location_groups FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_location_groups" ON location_groups;
CREATE POLICY "anon_insert_location_groups" ON location_groups FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_location_groups" ON location_groups;
CREATE POLICY "anon_update_location_groups" ON location_groups FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_location_groups" ON location_groups;
CREATE POLICY "anon_delete_location_groups" ON location_groups FOR DELETE
  TO anon, authenticated USING (true);

-- locations
CREATE TABLE IF NOT EXISTS locations (
  id text PRIMARY KEY,
  name text NOT NULL,
  group_id text NOT NULL REFERENCES location_groups(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_locations" ON locations;
CREATE POLICY "anon_select_locations" ON locations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_locations" ON locations;
CREATE POLICY "anon_insert_locations" ON locations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_locations" ON locations;
CREATE POLICY "anon_update_locations" ON locations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_locations" ON locations;
CREATE POLICY "anon_delete_locations" ON locations FOR DELETE
  TO anon, authenticated USING (true);

-- pillars
CREATE TABLE IF NOT EXISTS pillars (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE pillars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pillars" ON pillars;
CREATE POLICY "anon_select_pillars" ON pillars FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_pillars" ON pillars;
CREATE POLICY "anon_insert_pillars" ON pillars FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_pillars" ON pillars;
CREATE POLICY "anon_update_pillars" ON pillars FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_pillars" ON pillars;
CREATE POLICY "anon_delete_pillars" ON pillars FOR DELETE
  TO anon, authenticated USING (true);

-- pillar_questions
CREATE TABLE IF NOT EXISTS pillar_questions (
  id text PRIMARY KEY,
  pillar_id text NOT NULL REFERENCES pillars(id) ON DELETE CASCADE,
  text text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE pillar_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pillar_questions" ON pillar_questions;
CREATE POLICY "anon_select_pillar_questions" ON pillar_questions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_pillar_questions" ON pillar_questions;
CREATE POLICY "anon_insert_pillar_questions" ON pillar_questions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_pillar_questions" ON pillar_questions;
CREATE POLICY "anon_update_pillar_questions" ON pillar_questions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_pillar_questions" ON pillar_questions;
CREATE POLICY "anon_delete_pillar_questions" ON pillar_questions FOR DELETE
  TO anon, authenticated USING (true);

-- monthly_audits
CREATE TABLE IF NOT EXISTS monthly_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL,
  year int NOT NULL DEFAULT EXTRACT(year FROM now())::int,
  completed boolean NOT NULL DEFAULT false,
  overall_score numeric DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT monthly_audits_month_year_key UNIQUE (month, year)
);
ALTER TABLE monthly_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_monthly_audits" ON monthly_audits;
CREATE POLICY "anon_select_monthly_audits" ON monthly_audits FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_monthly_audits" ON monthly_audits;
CREATE POLICY "anon_insert_monthly_audits" ON monthly_audits FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_monthly_audits" ON monthly_audits;
CREATE POLICY "anon_update_monthly_audits" ON monthly_audits FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_monthly_audits" ON monthly_audits;
CREATE POLICY "anon_delete_monthly_audits" ON monthly_audits FOR DELETE
  TO anon, authenticated USING (true);

-- location_audits
CREATE TABLE IF NOT EXISTS location_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_audit_id uuid NOT NULL REFERENCES monthly_audits(id) ON DELETE CASCADE,
  location_id text NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  date text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  overall_score numeric DEFAULT NULL,
  auditor_visa varchar(3) DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT location_audits_monthly_location_key UNIQUE (monthly_audit_id, location_id)
);
ALTER TABLE location_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_location_audits" ON location_audits;
CREATE POLICY "anon_select_location_audits" ON location_audits FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_location_audits" ON location_audits;
CREATE POLICY "anon_insert_location_audits" ON location_audits FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_location_audits" ON location_audits;
CREATE POLICY "anon_update_location_audits" ON location_audits FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_location_audits" ON location_audits;
CREATE POLICY "anon_delete_location_audits" ON location_audits FOR DELETE
  TO anon, authenticated USING (true);

-- pillar_evaluations
CREATE TABLE IF NOT EXISTS pillar_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_audit_id uuid NOT NULL REFERENCES location_audits(id) ON DELETE CASCADE,
  pillar_id text NOT NULL REFERENCES pillars(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,
  comment text DEFAULT NULL,
  question_answers jsonb DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT pillar_evaluations_location_pillar_key UNIQUE (location_audit_id, pillar_id)
);
ALTER TABLE pillar_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pillar_evaluations" ON pillar_evaluations;
CREATE POLICY "anon_select_pillar_evaluations" ON pillar_evaluations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_pillar_evaluations" ON pillar_evaluations;
CREATE POLICY "anon_insert_pillar_evaluations" ON pillar_evaluations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_pillar_evaluations" ON pillar_evaluations;
CREATE POLICY "anon_update_pillar_evaluations" ON pillar_evaluations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_pillar_evaluations" ON pillar_evaluations;
CREATE POLICY "anon_delete_pillar_evaluations" ON pillar_evaluations FOR DELETE
  TO anon, authenticated USING (true);

-- corrective_actions
CREATE TABLE IF NOT EXISTS corrective_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pillar_evaluation_id uuid NOT NULL REFERENCES pillar_evaluations(id) ON DELETE CASCADE,
  title varchar(255) DEFAULT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE corrective_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_corrective_actions" ON corrective_actions;
CREATE POLICY "anon_select_corrective_actions" ON corrective_actions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_corrective_actions" ON corrective_actions;
CREATE POLICY "anon_insert_corrective_actions" ON corrective_actions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_corrective_actions" ON corrective_actions;
CREATE POLICY "anon_update_corrective_actions" ON corrective_actions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_corrective_actions" ON corrective_actions;
CREATE POLICY "anon_delete_corrective_actions" ON corrective_actions FOR DELETE
  TO anon, authenticated USING (true);

-- group_scores
CREATE TABLE IF NOT EXISTS group_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_audit_id uuid NOT NULL REFERENCES monthly_audits(id) ON DELETE CASCADE,
  group_id text NOT NULL REFERENCES location_groups(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT group_scores_monthly_group_key UNIQUE (monthly_audit_id, group_id)
);
ALTER TABLE group_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_group_scores" ON group_scores;
CREATE POLICY "anon_select_group_scores" ON group_scores FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_group_scores" ON group_scores;
CREATE POLICY "anon_insert_group_scores" ON group_scores FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_group_scores" ON group_scores;
CREATE POLICY "anon_update_group_scores" ON group_scores FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_group_scores" ON group_scores;
CREATE POLICY "anon_delete_group_scores" ON group_scores FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_location_audits_monthly ON location_audits(monthly_audit_id);
CREATE INDEX IF NOT EXISTS idx_pillar_evaluations_location ON pillar_evaluations(location_audit_id);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_eval ON corrective_actions(pillar_evaluation_id);
CREATE INDEX IF NOT EXISTS idx_group_scores_monthly ON group_scores(monthly_audit_id);
CREATE INDEX IF NOT EXISTS idx_pillar_questions_pillar ON pillar_questions(pillar_id);
