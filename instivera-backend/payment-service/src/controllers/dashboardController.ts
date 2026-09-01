import { Request, Response, NextFunction } from "express";
import { Op, QueryTypes } from "sequelize";
import { getTenantSequelize } from "../server";

export const getDashboardStats = async (req, res: Response, next: NextFunction) => {
  try {
    const { classId, programId, departmentId, academicYearId } = req.query;

    let whereClause = "WHERE 1=1";
    const replacements: any = {};

    // Filters now use student_personal_details (spd) and programs (pr)
    if (classId) {
      whereClause += ` AND spd.class_id = :classId`;
      replacements.classId = classId;
    }
    if (programId) {
      whereClause += ` AND spd.program_id = :programId`;
      replacements.programId = programId;
    }
    if (departmentId) {
      whereClause += ` AND pr.department_id = :departmentId`;
      replacements.departmentId = departmentId;
    }
    if (academicYearId) {
      whereClause += ` AND spd.academic_year_id = :academicYearId`;
      replacements.academicYearId = academicYearId;
    }

    const sequelize = getTenantSequelize(req.tenant);

    // Overall statistics
    const stats = await sequelize.query(`
      SELECT 
        COUNT(sp.id) AS total_payments,
        SUM(sp.amount) AS total_amount,
        SUM(sp.paid_amount) AS total_collected,
        SUM(sp.amount - sp.paid_amount) AS total_pending,
        SUM(CASE WHEN sp.status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
        SUM(CASE WHEN sp.status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN sp.status = 'overdue' THEN 1 ELSE 0 END) AS overdue_count,
        SUM(CASE WHEN sp.status = 'partial' THEN 1 ELSE 0 END) AS partial_count
      FROM student_fee_payments sp
      JOIN students st ON st.id = sp.student_id
      JOIN student_personal_details spd ON spd.user_id = st.user_id
      JOIN programs pr ON pr.id = spd.program_id
      ${whereClause}
    `, { type: QueryTypes.SELECT, replacements });

    // Payment type breakdown
    const paymentTypeBreakdown = await sequelize.query(`
      SELECT 
        pt.id,
        pt.name,
        COUNT(sp.id) AS total_payments,
        SUM(sp.amount) AS total_amount,
        SUM(sp.paid_amount) AS collected_amount,
        SUM(sp.amount - sp.paid_amount) AS pending_amount
      FROM payment_types pt
      LEFT JOIN student_fee_payments sp ON sp.payment_type_id = pt.id
      LEFT JOIN students st ON st.id = sp.student_id
      LEFT JOIN student_personal_details spd ON spd.user_id = st.user_id
      LEFT JOIN programs pr ON pr.id = spd.program_id
      ${whereClause}
      AND pt.is_active = 1
      GROUP BY pt.id, pt.name
      ORDER BY pt.name
    `, { type: QueryTypes.SELECT, replacements });

    return res.status(200).json({
      status: 1,
      message: "Dashboard statistics fetched successfully",
      data: {
        overview: stats[0] || {},
        paymentTypeBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};


// Get defaulters list (overdue payments)
export const getDefaulters = async (req, res: Response, next: NextFunction) => {
  try {
    const { classId, programId, departmentId, academicYearId } = req.query;

    let whereClause = `
      WHERE sp.status IN ('overdue', 'pending') 
        AND sp.due_date < CURDATE()
    `;
    const replacements: any = {};

    // Filters now use student_personal_details (spd) and programs (pr)
    if (classId) {
      whereClause += ` AND spd.class_id = :classId`;
      replacements.classId = classId;
    }
    if (programId) {
      whereClause += ` AND spd.program_id = :programId`;
      replacements.programId = programId;
    }
    if (departmentId) {
      whereClause += ` AND pr.department_id = :departmentId`;
      replacements.departmentId = departmentId;
    }
    if (academicYearId) {
      whereClause += ` AND spd.academic_year_id = :academicYearId`;
      replacements.academicYearId = academicYearId;
    }

    const sequelize = getTenantSequelize(req.tenant);

    const defaulters = await sequelize.query(`
      SELECT 
        sp.id,
        sp.student_id,        
        spd.class_id,
        spd.program_id,
        pr.department_id,
        spd.academic_year_id,
        sp.amount,
        sp.paid_amount,
        (sp.amount - sp.paid_amount) AS pending_amount,
        sp.due_date,
        sp.status,
        pt.name AS payment_type,
        TRIM(CONCAT(
          st.first_name, ' ',
          COALESCE(st.middle_name, ''), ' ',
          st.last_name
        )) AS student_name

      FROM student_fee_payments sp
      JOIN students st ON st.id = sp.student_id
      JOIN student_personal_details spd ON spd.user_id = st.user_id
      JOIN programs pr ON pr.id = spd.program_id
      JOIN payment_types pt ON pt.id = sp.payment_type_id
      ${whereClause}
      ORDER BY sp.due_date ASC
    `, { type: QueryTypes.SELECT, replacements });

    return res.status(200).json({
      status: 1,
      message: "Defaulters list fetched successfully",
      data: defaulters,
      count: defaulters.length,
    });
  } catch (error) {
    next(error);
  }
};


// Get class-wise payment summary
export const getClassWiseSummary = async (req, res: Response, next: NextFunction) => {
  try {
    const sequelize = getTenantSequelize(req.tenant);

    const summary = await sequelize.query(`
      SELECT 
        spd.class_id,
        COUNT(DISTINCT sp.student_id) AS total_students,
        COUNT(sp.id) AS total_payments,
        SUM(sp.amount) AS total_amount,
        SUM(sp.paid_amount) AS collected_amount,
        SUM(sp.amount - sp.paid_amount) AS pending_amount,
        ROUND((SUM(sp.paid_amount) / SUM(sp.amount)) * 100, 2) AS collection_percentage
      FROM student_fee_payments sp
      JOIN students st ON st.id = sp.student_id
      JOIN student_personal_details spd ON spd.user_id = st.user_id
      JOIN programs pr ON pr.id = spd.program_id
      WHERE spd.class_id IS NOT NULL
      GROUP BY spd.class_id
      ORDER BY spd.class_id
    `, { type: QueryTypes.SELECT });

    return res.status(200).json({
      status: 1,
      message: "Class-wise summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};