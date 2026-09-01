import { NextFunction } from "express";
import { ReportsService } from "../services/reportService";

const service = new ReportsService();
export const getDayBook = async (req, res, next: NextFunction) => {
    console.log("get Day book-------");
    try {
      const date = req.query.date as string;
      const data = await service.getDayBook(date, req.tenant);
      return res.status(200).json({
        status: 1,      
        data: data,
        message: "Daybook fetched successfully"
      });
    } catch (error) {
        next(error);
    }
};
export const getLedgerStatement = async (req, res, next: NextFunction) => {
    try {
      const ledger_id = Number(req.query.ledger_id);
      const from = req.query.from as string;
      const to = req.query.to as string;
      const data = await service.getLedgerStatement(ledger_id, from, to, req.tenant);
      return res.status(200).json({
        status: 1,      
        data: data,
        message: "Ledger statement fetched successfully"
      });
    } catch (error) {
        next(error);
    }
};
export const getTrialBalance = async (req, res, next: NextFunction) => {
    try {
      const date = req.query.date as string;
      const data = await service.getTrialBalance(date, req.tenant);
      return res.status(200).json({
        status: 1,      
        data: data,
        message: "Trial Balance fetched successfully"
      });
    } catch (error) {
        next(error);
    }
};
export const getIncomeExpenditure = async (req, res, next: NextFunction) => {
    try {
      const from = req.query.from as string;
      const to = req.query.to as string;
      const data = await service.getIncomeExpenditure(from, to, req.tenant);
      return res.status(200).json({
        status: 1,      
        data: data,
        message: "Income expenditure fetched successfully"
      });
    } catch (error) {
        next(error);
    }
};
export const getBalanceSheet = async (req, res, next: NextFunction) => {
    try {
      const date = req.query.date as string;
      const data = await service.getBalanceSheet(date, req.tenant);
      return res.status(200).json({
        status: 1,      
        data: data,
        message: "Balancesheet fetched successfully"
      });
    } catch (error) {
        next(error);
    }
};
export const getCashBook = async (req, res, next: NextFunction) => {
    try {
      const date = req.query.date as string;
      const data = await service.getCashBook(date, req.tenant);
      return res.status(200).json({
        status: 1,      
        data: data,
        message: "CashBook fetched successfully"
      });
    } catch (error) {
        next(error);
    }
};
export const getBankBook = async (req, res, next: NextFunction) => {
    try {
      const bankAccountId = req.query.bankAccountId;
      const date = req.query.date as string;
      const data = await service.getBankBook(bankAccountId, date, req.tenant);
      return res.status(200).json({
        status: 1,      
        data: data,
        message: "BankBook fetched successfully"
      });
    } catch (error) {
        next(error);
    }
};