import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacGoverningBodyAttributes {
  id: number;
  tenant_id: number ;
  academic_year_id?: number | null;
  member_name: string;
  designation: string;
  category?: string | null;
  appointment_date?: string | null;
  tenure_end_date?: string | null;
  qualification?: string | null;
  status: "SAVED" | "FINAL";
  photo_url?: string | null;
  sort_order: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacGoverningBodyCreationAttributes
  extends Optional<
    NaacGoverningBodyAttributes,
    | "id"
    | "academic_year_id"
    | "category"
    | "appointment_date"
    | "tenure_end_date"
    | "qualification"
    | "photo_url"
    | "sort_order"
    | "created_at"
    | "updated_at"
  > {}

class NaacGoverningBody
  extends Model<NaacGoverningBodyAttributes, NaacGoverningBodyCreationAttributes>
  implements NaacGoverningBodyAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public academic_year_id?: number | null;
  public member_name!: string;
  public designation!: string;
  public category?: string | null;
  public appointment_date?: string | null;
  public tenure_end_date?: string | null;
  public qualification?: string | null;
  public status!: "SAVED" | "FINAL";
  public photo_url?: string | null;
  public sort_order!: number;
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(sequelize: Sequelize): typeof NaacGoverningBody {
    NaacGoverningBody.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        tenant_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          defaultValue: 1,
        },
        academic_year_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        member_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        designation: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        category: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        appointment_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        tenure_end_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        qualification: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM("SAVED", "FINAL"),
          allowNull: false,
          defaultValue: "SAVED",
        },
        photo_url: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        sort_order: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
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
      },
      {
        sequelize,
        tableName: "naac_governing_body",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacGoverningBody;
  }

  static associate(models: any) {
    NaacGoverningBody.belongsTo(models.NaacAcademicYear, {
      foreignKey: "academic_year_id",
      as: "academicYear",
    });
  }
}

export default NaacGoverningBody;