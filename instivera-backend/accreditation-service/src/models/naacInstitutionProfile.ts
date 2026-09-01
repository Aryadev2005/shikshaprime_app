import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacInstitutionProfileAttributes {
  id: number;
  tenant_id: number ;
  name: string;
  short_name?: string | null;
  logo_url?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  website_url?: string | null;
  year_established?: number | null;
  university_affiliation?: string | null;
  affiliation_number?: string | null;
  naac_grade?: string | null;
  naac_cgpa?: string | null;
  naac_cycle?: number | null;
  naac_last_visit_date?: string | null;
  ugc_2f_status: boolean;
  ugc_12b_status: boolean;
  vision?: string | null;
  mission?: string | null;
  history?: string | null;
  org_chart_path?: string | null;
  status: "SAVED" | "FINAL";
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacInstitutionProfileCreationAttributes
  extends Optional<
    NaacInstitutionProfileAttributes,
    | "id"
    | "short_name"
    | "logo_url"
    | "address"
    | "city"
    | "state"
    | "pincode"
    | "phone"
    | "email"
    | "website_url"
    | "year_established"
    | "university_affiliation"
    | "affiliation_number"
    | "naac_grade"
    | "naac_cgpa"
    | "naac_cycle"
    | "naac_last_visit_date"
    | "vision"
    | "mission"
    | "history"
    | "org_chart_path"
    | "created_at"
    | "updated_at"
  > {}

class NaacInstitutionProfile
  extends Model<NaacInstitutionProfileAttributes, NaacInstitutionProfileCreationAttributes>
  implements NaacInstitutionProfileAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public name!: string;
  public short_name?: string | null;
  public logo_url?: string | null;
  public address?: string | null;
  public city?: string | null;
  public state?: string | null;
  public pincode?: string | null;
  public phone?: string | null;
  public email?: string | null;
  public website_url?: string | null;
  public year_established?: number | null;
  public university_affiliation?: string | null;
  public affiliation_number?: string | null;
  public naac_grade?: string | null;
  public naac_cgpa?: string | null;
  public naac_cycle?: number | null;
  public naac_last_visit_date?: string | null;
  public ugc_2f_status!: boolean;
  public ugc_12b_status!: boolean;
  public vision?: string | null;
  public mission?: string | null;
  public history?: string | null;
  public org_chart_path?: string | null;
  public status!: "SAVED" | "FINAL";
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(sequelize: Sequelize): typeof NaacInstitutionProfile {
    NaacInstitutionProfile.init(
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
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        short_name: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        logo_url: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        city: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        state: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        pincode: {
          type: DataTypes.STRING(10),
          allowNull: true,
        },
        phone: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING(150),
          allowNull: true,
        },
        website_url: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        year_established: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        university_affiliation: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        affiliation_number: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        naac_grade: {
          type: DataTypes.STRING(10),
          allowNull: true,
        },
        naac_cgpa: {
          type: DataTypes.DECIMAL(4, 2),
          allowNull: true,
        },
        naac_cycle: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        naac_last_visit_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        ugc_2f_status: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        ugc_12b_status: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        vision: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        mission: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        history: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        org_chart_path: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM("SAVED", "FINAL"),
          allowNull: false,
          defaultValue: "SAVED",
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
        tableName: "naac_institution_profile",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacInstitutionProfile;
  }

  // No associations needed — tenant_id is a plain string, no FK
  static associate(_models: any) {}
}

export default NaacInstitutionProfile;
