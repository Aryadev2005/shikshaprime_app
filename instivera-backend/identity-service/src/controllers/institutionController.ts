import { Request, Response, NextFunction } from "express";
import { Tenant } from "../models/main/Tenants";
import { buildFrontendUrl, buildApiUrl } from "../utils/tenantUrlBuilder";

export const getActiveInstitutions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenants = await Tenant.findAll({
      where: { status: "active" },
      attributes: ["id", "name", "subdomain", "logo", "tagline", "city", "state", "address_line"]
    });

    const institutions = tenants.map((tenant) => {
      const t = tenant.toJSON();
      return {
        ...t,
        frontendUrl: buildFrontendUrl(t.subdomain, "/"),
        apiUrl: buildApiUrl(t.subdomain, "/")
      };
    });

    res.status(200).json({
      status: 1,
      data: institutions,
      message: "Institutions fetched successfully"
    });
  } catch (error) {
    next(error);
  }
};
