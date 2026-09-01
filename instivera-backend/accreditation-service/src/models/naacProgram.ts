import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacProgramAttributes {
  id: number;
  tenant_id: number ;
  program_name: string;
  short_name?: string | null;
  level: "UG" | "PG" | "Diploma" | "Certificate" | "PhD";
  department?: string | null;
  duration_years?: number | null;
  intake?: number | null;
  fee_per_year?: number | null;
  affiliation_status?: string | null;
  naac_metric_reference?: string | null;
  is_active: boolean;
  eligibility?: string | null;
  status: "SAVED" | "FINAL";
  academic_year_id?: number | null;
  is_deleted: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacProgramCreationAttributes
  extends Optional<
    NaacProgramAttributes,
    | "id"
    | "short_name"
    | "department"
    | "duration_years"
    | "intake"
    | "fee_per_year"
    | "affiliation_status"
    | "naac_metric_reference"
    | "eligibility"
    | "academic_year_id"
    | "is_deleted"
    | "created_at"
    | "updated_at"
  > {}

class NaacProgram
  extends Model<NaacProgramAttributes, NaacProgramCreationAttributes>
  implements NaacProgramAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public program_name!: string;
  public short_name?: string | null;
  public level!: "UG" | "PG" | "Diploma" | "Certificate" | "PhD";
  public department?: string | null;
  public duration_years?: number | null;
  public intake?: number | null;
  public fee_per_year?: number | null;
  public affiliation_status?: string | null;
  public naac_metric_reference?: string | null;
  public is_active!: boolean;
  public eligibility?: string | null;
  public status!: "SAVED" | "FINAL";
  public academic_year_id?: number | null;
  public is_deleted!: boolean;
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(sequelize: Sequelize): typeof NaacProgram {
    NaacProgram.init(
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
        program_name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        short_name: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        level: {
          type: DataTypes.ENUM("UG", "PG", "Diploma", "Certificate", "PhD"),
          allowNull: false,
        },
        department: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        duration_years: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        intake: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        fee_per_year: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },
        affiliation_status: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        naac_metric_reference: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        eligibility: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM("SAVED", "FINAL"),
          allowNull: false,
          defaultValue: "SAVED",
        },
        academic_year_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        is_deleted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
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
        tableName: "naac_programs",
        timestamps: false, // 👈 matches your existing pattern
        underscored: true,
      }
    );

    return NaacProgram;
  }

  static associate(_models: any) {}
}

export default NaacProgram;