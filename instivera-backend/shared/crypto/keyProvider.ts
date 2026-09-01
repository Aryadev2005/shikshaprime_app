export interface KeyProvider {
  getTenantKek(tenantId: string): Promise<string>;
  createTenantKek(tenantId: string): Promise<string>;
  rotateTenantKek(tenantId: string): Promise<void>;
}