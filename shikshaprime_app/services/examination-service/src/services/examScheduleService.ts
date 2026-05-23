import { Op, QueryTypes } from "sequelize";
import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";

export class ExamScheduleService {
    async createExamSchedule(payload: any, tenant: string) {
        const {
            exam_id,
            scheduled_date,
            start_time,
            end_time,
            venue,
            invigilator_id,
            total_seats,
        } = payload;
        const { Exam, StudentExamRegistration, ExamSchedule } = getTenantModels(tenant);

        // 1. Validate exam exists
        const exam = await Exam.findByPk(exam_id);
        if (!exam) {
            throw new Error("Exam not found");
        }

        // 2. Validate total seats
        if (!total_seats || total_seats <= 0) {
            throw new Error("Total seats must be greater than zero");
        }

        // 3. Check room/time conflict
        const conflict = await ExamSchedule.findOne({
            where: {
            scheduled_date,
            venue,
            start_time: { [Op.lte]: end_time },
            end_time: { [Op.gte]: start_time },
            },
        });

        if (conflict) {
            throw new Error("Room is already booked for this time slot");
        }

        // 4. Validate student count <= total seats
        const registeredCount = await StudentExamRegistration.count({
            where: { exam_id },
        });

        if (registeredCount > total_seats) {
            throw new Error(
            `Cannot schedule exam. Registered students (${registeredCount}) exceed total seats (${total_seats}).`
            );
        }

        // 5. Create schedule
        const schedule = await ExamSchedule.create({
            exam_id,
            scheduled_date,
            start_time,
            end_time,
            venue,
            invigilator_id,
            total_seats,
        });
        return schedule;
    }
    async getExamSchedules(exam_id: number, tenant: string) {
        const { ExamSchedule } = getTenantModels(tenant);
        if (!exam_id) {
            throw new Error("exam_id is required");
        }
        const schedules = await ExamSchedule.findAll({
            where: { exam_id },
            order: [
                ["scheduled_date", "ASC"],
                ["start_time", "ASC"]
            ],
        });
        return schedules;
    }

    async updateExamSchedule(payload: any, tenant: string) {
        const {
            id, // schedule_id
            exam_id,
            scheduled_date,
            start_time,
            end_time,
            venue,
            invigilator_id,
            total_seats,
        } = payload;

        const { Exam, StudentExamRegistration, ExamSchedule } = getTenantModels(tenant);

        // 1. Validate schedule exists
        const schedule = await ExamSchedule.findByPk(id);
        if (!schedule) {
            throw new Error("Schedule not found");
        }

        // 2. Validate exam exists
        const exam = await Exam.findByPk(exam_id);
        if (!exam) {
            throw new Error("Exam not found");
        }

        // 3. Validate total seats
        if (!total_seats || total_seats <= 0) {
            throw new Error("Total seats must be greater than zero");
        }

        // 4. Check room/time conflict (exclude current schedule)
        const conflict = await ExamSchedule.findOne({
            where: {
                id: { [Op.ne]: id },
                scheduled_date,
                venue,
                start_time: { [Op.lte]: end_time },
                end_time: { [Op.gte]: start_time },
            },
        });

        if (conflict) {
            throw new Error("Room is already booked for this time slot");
        }

        // 5. Validate student count <= total seats
        const registeredCount = await StudentExamRegistration.count({
            where: { exam_id },
        });

        if (registeredCount > total_seats) {
            throw new Error(
                `Cannot update schedule. Registered students (${registeredCount}) exceed total seats (${total_seats}).`
            );
        }

        // 6. Update schedule
        await schedule.update({
            exam_id,
            scheduled_date,
            start_time,
            end_time,
            venue,
            invigilator_id,
            total_seats,
        });

        return schedule;
    }
    async deleteExamSchedule(id: number, tenant: string) {
        const { ExamSchedule } = getTenantModels(tenant);

        if (!id) {
            throw new Error("Schedule ID is required");
        }
        // 1. Validate schedule exists
        const schedule = await ExamSchedule.findByPk(id);
        if (!schedule) {
            throw new Error("Schedule not found");
        }
        // 2. Delete schedule
        await schedule.destroy();

        return { deleted: true };
    }

    async checkRoomAvailability(payload: any, tenant: string) {
        const {
            scheduled_date,
            start_time,
            end_time,
            venue,
            exclude_schedule_id, // optional (used during update)
        } = payload;

        const { ExamSchedule } = getTenantModels(tenant);

        if (!scheduled_date || !start_time || !end_time || !venue) {
            throw new Error("scheduled_date, start_time, end_time and venue are required");
        }

        // Build where clause
        const whereClause: any = {
            scheduled_date,
            venue,
            start_time: { [Op.lte]: end_time },
            end_time: { [Op.gte]: start_time },
        };

        // Exclude current schedule when updating
        if (exclude_schedule_id) {
            whereClause.id = { [Op.ne]: exclude_schedule_id };
        }

        // Check conflict
        const conflict = await ExamSchedule.findOne({ where: whereClause });

        return {
            available: !conflict,
            conflict,
        };
    }


    async getAllExamSchedules(tenant: string) {
        const sequelize = getTenantSequelize(tenant);

        const schedules = await sequelize.query(
            `SELECT 
                es.id AS schedule_id,
                es.exam_id,
                es.scheduled_date,
                es.start_time,
                es.end_time,
                es.venue,
                es.invigilator_id,
                es.total_seats,
                e.exam_name,
                e.exam_type,
                e.total_marks,
                e.duration_minutes,
                e.program_id,
                p.name AS program_name,
                e.department_id,
                d.name AS department_name,
                e.academic_year_id,
                ay.year AS academic_year_name,
                e.class_id,
                c.name AS class_name,
                e.semester_id,
                s.semester_number AS semester_number,
                e.subject_id,
                subj.name AS subject_name
            FROM exam_schedules es
            INNER JOIN exams e ON e.id = es.exam_id
            LEFT JOIN programs p ON p.id = e.program_id
            LEFT JOIN departments d ON d.id = e.department_id
            LEFT JOIN academic_years ay ON ay.id = e.academic_year_id
            LEFT JOIN classes c ON c.id = e.class_id
            LEFT JOIN semesters s ON s.id = e.semester_id
            LEFT JOIN subjects subj ON subj.id = e.subject_id

            ORDER BY es.scheduled_date ASC, es.start_time ASC;
            `,
            {
                type: QueryTypes.SELECT,
            }
        );
        return schedules;
    } 

    
    async getUpcomingExamSchedules(tenant: string) {
        const sequelize = getTenantSequelize(tenant);
        const today = new Date().toISOString().split("T")[0];

        const schedules = await sequelize.query(
            `
            SELECT 
                es.id,
                es.exam_id,
                es.scheduled_date,
                es.start_time,
                es.end_time,
                es.venue,
                es.invigilator_id,
                es.total_seats,

                -- Teacher details
                t.first_name AS invigilator_first_name,
                t.last_name AS invigilator_last_name,
                CONCAT(t.first_name, ' ', t.last_name) AS invigilator_name

            FROM exam_schedules es
            LEFT JOIN teachers t 
                ON t.id = es.invigilator_id

            WHERE es.scheduled_date >= :today

            ORDER BY es.scheduled_date ASC, es.start_time ASC;
            `,
            {
                replacements: { today },
                type: QueryTypes.SELECT,
            }
        );
        return schedules;
    }
}