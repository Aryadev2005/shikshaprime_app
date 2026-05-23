-- Test Assignment Data for faculty_assignments table
-- Run these commands in your MySQL database to create test assignments

-- First, let's insert some test data into faculty_assignments with assignment information
INSERT INTO faculty_assignments (
    tenant_id, 
    faculty_id, 
    program_id, 
    semester_id, 
    section_id, 
    academic_year_id, 
    is_class_incharge, 
    is_active,
    title,
    description,
    detailed_instructions,
    type,
    subject_id,
    due_date,
    due_time,
    maximum_marks,
    allow_late_submissions,
    send_notification
) VALUES 
-- Assignment 1: Mathematics Quiz
(1, 1, 1, 1, 1, 1, 0, 1,
 'Mathematics Chapter 5 Quiz',
 'Quiz covering Quadratic Equations and their applications',
 'Study Chapter 5 from the textbook. Focus on solving quadratic equations using factoring, completing the square, and the quadratic formula. Practice problems 1-20 from exercise 5.3.',
 'Assignment',
 1, -- Mathematics subject_id
 '2026-02-15',
 '23:59:00',
 50,
 0, -- No late submissions
 1  -- Send notification
),

-- Assignment 2: English Essay
(1, 1, 2, 1, 2, 1, 0, 1,
 'English Literature Essay',
 'Write an analytical essay on Shakespeare''s Hamlet',
 'Write a 1000-word essay analyzing the theme of revenge in Hamlet. Include at least 3 specific examples from the text with proper citations. Use MLA format for citations and bibliography.',
 'Homework',
 2, -- English subject_id
 '2026-02-20',
 '17:00:00',
 100,
 1, -- Allow late submissions
 1  -- Send notification
),

-- Assignment 3: Physics Lab Report
(1, 1, 1, 1, 1, 1, 0, 1,
 'Physics Lab Report - Pendulum Experiment',
 'Submit lab report on simple pendulum experiment',
 'Complete the pendulum experiment and submit a detailed lab report. Include: 1) Objective, 2) Apparatus used, 3) Procedure, 4) Observations, 5) Calculations, 6) Results, 7) Conclusion. Show all mathematical calculations clearly.',
 'Assignment',
 3, -- Physics subject_id
 '2026-02-12',
 '14:30:00',
 75,
 0, -- No late submissions
 1  -- Send notification
),

-- Assignment 4: Computer Science Programming
(1, 1, 5, 1, 1, 1, 0, 1,
 'Java Programming Assignment',
 'Create a simple calculator application using Java',
 'Develop a console-based calculator in Java that can perform basic arithmetic operations (+, -, *, /). Requirements: 1) Use proper OOP concepts, 2) Handle division by zero, 3) Include proper error handling, 4) Submit both .java source files and compiled .class files, 5) Include documentation comments.',
 'Assignment',
 8, -- Computer Science subject_id
 '2026-02-25',
 '23:59:00',
 100,
 1, -- Allow late submissions
 1  -- Send notification
),

-- Assignment 5: Chemistry Lab Work
(1, 1, 1, 1, 2, 1, 0, 1,
 'Organic Chemistry Homework',
 'Problems on Hydrocarbons nomenclature and reactions',
 'Complete exercises from Chapter 12: 1) Name the given organic compounds using IUPAC nomenclature (Questions 1-15), 2) Draw structures for the given compound names (Questions 16-25), 3) Write balanced equations for the given reactions (Questions 26-35). Show all steps clearly.',
 'Homework',
 4, -- Chemistry subject_id
 '2026-02-18',
 '16:00:00',
 80,
 0, -- No late submissions
 1  -- Send notification
);

-- Verify the inserted data
SELECT 
    fa.id,
    fa.title,
    fa.type,
    fa.due_date,
    fa.due_time,
    fa.maximum_marks,
    s.name as subject_name,
    p.name as program_name,
    sec.name as section_name
FROM faculty_assignments fa
LEFT JOIN subjects s ON fa.subject_id = s.id
LEFT JOIN programs p ON fa.program_id = p.id
LEFT JOIN sections sec ON fa.section_id = sec.id
WHERE fa.title IS NOT NULL
ORDER BY fa.created_at DESC;

-- Check the total count of assignments
SELECT 
    COUNT(*) as total_assignments,
    COUNT(CASE WHEN type = 'Assignment' THEN 1 END) as assignments,
    COUNT(CASE WHEN type = 'Homework' THEN 1 END) as homework
FROM faculty_assignments 
WHERE title IS NOT NULL;