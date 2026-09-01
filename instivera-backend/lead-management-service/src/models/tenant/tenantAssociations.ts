export function applyTenantAssociations(models: any) {
  const {
    LeadMaster,
    LeadFollowup,
    LeadCommunication,
    LeadConversion,
    LeadCampusVisit,
    LeadCampaign,
    LeadScoringRule,
    LeadAssignmentRule,
    AiLeadPrediction,
    User
  } = models;

  /* -----------------------------------------
     LeadMaster → LeadFollowups (1:M)
  ------------------------------------------ */
  LeadMaster.hasMany(LeadFollowup, {
    foreignKey: "lead_id",
    as: "followups",
    onDelete: "CASCADE"
  });
  LeadFollowup.belongsTo(LeadMaster, {
    foreignKey: "lead_id",
    as: "lead"
  });

  /* -----------------------------------------
     LeadMaster → LeadCommunication (1:M)
  ------------------------------------------ */
  LeadMaster.hasMany(LeadCommunication, {
    foreignKey: "lead_id",
    as: "communications",
    onDelete: "CASCADE"
  });
  LeadCommunication.belongsTo(LeadMaster, {
    foreignKey: "lead_id",
    as: "lead"
  });
  LeadMaster.hasMany(LeadCampusVisit, {
    foreignKey: "lead_id",
    as: "visits",
    onDelete: "CASCADE"
  });
  LeadCampusVisit.belongsTo(LeadMaster, { foreignKey: "lead_id" });

  /* -----------------------------------------
     LeadMaster → LeadConversion (1:1)
  ------------------------------------------ */
  LeadMaster.hasOne(LeadConversion, {
    foreignKey: "lead_id",
    as: "conversion",
    onDelete: "CASCADE"
  });
  LeadConversion.belongsTo(LeadMaster, {
    foreignKey: "lead_id",
    as: "lead"
  });

  /* -----------------------------------------
     LeadMaster → AiLeadPrediction (1:1)
  ------------------------------------------ */
  LeadMaster.hasOne(AiLeadPrediction, {
    foreignKey: "lead_id",
    as: "ai_prediction",
    onDelete: "CASCADE"
  });
  AiLeadPrediction.belongsTo(LeadMaster, {
    foreignKey: "lead_id",
    as: "lead"
  });

  /* -----------------------------------------
     LeadCampaign (Standalone)
     LeadScoringRule (Standalone)
     LeadAssignmentRule (Standalone)
  ------------------------------------------ */
  // No associations required for these tables

  LeadMaster.belongsTo(User, { as: "assigned_user", foreignKey: "assigned_to" });
}
