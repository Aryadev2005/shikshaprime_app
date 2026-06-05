import { getTenantSequelize } from '../server';
import { defineNotice } from './notice';

export function getTenantModels(tenant: string) {
  const sequelize = getTenantSequelize(tenant);
  const Notice = defineNotice(sequelize);
  return { Notice };
}
