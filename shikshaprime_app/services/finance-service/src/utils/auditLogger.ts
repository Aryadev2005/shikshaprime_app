import { getTenantModels } from "../models";

interface AuditLogInput {
  action: string;
  entity: string;
  entityId: number | string;
  performedBy: number | string;
  oldValue?: any;
  newValue?: any;
}

export async function logAudit({
  action,
  entity,
  entityId,
  performedBy,
  oldValue = null,
  newValue = null
}: AuditLogInput, tenant: string) {
  try {
    const models = getTenantModels(tenant);
    await models.AuditTrail.create({
      action,
      entity,
      entity_id: Number(entityId),
      performed_by: Number(performedBy),
      old_value: oldValue ? JSON.stringify(oldValue) : null,
      new_value: newValue ? JSON.stringify(newValue) : null,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("AUDIT LOGGING FAILED:", error);    
  }
}
