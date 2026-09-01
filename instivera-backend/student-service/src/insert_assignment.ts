import { getTenantSequelize } from "./server";
import { QueryTypes } from "sequelize";

async function run() {
    try {
        const sequelize = getTenantSequelize('retechprime'); 
        
        // 1. Get Navnil's exact IDs from the database
        const [student] = await sequelize.query(`
            SELECT 
                s.id as student_id,
                spd.program_id,
                spd.class_id,
                s.semester_id,
                spd.academic_year_id
            FROM students s
            LEFT JOIN student_personal_details spd ON spd.student_id = s.id
            WHERE s.id = 33
        `, { type: QueryTypes.SELECT }) as any;

        if (!student) {
            console.error("Student not found!");
            return;
        }
        
        console.log("Found Navnil's exact Class/Program IDs:", student);

        // 2. Insert Assignment perfectly matched to Navnil's Class ID
        const result = await sequelize.query(`
            INSERT INTO teacher_assignments 
            (title, description, assignment_type, program_id, class_id, semester_id, subject_id, teacher_id, due_date, status, created_at, updated_at)
            VALUES 
            ('Auto-Synced Assignment for Navnil', 'This assignment matches Navnil perfectly!', 'Assignment',
             :programId, :classId, :semesterId, 5, 1, '2027-12-31', 'active', NOW(), NOW())
        `, { 
            replacements: {
                programId: student.program_id,
                classId: student.class_id,
                semesterId: student.semester_id
            }
        });

        console.log("✅ Successfully inserted perfectly-synced assignment into database!");
        process.exit(0);
    } catch(e) {
        console.error("Error inserting assignment:", e);
        process.exit(1);
    }
}

run();
