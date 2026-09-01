import { logAudit } from "../utils/auditLogger";

export function auditTrail(action: string, entity: string) {
  return async (req, res, next) => {
    // Capture old value BEFORE controller runs
    req._audit_old = req._audit_old || null;

    // Wrap res.json to capture new value AFTER controller runs
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      try {
        await logAudit({
          action,
          entity,
          entityId: req._audit_entity_id || data?.id,
          performedBy: req.user?.id,
          oldValue: req._audit_old,
          newValue: data
        }, req.tenant);
      } catch (err) {
        console.error("Audit logging failed:", err);
      }

      return originalJson(data);
    };

    next();
  };
}