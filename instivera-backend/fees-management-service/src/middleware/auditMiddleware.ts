import { logAudit } from "../utils/auditLogger";

export function auditTrail(action: string, entity: string) {
  return async (req, res, next) => {
    console.log("audit Trailing called.......");

    const oldValue = req._audit_old || null;

    // DO NOT override res.json
    // DO NOT intercept response
    // DO NOT modify headers

    res.on("finish", async () => {
      try {
        await logAudit(
          {
            action,
            entity,
            entityId: req._audit_entity_id || null,
            performedBy: req.user?.id,
            oldValue,
            newValue: null
          },
          req.tenant
        );
      } catch (err) {
        console.error("Audit logging failed:", err);
      }
    });

    next();
  };
}