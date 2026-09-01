import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface LibraryClearanceLogsAttributes {
  id: number;
  student_id: number;
  koha_patron_id?: string | null;
  has_pending_books: number;
  pending_books_count: number;
  pending_fine_amount: number;
  is_clear: number;
  checked_at?: Date;
  context:
    | "RESULT_PUBLISH"
    | "ADMIT_CARD"
    | "GRADUATION"
    | "MANUAL_CHECK"
    | "OTHER";
  checked_by?: number | null;
  remarks?: string | null;
  created_at?: Date;
  updated_at?: Date;
  is_deleted: number;
}

export interface LibraryClearanceLogsCreationAttributes
  extends Optional<
    LibraryClearanceLogsAttributes,
    | "id"
    | "koha_patron_id"
    | "checked_by"
    | "remarks"
    | "checked_at"
    | "created_at"
    | "updated_at"
  > {}

export class LibraryClearanceLogs
  extends Model<
    LibraryClearanceLogsAttributes,
    LibraryClearanceLogsCreationAttributes
  >
  implements LibraryClearanceLogsAttributes
{
  public id!: number;
  public student_id!: number;
  public koha_patron_id!: string | null;
  public has_pending_books!: number;
  public pending_books_count!: number;
  public pending_fine_amount!: number;
  public is_clear!: number;
  public checked_at!: Date;

  public context!:
    | "RESULT_PUBLISH"
    | "ADMIT_CARD"
    | "GRADUATION"
    | "MANUAL_CHECK"
    | "OTHER";

  public checked_by!: number | null;
  public remarks!: string | null;
  public created_at!: Date;
  public updated_at!: Date;
  public is_deleted!: number;
}

export function defineLibraryClearanceLogs(sequelize: Sequelize) {
  class TenantLibraryClearanceLogs extends LibraryClearanceLogs {}
  
  TenantLibraryClearanceLogs.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      student_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment: "ERP student reference",
      },
      koha_patron_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "KOHA patron reference at check time",
      },
      has_pending_books: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      pending_books_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      pending_fine_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      is_clear: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
      },
      checked_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      context: {
        type: DataTypes.ENUM(
          "RESULT_PUBLISH",
          "ADMIT_CARD",
          "GRADUATION",
          "MANUAL_CHECK",
          "OTHER"
        ),
        allowNull: false,
        defaultValue: "OTHER",
      },
      checked_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      is_deleted: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      tableName: "library_clearance_logs",
      modelName: "LibraryClearanceLogs",
      timestamps: false,
      underscored: false,
    }
  );

  return TenantLibraryClearanceLogs as typeof LibraryClearanceLogs;
}