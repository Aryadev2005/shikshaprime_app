import { NextFunction, Request, Response } from "express";
import { OnlinePaymentService } from "../services/onlinePaymentService";
import { getTenantSequelize } from "../server";
import { QueryTypes } from "sequelize";


  const service = new OnlinePaymentService();

  export const processOnlinePayment = async (req, res: Response, next: NextFunction) => {
      try {              
        const data = await service.processOnlinePayment(req.body.orderId, req.tenant);
        return res.status(200).json({
          status: 1,      
          data: data,
          message: "Online Payment processed successfully"
        });
      } catch (error) {
          next(error);
      }
    };
    export const processOnlineRegistrationPayment = async (req, res: Response, next: NextFunction) => {
      try {
        const data = await service.processRegistrationPayment(req.body.orderId, req.tenant);
        return res.status(200).json({
          status: 1,      
          data: data,
          message: "Registration Payment processed successfully"
        });
      } catch (error) {
          next(error);
      }
    };