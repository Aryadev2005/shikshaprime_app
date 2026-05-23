-- Run this migration to add profile_img column to the database
-- File: 003_add_profile_img.sql

-- Execute in MySQL/MariaDB
SOURCE d:\3\services\identity-service\migrations\003_add_profile_img.sql;

-- Or run directly:
-- ALTER TABLE `student_registrations` ADD COLUMN `profile_img` VARCHAR(255) NULL AFTER `twelve_marksheet_doc`;

-- Verify the column was added:
-- DESCRIBE student_registrations;