import { NextFunction, Request, Response } from "express";
import { FeeReportsService } from "../services/feeReportsService";

  const service = new FeeReportsService();

  export const getDailyCollectionReport = async (req, res: Response, next: NextFunction) => {
    try {
      const { date, payment_mode } = req.query;
      const data = await service.getDailyCollectionReport(date, payment_mode, req.tenant);
      return res.status(200).json({
        status: 1,      
        data: data,
        message: "Daily collection report fetched successfully"
      });
    } catch (error) {
        next(error);
    }
  };

  export const getStudentLedger = async (req, res, next) => {
    try {
      const data = await service.getStudentLedger(
        req.query,
        req.tenant
      );

      return res.json({
        status: 1,
        message: "Student ledger loaded",
        data,
      });
    } catch (err) {
      next(err);
    }
  };

  export const getHeadwiseCollectionReport = async (req, res, next) => {
    try {
      const data = await service.getHeadwiseCollection(req.query, req.tenant);

      return res.json({
        status: 1,
        message: "Head-wise collection loaded",
        data,
      });
    } catch (err) {
      next(err);
    }
  };

  export const getOutstandingDues = async (req, res, next) => {
    try {
      const data = await service.getOutstandingDues(
        req.query,
        req.tenant
      );

      return res.json({
        status: 1,
        message: "Outstanding dues loaded",
        data,
      });
    } catch (err) {
      next(err);
    }
  };