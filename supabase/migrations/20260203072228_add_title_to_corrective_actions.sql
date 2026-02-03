/*
  # Add title field to corrective_actions table

  1. Schema Changes
    - Add `title` column to `corrective_actions` table
    - Title stores the action title/heading
    - Description stores the detailed comment/explanation

  2. Notes
    - Title is optional for backward compatibility
    - Existing actions will have title as NULL
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'corrective_actions'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'corrective_actions' AND column_name = 'title'
    ) THEN
      ALTER TABLE corrective_actions ADD COLUMN title VARCHAR(255);
    END IF;
  END IF;
END $$;