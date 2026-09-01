import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacCommitteeAttributes {
  id: number;
  tenant_id: number ;
  committee_name: string;
  committee_type:
    | "IQAC"
    | "ICC"
    | "SC_ST_CELL"
    | "ANTI_RAGGING"
    | "GRIEVANCE_REDRESSAL"
    | "OTHER";
  description?: string | null;
  order_no?: string | null;
  order_date?: string | null;
  tenure_start_date?: string | null;
  tenure_end_date?: string | null;
  document_path?: string | null;
  status: "SAVED" | "FINAL";
  is_deleted: boolean;
  academic_year_id?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacCommitteeCreationAttributes
  extends Optional<
    NaacCommitteeAttributes,
    | "id"
    | "description"
    | "order_no"
    | "order_date"
    | "tenure_start_date"
    | "tenure_end_date"
    | "document_path"
    | "academic_year_id"
    | "created_at"
    | "updated_at"
  > {}

class NaacCommittee
  extends Model<NaacCommitteeAttributes, NaacCommitteeCreationAttributes>
  implements NaacCommitteeAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public committee_name!: string;
  public committee_type!:
    | "IQAC"
    | "ICC"
    | "SC_ST_CELL"
    | "ANTI_RAGGING"
    | "GRIEVANCE_REDRESSAL"
    | "OTHER";
  public description?: string | null;
  public order_no?: string | null;
  public order_date?: string | null;
  public tenure_start_date?: string | null;
  public tenure_end_date?: string | null;
  public document_path?: string | null;
  public status!: "SAVED" | "FINAL";
  public is_deleted!: boolean;
  public academic_year_id?: number | null;
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(sequelize: Sequelize): typeof NaacCommittee {
    NaacCommittee.init(
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
        committee_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        committee_type: {
          type: DataTypes.ENUM(
            "IQAC",
            "ICC",
            "SC_ST_CELL",
            "ANTI_RAGGING",
            "GRIEVANCE_REDRESSAL",
            "OTHER"
          ),
          allowNull: false,
          defaultValue: "OTHER",
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        order_no: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        order_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        tenure_start_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        tenure_end_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        document_path: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM("SAVED", "FINAL"),
          allowNull: false,
          defaultValue: "SAVED",
        },
        is_deleted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        academic_year_id: {
          type: DataTypes.BIGINT.UNSIGNED,
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
      },
      {
        sequelize,
        tableName: "naac_committees",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacCommittee;
  }

  static associate(models: any) {
    NaacCommittee.belongsTo(models.NaacAcademicYear, {
      foreignKey: "academic_year_id",
      as: "academicYear",
    });
  }
}

export default NaacCommittee;