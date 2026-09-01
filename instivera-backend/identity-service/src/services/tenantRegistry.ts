import { Tenant } from "../models/main/Tenants";

export async function getAllTenants(): Promise<string[]> {
  const tenants = await Tenant.findAll({ attributes: ["subdomain"] });
  return tenants.map(t => t.subdomain);
}
