import { Request, Response, NextFunction } from "express";
import { getTenantModels } from "../models";
import { Op } from "sequelize";

/* ============================================================
   GET FINANCE DASHBOARD STATS
   ============================================================ */
export const getDashboardStats = async (req, res: Response, next: NextFunction) => {
  try {
    const tenant = req.tenant;
    const models = getTenantModels(tenant);

    // -----------------------------
    // TOTAL COLLECTION (RECEIPT VOUCHERS)
    // -----------------------------
    // Fetch all voucher entries that belong to RECEIPT vouchers
    const receiptEntries = await models.VoucherEntry.findAll({
    include: [
        {
        model: models.Voucher, as: "voucher",
        where: { voucher_type: "RECEIPT" }
        }
    ]
    });

    const totalCollection = receiptEntries.reduce(
        (sum, entry) => sum + Number(entry.debit_amount || 0),
        0
    );


    // -----------------------------
    // PENDING DUES (You don't have dues model yet)
    // -----------------------------
    const pendingDues = 0;

    // -----------------------------
    // BANK ACCOUNTS COUNT
    // -----------------------------
    const bankAccounts = await models.BankAccount.count();

    // -----------------------------
    // VOUCHERS CREATED TODAY
    // -----------------------------
    const today = new Date().toISOString().slice(0, 10);

    const vouchersToday = await models.Voucher.count({
      where: { voucher_date: today }
    });

    return res.status(200).json({
      status: 1,
      message: "Dashboard stats fetched successfully",
      data: {
        totalCollection: totalCollection || 0,
        pendingDues,
        bankAccounts,
        vouchersToday
      }
    });

  } catch (error) {
    next(error);
  }
};

/* ============================================================
   GET RECENT TRANSACTIONS
   ============================================================ */
export const getRecentTransactions = async (req, res: Response, next: NextFunction) => {
  try {
    const tenant = req.tenant;
    const models = getTenantModels(tenant);

    const transactions = await models.Voucher.findAll({
      limit: 10,
      order: [
        ["voucher_date", "DESC"],
        ["id", "DESC"]
      ],
      include: [
        {
          model: models.VoucherEntry,
          as: "entries",
          include: [{ model: models.Ledger, as: "ledger" }]
        }
      ]
    });

    return res.status(200).json({
      status: 1,
      message: "Recent transactions fetched successfully",
      data: transactions
    });

  } catch (error) {
    next(error);
  }
};