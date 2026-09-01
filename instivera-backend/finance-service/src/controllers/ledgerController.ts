import { NextFunction } from "express";
import { getTenantModels } from "../models";

export const listLedgers = async (req, res, next: NextFunction) => {
  try {
    const models = getTenantModels(req.tenant);

    const { type, group_id, is_system, is_active } = req.query;

    const where: any = {};

    if (type) where.type = type;
    if (group_id) where.group_id = group_id;
    if (is_system !== undefined) where.is_system = is_system;
    if (is_active !== undefined) where.is_active = is_active;

    const ledgers = await models.Ledger.findAll({
      where,
      include: [{ model: models.ChartOfAccountGroup, as: "group" }],
      order: [["id", "ASC"]]
    });

    return res.status(200).json({
        status: 1,      
        data: ledgers,
        message: "Ledgers fetched successfully"
    });

  } catch (error) {
      next(error);
  }
};

export const listLedgersByType = async (req, res, next: NextFunction) => {
  try {
    const models = getTenantModels(req.tenant);

     const { type } = req.params;

    const where: any = {};

    if (type) where.type = type;    

    const ledgers = await models.Ledger.findAll({
      where,
      order: [["id", "ASC"]]
    });

    return res.status(200).json({
        status: 1,      
        data: ledgers,
        message: "Ledgers fetched successfully"
    });

  } catch (error) {
      next(error);
  }
};

export const getLedgerById = async (req, res, next: NextFunction) => {
  try {
    const tenant = req.tenant;
    const models = getTenantModels(tenant);
    const { id } = req.params;

    const ledger = await models.Ledger.findOne({
      where: { id },
      include: [{ model: models.ChartOfAccountGroup }]
    });

    if (!ledger) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    return res.status(200).json({
        status: 1,      
        data: ledger,
        message: "Ledger fetched successfully"
    });

  } catch (error) {
      next(error);
  }
};
export const getLedgerBalance = async (req, res, next: NextFunction) => {
  try {
    const tenant = req.tenant;
    const models = getTenantModels(tenant);
    const { id } = req.params;

    const balance = await models.LedgerBalanceCache.findOne({
      where: { ledger_id: id }
    });

    return res.status(200).json({
        status: 1,      
        data: {
          ledger_id: id,
          current_balance: balance?.current_balance || 0
        },
        message: "Ledger fetched successfully"
    });

  } catch (error) {
      next(error);
  }
};
export const createLedger = async (req, res, next: NextFunction) => {
  try {
    const tenant = req.tenant;
    const models = getTenantModels(tenant);

    const { name, group_id, type, opening_balance, is_system, is_active } = req.body;

    if (!name || !group_id || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const ledger = await models.Ledger.create({
      name,
      group_id,
      type,
      opening_balance: opening_balance || 0,
      is_system: is_system ?? 0,
      is_active: is_active ?? 1
    });

    const isDebitType = ["ASSET", "EXPENSE"].includes(type);
    const initialBalance = isDebitType
      ? (opening_balance || 0)
      : -(opening_balance || 0);

    await models.LedgerBalanceCache.create({
      ledger_id: ledger.id,
      opening_balance: initialBalance,
      current_balance: initialBalance,
      updated_at: new Date()
    });

    return res.status(201).json({
        status: 1,      
        data: ledger,
        message: "Ledger created successfully"
    });

  } catch (error) {
      next(error);
  }
};
export const updateLedger = async (req, res, next) => {
  try {
    const tenant = req.tenant;
    const models = getTenantModels(tenant);

    const { id, name, group_id, type, opening_balance, is_active } = req.body;

    if (!id || !name || !group_id || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const ledger = await models.Ledger.findOne({ where: { id } });

    if (!ledger) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    // Update ledger
    await ledger.update({
      name,
      group_id,
      type,
      opening_balance: opening_balance ?? ledger.opening_balance,
      is_active: is_active ?? ledger.is_active
    });

    // Recalculate balance based on type
    const isDebitType = ["ASSET", "EXPENSE"].includes(type);
    const newBalance = isDebitType
      ? (opening_balance || 0)
      : -(opening_balance || 0);

    await models.LedgerBalanceCache.update(
      {
        opening_balance: newBalance,
        current_balance: newBalance,
        updated_at: new Date()
      },
      { where: { ledger_id: id } }
    );

    return res.status(200).json({
      status: 1,
      data: ledger,
      message: "Ledger updated successfully"
    });

  } catch (error) {
    next(error);
  }
};
export const deleteLedger = async (req, res, next) => {
  try {
    const tenant = req.tenant;
    const models = getTenantModels(tenant);

    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Ledger ID is required" });
    }

    const ledger = await models.Ledger.findOne({ where: { id } });

    if (!ledger) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    if (ledger.is_system) {
      return res.status(400).json({ message: "System ledger cannot be deleted" });
    }

    // Optional: Prevent deletion if ledger has voucher entries
    const voucherCount = await models.VoucherEntry.count({
      where: { ledger_id: id }
    });

    if (voucherCount > 0) {
      return res.status(400).json({
        message: "Ledger cannot be deleted because it has voucher entries"
      });
    }

    // Delete balance cache
    await models.LedgerBalanceCache.destroy({ where: { ledger_id: id } });

    // Delete ledger
    await ledger.destroy();

    return res.status(200).json({
      status: 1,
      message: "Ledger deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};