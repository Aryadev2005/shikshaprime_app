import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { getTenantModels } from "../models";
export const getAllPaymentTypes = async (req, res: Response, next: NextFunction) => {
  try {
    const { PaymentType } = getTenantModels(req.tenant);
    const paymentTypes = await PaymentType.findAll({
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      status: 1,
      message: "Payment types fetched successfully",
      data: paymentTypes,
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
    const { name, description, amount, is_active } = req.body;

    if (!name || name.trim() === '') {
      throw new AppError("Payment type name is required", 400);
    }
    const { PaymentType } = getTenantModels(req.tenant);
    const paymentType = await PaymentType.create({
      name: name.trim(),
      description: description?.trim() || null,
      amount: amount !== undefined && amount !== null && amount !== '' ? parseFloat(amount) : null,
      is_active: is_active !== undefined ? is_active : true,
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
    const { name, description, amount, is_active } = req.body;
    const { PaymentType } = getTenantModels(req.tenant);
    const paymentType = await PaymentType.findByPk(id);
    if (!paymentType) {
      throw new AppError("Payment type not found", 404);
    }

    await paymentType.update({
      name: name?.trim() || paymentType.name,
      description: description !== undefined ? description?.trim() : paymentType.description,
      amount: amount !== undefined ? (amount !== null && amount !== '' ? parseFloat(amount) : null) : paymentType.amount,
      is_active: is_active !== undefined ? is_active : paymentType.is_active,
      updated_at: new Date(),
    });

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
    const { PaymentType } = getTenantModels(req.tenant);
    const paymentType = await PaymentType.findByPk(id);
    if (!paymentType) {
      throw new AppError("Payment type not found", 404);
    }

    await paymentType.destroy();

    return res.status(200).json({
      status: 1,
      message: "Payment type deleted successfully",
      data: null,
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
