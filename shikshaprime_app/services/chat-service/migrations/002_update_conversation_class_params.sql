-- Update conversation table to use string class parameters instead of BIGINT
-- This migration changes class identifiers from numbers to strings

-- First, let's backup any existing data
CREATE TABLE conversations_backup AS SELECT * FROM conversations WHERE type = 'class_broadcast';

-- Drop foreign key constraints if any exist
SET foreign_key_checks = 0;

-- Alter the columns to be strings
ALTER TABLE conversations 
  MODIFY COLUMN class_id VARCHAR(50) NULL COMMENT 'Class ID for class broadcasts',
  MODIFY COLUMN program_id VARCHAR(50) NULL COMMENT 'Program ID for class broadcasts', 
  MODIFY COLUMN department_id VARCHAR(50) NULL COMMENT 'Department ID for class broadcasts',
  MODIFY COLUMN academic_year_id VARCHAR(50) NULL COMMENT 'Academic Year ID for class broadcasts';

-- Re-enable foreign key constraints  
SET foreign_key_checks = 1;

-- Verify the changes
DESCRIBE conversations;

-- Show count of class broadcast conversations
SELECT COUNT(*) as class_broadcast_count FROM conversations WHERE type = 'class_broadcast';

-- Clean up backup table if migration successful (optional - can be kept for rollback)
-- DROP TABLE conversations_backup;