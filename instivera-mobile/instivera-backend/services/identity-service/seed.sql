-- ===================================================
-- Identity Service - Phase 1 Test Data
-- ===================================================
-- Run this script after npm start creates the tables

-- Insert test institution
INSERT INTO institutions (name, slug, type, logo_url, is_active, created_at, updated_at)
VALUES 
  ('Test College', 'test-college', 'college', 'https://example.com/logo.png', 1, NOW(), NOW()),
  ('Test School', 'test-school', 'school', 'https://example.com/logo2.png', 1, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert test users (passwords are hashed with bcrypt, example: "password123" hashed)
-- To create your own: npm install -g bcrypt-cli, then: bcrypt -c 10 "password123"
INSERT INTO users (username, email, password_hash, role, user_type, user_code, is_active, created_at, updated_at)
VALUES 
  ('teacher1', 'teacher1@test.com', '$2a$10$YJzJYOYhqR5KjkqC5A.R1eOVqt6Y6Tm3bSN9qDSc9sGPvQSFPZPxC', 'teacher', 'teacher', 'T001', 1, NOW(), NOW()),
  ('student1', 'student1@test.com', '$2a$10$YJzJYOYhqR5KjkqC5A.R1eOVqt6Y6Tm3bSN9qDSc9sGPvQSFPZPxC', 'student', 'student', 'S001', 1, NOW(), NOW()),
  ('admin1', 'admin1@test.com', '$2a$10$YJzJYOYhqR5KjkqC5A.R1eOVqt6Y6Tm3bSN9qDSc9sGPvQSFPZPxC', 'admin', 'admin', 'A001', 1, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert test teachers
INSERT INTO teachers (teacher_id, first_name, last_name, email, phone, department_id, designation, employee_id, is_active, created_at, updated_at)
VALUES 
  ('T001', 'John', 'Doe', 'teacher1@test.com', '9876543210', 1, 'Assistant Professor', 'EMP001', 1, NOW(), NOW()),
  ('T002', 'Jane', 'Smith', 'teacher2@test.com', '9876543211', 2, 'Professor', 'EMP002', 1, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert test students
INSERT INTO students (student_id, first_name, last_name, email, phone, class_id, program_id, roll_number, is_active, created_at, updated_at)
VALUES 
  ('S001', 'Alice', 'Johnson', 'student1@test.com', '9999999990', 1, 1, 'CS001', 1, NOW(), NOW()),
  ('S002', 'Bob', 'Williams', 'student2@test.com', '9999999991', 1, 1, 'CS002', 1, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Test queries
SELECT 'Users:' as section;
SELECT id, username, email, role FROM users;

SELECT '' as blank;
SELECT 'Teachers:' as section;
SELECT id, teacher_id, first_name, last_name, email FROM teachers;

SELECT '' as blank;
SELECT 'Students:' as section;
SELECT id, student_id, first_name, last_name, email FROM students;

SELECT '' as blank;
SELECT 'Institutions:' as section;
SELECT id, name, slug, type FROM institutions;
