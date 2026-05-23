import { Op, QueryTypes } from "sequelize";
import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";

export class FeeReportsService {
  /* ----------------------------------------------------
     1. DAILY COLLECTION REPORT
  ---------------------------------------------------- */
  async getDailyCollectionReport(
  date: string,
  payment_mode: string,
  tenant: string
) {
  if (!date) throw new Error("date is required");

  let query = `
    SELECT 
      fr.receipt_no,
      s.student_name AS student_name,
      CONCAT(p.name, ' ', d.name, ' ', c.name) AS class_name,
      fr.payment_mode,
      fr.total_amount AS amount,
      DATE_FORMAT(fr.created_at, '%h:%i %p') AS time,
      u.email AS collected_by
    FROM fee_receipts fr
    JOIN students s ON s.id = fr.student_id
    JOIN programs p ON p.id = s.program_id 
    JOIN departments d on d.id = s.department_id 
    JOIN classes c ON c.id = s.class_id
    JOIN users u ON u.user_id = fr.collected_by
    WHERE DATE(fr.created_at) = ?
  `;

  const params: any[] = [date];

  if (payment_mode) {
    query += ` AND fr.payment_mode = ?`;
    params.push(payment_mode);
  }

  query += ` ORDER BY fr.created_at DESC`;

  const sequelize = getTenantSequelize(tenant);

  const rows = await sequelize.query(query, {
    replacements: params,
    type: QueryTypes.SELECT,
  });
  return rows;
}

  /* ----------------------------------------------------
     2. STUDENT LEDGER REPORT
  ---------------------------------------------------- */
  async getStudentLedger(
    payload: { student_id: number },
    tenant: string
  ) {
    const { student_id } = payload;

    if (!student_id) throw new Error("student_id is required");

    const models = getTenantModels(tenant);
    const sequelize = getTenantSequelize(tenant);

    // ---------------------------------------------------------
    // 1️⃣ FETCH STUDENT DETAILS USING RAW SQL
    // ---------------------------------------------------------
    const studentQuery = `
      SELECT 
        s.id,
        s.student_name,
        
        s.program_id,
        p.name AS program_name,

        s.department_id,
        d.name AS department_name,

        s.class_id,
        c.name AS class_name,

        s.semester_id,
        sem.name AS semester_name,

        s.academic_year_id,
        ay.name AS academic_year_name

      FROM students s
      LEFT JOIN programs p ON p.id = s.program_id
      LEFT JOIN departments d ON d.id = s.department_id
      LEFT JOIN classes c ON c.id = s.class_id
      LEFT JOIN semesters sem ON sem.id = s.semester_id
      LEFT JOIN academic_years ay ON ay.id = s.academic_year_id

      WHERE s.id = :student_id
      LIMIT 1;
    `;

    const [studentRows] = await sequelize.query(studentQuery, {
      replacements: { student_id },
      type: QueryTypes.SELECT,
    });

    const student: any = studentRows;

    if (!student) throw new Error("Student not found");

    // ---------------------------------------------------------
    // 2️⃣ FETCH ASSIGNED FEES (StudentFeeAssignment)
    // ---------------------------------------------------------
    const assignedFees = await models.StudentFeeAssignment.findAll({
      where: { student_id },
      include: [
        {
          model: models.FeeHead,
          as: "fee_head",
          attributes: ["id", "name"],
        },
      ],
    });

    const assigned = assignedFees.map((a: any) => ({
      fee_head: a.fee_head?.name,
      amount: Number(a.amount),
    }));

    // ---------------------------------------------------------
    // 3️⃣ FETCH PAYMENTS (FeeReceipt + FeeReceiptItem)
    // ---------------------------------------------------------
    const receipts = await models.FeeReceipt.findAll({
      where: { student_id },
      include: [
        {
          model: models.FeeReceiptItem,
          as: "items",
          include: [
            {
              model: models.FeeHead,
              as: "fee_head",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    const payments = receipts.map((r: any) => ({
      receipt_no: r.receipt_no,
      date: r.collected_at,
      amount: Number(r.total_amount),
      mode: r.payment_mode,
    }));

    // ---------------------------------------------------------
    // 4️⃣ SUMMARY CALCULATION
    // ---------------------------------------------------------
    const total_payable = assigned.reduce((sum, a) => sum + a.amount, 0);
    const total_paid = payments.reduce((sum, p) => sum + p.amount, 0);

    const balance = total_payable - total_paid;

    // ---------------------------------------------------------
    // 5️⃣ FINAL RESPONSE
    // ---------------------------------------------------------
    return {
      student: {
        id: student.student_id,
        name: student.student_name,
        
        program: student.program_name,
        department: student.department_name,
        class: student.class_name,
        semester: student.semester_name,
        academic_year: student.academic_year_name,
      },

      assigned_fees: assigned,
      payments,

      summary: {
        total_payable,
        total_paid,
        balance,
      },
    };
  }
  /* ----------------------------------------------------
     3. HEADWISE COLLECTION REPORT
  ---------------------------------------------------- */
  async getHeadwiseCollection(
    payload: {
      from: string;
      to: string;
      program_id: number;
      department_id: number;
      academic_year_id: number;
      class_id: number;
    },
    tenant: string
  ) {
    const { from, to, program_id, department_id, academic_year_id, class_id } = payload;

    if (!from || !to) throw new Error("Date range is required");
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);

    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const models = getTenantModels(tenant);

    const receipts = await models.FeeReceipt.findAll({
      where: {
        collected_at: {
          [Op.between]: [start, end],
        },
      },
      include: [
        {
          model: models.Student,
          as: "student",
          required: true,
          where: {
            program_id,
            department_id,
            academic_year_id,
            class_id,
          },
          attributes: ["id", "student_name"],
        },
        {
          model: models.FeeReceiptItem,
          as: "items",
          required: true,
          include: [
            {
              model: models.FeeHead,
              as: "fee_head",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    // -----------------------------
    // GROUP BY FEE HEAD
    // -----------------------------
    const grouped: any = {};

    receipts?.forEach((receipt: any) => {
      receipt.items.forEach((item: any) => {
        const headName = item.fee_head?.name || "Unknown";

        if (!grouped[headName]) {
          grouped[headName] = {
            fee_head: headName,
            amount: 0,
            students: new Set(),
          };
        }

        grouped[headName].amount += Number(item.amount);
        grouped[headName].students.add(receipt.student_id);
      });
    });

    // Convert Set → number
    return Object.values(grouped).map((g: any) => ({
      fee_head: g.fee_head,
      amount: g.amount,
      students: g.students.size,
    }));
  }
  /* ----------------------------------------------------
     4. OUTSTANDING DUES REPORT
  ---------------------------------------------------- */
  async getOutstandingDues(
    payload: {
      program_id: number;
      department_id: number;
      academic_year_id: number;
      class_id: number;
    },
    tenant: string
  ) {
    const { program_id, department_id, academic_year_id, class_id } = payload;

    const sequelize = getTenantSequelize(tenant);

    // ---------------------------------------------------------
    // OUTSTANDING DUES QUERY (FAST RAW SQL)
    // ---------------------------------------------------------
    const query = `
      SELECT 
        s.student_id AS student_id,
        s.student_name AS student_name,
        c.name AS class_name,

        COALESCE(SUM(sfa.amount), 0) AS total_payable,
        COALESCE(SUM(fr.total_amount), 0) AS total_paid,

        (COALESCE(SUM(sfa.amount), 0) - COALESCE(SUM(fr.total_amount), 0)) AS balance

      FROM students s
      LEFT JOIN classes c ON c.id = s.class_id

      LEFT JOIN student_fee_assignments sfa 
        ON sfa.student_id = s.id

      LEFT JOIN fee_receipts fr 
        ON fr.student_id = s.id

      WHERE 
        s.program_id = :program_id
        AND s.department_id = :department_id
        AND s.academic_year_id = :academic_year_id
        AND s.class_id = :class_id

      GROUP BY 
        s.student_id, s.student_name, c.name

      HAVING 
        (COALESCE(SUM(sfa.amount), 0) - COALESCE(SUM(fr.total_amount), 0)) > 0

      ORDER BY s.student_name ASC;
    `;

    const results = await sequelize.query(query, {
      replacements: {
        program_id,
        department_id,
        academic_year_id,
        class_id,
      },
      type: QueryTypes.SELECT,
    });

    return results;
  }

}