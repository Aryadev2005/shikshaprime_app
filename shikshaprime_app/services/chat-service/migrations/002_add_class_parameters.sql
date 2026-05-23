-- Migration: Add class parameters to conversations table
-- This adds support for proper class identification in class broadcasts

USE college_management;

-- Add new class parameter columns to conversations table
ALTER TABLE conversations 
ADD COLUMN program_id BIGINT UNSIGNED NULL COMMENT 'Program ID for class broadcasts' AFTER class_id,
ADD COLUMN department_id BIGINT UNSIGNED NULL COMMENT 'Department ID for class broadcasts' AFTER program_id,  
ADD COLUMN academic_year_id BIGINT UNSIGNED NULL COMMENT 'Academic Year ID for class broadcasts' AFTER department_id;

-- Add indexes for better performance on class parameter queries
ALTER TABLE conversations
ADD INDEX idx_program_id (program_id),
ADD INDEX idx_department_id (department_id),
ADD INDEX idx_academic_year_id (academic_year_id),
ADD INDEX idx_class_params (program_id, department_id, academic_year_id, class_id);

-- Verify the changes
DESCRIBE conversations;

-- Show the updated table structure
SHOW CREATE TABLE conversations;