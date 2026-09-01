import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacStudentSupportAttributes {
  id: number;
  tenant_id: number ;
  academic_year_id?: number | null;
  scheme_name: string;
  scheme_type?: string | null;
  provider?: string | null;
  beneficiary_count?: number | null;
  amount_per_student?: number | null;
  total_amount_disbursed?: number | null;
  description?: string | null;
  naac_metric_ref?: string | null;
  status: 'SAVED' | 'FINAL';
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacStudentSupportCreationAttributes
  extends Optional<
    NaacStudentSupportAttributes,
    | "id"
    | "academic_year_id"
    | "scheme_type"
    | "provider"
    | "beneficiary_count"
    | "amount_per_student"
    | "total_amount_disbursed"
    | "description"
    | "naac_metric_ref"
    | "status"
    | "created_at"
    | "updated_at"
  > {}

class NaacStudentSupport
  extends Model<
    NaacStudentSupportAttributes,
    NaacStudentSupportCreationAttributes
  >
  implements NaacStudentSupportAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public academic_year_id?: number | null;
  public scheme_name!: string;
  public scheme_type?: string | null;
  public provider?: string | null;
  public beneficiary_count?: number | null;
  public amount_per_student?: number | null;
  public total_amount_disbursed?: number | null;
  public description?: string | null;
  public naac_metric_ref?: string | null;
  public status!: 'SAVED' | 'FINAL';
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(sequelize: Sequelize): typeof NaacStudentSupport {
    NaacStudentSupport.init(
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

        scheme_name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },

        scheme_type: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },

        provider: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },

        beneficiary_count: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        amount_per_student: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },

        total_amount_disbursed: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: true,
        },

        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        naac_metric_ref: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },

        status: {
          type: DataTypes.ENUM('SAVED', 'FINAL'),
          allowNull: false,
          defaultValue: 'SAVED',
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
        tableName: "naac_student_support",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacStudentSupport;
  }

  static associate(_models: any) {}
}


export default NaacStudentSupport;