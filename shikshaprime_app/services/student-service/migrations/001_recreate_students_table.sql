-- Migration: Recreate students table with registration table fields

-- Step 1: Rename existing table as backup (avoids foreign key constraint issues)
RENAME TABLE students TO students_backup;

-- Step 2: Also rename student_info if it exists
RENAME TABLE student_info TO student_info_backup;

-- Create new students table with registration table fields + additional student fields
CREATE TABLE students (
  -- Primary Key
  id BIGINT(20) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  
  -- Student specific fields (generated during creation)
  student_id VARCHAR(50) UNIQUE NOT NULL, -- Generated: STSC001
  roll_number VARCHAR(50) UNIQUE NOT NULL, -- Generated with same logic
  
  -- Fields from registration table
  mode VARCHAR(20) DEFAULT 'ONLINE',
  first_name VARCHAR(128) NOT NULL,
  last_name VARCHAR(128) NOT NULL,
  gender VARCHAR(20) DEFAULT 'UNSPECIFIED',
  date_of_birth DATE NOT NULL,
  class_id BIGINT(20) UNSIGNED NOT NULL,
  department_id BIGINT(20) UNSIGNED NULL,
  academic_year_id BIGINT(20) UNSIGNED NOT NULL,
  father_name VARCHAR(128) NOT NULL,
  mother_name VARCHAR(128) NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address_line VARCHAR(255) NULL,
  city VARCHAR(128) NULL,
  state VARCHAR(128) NULL,
  pin_code VARCHAR(16) NULL,
  previous_school_name VARCHAR(255) NULL,
  last_class_passed VARCHAR(128) NULL,
  board_university VARCHAR(128) NULL,
  status VARCHAR(100) DEFAULT 'ACTIVE',
  remarks TEXT NULL,
  entered_by_user_id BIGINT(20) UNSIGNED NULL,
  entered_by_name VARCHAR(128) NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_student_id (student_id),
  INDEX idx_roll_number (roll_number),
  INDEX idx_class_id (class_id),
  INDEX idx_department_id (department_id),
  INDEX idx_academic_year_id (academic_year_id),
  INDEX idx_mobile (mobile),
  INDEX idx_email (email),
  INDEX idx_status (status)
);