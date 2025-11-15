/*
  # Remove People pillar from database

  1. Data Cleanup
    - Remove all pillar questions for 'people' pillar
    - Remove all pillar evaluations for 'people' pillar  
    - Remove the 'people' pillar itself
  2. Notes
    - This will clean up existing data that references the people pillar
    - Cascading deletes will handle related evaluations and actions
*/

-- Remove pillar questions for people pillar
DELETE FROM pillar_questions WHERE pillar_id = 'people';

-- Remove pillar evaluations for people pillar (this will cascade to corrective_actions)
DELETE FROM pillar_evaluations WHERE pillar_id = 'people';

-- Remove the people pillar itself
DELETE FROM pillars WHERE id = 'people';