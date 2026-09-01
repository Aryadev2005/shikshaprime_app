class TenantService {
    private mainModels: any;

    // Inject main DB models from each microservice
    init(mainModels: any) {
        this.mainModels = mainModels;
    }
    async getTenantByName(tenantName: string): Promise<any> {
        const tenant = await this.mainModels.Tenant.findOne({
            where: { name: tenantName }
        });

        if (!tenant) {
            throw new Error(`Invalid tenant: ${tenantName}`);
        }

        return tenant;
    }
}
export const tenantsService = new TenantService();