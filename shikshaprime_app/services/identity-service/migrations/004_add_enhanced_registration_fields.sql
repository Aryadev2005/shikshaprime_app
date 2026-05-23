-- Migration: Add new fields for enhanced student registration
-- caste, degree, idProofType, idProofNumber, nationality fields

ALTER TABLE `student_registrations`
  ADD COLUMN `caste` ENUM('general', 'sc', 'st', 'obc', 'physical handicap') NULL AFTER `nationality`,
  ADD COLUMN `degree` ENUM('graduation', 'post-graduation', 'diploma') NULL AFTER `caste`,
  ADD COLUMN `id_proof_type` ENUM('aadher', 'pan', 'driving-license', 'passport') NULL AFTER `degree`,
  ADD COLUMN `id_proof_number` VARCHAR(255) NULL AFTER `id_proof_type`,
  ADD COLUMN `nationality` ENUM('Indian', 'other') DEFAULT 'Indian' AFTER `id_proof_number`,
  ADD COLUMN `graduation_doc` VARCHAR(255) NULL AFTER `profile_img`,
  ADD COLUMN `caste_certificate_doc` VARCHAR(255) NULL AFTER `graduation_doc`;