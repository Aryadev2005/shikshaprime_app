import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacDocumentAttributes {
  id: number;
  tenant_id: number ;
  title: string;
  description?: string | null;
  doc_type: string;
  file_path: string;
  file_size_kb?: number | null;
  file_format?: string | null;
  is_public: boolean;
  uploaded_by?: string | null;
  status: "SAVED" | "FINAL";
  is_deleted: boolean;
  academic_year_id?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacDocumentCreationAttributes
  extends Optional<
    NaacDocumentAttributes,
    | "id"
    | "description"
    | "file_size_kb"
    | "file_format"
    | "uploaded_by"
    | "academic_year_id"
    | "created_at"
    | "updated_at"
  > {}

class NaacDocument
  extends Model<NaacDocumentAttributes, NaacDocumentCreationAttributes>
  implements NaacDocumentAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public title!: string;
  public description?: string | null;
  public doc_type!: string;
  public file_path!: string;
  public file_size_kb?: number | null;
  public file_format?: string | null;
  public is_public!: boolean;
  public uploaded_by?: string | null;
  public status!: "SAVED" | "FINAL";
  public is_deleted!: boolean;
  public academic_year_id?: number | null;
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(sequelize: Sequelize): typeof NaacDocument {
    NaacDocument.init(
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
        title: {
          type: DataTypes.STRING(500),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        doc_type: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        file_path: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        file_size_kb: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        file_format: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        is_public: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        uploaded_by: {
          type: DataTypes.STRING(255),
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
        tableName: "naac_documents",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacDocument;
  }

  static associate(models: any) {
    NaacDocument.belongsTo(models.NaacAcademicYear, {
      foreignKey: "academic_year_id",
      as: "academicYear",
    });
  }
}

export default NaacDocument;
