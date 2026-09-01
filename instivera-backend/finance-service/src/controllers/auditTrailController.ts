import { getTenantModels } from "../models";

export const getAuditLogs = async (req, res, next) => {
  try {
    const tenant = req.tenant;
    const models = getTenantModels(tenant);

    const { module, action, user, fromDate, toDate } = req.query;

    let where: any = {};

    if (module) where.entity = module;
    if (action) where.action = action;
    if (user) where.performed_by = user;

    if (fromDate) where.timestamp = { ...where.timestamp, $gte: new Date(fromDate) };
    if (toDate) where.timestamp = { ...where.timestamp, $lte: new Date(toDate) };

    const logs = await models.AuditTrail.findAll({
      order: [["timestamp", "DESC"]]
    });

    return res.json({
      status: 1,
      data: logs
    });

  } catch (error) {
    next(error);
  }
};
