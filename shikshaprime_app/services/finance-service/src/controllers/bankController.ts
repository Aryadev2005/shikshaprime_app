import { NextFunction } from "express";
import { getTenantModels } from "../models";

export const listBanks = async (req, res, next: NextFunction) => {
  try {
    const models = getTenantModels(req.tenant);

    const banks = await models.Bank.findAll({
      order: [["name", "ASC"]]
    });    
    return res.status(200).json({
        status: 1,      
        data: banks,
        message: "Banks fetched successfully"
    });

  } catch (error) {
      next(error);
  }
};
export const listBankBranches = async (req, res, next: NextFunction) => {
  try {
    const models = getTenantModels(req.tenant);
    const { bank_id } = req.query;

    const where: any = {};
    if (bank_id) where.bank_id = bank_id;

    const branches = await models.BankBranch.findAll({
      where,
      order: [["branch_name", "ASC"]]
    });

    return res.status(200).json({
        status: 1,      
        data: branches,
        message: "Branches fetched successfully"
    });

  } catch (error) {
      next(error);
  }
};
export const listBankAccounts = async (req, res, next: NextFunction) => {
  try {
    const models = getTenantModels(req.tenant);

    const accounts = await models.BankAccount.findAll({
      include: [
        { model: models.Bank },
        { model: models.BankBranch },
        { model: models.Ledger, as: "ledger"}
      ],
      order: [["id", "DESC"]]
    });
    return res.status(200).json({
        status: 1,      
        data: accounts,
        message: "Accounts fetched successfully"
    });
  } catch (error) {
      next(error);
  }
};
export const createBankAccount = async (req, res, next: NextFunction) => {
  try {
    const models = getTenantModels(req.tenant);

    const {
      bank_id,
      branch_id,
      account_number,
      account_name,
      opening_balance
    } = req.body;

    if (!bank_id || !branch_id || !account_number || !account_name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const bankGroup = await models.ChartOfAccountGroup.findOne({
      where: { name: "Current Asset", root_type: "ASSET" }
    });

    if (!bankGroup) {
      return res.status(500).json({ message: "Bank Accounts group not found" });
    }

    const existing = await models.BankAccount.findOne({
      where: { account_number }
    });

    if (existing) {
      return res.status(400).json({ message: "Bank account already exists" });
    }

    // 1. Create Ledger for this bank account
    const ledger = await models.Ledger.create({
      name: account_name,
      group_id: bankGroup.id,
      type: "ASSET",
      opening_balance: opening_balance || 0,
      is_system: 0,
      is_active: 1,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Determine natural balance
    const initialBalance = opening_balance || 0;

    await models.LedgerBalanceCache.create({
      ledger_id: ledger.id,
      opening_balance: initialBalance,
      current_balance: initialBalance,
      updated_at: new Date()
    });

    // 2. Create Bank Account
    const bankAccount = await models.BankAccount.create({
      bank_id,
      branch_id,
      ledger_id: ledger.id,
      account_number,
      account_name
    });
    
    return res.status(201).json({
        status: 1,      
        data: {bankAccount, ledger},
        message: "Bank account created successfully"
    });

  } catch (error) {
      next(error);
  }
};
export const getBankAccountById = async (req, res, next: NextFunction) => {
  try {
    const models = getTenantModels(req.tenant);
    const { id } = req.params;

    const account = await models.BankAccount.findOne({
      where: { id },
      include: [
        { model: models.Bank },
        { model: models.BankBranch },
        { model: models.Ledger }
      ]
    });

    if (!account) {
      return res.status(404).json({ message: "Bank account not found" });
    }

    return res.status(200).json({
        status: 1,      
        data: account,
        message: "Account fetched successfully"
    });

  } catch (error) {
      next(error);
  }
};
