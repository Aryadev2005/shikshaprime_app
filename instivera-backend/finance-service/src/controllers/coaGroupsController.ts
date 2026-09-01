import { Next } from "mysql2/typings/mysql/lib/parsers/typeCast";
import { getTenantModels } from "../models";
import { NextFunction } from "express";
import { getTenantSequelize } from "../server";
import { QueryTypes } from "sequelize";

export const createChartOfAccountGroup = async (req, res, next: NextFunction) => {
  try {
    const tenant = req.tenant;
    const models = getTenantModels(tenant);

    const { financial_year, name, parent_group_id, root_type, is_system } = req.body;

    if (!financial_year || !name || !root_type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user: any = await getTenantSequelize(req.tenant).query(
          `SELECT user_id
          FROM users 
          WHERE email = :email LIMIT 1`,
          {
            replacements: { email: req.user.email },
            type: QueryTypes.SELECT
          }
        );
    console.log(user[0].user_id);

    const coa = await models.ChartOfAccountGroup.create({
      name,
      financial_year,
      parent_group_id,
      root_type,
      is_system: is_system ?? 0,
      created_by: user[0].user_id,
      created_at: new Date(),
      updated_at: new Date(),
      is_deleted: 0
    });    
    return res.status(201).json({
        status: 1,      
        data: coa,
        message: "Chart Of Account created successfully"
    });

  } catch (error) {
      next(error);
  }
};

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