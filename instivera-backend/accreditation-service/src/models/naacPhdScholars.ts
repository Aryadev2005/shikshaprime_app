import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacPhdScholarsAttributes {
  id: number;
  faculty_id?: number | null;
  tenant_id: number ;
  academic_year_id?: number | null;
  scholar_name: string;
  registration_year?: number | null;
  award_year?: number | null;
  status?: string | null;
  thesis_title?: string | null;
  university?: string | null;
  naac_metric_ref?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacPhdScholarsCreationAttributes
  extends Optional<NaacPhdScholarsAttributes, "id"> {}

class NaacPhdScholars extends Model<
  NaacPhdScholarsAttributes,
  NaacPhdScholarsCreationAttributes
> {
  static initModel(sequelize: Sequelize): typeof NaacPhdScholars {
    NaacPhdScholars.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        faculty_id: { type: DataTypes.BIGINT.UNSIGNED },
        tenant_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          defaultValue: 1,
        },
        academic_year_id: { type: DataTypes.BIGINT.UNSIGNED },
        scholar_name: { type: DataTypes.TEXT, allowNull: false },
        registration_year: { type: DataTypes.INTEGER },
        award_year: { type: DataTypes.INTEGER },
        status: { type: DataTypes.STRING(20) },
        thesis_title: { type: DataTypes.TEXT },
        university: { type: DataTypes.TEXT },
        naac_metric_ref: { type: DataTypes.STRING(20) },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      },
      {
        sequelize,
        tableName: "naac_phd_scholars",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacPhdScholars;
  }
}

export default NaacPhdScholars;