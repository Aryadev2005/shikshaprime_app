import { NextFunction, Request, Response } from "express";
import { FeeStructureService } from "../services/feeStructureService";

  const service = new FeeStructureService();

  export const createFeeHead = async (req, res: Response, next: NextFunction) => {
    try {
      const data = await service.createFeeHead(req.body, req.tenant);
      res.status(201).json({ status: "success", data });
      return res.status(201).json({
        status: 1,      
        data: data,
        message: "Fee head created successfully"
      });
    } catch (error) {
      next(error);
    }
  };

  export const getFeeHeads = async (req, res: Response, next: NextFunction) => {
    try {
      const data = await service.getFeeHeads(req.tenant);
      return res.status(200).json({
        status: 1,      
        data: data,
        message: "Fee heads are fetched successfully"
      });
    } catch (error) {
      next(error);
    }
  };

  export const createFeeParticular = async (req, res: Response, next: NextFunction) => {
    try {
      const data = await service.createFeeParticular(req.body, req.tenant);
      return res.status(201).json({
        status: 1,      
        data: data,
        message: "Fee particular is created successfully"
      });
    } catch (error) {
      next(error);
    }
  };

  export const getFeeParticulars = async (req, res: Response, next: NextFunction) => {
    try {
      const { program_id, academic_year_id, semester_id } = req.params;
      const data = await service.getFeeParticulars(program_id, academic_year_id, semester_id, req.tenant);
      return res.status(200).json({
        status: 1,      
        data: data,
        message: "Fee particulars are fetched successfully"
      });
    } catch (error) {
      next(error);
    }
  };