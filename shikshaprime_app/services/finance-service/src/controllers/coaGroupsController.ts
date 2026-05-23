import { Next } from "mysql2/typings/mysql/lib/parsers/typeCast";
import { getTenantModels } from "../models";
import { NextFunction } from "express";

export const listCoaGroups = async (req, res, next: NextFunction) => {
  try {
    const tenant = req.tenant;
    const models = getTenantModels(tenant);

    const groups = await models.ChartOfAccountGroup.findAll({
      include: [
        { model: models.ChartOfAccountGroup, as: "parent" }
      ],
      order: [["id", "ASC"]]
    });

    return res.status(200).json({
        status: 1,      
        data: groups,
        message: "Chart Of account Groups fetched successfully"
    });
  } catch (error) {
      next(error);
  }
};
export const getCoaTree = async (req, res, next: NextFunction) => {
  try {
    const tenant = req.tenant;
    const models = getTenantModels(tenant);

    const groups = await models.ChartOfAccountGroup.findAll({
      include: [
        {
          model: models.ChartOfAccountGroup,
          as: "children",
          include: [
            {
              model: models.ChartOfAccountGroup,
              as: "children"
            }
          ]
        }
      ],
      where: { parent_group_id: null }
    });

    return res.status(200).json({
        status: 1,      
        data: groups,
        message: "COA Group tree fetched successfully"
    });

  } catch (error) {
      next(error);
  }
};