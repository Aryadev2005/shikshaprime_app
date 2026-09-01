import { getTenantModels } from "../models";

export class InventorySettingsService {
    async loadSettings(tenant: string) {
        const models = getTenantModels(tenant);
        const settings: Record<string, any> = {};
        const rows: any = await models.InventorySettings.findAll();
        for (const row of rows) {
            let value: any = row.setting_value;

            switch (row.data_type) {
            case 'INTEGER':
                value = parseInt(value, 10);
                break;
            case 'DECIMAL':
                value = parseFloat(value);
                break;
            case 'BOOLEAN':
                value = value === 'true';
                break;
            case 'STRING':
            default:
                break;
            }
            settings[row.setting_key] = value;
        }
        return settings;
    }
}