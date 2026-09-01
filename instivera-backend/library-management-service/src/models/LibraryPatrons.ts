import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface LibraryPatronsAttributes {
  id: number;
  student_id: number;
  koha_patron_id: string;
  patron_type: "STUDENT" | "STAFF";
  is_active: number;
  remarks?: string | null;
  created_at?: Date;
  updated_at?: Date;
  is_deleted: number;
}

export interface LibraryPatronsCreationAttributes
  extends Optional<
    LibraryPatronsAttributes,
    "id" | "remarks" | "created_at" | "updated_at"
  > {}

export class LibraryPatrons
  extends Model<
    LibraryPatronsAttributes,
    LibraryPatronsCreationAttributes
  >
  implements LibraryPatronsAttributes
{
  public id!: number;
  public student_id!: number;
  public koha_patron_id!: string;
  public patron_type!: "STUDENT" | "STAFF";
  public is_active!: number;
  public remarks!: string | null;
  public created_at!: Date;
  public updated_at!: Date;
  public is_deleted!: number;
}

export function defineLibraryPatrons(sequelize: Sequelize) {
  class TenantLibraryPatrons extends LibraryPatrons {}
  
  TenantLibraryPatrons.init(
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
        allowNull: false,
        comment: "KOHA borrower/patron identifier",
      },
      patron_type: {
        type: DataTypes.ENUM("STUDENT", "STAFF"),
        allowNull: false,
        defaultValue: "STUDENT",
        comment: "Patron category type",
      },
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
        comment: "Indicates active mapping status",
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Additional mapping notes or comments",
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
        comment: "Soft delete flag",
      },
    },
    {
      sequelize,
      tableName: "library_patrons",
      modelName: "LibraryPatrons",
      timestamps: false,
      underscored: false,
    }
  );

  return TenantLibraryPatrons as typeof LibraryPatrons;
}