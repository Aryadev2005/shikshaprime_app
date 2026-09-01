import { Sequelize } from "sequelize";
import { config } from "../config";
import { getTenantSequelize } from "../server";

// Import all model classes
import { InventoryLocations } from "./InventoryLocations";
import { InventoryVendors } from "./InventoryVendors";
import { InventoryCategories } from "./InventoryCategories";
import { InventoryDepartments } from "./InventoryDepartments";
import { InventoryAssets } from "./InventoryAssets";
import { InventoryDepreciationLogs } from "./InventoryDepreciationLogs";
import { InventoryProcurementRequests } from "./InventoryProcurementRequests";
import { InventoryProcurementItems } from "./InventoryProcurementItems";
import { InventoryVerifications } from "./InventoryVerifications";
import { InventoryActivities } from "./InventoryActivities";
import { InventorySettings } from "./InventorySettings";
import { InventoryCategoryLedgerMapping } from "./InventoryCategoryLedgerMapping";

// Export model classes (optional)
export {
  InventoryLocations,
  InventoryVendors,
  InventoryCategories,
  InventoryDepartments,
  InventoryAssets,
  InventoryDepreciationLogs,
  InventoryProcurementRequests,
  InventoryProcurementItems,
  InventoryVerifications,
  InventoryActivities
};

// Global system DB (non‑tenant)
export const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.pass,
  {
    host: config.db.host,
    port: Number(config.db.port),
    dialect: "mysql",
    logging: false,
  }
);

// Test global connection
export async function testConnection(): Promise<boolean> {
  try {
    await sequelize.authenticate();
    console.log("Global DB connected");
    return true;
  } catch (err) {
    console.error("Global DB connection failed:", err);
    return false;
  }
}

// All tenant models in one array for easy iteration
const tenantModelList = [
  InventoryLocations,
  InventoryVendors,
  InventoryCategories,
  InventoryDepartments,
  InventoryAssets,
  InventoryDepreciationLogs,
  InventoryProcurementRequests,
  InventoryProcurementItems,
  InventoryVerifications,
  InventoryActivities,
  InventorySettings,
  InventoryCategoryLedgerMapping
];

// Multi‑tenant model loader
export function getTenantModels(tenant: string) {
  const tenantSequelize = getTenantSequelize(tenant);

  // Initialize models only once per tenant
  if (Object.keys(tenantSequelize.models).length === 0) {
    tenantModelList.forEach((model) => model.initModel(tenantSequelize));    
    
    // Setup Associations
    const { InventoryAssets, InventoryVerifications, InventoryProcurementRequests, InventoryProcurementItems } = tenantSequelize.models as any;
    if (InventoryAssets && InventoryVerifications) {
      InventoryAssets.hasOne(InventoryVerifications, { foreignKey: 'asset_id', as: 'verification' });
      InventoryVerifications.belongsTo(InventoryAssets, { foreignKey: 'asset_id', as: 'asset' });
    }
    if (InventoryProcurementRequests && InventoryProcurementItems) {
      InventoryProcurementRequests.hasMany(InventoryProcurementItems, { foreignKey: 'procurement_request_id', as: 'items' });
      InventoryProcurementItems.belongsTo(InventoryProcurementRequests, { foreignKey: 'procurement_request_id', as: 'request' });
    }
  }

  console.log("Registered models:", Object.keys(tenantSequelize.models));

  return tenantSequelize.models;
}