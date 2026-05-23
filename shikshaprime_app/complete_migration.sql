-- Complete SQL Migration Script for Enhanced Student Registration
-- Run these in order after backing up your databases

-- =============================================================
-- IDENTITY SERVICE DATABASE MIGRATION
-- =============================================================

-- Add new fields to student_registrations table
ALTER TABLE `student_registrations`
  ADD COLUMN `nationality` ENUM('Indian', 'other') DEFAULT 'Indian' AFTER `year_of_passing_12th`,
  ADD COLUMN `caste` ENUM('general', 'sc', 'st', 'obc', 'physical handicap') NULL AFTER `nationality`,
  ADD COLUMN `degree` ENUM('graduation', 'post-graduation', 'diploma') NULL AFTER `caste`,
  ADD COLUMN `id_proof_type` ENUM('aadher', 'pan', 'driving-license', 'passport') NULL AFTER `degree`,
  ADD COLUMN `id_proof_number` VARCHAR(255) NULL AFTER `id_proof_type`,
  ADD COLUMN `graduation_doc` VARCHAR(255) NULL AFTER `profile_img`,
  ADD COLUMN `caste_certificate_doc` VARCHAR(255) NULL AFTER `graduation_doc`;

-- =============================================================
-- STUDENT SERVICE DATABASE MIGRATION  
-- =============================================================

-- Add new fields to students table
ALTER TABLE `students`
  ADD COLUMN `caste` ENUM('general', 'sc', 'st', 'obc', 'physical handicap') NULL AFTER `board_university`,
  ADD COLUMN `degree` ENUM('graduation', 'post-graduation', 'diploma') NULL AFTER `caste`,
  ADD COLUMN `id_proof_type` ENUM('aadher', 'pan', 'driving-license', 'passport') NULL AFTER `degree`,
  ADD COLUMN `id_proof_number` VARCHAR(255) NULL AFTER `id_proof_type`,
  ADD COLUMN `nationality` ENUM('Indian', 'other') DEFAULT 'Indian' AFTER `id_proof_number`;

-- =============================================================
-- VERIFICATION QUERIES (Optional - run to verify changes)
-- =============================================================

-- Check student_registrations table structure
-- DESCRIBE student_registrations;

-- Check students table structure  
-- DESCRIBE students;

-- Sample data verification
-- SELECT caste, degree, id_proof_type, id_proof_number, nationality FROM student_registrations LIMIT 5;
-- SELECT caste, degree, id_proof_type, id_proof_number, nationality FROM students LIMIT 5;