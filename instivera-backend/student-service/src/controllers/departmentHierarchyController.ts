
import { Request, Response, NextFunction } from "express";
import { getTenantModels } from "../models";

export const getMasterDepartments = async (req, res: Response, next: NextFunction) => {
          try {
                    const { Department } = getTenantModels(req.tenant);
                    const data = await Department.findAll({
                              where: { parent_id: null }
                    });

                    res.status(200).json({
                              status: 1,
                              data,
                              message: "Master departments fetched successfully"
                    });
          } catch (error) {
                    next(error);
          }
};

export const getChildDepartments = async (req, res: Response, next: NextFunction) => {
          try {
                    const { Department } = getTenantModels(req.tenant);
                    const { masterId } = req.params;
                    const data = await Department.findAll({
                              where: {
                                        parent_id: masterId,
                                        level: 2
                              }
                    });

                    res.status(200).json({
                              status: 1,
                              data,
                              message: "Child departments fetched successfully"
                    });
          } catch (error) {
                    next(error);
          }
};

export const getSubjects = async (req, res: Response, next: NextFunction) => {
          try {
                    const { Subject } = getTenantModels(req.tenant);
                    const { childId } = req.params;
                    const data = await Subject.findAll({
                              where: {
                                        department_id: childId,
                                        is_active: true
                              }
                    });

                    res.status(200).json({
                              status: 1,
                              data,
                              message: "Subjects fetched successfully"
                    });
          } catch (error) {
                    next(error);
          }
};