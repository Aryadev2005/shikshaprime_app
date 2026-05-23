import { Op } from "sequelize";
import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";

export class FeeAssignmentService {

  /* ----------------------------------------------------
     ASSIGN FEES TO A STUDENT
     Creates dues based on fee particulars
  ---------------------------------------------------- */
  async assignFees(payload: {
    student_id: number;
    academic_year_id: number;
    program_id: number;
    semester_id?: number | null;
  }, tenant: string) {
    const { student_id, academic_year_id, program_id, semester_id = null } = payload;

    if (!student_id || !academic_year_id || !program_id) {
      throw new Error("Missing required fields");
    }
    const models = getTenantModels(tenant);
    const sequelize = getTenantSequelize(tenant);

    return await sequelize.transaction(async (t) => {
      // 1. Fetch fee particulars for the program/year/term
      const particulars = await models.FeeParticular.findAll({
        where: { academic_year_id, program_id, semester_id },
        include: [{ model: models.FeeHead, as: "fee_head" }],
        transaction: t,
      });

      if (particulars.length === 0) {
        throw new Error("No fee particulars found for this program/year");
      }

      // 2. Create dues for each fee head
      const dues = particulars.map((p) => ({
        student_id,
        academic_year_id,
        fee_head_id: p.fee_head_id,
        amount: p.amount,
        discount_amount: 0,
        fine_amount: 0,
        due_date: new Date(),
        status: "PENDING" as const
      }));

      await models.StudentFeeAssignment.bulkCreate(dues, { transaction: t });

      return { assigned: dues.length };
    });
  }

  async assignFeesToStudents(payload, tenant) {
    const {
      academic_year_id,
      program_id,
      department_id,
      class_id,
      semester_id,
      student_ids,
      fee_items
    } = payload;

    if (!academic_year_id || !program_id || !class_id || !student_ids?.length || !fee_items?.length) {
      throw new Error("Missing required fields");
    }

    const models = getTenantModels(tenant);
    const sequelize = getTenantSequelize(tenant);

    return await sequelize.transaction(async (t) => {
      const dues = [];

      for (const student_id of student_ids) {
        for (const item of fee_items) {
          dues.push({
            student_id,
            academic_year_id,
            program_id,
            department_id,
            class_id,
            semester_id,
            fee_head_id: item.fee_head_id,
            amount: item.amount,
            discount_amount: 0,
            fine_amount: 0,
            due_date: new Date(),
            status: "PENDING"
          });
        }
      }

      await models.StudentFeeAssignment.bulkCreate(dues, { transaction: t });

      return {
        assigned_students: student_ids.length,
        assigned_fee_items: fee_items.length,
        total_rows_inserted: dues.length
      };
    });
  }


  /* ----------------------------------------------------
     GET STUDENT DUES
  ---------------------------------------------------- */
  async getStudentDues(student_id: number, tenant: string) {
    if (!student_id) throw new Error("student_id is required");
    const models = getTenantModels(tenant);
    const dues = await models.StudentFeeAssignment.findAll({
      where: { student_id },
      include: [
        {
          model: models.FeeHead,
          as: "fee_head",
          attributes: ["id", "name", "ledger_id"],
        },
      ],
      order: [["fee_head_id", "ASC"]],
    });

    return dues;
  }

  /* ----------------------------------------------------
     UPDATE DUE STATUS (PENDING → PAID/PARTIAL)
  ---------------------------------------------------- */
  async updateDueStatus(id: number, status: "PENDING" | "PARTIAL" | "PAID", tenant: string) {
    if (!id || !status) throw new Error("Missing required fields");
    const models = getTenantModels(tenant);
    const due = await models.StudentFeeAssignment.findByPk(id);
    if (!due) throw new Error("Invalid due ID");

    due.status = status;
    due.updated_at = new Date();
    await due.save();

    return due;
  }

  async searchStudent(query: string, tenant: string) {
    if (!query) throw new Error("Search query is required");
    const models = getTenantModels(tenant);
    // 1. Find student by name / admission no / phone
    const student = await models.Student.findOne({
      where: {
        [Op.or]: [
          { student_name: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
          { student_id: query }, // exact match for ID
        ]
      }
    });

    if (!student) {
      return { student: null, dues: [] };
    }

    // 2. Fetch dues for that student
    const dues = await models.StudentFeeAssignment.findAll({
      where: {
        student_id: student.id,
        status: "PENDING"
      },
      include: [
        {
          model: models.FeeHead,
          as: "fee_head",
          attributes: ["id", "name"]
        }
      ]
    });

    // 3. Transform dues for frontend
    const formattedDues = dues.map((d: any) => ({
      id: d.id,
      fee_head_id: d.fee_head_id,
      name: d.fee_head?.name,
      amount: d.amount,
      discount: d.discount_amount || 0,
      fine: d.fine_amount || 0
    }));

    return {
      student,
      dues: formattedDues
    };
  }
}