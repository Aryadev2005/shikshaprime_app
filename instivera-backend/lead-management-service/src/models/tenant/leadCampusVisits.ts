import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface CampusVisitAttributes {
  id: number;
  lead_id: number;
  visit_date: string; // DATEONLY
  visit_time: string | null; // VARCHAR(20)
  parent_attending?: string | null;
  course_interest?: string | null;
  counselor_notes?: string | null;
  created_by?: number | null;
  created_at?: Date;
}

export interface CampusVisitCreationAttributes
  extends Optional<
    CampusVisitAttributes,
    | "id"
    | "visit_time"
    | "parent_attending"
    | "course_interest"
    | "counselor_notes"
    | "created_by"
    | "created_at"
  > {}

export class CampusVisit
  extends Model<CampusVisitAttributes, CampusVisitCreationAttributes>
  implements CampusVisitAttributes
{
  public id!: number;
  public lead_id!: number;
  public visit_date!: string;
  public visit_time!: string | null;
  public parent_attending!: string | null;
  public course_interest!: string | null;
  public counselor_notes!: string | null;
  public created_by!: number | null;
  public created_at!: Date;
}

export function defineCampusVisit(sequelize: Sequelize) {
  CampusVisit.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      lead_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      visit_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      visit_time: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      parent_attending: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      course_interest: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      counselor_notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      created_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: "lead_campus_visits",
      timestamps: false,
      underscored: true
    }
  );

  return CampusVisit;
}