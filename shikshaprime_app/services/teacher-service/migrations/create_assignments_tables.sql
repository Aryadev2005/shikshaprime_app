-- Migration: Add assignment functionality to existing faculty_assignments table
-- Run this SQL script in your database

-- 1. Add assignment-related columns to existing faculty_assignments table
ALTER TABLE faculty_assignments 
ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL COMMENT 'Assignment title',
ADD COLUMN IF NOT EXISTS description TEXT NULL COMMENT 'Assignment description', 
ADD COLUMN IF NOT EXISTS detailed_instructions TEXT NULL COMMENT 'Detailed assignment instructions',
ADD COLUMN IF NOT EXISTS type ENUM('Assignment', 'Homework') NULL COMMENT 'Assignment type',
ADD COLUMN IF NOT EXISTS subject_id BIGINT NULL COMMENT 'Subject reference',
ADD COLUMN IF NOT EXISTS due_date DATE NULL COMMENT 'Assignment due date',
ADD COLUMN IF NOT EXISTS due_time TIME NULL COMMENT 'Assignment due time',
ADD COLUMN IF NOT EXISTS maximum_marks INT DEFAULT 100 COMMENT 'Maximum marks for assignment',
ADD COLUMN IF NOT EXISTS allow_late_submissions BOOLEAN DEFAULT FALSE COMMENT 'Allow late submissions',
ADD COLUMN IF NOT EXISTS send_notification BOOLEAN DEFAULT TRUE COMMENT 'Send notification to students',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last updated timestamp';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_faculty_assignments_due_date ON faculty_assignments (due_date);
CREATE INDEX IF NOT EXISTS idx_faculty_assignments_subject_id ON faculty_assignments (subject_id);
CREATE INDEX IF NOT EXISTS idx_faculty_assignments_type ON faculty_assignments (type);
CREATE INDEX IF NOT EXISTS idx_faculty_assignments_title ON faculty_assignments (title);

-- 2. Create assignment submissions table (linked to faculty_assignments)
CREATE TABLE IF NOT EXISTS student_assignment_submissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    faculty_assignment_id BIGINT NOT NULL COMMENT 'Reference to faculty_assignments table',
    student_id BIGINT NOT NULL,
    submission_text TEXT,
    file_url VARCHAR(500),
    submitted_at TIMESTAMP NULL,
    marks_obtained INT NULL,
    feedback TEXT,
    is_late_submission BOOLEAN DEFAULT FALSE,
    status ENUM('not_submitted', 'submitted', 'graded') DEFAULT 'not_submitted',
    graded_at TIMESTAMP NULL,
    graded_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_assignment_id) REFERENCES faculty_assignments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_faculty_assignment_student (faculty_assignment_id, student_id),
    INDEX idx_faculty_assignment_student (faculty_assignment_id, student_id),
    INDEX idx_status (status),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_student_id (student_id)
);

-- 3. Create assignment attachments table (linked to faculty_assignments)
CREATE TABLE IF NOT EXISTS teacher_assignment_attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    faculty_assignment_id BIGINT NOT NULL COMMENT 'Reference to faculty_assignments table',
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_assignment_id) REFERENCES faculty_assignments(id) ON DELETE CASCADE,
    INDEX idx_faculty_assignment_id (faculty_assignment_id)
);

-- 4. Insert sample data for testing (optional)
-- Make sure you have valid faculty_id, subject_id, class_id values in your database

-- Sample subjects table (if needed)
CREATE TABLE IF NOT EXISTS subjects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample subjects
INSERT IGNORE INTO subjects (id, name, code) VALUES 
(1, 'Mathematics', 'MATH101'),
(2, 'English', 'ENG101'),
(3, 'Physics', 'PHY101'),
(4, 'Chemistry', 'CHEM101'),
(5, 'Biology', 'BIO101'),
(6, 'History', 'HIST101'),
(7, 'Geography', 'GEO101'),
(8, 'Computer Science', 'CS101');

-- Sample classes table (replace with programs table if using different structure)
CREATE TABLE IF NOT EXISTS programs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    level VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample programs
INSERT IGNORE INTO programs (id, name, code, level) VALUES 
(1, 'Bachelor of Science', 'BSC', 'Undergraduate'),
(2, 'Bachelor of Arts', 'BA', 'Undergraduate'),
(3, 'Master of Science', 'MSC', 'Graduate'),
(4, 'Master of Arts', 'MA', 'Graduate'),
(5, 'Bachelor of Technology', 'BTECH', 'Undergraduate'),
(6, 'Master of Business Administration', 'MBA', 'Graduate');

-- Sample sections table (linked to programs instead of classes)
CREATE TABLE IF NOT EXISTS sections (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    program_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    semester VARCHAR(20),
    capacity INT DEFAULT 40,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample sections
INSERT IGNORE INTO sections (id, program_id, name, semester) VALUES 
(1, 1, 'Section A', 'Semester 1'),
(2, 1, 'Section B', 'Semester 1'),
(3, 2, 'Section A', 'Semester 1'),
(4, 2, 'Section B', 'Semester 1'),
(5, 3, 'Section A', 'Semester 1'),
(6, 3, 'Section B', 'Semester 1'),
(7, 4, 'Section A', 'Semester 1'),
(8, 4, 'Section B', 'Semester 1'),
(9, 5, 'Section A', 'Semester 1'),
(10, 5, 'Section B', 'Semester 1'),
(11, 6, 'Section A', 'Semester 1'),
(12, 6, 'Section B', 'Semester 1');

-- Create view for assignment summary using faculty_assignments
CREATE OR REPLACE VIEW assignment_summary AS
SELECT 
    fa.id,
    fa.title,
    fa.type,
    fa.due_date,
    fa.due_time,
    fa.maximum_marks,
    s.name as subject_name,
    p.name as program_name,
    sec.name as section_name,
    f.employee_name as faculty_name,
    fa.faculty_id,
    fa.tenant_id,
    fa.is_active,
    fa.created_at,
    COUNT(DISTINCT sub.id) as total_submissions,
    COUNT(DISTINCT CASE WHEN sub.status = 'submitted' THEN sub.id END) as pending_grading,
    COUNT(DISTINCT CASE WHEN sub.status = 'graded' THEN sub.id END) as graded_submissions,
    AVG(CASE WHEN sub.status = 'graded' THEN sub.marks_obtained END) as average_marks
FROM faculty_assignments fa
LEFT JOIN subjects s ON fa.subject_id = s.id
LEFT JOIN programs p ON fa.program_id = p.id
LEFT JOIN sections sec ON fa.section_id = sec.id
LEFT JOIN faculty f ON fa.faculty_id = f.id
LEFT JOIN student_assignment_submissions sub ON fa.id = sub.faculty_assignment_id
WHERE fa.is_active = 1 AND fa.title IS NOT NULL
GROUP BY fa.id, fa.title, fa.type, fa.due_date, fa.due_time, fa.maximum_marks, 
         s.name, p.name, sec.name, f.employee_name, fa.faculty_id, fa.tenant_id, 
         fa.is_active, fa.created_at;

-- Grant necessary permissions (adjust based on your database user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON teacher_assignments TO 'your_app_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON student_assignment_submissions TO 'your_app_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON teacher_assignment_attachments TO 'your_app_user'@'%';