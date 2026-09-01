import { NextFunction, Request, Response } from "express";
import { FeeCollectionService } from "../services/feeCollectionService";
import { getTenantSequelize } from "../server";
import { QueryTypes } from "sequelize";

const feeCollectionService = new FeeCollectionService();

export const collectFee = async (req, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization;
    const sequelize = getTenantSequelize(req.tenant);
    console.log(req.user);
    const user: any = await sequelize.query(
        `SELECT user_id
        FROM users 
        WHERE email = :email LIMIT 1`,
        {
          replacements: { email: req.user.email },
          type: QueryTypes.SELECT
        }
      );
      console.log(user);
    const payload = {
      ...req.body,
      collected_by: user[0].user_id
    };
    console.log(payload);
    const result = await feeCollectionService.collectFee(payload, token, req.tenant);
    return res.status(201).json({
      status: 1,      
      data: result,
      message: "Fee collected successfully"
    });
  } catch (error) {
    next(error);
  }
};
export const getReceipt = async (req, res: Response, next: NextFunction) => {
  try {
    const data = await feeCollectionService.getReceipt(+req.params.receipt_id, req.tenant);
    return res.status(200).json({
      status: 1,      
      data: data,
      message: "Receipt fetched successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentReceipts = async (req, res: Response, next: NextFunction) => {
  try {
    const data = await feeCollectionService.getStudentReceipts(+req.params.student_id, req.tenant);
    return res.status(200).json({
      status: 1,      
      data: data,
      message: "Student Receipts fetched successfully"
    });
  } catch (error) {
    next(error);
  }
};