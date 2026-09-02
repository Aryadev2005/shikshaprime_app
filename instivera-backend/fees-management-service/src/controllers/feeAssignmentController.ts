import { NextFunction, Request, Response } from "express";
import { FeeAssignmentService } from "../services/feeAssignmentService";
import { getTenantModels } from "../models";
import { Op } from "sequelize";
import { assertCanReadStudent } from "../utils/studentScope";


  const service = new FeeAssignmentService();

  export const assignFeesToStudent = async (req, res: Response, next: NextFunction) => {
    try {
      const data = await service.assignFees(req.body, req.tenant);
      return res.status(201).json({
        status: 1,      
        data: data,
        message: "Fee assigned successfully"
      });
    } catch (error) {
        next(error);
    }
  };

  export const assignFeesToStudents = async (req, res: Response, next: NextFunction) => {
    try {
      const data = await service.assignFeesToStudents(req.body, req.tenant);
      return res.status(201).json({
        status: 1,      
        data: data,
        message: "Fee assigned successfully"
      });
    } catch (error) {
        next(error);
    }
  };

  

  export const getStudentDues = async (req, res: Response, next: NextFunction) => {
    try {
      await assertCanReadStudent(req.user, +req.params.student_id, req.tenant);

      const data = await service.getStudentDues(req.params.student_id, req.tenant);
      return res.status(200).json({
        status: 1,      
        data: data,
        message: "Student dues fetched successfully"
      });
    } catch (error) {
        next(error);
    }
  };

  export const updateDueStatus = async (req, res: Response, next: NextFunction) => {
    try {
      const data = await service.updateDueStatus(req.params.id, req.body.status, req.tenant);
      return res.status(201).json({
        status: 1,      
        data: data,
        message: "Student due status updated successfully"
      });
    } catch (error) {
        next(error);
    }
  };
  export const searchStudent = async (req, res: Response, next: NextFunction) => {
    try {
      const query = req.query.query as string;
      const data = await service.searchStudent(query, req.tenant);

      return res.status(200).json({
        status: 1,      
        data: data,
        message: "Student data fetched successfully"
      });      
    } catch (error) {
        next(error);
    }    
  };

export const searchStudentWithDues = async (req, res: Response, next: NextFunction) => {
  try {
    const tenant = req.tenant;
    const models = getTenantModels(tenant);

    const q = req.query.q as string;

    if (!q) {
      return res.status(400).json({
        status: 0,
        message: "Search text is required",
        data: null
      });
    }

    // -----------------------------------------
    // 1. Search student (reuse your search logic)
    // -----------------------------------------
    const student = await models.Student.findOne({
      where: {
        [Op.or]: [
          { first_name: { [Op.like]: `%${q}%` } },
          { middle_name: { [Op.like]: `%${q}%` } },
          { last_name: { [Op.like]: `%${q}%` } },
          { email: { [Op.like]: `%${q}%` } },
          { mobile: q },          
          { student_id: q }
        ]
      }
    });

    if (!student) {
      return res.status(404).json({
        status: 0,
        message: "Student not found",
        data: null
      });
    }

    // -----------------------------------------
    // 2. Fetch dues using your existing dues logic
    // -----------------------------------------
    const assignments = await models.StudentFeeAssignment.findAll({
      where: { student_id: student.id },
      include: [
        {
          model: models.FeeHead,
          as: "fee_head",
          attributes: ["id", "name", "ledger_id"]
        }
      ]
    });

    // -----------------------------------------
    // 3. Fetch receipts to compute paid amounts
    // -----------------------------------------
    const receipts = await models.FeeReceipt.findAll({
      where: { student_id: student.id },
      include: [
        {
          model: models.FeeReceiptItem,
          include: [{ model: models.FeeHead }]
        }
      ]
    });

    // -----------------------------------------
    // 4. Compute dues per fee head
    // -----------------------------------------
    const duesMap: any = {};

    // Assigned amounts
    for (const a of assignments) {
      if (!duesMap[a.fee_head_id]) {
        duesMap[a.fee_head_id] = {
          fee_head_id: a.fee_head_id,
          name: a.fee_head?.name,
          ledger_id: a.fee_head?.ledger_id,
          assigned: 0,
          paid: 0
        };
      }
      duesMap[a.fee_head_id].assigned += Number(a.amount);
    }

    // Subtract paid amounts
    for (const r of receipts) {
      for (const item of r.fee_receipt_items) {
        if (duesMap[item.fee_head_id]) {
          duesMap[item.fee_head_id].paid += Number(item.amount);
        }
      }
    }

    // Convert to array
    const duesList = Object.values(duesMap).map((d: any) => ({
      fee_head_id: d.fee_head_id,
      name: d.name,
      ledger_id: d.ledger_id,
      assigned: d.assigned,
      paid: d.paid,
      due: d.assigned - d.paid
    }));

    return res.status(200).json({
      status: 1,
      message: "Student & dues fetched successfully",
      data: {
        student,
        dues: duesList
      }
    });

  } catch (error) {
    next(error);
  }
};

