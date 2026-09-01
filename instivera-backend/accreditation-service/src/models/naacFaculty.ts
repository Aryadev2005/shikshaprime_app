import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacFacultyAttributes {
  id: number;
  tenant_id: number ;
  employee_code?: string | null;
  name: string;
  photo_url?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  date_of_joining?: string | null;
  designation: string;
  designation_rank?: number | null;
  department: string;
  qualification?: string | null;
  ug_degree?: string | null;
  pg_degree?: string | null;
  phd_awarded?: boolean | null;
  phd_year?: number | null;
  phd_university?: string | null;
  experience_years?: number | null;
  industry_exp_years?: number | null;
  specialization?: string | null;
  email?: string | null;
  phone?: string | null;
  google_scholar_url?: string | null;
  orcid_id?: string | null;
  scopus_id?: string | null;
  web_of_science_id?: string | null;
  h_index?: number | null;
  i10_index?: number | null;
  is_active?: boolean | null;
  employment_type?: string | null;
  naac_metric_ref?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacFacultyCreationAttributes
  extends Optional<NaacFacultyAttributes, "id"> {}

class NaacFaculty
  extends Model<NaacFacultyAttributes, NaacFacultyCreationAttributes>
  implements NaacFacultyAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public employee_code?: string | null;
  public name!: string;
  public photo_url?: string | null;
  public gender?: string | null;
  public date_of_birth?: string | null;
  public date_of_joining?: string | null;
  public designation!: string;
  public designation_rank?: number | null;
  public department!: string;
  public qualification?: string | null;
  public ug_degree?: string | null;
  public pg_degree?: string | null;
  public phd_awarded?: boolean | null;
  public phd_year?: number | null;
  public phd_university?: string | null;
  public experience_years?: number | null;
  public industry_exp_years?: number | null;
  public specialization?: string | null;
  public email?: string | null;
  public phone?: string | null;
  public google_scholar_url?: string | null;
  public orcid_id?: string | null;
  public scopus_id?: string | null;
  public web_of_science_id?: string | null;
  public h_index?: number | null;
  public i10_index?: number | null;
  public is_active?: boolean | null;
  public employment_type?: string | null;
  public naac_metric_ref?: string | null;
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(sequelize: Sequelize): typeof NaacFaculty {
    NaacFaculty.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        tenant_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          defaultValue: 1,
        },
        employee_code: { type: DataTypes.STRING(50), unique: true },
        name: { type: DataTypes.TEXT, allowNull: false },
        photo_url: { type: DataTypes.TEXT, allowNull: true },
        gender: { type: DataTypes.STRING(10), allowNull: true },
        date_of_birth: { type: DataTypes.DATEONLY, allowNull: true },
        date_of_joining: { type: DataTypes.DATEONLY, allowNull: true },
        designation: { type: DataTypes.STRING(100), allowNull: false },
        designation_rank: { type: DataTypes.INTEGER, allowNull: true },
        department: { type: DataTypes.STRING(100), allowNull: false },
        qualification: { type: DataTypes.TEXT, allowNull: true },
        ug_degree: { type: DataTypes.STRING(100), allowNull: true },
        pg_degree: { type: DataTypes.STRING(100), allowNull: true },
        phd_awarded: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
        phd_year: { type: DataTypes.INTEGER, allowNull: true },
        phd_university: { type: DataTypes.TEXT, allowNull: true },
        experience_years: { type: DataTypes.INTEGER, allowNull: true },
        industry_exp_years: { type: DataTypes.INTEGER, allowNull: true },
        specialization: { type: DataTypes.TEXT, allowNull: true },
        email: { type: DataTypes.STRING(150), allowNull: true },
        phone: { type: DataTypes.STRING(20), allowNull: true },
        google_scholar_url: { type: DataTypes.TEXT, allowNull: true },
        orcid_id: { type: DataTypes.STRING(30), allowNull: true },
        scopus_id: { type: DataTypes.STRING(30), allowNull: true },
        web_of_science_id: { type: DataTypes.STRING(30), allowNull: true },
        h_index: { type: DataTypes.INTEGER, allowNull: true },
        i10_index: { type: DataTypes.INTEGER, allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
        employment_type: { type: DataTypes.STRING(30), allowNull: true },
        naac_metric_ref: { type: DataTypes.STRING(20) },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      },
      {
        sequelize,
        tableName: "naac_faculty",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacFaculty;
  }

  static associate(models: any) {
    NaacFaculty.hasMany(models.NaacPublications, {
      foreignKey: "faculty_id",
      as: "publications",
    });
  }
}

export default NaacFaculty;
