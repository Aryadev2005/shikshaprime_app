import { KohaSettingKeys } from "../constants/koha";
import { logger } from "../logs/logger";
import { getTenantModels } from "../models";
import { ApiError } from "../utils/ApiError";
import { decrypt } from "../utils/encryption";

class KohaSettingsService {
  private tenantSettings = new Map<string, Map<string, string>>();

  async refresh(tenant?: string): Promise<void> {
    if (!tenant) {
      return;
    }

    const { KohaSettings } = getTenantModels(tenant);
    const rows = await KohaSettings.findAll({ where: { is_active: 1, is_deleted: 0 } });

    const settings = new Map<string, string>();
    for (const row of rows) {
      try {
        const value = row.is_encrypted ? decrypt(row.setting_value || "") : row.setting_value || "";
        settings.set(row.setting_key, value);
      } catch (error) {
        throw new ApiError(
          500,
          `Unable to decrypt setting ${row.setting_key}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }
    }

    this.tenantSettings.set(tenant, settings);
    this.validateRequiredSettings(tenant);
  }

  async get(tenant: string, key: KohaSettingKeys | string): Promise<string> {
    if (!tenant) {
      throw new ApiError(400, "Tenant key is required");
    }

    let settings = this.tenantSettings.get(tenant);
    if (!settings) {
      await this.refresh(tenant);
      settings = this.tenantSettings.get(tenant);
    }

    if (!settings) {
      throw new ApiError(500, `Failed to load settings for tenant ${tenant}`);
    }

    const value = settings.get(key);
    if (value === undefined) {
      throw new ApiError(500, `Missing setting ${key} in koha_settings for tenant ${tenant}`);
    }

    return value;
  }

  async getOptional(tenant: string, key: KohaSettingKeys | string): Promise<string | undefined> {
    if (!tenant) {
      throw new ApiError(400, "Tenant key is required");
    }

    let settings = this.tenantSettings.get(tenant);
    if (!settings) {
      await this.refresh(tenant);
      settings = this.tenantSettings.get(tenant);
    }

    if (!settings) {
      return undefined;
    }

    return settings.get(key);
  }

  async getNumber(tenant: string, key: KohaSettingKeys | string): Promise<number> {
    return Number(await this.get(tenant, key));
  }

  async getBoolean(tenant: string, key: KohaSettingKeys | string): Promise<boolean> {
    const value = await this.get(tenant, key);
    return value.toLowerCase() === "true" || value === "1";
  }

  validateRequiredSettings(tenant: string): void {
    const settings = this.tenantSettings.get(tenant);
    if (!settings) {
      return;
    }

    const requiredAlways = [
      KohaSettingKeys.KOHA_BASE_URL,
      KohaSettingKeys.KOHA_TIMEOUT_MS,
      KohaSettingKeys.KOHA_RETRY_COUNT,
    ];

    const missing: string[] = [];
    for (const key of requiredAlways) {
      if (!settings.get(key)) {
        missing.push(key);
      }
    }

    const hasApiKey = !!settings.get(KohaSettingKeys.KOHA_API_KEY);
    const hasBasicCreds =
      !!settings.get(KohaSettingKeys.KOHA_USERNAME) && !!settings.get(KohaSettingKeys.KOHA_PASSWORD);

    if (!hasApiKey && !hasBasicCreds) {
      missing.push("KOHA_API_KEY or (KOHA_USERNAME + KOHA_PASSWORD)");
    }

    if (missing.length > 0) {
      logger.warn(
        { tenant, missing },
        "Missing recommended Koha settings in koha_settings table",
      );
    }
  }
}

export const kohaSettingsService = new KohaSettingsService();