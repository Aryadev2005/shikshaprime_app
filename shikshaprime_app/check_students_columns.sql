-- Check all columns in the students table
DESCRIBE students;

-- Alternative query to get detailed column information
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM 
    INFORMATION_SCHEMA.COLUMNS 
WHERE 
    TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'students'
ORDER BY 
    ORDINAL_POSITION;

-- Check specifically for the graduation academic fields that should exist
SELECT 
    COLUMN_NAME
FROM 
    INFORMATION_SCHEMA.COLUMNS 
WHERE 
    TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'students'
    AND COLUMN_NAME IN (
        'guardian_email',
        'caste',
        'degree',
        'id_proof_type',
        'id_proof_number',
        'nationality',
        'graduation_degree',
        'graduation_board_university',
        'graduation_year_of_passing',
        'graduation_percentage',
        'graduation_certificate_path'
    )
ORDER BY 
    COLUMN_NAME;

-- Count total columns in students table
SELECT COUNT(*) as total_columns 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'students';

-- Compare registration data vs student data to find missing fields
-- Check recent student_registrations with these fields
SELECT 
    id,
    first_name,
    last_name,
    caste,
    degree,
    id_proof_type,
    id_proof_number,
    guardian_email
FROM student_registrations 
WHERE id >= 142 
ORDER BY id DESC;

-- Check students table for same fields
SELECT 
    id,
    student_name,
    caste,
    degree,
    id_proof_type,
    id_proof_number,
    guardian_email
FROM students 
ORDER BY id DESC 
LIMIT 5;