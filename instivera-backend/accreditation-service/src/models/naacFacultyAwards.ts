import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacFacultyAwardsAttributes {
  id: number;
  tenant_id: number ;
  faculty_id?: number | null;
  academic_year_id?: number | null;
  award_title: string;
  awarding_body?: string | null;
  award_type?: string | null;
  level?: string | null;
  award_date?: string | null;
  proof_url?: string | null;
  naac_metric_ref?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacFacultyAwardsCreationAttributes
  extends Optional<NaacFacultyAwardsAttributes, "id"> { }

class NaacFacultyAwards extends Model<
  NaacFacultyAwardsAttributes,
  NaacFacultyAwardsCreationAttributes
> {
  public id!: number;
  public tenant_id!: number ;

  static initModel(sequelize: Sequelize): typeof NaacFacultyAwards {
    NaacFacultyAwards.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        tenant_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          defaultValue: 1,
        },
        faculty_id: { type: DataTypes.BIGINT.UNSIGNED },
        academic_year_id: { type: DataTypes.BIGINT.UNSIGNED },
        award_title: { type: DataTypes.TEXT, allowNull: false },
        awarding_body: { type: DataTypes.TEXT },
        award_type: { type: DataTypes.STRING(50) },
        level: { type: DataTypes.STRING(30) },
        award_date: { type: DataTypes.DATEONLY },
        proof_url: { type: DataTypes.TEXT },
        naac_metric_ref: { type: DataTypes.STRING(20) },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      },
      {
        sequelize,
        tableName: "naac_faculty_awards",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacFacultyAwards;
  }
}

export default NaacFacultyAwards;