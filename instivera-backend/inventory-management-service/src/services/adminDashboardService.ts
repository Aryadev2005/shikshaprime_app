import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";
import { Op } from "sequelize";

export class AdminDashboardService {
      static async getDashboardData(tenant: string) {
            const models = getTenantModels(tenant);
            const sequelize = getTenantSequelize(tenant);
            
            const totalAssetsCount = await models.InventoryAssets.count();
            const totalAssetValueResult = await models.InventoryAssets.sum('purchase_cost');
            const totalAssetValue = totalAssetValueResult || 0;
            const underMaintenanceCount = await models.InventoryVerifications.count({ where: { status: 'Maintenance' } });
            const pendingRequestsCount = await models.InventoryProcurementRequests.count({ where: { status: 'Pending' } });
            
            // Calculate Pending GRN (Approved requests waiting for completion)
            const pendingGRNCount = await models.InventoryProcurementRequests.count({ where: { status: 'Approved' } });
            
            // Calculate Warranty Expiring (within next 30 days)
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            
            const warrantyExpiringCount = await models.InventoryAssets.count({ 
                  where: { 
                        warranty_expiry: { 
                              [Op.between]: [new Date(), thirtyDaysFromNow] 
                        } 
                  } 
            });

            // Calculate Consumable Value
            const [consumableResults] = await sequelize.query(`
                  SELECT SUM(a.purchase_cost) as consumableValueResult
                  FROM inventory_assets a
                  JOIN inventory_categories c ON a.category_id = c.id
                  WHERE c.name LIKE '%Consumable%'
            `) as [any[], unknown];
            const consumableValue = consumableResults[0]?.consumableValueResult || 0;


            const [categoriesData] = await sequelize.query(`
                  SELECT c.name as label, COUNT(a.id) as value
                  FROM inventory_categories c
                  LEFT JOIN inventory_assets a ON a.category_id = c.id
                  GROUP BY c.id, c.name
            `);

            const [departmentsData] = await sequelize.query(`
                  SELECT d.name as label, COUNT(a.id) as value
                  FROM inventory_departments d
                  LEFT JOIN inventory_assets a ON a.inventory_department_id = d.id
                  GROUP BY d.id, d.name
            `);

            const [procurementData] = await sequelize.query(`
                  SELECT status as label, COUNT(id) as value
                  FROM inventory_procurement_requests
                  GROUP BY status
            `);
            
            return {
                  stats: {
                        totalAssets: totalAssetsCount,
                        totalAssetValue: totalAssetValue,
                        lowStockItems: 0, // Requires minimum stock tracking implementation
                        underMaintenance: underMaintenanceCount,
                        consumableValue: consumableValue,
                        pendingRequests: pendingRequestsCount,
                        pendingGRN: pendingGRNCount,
                        warrantyExpiring: warrantyExpiringCount,
                  },
                  charts: {
                        assetsByCategory: categoriesData,
                        departmentDistribution: departmentsData,
                        procurementStatus: procurementData,
                        deliveryPerformance: []
                  }
            };
      }
}
