/*
  # Add auditor visa to location audits

  1. Schema Changes
    - Add `auditor_visa` column to `location_audits` table
    - Column stores 3-letter visa code for each audit
  2. Notes
    - Visa is optional for existing audits
    - New audits should include visa before completion
*/

-- Add auditor_visa column to location_audits table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'location_audits' AND column_name = 'auditor_visa'
  ) THEN
    ALTER TABLE location_audits ADD COLUMN auditor_visa VARCHAR(3);
  END IF;
END $$;