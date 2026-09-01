import { NextFunction } from "express";
import { getTenantModels } from "../models";

export const listBanks = async (req, res, next: NextFunction) => {
  try {
    const models = getTenantModels(req.tenant);

    const banks = await models.Bank.findAll({
      order: [["bank_name", "ASC"]]
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
export const createBank = async (req, res, next: NextFunction) => {
  try {
    const models = getTenantModels(req.tenant);

    const { bank_name, bank_code, ifsc_prefix, is_active } = req.body;

    if (!bank_name || !bank_code || !ifsc_prefix) {
      return res.status(400).json({
        status: 0,
        message: "Missing required fields"
      });
    }

    const bank = await models.Bank.create({
      bank_name,
      bank_code,
      ifsc_prefix,
      is_active: is_active ?? 1
    });

    return res.status(201).json({
      status: 1,
      data: bank,
      message: "Bank created successfully"
    });

  } catch (error) {
    next(error);
  }
};
export const createBankBranch = async (req, res, next: NextFunction) => {
  try {
    const models = getTenantModels(req.tenant);

    const {
      bank_id,
      branch_name,
      branch_address,
      ifsc_code,
      micr_code,
      contact_person,
      contact_phone,
      is_active
    } = req.body;

    if (!bank_id || !branch_name) {
      return res.status(400).json({
        status: 0,
        message: "Missing required fields"
      });
    }

    console.log(contact_person);

    const branch = await models.BankBranch.create({
      bank_id,
      branch_name,
      branch_address,
      ifsc_code,
      micr_code,
      contact_person,
      contact_phone,
      is_active: is_active ?? 1
    });

    return res.status(201).json({
      status: 1,
      data: branch,
      message: "Bank branch created successfully"
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
      account_name,
      account_number,
      account_type,
      opening_balance,
      opening_balance_date,
      is_primary_account,
      is_active
    } = req.body;

    if (!bank_id || !branch_id || !account_name || !account_number) {
      return res.status(400).json({
        status: 0,
        message: "Missing required fields"
      });
    }

    // -----------------------------------------
    // 1️⃣ Find Chart of Account Group for Bank Accounts
    // -----------------------------------------
    const bankGroup = await models.ChartOfAccountGroup.findOne({
      where: { name: "Cash & Bank", root_type: "ASSET" }
    });

    if (!bankGroup) {
      return res.status(500).json({
        status: 0,
        message: "ChartOfAccountGroup 'Cash & Bank' not found"
      });
    }

    // -----------------------------------------
    // 2️⃣ Auto-create Ledger for this Bank Account
    // -----------------------------------------
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

    // -----------------------------------------
    // 3️⃣ Create LedgerBalanceCache
    // -----------------------------------------
    const initialBalance = opening_balance || 0;

    await models.LedgerBalanceCache.create({
      ledger_id: ledger.id,
      opening_balance: initialBalance,
      current_balance: initialBalance,
      updated_at: new Date()
    });

    // -----------------------------------------
    // 4️⃣ Create Bank Account
    // -----------------------------------------
    const bankAccount = await models.BankAccount.create({
      bank_id,
      branch_id,
      ledger_id: ledger.id,
      account_name,
      account_number,
      account_type,
      opening_balance,
      opening_balance_date,
      is_primary_account,
      is_active
    });

    return res.status(201).json({
      status: 1,
      message: "Bank account created successfully",
      data: bankAccount,
      ledger
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
export const listFinancialYears = async (req, res, next: NextFunction) => {
  try {
    const models = getTenantModels(req.tenant);

    const years = await models.FinancialYear.findAll({
      order: [["year_label", "ASC"]]
    });    
    return res.status(200).json({
        status: 1,      
        data: years,
        message: "FinancialYears fetched successfully"
    });

  } catch (error) {
      next(error);
  }
};