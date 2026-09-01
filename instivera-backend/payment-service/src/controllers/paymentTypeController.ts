import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { getTenantModels } from "../models";
export const getAllPaymentTypes = async (req, res: Response, next: NextFunction) => {
  try {
    const { PaymentType, PaymentTypeLedgerMapping } = getTenantModels(req.tenant);

    const paymentTypes: any = await PaymentType.findAll({
      include: [
        {
          model: PaymentTypeLedgerMapping,
          as: "ledgerMappings",
          attributes: ["ledger_id"]
        }
      ],
      order: [["created_at", "DESC"]],
    });

    const formatted = paymentTypes.map(pt => ({
      ...pt.toJSON(),
      ledger_id: pt.ledgerMappings?.ledger_id ?? null
    }));

    return res.status(200).json({
      status: 1,
      message: "Payment types fetched successfully",
      data: formatted,
    });

  } catch (error) {
    next(error);
  }
};

export const getActivePaymentTypes = async (req, res: Response, next: NextFunction) => {
  try {
    const { PaymentType } = getTenantModels(req.tenant);
    const paymentTypes = await PaymentType.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']],
    });

    return res.status(200).json({
      status: 1,
      message: "Active payment types fetched successfully",
      data: paymentTypes,
    });
  } catch (error) {
    next(error);
  }
};
export const getPaymentTypeById = async (req, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { PaymentType } = getTenantModels(req.tenant);
    const paymentType = await PaymentType.findByPk(id);

    if (!paymentType) {
      throw new AppError("Payment type not found", 404);
    }

    return res.status(200).json({
      status: 1,
      message: "Payment type fetched successfully",
      data: paymentType,
    });
  } catch (error) {
    next(error);
  }
};
export const createPaymentType = async (req, res: Response, next: NextFunction) => {
  try {
    const { name, fee_head_id, description, amount, ledger, is_active } = req.body;
    console.log(req.body.ledger);

    if (!name || name.trim() === '') {
      throw new AppError("Payment type name is required", 400);
    }
    const { PaymentType, PaymentTypeLedgerMapping } = getTenantModels(req.tenant);
    const paymentType = await PaymentType.create({
      name: name.trim(),
      fee_head_id: fee_head_id,
      description: description?.trim() || null,
      amount: amount !== undefined && amount !== null && amount !== '' ? parseFloat(amount) : null,
      is_active: is_active !== undefined ? is_active : true,
    });

    await PaymentTypeLedgerMapping.create({
      payment_type_id: paymentType.id,
      ledger_id: parseInt(ledger),
      is_active: 1
    });

    return res.status(201).json({
      status: 1,
      message: "Payment type created successfully",
      data: paymentType,
    });
  } catch (error) {
    next(error);
  }
};
export const updatePaymentType = async (req, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, fee_head_id, description, amount, ledger, is_active } = req.body;

    const { PaymentType, PaymentTypeLedgerMapping } = getTenantModels(req.tenant);

    const paymentType: any = await PaymentType.findByPk(id, {
      include: [
        {
          model: PaymentTypeLedgerMapping,
          as: "ledgerMapping"
        }
      ]
    });

    if (!paymentType) {
      throw new AppError("Payment type not found", 404);
    }

    // Update payment type fields
    await paymentType.update({
      name: name?.trim() || paymentType.name,
      fee_head_id: fee_head_id,
      description: description !== undefined ? description?.trim() : paymentType.description,
      amount: amount !== undefined ? (amount !== null && amount !== '' ? parseFloat(amount) : null) : paymentType.amount,
      is_active: is_active !== undefined ? is_active : paymentType.is_active,
      updated_at: new Date(),
    });

    // Update ledger mapping
    if (ledger !== undefined) {
      if (paymentType.ledgerMapping) {
        // Update existing mapping
        await paymentType.ledgerMapping.update({
          ledger_id: Number(ledger)
        });
      } else {
        // Create new mapping if none exists
        await PaymentTypeLedgerMapping.create({
          payment_type_id: paymentType.id,
          ledger_id: Number(ledger)
        });
      }
    }

    return res.status(200).json({
      status: 1,
      message: "Payment type updated successfully",
      data: paymentType,
    });

  } catch (error) {
    next(error);
  }
};

export const deletePaymentType = async (req, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { PaymentType, PaymentTypeLedgerMapping } = getTenantModels(req.tenant);

    // Fetch payment type with its ledger mapping
    const paymentType: any = await PaymentType.findByPk(id, {
      include: [
        {
          model: PaymentTypeLedgerMapping,
          as: "ledgerMapping"
        }
      ]
    });

    if (!paymentType) {
      throw new AppError("Payment type not found", 404);
    }

    // Delete ledger mapping first (if exists)
    if (paymentType.ledgerMapping) {
      await paymentType.ledgerMapping.destroy();
    }

    // Delete payment type
    await paymentType.destroy();

    return res.status(200).json({
      status: 1,
      message: "Payment type deleted successfully",
      data: null
    });

  } catch (error) {
    next(error);
  }
};

export const togglePaymentTypeStatus = async (req, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { PaymentType } = getTenantModels(req.tenant);
    const paymentType = await PaymentType.findByPk(id);
    if (!paymentType) {
      throw new AppError("Payment type not found", 404);
    }

    await paymentType.update({
      is_active: !paymentType.is_active,
      updated_at: new Date(),
    });

    return res.status(200).json({
      status: 1,
      message: `Payment type ${paymentType.is_active ? 'activated' : 'deactivated'} successfully`,
      data: paymentType,
    });
  } catch (error) {
    next(error);
  }
};
