import { NextFunction, Response } from "express";
import { getTenantModels } from "../models";
import { VoucherService } from "../services/voucherService";
import { Op, QueryTypes } from "sequelize";
import { getTenantSequelize } from "../server";

const voucherService = new VoucherService();

export const createVoucher = async (req, res: Response, next: NextFunction) => {
  try {
    const tenant = req.tenant; // middleware sets this
    const user = req.user;

    const {
      voucher_type,
      voucher_date,
      reference_id,
      narration,
      created_by,
      lines
    } = req.body;

    if (!voucher_type || !voucher_date || !lines || lines.length < 2) {
      return res.status(400).json({ message: "Invalid voucher payload" });
    }

    const allowedTypes = ["RECEIPT", "PAYMENT", "CONTRA", "JOURNAL"];
    if (!allowedTypes.includes(voucher_type)) {
      return res.status(400).json({ message: "Invalid voucher type" });
    }

    for (const line of lines) {
      if (!line.ledger_id) {
        return res.status(400).json({ message: "Each line must have a ledger_id" });
      }
      if ((line.debit || 0) > 0 && (line.credit || 0) > 0) {
        return res.status(400).json({ message: "A line cannot have both debit and credit" });
      }
      if ((line.debit || 0) === 0 && (line.credit || 0) === 0) {
        return res.status(400).json({ message: "A line must have either debit or credit" });
      }
    }


    const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    if (totalDebit !== totalCredit) {
      return res.status(400).json({ message: "Debit and Credit totals must match" });
    }

    const voucher = await voucherService.createVoucher({
      voucher_type,
      voucher_date,
      reference_id,
      narration,
      created_by,
      lines
    }, req.tenant);

    return res.status(201).json({
        status: 1,      
        data: voucher,
        message: "Voucher created successfully"
    });
  } catch (error) {
      next(error);
  }
};
export const getVoucherById = async (req, res: Response, next: NextFunction) => {
  try {
    const tenant = req.tenant;
    const models = getTenantModels(tenant);
    const { id } = req.params;

    const voucher = await models.Voucher.findOne({
      where: { id },
      include: [
        {
          model: models.VoucherEntry,
          include: [{ model: models.Ledger }]
        }
      ]
    });

    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    return res.status(200).json({
        status: 1,      
        data: voucher,
        message: "Voucher fetched successfully"
    });

  } catch (error) {
      next(error);
  }
};
export const listVouchers = async (req, res: Response, next: NextFunction) => {
  try {
    const tenant = req.tenant;
    const models = getTenantModels(tenant);

    const { from, to, voucher_type, reference_id } = req.query;

    const where: any = {};

    if (voucher_type) where.voucher_type = voucher_type;
    if (reference_id) where.reference_id = reference_id;

    if (from && to) {
      where.voucher_date = { [Op.between]: [from, to] };
    }

    const vouchers = await models.Voucher.findAll({
      where,
      order: [["voucher_date", "DESC"], ["id", "DESC"]],
      include: [
        {
          model: models.VoucherEntry,
          include: [{ model: models.Ledger }]
        }
      ]
    });

    return res.status(200).json({
        status: 1,      
        data: vouchers,
        message: "Vouchers fetched successfully"
    });

  } catch (error) {
      next(error);
  }
};
export const deleteVoucher = async (req, res: Response, next: NextFunction) => {
  try {
    const tenant = req.tenant;
    const models = getTenantModels(tenant);
    const { id } = req.params;
    const userId = req.body.user_id;

    const result = await voucherService.deleteVoucher(req.tenant, id, userId);

    return res.status(200).json({
        status: 1,      
        data: result,
        message: "Voucher deleted successfully"
    });

  } catch (error) {
      next(error);
  }
};
export const createReceiptVoucher = async (req, res, next: NextFunction) => {
  try {
    const models = getTenantModels(req.tenant);

    const {
      payment_mode,
      bank_account_id,
      student_id,
      fee_heads,
      narration,
      created_by
    } = req.body;

    // Validate payment mode
    if (!payment_mode) {
      return res.status(400).json({ message: "Payment mode is required" });
    }

    // Determine payment ledger
    let paymentLedgerId;

    if (payment_mode === "CASH") {
      const cashLedger = await models.Ledger.findOne({ where: { name: "Cash in Hand" } });
      paymentLedgerId = cashLedger.id;
    }

    if (payment_mode === "BANK" || payment_mode === "CHEQUE") {
      if (!bank_account_id) {
        return res.status(400).json({ message: "bank_account_id is required for BANK payments" });
      }
      const bankAccount = await models.BankAccount.findByPk(bank_account_id);
      paymentLedgerId = bankAccount.ledger_id;
    }
    if (payment_mode === "ONLINE") {
      const onlineLedger = await models.Ledger.findOne({ where: { name: "Online Payments Settlement Account" } });
      paymentLedgerId = onlineLedger.id;
    }

    // Build voucher lines
    const lines = [];

    // Debit line (money received)
    let totalAmount = 0;

    // if (fee_head_id && amount) {
    //   // Single fee head
    //   totalAmount = amount;

    //   lines.push({
    //     ledger_id: paymentLedgerId,
    //     debit: amount,
    //     credit: 0
    //   });

    //   lines.push({
    //     ledger_id: fee_head_id,
    //     debit: 0,
    //     credit: amount
    //   });
    // }

    if (fee_heads && Array.isArray(fee_heads)) {
      // Multiple fee heads
      const fee_heads_numeric = fee_heads.map(h => ({
        ...h,
        amount: Number(h.amount),
        discount: Number(h.discount || 0),
        fine: Number(h.fine || 0)
      }));
      totalAmount = fee_heads_numeric.reduce((sum, h) => sum + h.amount, 0);      

      lines.push({
        ledger_id: paymentLedgerId,
        debit: totalAmount,
        credit: 0
      });

      for (const fh of fee_heads) {
        lines.push({
          ledger_id: fh.ledger_id,
          debit: 0,
          credit: fh.amount
        });
      }
    }

    else {
      return res.status(400).json({ message: "Provide either fee_head_id+amount OR fee_heads[]" });
    }

    // Call your existing voucher API    
    const voucher = await voucherService.createVoucher({
      voucher_type: "RECEIPT",
      voucher_date: new Date(),
      reference_id: student_id,
      narration,
      created_by,
      lines
    }, req.tenant);

    return res.status(201).json({
        status: 1,      
        data: voucher,
        message: "Receipt voucher created successfully"
    });

  } catch (error) {
      next(error);
  }
};
export const createPaymentVoucher = async (req, res, next: NextFunction) => {
  try {
    const models = getTenantModels(req.tenant);

    const {
      payment_mode,
      bank_account_id,
      expense_head_id,
      amount,
      expense_heads,
      narration,
      created_by
    } = req.body;

    if (!payment_mode) {
      return res.status(400).json({ message: "Payment mode is required" });
    }

    // Determine payment ledger (credit ledger)
    let paymentLedgerId;

    if (payment_mode === "CASH") {
      const cashLedger = await models.Ledger.findOne({ where: { name: "Cash in Hand" } });
      paymentLedgerId = cashLedger.id;
    }

    if (payment_mode === "BANK" || payment_mode === "CHEQUE") {
      if (!bank_account_id) {
        return res.status(400).json({ message: "bank_account_id is required for BANK payments" });
      }
      const bankAccount = await models.BankAccount.findByPk(bank_account_id);
      paymentLedgerId = bankAccount.ledger_id;
    }
    if (payment_mode === "ONLINE") {
      const onlineLedger = await models.Ledger.findOne({ where: { name: "Online Payments Settlement Account" } });
      paymentLedgerId = onlineLedger.id;
    }

    // Build voucher lines
    const lines = [];

    if (expense_head_id && amount) {
      // Single expense head
      lines.push({
        ledger_id: expense_head_id,
        debit: amount,
        credit: 0
      });

      lines.push({
        ledger_id: paymentLedgerId,
        debit: 0,
        credit: amount
      });
    }

    else if (expense_heads && Array.isArray(expense_heads)) {
      const totalAmount = expense_heads.reduce((sum, e) => sum + e.amount, 0);

      for (const e of expense_heads) {
        lines.push({
          ledger_id: e.expense_head_id,
          debit: e.amount,
          credit: 0
        });
      }

      lines.push({
        ledger_id: paymentLedgerId,
        debit: 0,
        credit: totalAmount
      });
    }

    else {
      return res.status(400).json({ message: "Provide either expense_head_id+amount OR expense_heads[]" });
    }

    // Call your existing voucher creation logic
    const voucher = await voucherService.createVoucher({
      voucher_type: "PAYMENT",
      voucher_date: new Date(),
      narration,
      created_by,
      lines
    }, req.tenant);

    return res.status(201).json({
        status: 1,      
        data: voucher,
        message: "Payment voucher created successfully"
    });

  } catch (error) {
      next(error);
  }
};
export const createContraVoucher = async (req, res, next: NextFunction) => {
  try {
    const models = getTenantModels(req.tenant);

    const {
      from_ledger_id,
      to_ledger_id,
      amount,
      narration,
      created_by
    } = req.body;

    // Basic validation
    if (!from_ledger_id || !to_ledger_id || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (from_ledger_id === to_ledger_id) {
      return res.status(400).json({ message: "Source and destination cannot be the same ledger" });
    }

    // Validate both ledgers exist
    const fromLedger = await models.Ledger.findByPk(from_ledger_id);
    const toLedger = await models.Ledger.findByPk(to_ledger_id);

    if (!fromLedger || !toLedger) {
      return res.status(404).json({ message: "Invalid ledger IDs" });
    }

    // Build voucher lines
    const lines = [
      {
        ledger_id: to_ledger_id,
        debit: amount,
        credit: 0
      },
      {
        ledger_id: from_ledger_id,
        debit: 0,
        credit: amount
      }
    ];

    // Call your existing voucher creation logic
    const voucher = await voucherService.createVoucher({
      voucher_type: "CONTRA",
      voucher_date: new Date(),
      narration,
      created_by,
      lines
    }, req.tenant);

    return res.status(201).json({
        status: 1,      
        data: voucher,
        message: "Contra Voucher created successfully"
    });

  } catch (error) {
      next(error);
  }
};
export const createJournalVoucher = async (req, res, next: NextFunction) => {
  try {
    const models = getTenantModels(req.tenant);

    const {
      narration,
      created_by,
      lines
    } = req.body;

    // Basic validation
    if (!lines || !Array.isArray(lines) || lines.length < 2) {
      return res.status(400).json({ message: "At least two voucher lines are required" });
    }

    // Validate each line
    for (const line of lines) {
      if (!line.ledger_id) {
        return res.status(400).json({ message: "Each line must have a ledger_id" });
      }
      if ((line.debit || 0) > 0 && (line.credit || 0) > 0) {
        return res.status(400).json({ message: "A line cannot have both debit and credit" });
      }
      if ((line.debit || 0) === 0 && (line.credit || 0) === 0) {
        return res.status(400).json({ message: "A line must have either debit or credit" });
      }
    }

    // Call your existing voucher creation logic
    const voucher = await voucherService.createVoucher({
      voucher_type: "JOURNAL",
      voucher_date: new Date(),
      narration,
      created_by,
      lines
    }, req.tenant);

    return res.status(201).json({
        status: 1,      
        data: voucher,
        message: "Journal voucher created successfully"
    });

  } catch (error) {
      next(error);
  }
};
export async function createManualVoucher(req, res, next: NextFunction) {
  const models = getTenantModels(req.tenant);
  const sequelize = getTenantSequelize(req.tenant);
  const t = await sequelize.transaction();

  try {
    const {
      voucher_type,
      voucher_date,
      reference_id,
      narration,
      lines
    } = req.body;

    if (!voucher_type || !voucher_date || !lines || lines.length < 2) {
      return res.status(400).json({ message: "Invalid voucher payload" });
    }

    const allowedTypes = ["RECEIPT", "PAYMENT", "CONTRA", "JOURNAL"];
    if (!allowedTypes.includes(voucher_type)) {
      return res.status(400).json({ message: "Invalid voucher type" });
    }

    for (const line of lines) {
      if (!line.ledger_id) {
        return res.status(400).json({ message: "Each line must have a ledger_id" });
      }
      if ((line.debit || 0) > 0 && (line.credit || 0) > 0) {
        return res.status(400).json({ message: "A line cannot have both debit and credit" });
      }
      if ((line.debit || 0) === 0 && (line.credit || 0) === 0) {
        return res.status(400).json({ message: "A line must have either debit or credit" });
      }
    }
    const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    if (totalDebit !== totalCredit) {
      return res.status(400).json({ message: "Debit and Credit totals must match" });
    }

    const voucherNo = await voucherService.generateVoucherNumber(models, voucher_type, t);
    const user: any = await sequelize.query(
            `SELECT user_id
            FROM users 
            WHERE email = :email LIMIT 1`,
            {
              replacements: { email: req.user.email },
              type: QueryTypes.SELECT
            }
          );
    console.log(user[0].user_id);

    const voucher = await models.Voucher.create(
      {
        voucher_no: voucherNo,
        voucher_type,
        voucher_date,
        financial_year_id: await voucherService.getCurrentFinancialYearId(sequelize),
        reference_no: reference_id,
        narration: narration,
        created_by: user[0].user_id
      },
      { transaction: t }
    );

    for (const line of lines) {
        await models.VoucherEntry.create(
          {
            voucher_id: voucher.id,
            ledger_id: line.ledger_id,
            debit_amount: line.debit || 0,
            credit_amount: line.credit || 0,
            particulars: line.particulars || null
          },
          { transaction: t }
        );
    }

    await t.commit();

    return res.status(201).json({
        status: 1,      
        data: voucher.voucher_no,
        message: "Manual voucher created successfully"
    });
  } catch (error) {
      next(error);
  }
}
