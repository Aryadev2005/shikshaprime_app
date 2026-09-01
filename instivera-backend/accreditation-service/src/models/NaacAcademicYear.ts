import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacAcademicYearAttributes {
  id: number;
  year_label: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at?: Date;
  current_year_unique?: number | null;
}

export interface NaacAcademicYearCreationAttributes
  extends Optional<
    NaacAcademicYearAttributes,
    "id" | "created_at" | "current_year_unique"
  > {}

class NaacAcademicYear
  extends Model<NaacAcademicYearAttributes, NaacAcademicYearCreationAttributes>
  implements NaacAcademicYearAttributes
{
  public id!: number;
  public year_label!: string;
  public start_date!: string;
  public end_date!: string;
  public is_current!: boolean;
  public created_at?: Date;
  public current_year_unique?: number | null;

  static initModel(sequelize: Sequelize): typeof NaacAcademicYear {
    NaacAcademicYear.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        year_label: {
          type: DataTypes.STRING(10),
          allowNull: false,
          unique: true,
        },
        start_date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        end_date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        is_current: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        current_year_unique: {
          type: DataTypes.TINYINT,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "naac_academic_years",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacAcademicYear;
  }

  static associate(models: any) {
    NaacAcademicYear.hasMany(models.NaacGoverningBody, {
      foreignKey: "academic_year_id",
      as: "naacGoverningBodyMembers",
    });

    NaacAcademicYear.hasMany(models.NaacCommittee, {
      foreignKey: "academic_year_id",
      as: "naacCommittees",
    });

    NaacAcademicYear.hasMany(models.NaacAccreditation, {
      foreignKey: "academic_year_id",
      as: "naacAccreditations",
    });

    NaacAcademicYear.hasMany(models.NaacDocument, {
      foreignKey: "academic_year_id",
      as: "naacDocuments",
    });
  }
}

export default NaacAcademicYear;