import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacAlumniAttributes {
  id: number;
  tenant_id: number ;
  name: string;
  graduation_year?: number | null;
  program?: string | null;
  current_designation?: string | null;
  current_organization?: string | null;
  notable_achievement?: string | null;
  contribution_to_college?: string | null;
  photo_url?: string | null;
  proof_document_url?: string | null;
  naac_metric_ref?: string | null;
  status: 'SAVED' | 'FINAL';
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacAlumniCreationAttributes
  extends Optional<
    NaacAlumniAttributes,
    | "id"
    | "graduation_year"
    | "program"
    | "current_designation"
    | "current_organization"
    | "notable_achievement"
    | "contribution_to_college"
    | "photo_url"
    | "proof_document_url" 
    | "naac_metric_ref"
    | "status"
    | "created_at"
    | "updated_at"
  > {}

class NaacAlumni
  extends Model<
    NaacAlumniAttributes,
    NaacAlumniCreationAttributes
  >
  implements NaacAlumniAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public name!: string;
  public graduation_year?: number | null;
  public program?: string | null;
  public current_designation?: string | null;
  public current_organization?: string | null;
  public notable_achievement?: string | null;
  public contribution_to_college?: string | null;
  public photo_url?: string | null;
  public proof_document_url?: string | null;
  public naac_metric_ref?: string | null;
  public status!: 'SAVED' | 'FINAL';
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(sequelize: Sequelize): typeof NaacAlumni {
    NaacAlumni.init(
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
          type: DataTypes.TEXT,
          allowNull: false,
        },

        graduation_year: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        program: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },

        current_designation: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        current_organization: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        notable_achievement: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        contribution_to_college: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        photo_url: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        proof_document_url: {
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
        tableName: "naac_alumni",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacAlumni;
  }

  static associate(_models: any) {}
}

export default NaacAlumni;