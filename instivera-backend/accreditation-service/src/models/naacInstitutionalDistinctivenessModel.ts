import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacInstitutionalDistinctivenessAttributes {
  id: number;
  tenant_id: number ;
  academic_year_id?: number | null;
  title: string;
  description?: string | null;
  naac_metric_ref?: string | null;
  status: 'SAVED' | 'FINAL';
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacInstitutionalDistinctivenessCreationAttributes
  extends Optional<
    NaacInstitutionalDistinctivenessAttributes,
    | "id"
    | "academic_year_id"
    | "description"
    | "naac_metric_ref"
    | "created_at"
    | "updated_at"
  > {}

class NaacInstitutionalDistinctiveness
  extends Model<
    NaacInstitutionalDistinctivenessAttributes,
    NaacInstitutionalDistinctivenessCreationAttributes
  >
  implements NaacInstitutionalDistinctivenessAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public academic_year_id?: number | null;
  public title!: string;
  public description?: string | null;
  public naac_metric_ref?: string | null;
  public status!: 'SAVED' | 'FINAL';
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(
    sequelize: Sequelize
  ): typeof NaacInstitutionalDistinctiveness {
    NaacInstitutionalDistinctiveness.init(
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

        title: {
          type: DataTypes.TEXT,
          allowNull: false,
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
        tableName: "naac_institutional_distinctiveness",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacInstitutionalDistinctiveness;
  }

  static associate(_models: any) {}
}

export default NaacInstitutionalDistinctiveness;