-- Migration: Add new fields for enhanced student records
-- caste, degree, idProofType, idProofNumber, nationality fields

ALTER TABLE `students`
  ADD COLUMN `caste` ENUM('general', 'sc', 'st', 'obc', 'physical handicap') NULL AFTER `board_university`,
  ADD COLUMN `degree` ENUM('graduation', 'post-graduation', 'diploma') NULL AFTER `caste`,
  ADD COLUMN `id_proof_type` ENUM('aadher', 'pan', 'driving-license', 'passport') NULL AFTER `degree`,
  ADD COLUMN `id_proof_number` VARCHAR(255) NULL AFTER `id_proof_type`,
  ADD COLUMN `nationality` ENUM('Indian', 'other') DEFAULT 'Indian' AFTER `id_proof_number`;