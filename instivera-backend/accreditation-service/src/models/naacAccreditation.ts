import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacAccreditationAttributes {
  id: number;
  tenant_id: number ;
  accreditation_type:
    | "UNIVERSITY_AFFILIATION"
    | "NAAC"
    | "NIRF"
    | "AICTE"
    | "MCI"
    | "BCI"
    | "UGC_2F"
    | "UGC_12B"
    | "OTHER";
  authority_name: string;
  affiliation_number?: string | null;
  naac_grade?: string | null;
  naac_cgpa?: string | null;
  nirf_rank?: number | null;
  nirf_year?: number | null;
  approval_status?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  remarks?: string | null;
  evidence_document_path?: string | null;
  status: "SAVED" | "FINAL";
  is_deleted: boolean;
  academic_year_id?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacAccreditationCreationAttributes
  extends Optional<
    NaacAccreditationAttributes,
    | "id"
    | "affiliation_number"
    | "naac_grade"
    | "naac_cgpa"
    | "nirf_rank"
    | "nirf_year"
    | "approval_status"
    | "valid_from"
    | "valid_to"
    | "remarks"
    | "evidence_document_path"
    | "academic_year_id"
    | "created_at"
    | "updated_at"
  > {}

class NaacAccreditation
  extends Model<NaacAccreditationAttributes, NaacAccreditationCreationAttributes>
  implements NaacAccreditationAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public accreditation_type!:
    | "UNIVERSITY_AFFILIATION"
    | "NAAC"
    | "NIRF"
    | "AICTE"
    | "MCI"
    | "BCI"
    | "UGC_2F"
    | "UGC_12B"
    | "OTHER";
  public authority_name!: string;
  public affiliation_number?: string | null;
  public naac_grade?: string | null;
  public naac_cgpa?: string | null;
  public nirf_rank?: number | null;
  public nirf_year?: number | null;
  public approval_status?: string | null;
  public valid_from?: string | null;
  public valid_to?: string | null;
  public remarks?: string | null;
  public evidence_document_path?: string | null;
  public status!: "SAVED" | "FINAL";
  public is_deleted!: boolean;
  public academic_year_id?: number | null;
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(sequelize: Sequelize): typeof NaacAccreditation {
    NaacAccreditation.init(
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
        accreditation_type: {
          type: DataTypes.ENUM(
            "UNIVERSITY_AFFILIATION",
            "NAAC",
            "NIRF",
            "AICTE",
            "MCI",
            "BCI",
            "UGC_2F",
            "UGC_12B",
            "OTHER"
          ),
          allowNull: false,
        },
        authority_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        affiliation_number: {
          type: DataTypes.STRING(150),
          allowNull: true,
        },
        naac_grade: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        naac_cgpa: {
          type: DataTypes.DECIMAL(4, 2),
          allowNull: true,
        },
        nirf_rank: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        nirf_year: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        approval_status: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        valid_from: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        valid_to: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        remarks: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        evidence_document_path: {
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
        tableName: "naac_accreditations",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacAccreditation;
  }

  static associate(models: any) {
    NaacAccreditation.belongsTo(models.NaacAcademicYear, {
      foreignKey: "academic_year_id",
      as: "academicYear",
    });
  }
}

export default NaacAccreditation;