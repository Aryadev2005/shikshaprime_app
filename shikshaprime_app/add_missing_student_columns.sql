-- Add missing columns to student_info table
-- Run this to add the new fields that are missing

USE student_demo;

-- Add the missing registration fields to student_info table (caste and nationality already exist)
ALTER TABLE student_info 
ADD COLUMN degree ENUM('graduation', 'post-graduation') DEFAULT NULL AFTER caste,
ADD COLUMN id_proof_type ENUM('aadhar', 'pan', 'passport', 'voter_id', 'driving_license') DEFAULT NULL AFTER nationality,
ADD COLUMN id_proof_number VARCHAR(50) DEFAULT NULL AFTER id_proof_type;

-- Add graduation academic fields to student_info table
ALTER TABLE student_info
ADD COLUMN graduation_degree VARCHAR(100) DEFAULT NULL AFTER nationality,
ADD COLUMN graduation_board_university VARCHAR(100) DEFAULT NULL AFTER graduation_degree,
ADD COLUMN graduation_year_of_passing YEAR DEFAULT NULL AFTER graduation_board_university,
ADD COLUMN graduation_percentage DECIMAL(5,2) DEFAULT NULL AFTER graduation_year_of_passing,
ADD COLUMN graduation_certificate_path VARCHAR(255) DEFAULT NULL AFTER graduation_percentage;

-- Verify the columns were added
DESCRIBE student_info;