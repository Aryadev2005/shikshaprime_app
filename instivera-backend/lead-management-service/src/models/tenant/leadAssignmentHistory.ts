import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface LeadAssignmentHistoryAttributes {
  id: number;
  lead_id: number;
  assigned_to: number;
  assigned_by?: number | null;
  assigned_at: Date;
}

export interface LeadAssignmentHistoryCreationAttributes
  extends Optional<
    LeadAssignmentHistoryAttributes,
    "id" | "assigned_by" | "assigned_at"
  > {}

export class LeadAssignmentHistory
  extends Model<
    LeadAssignmentHistoryAttributes,
    LeadAssignmentHistoryCreationAttributes
  >
  implements LeadAssignmentHistoryAttributes
{
  public id!: number;
  public lead_id!: number;
  public assigned_to!: number;
  public assigned_by!: number | null;
  public assigned_at!: Date;
}

export function defineLeadAssignmentHistory(sequelize: Sequelize) {
  LeadAssignmentHistory.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      lead_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      assigned_to: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      assigned_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },

      assigned_at: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "lead_assignment_history",
      timestamps: false,
      underscored: true,
    }
  );

  return LeadAssignmentHistory;
}