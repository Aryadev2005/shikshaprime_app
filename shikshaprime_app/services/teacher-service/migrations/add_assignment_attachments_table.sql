-- Migration: Fix assignment attachments table for teacher assignments
-- This migration ensures the teacher_assignment_attachments table works with teacher_assignments

-- Create the teacher_assignment_attachments table with the correct foreign key reference
CREATE TABLE IF NOT EXISTS teacher_assignment_attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    teacher_assignment_id BIGINT NOT NULL COMMENT 'Reference to teacher_assignments table',
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_assignment_id) REFERENCES teacher_assignments(id) ON DELETE CASCADE,
    INDEX idx_teacher_assignment_id (teacher_assignment_id)
);

-- If you already have faculty_assignments table and want to keep it, 
-- you can create a separate table or rename the existing one:
-- RENAME TABLE faculty_assignments TO teacher_assignments;

-- Add indexes for better performance on file queries
CREATE INDEX IF NOT EXISTS idx_assignment_attachments_file_type ON teacher_assignment_attachments (file_type);
CREATE INDEX IF NOT EXISTS idx_assignment_attachments_uploaded_at ON teacher_assignment_attachments (uploaded_at);