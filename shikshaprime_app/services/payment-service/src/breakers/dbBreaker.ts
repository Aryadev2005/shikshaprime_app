import CircuitBreaker from "opossum";
import { getTenantSequelize } from "../server";

const tenantBreakers: Record<string, CircuitBreaker> = {};

export function getTenantBreaker(tenant: string) {
  if (!tenantBreakers[tenant]) {
    const sequelize = getTenantSequelize(tenant);
    const breaker = new CircuitBreaker(
      async () => {
        await sequelize.authenticate(); // test tenant DB connection
        return true;
      },
      {
        timeout: 3000,
        errorThresholdPercentage: 50,
        resetTimeout: 10000,
      }
    );
    breaker.fallback(() => false);
    tenantBreakers[tenant] = breaker;
  }
  return tenantBreakers[tenant];
}