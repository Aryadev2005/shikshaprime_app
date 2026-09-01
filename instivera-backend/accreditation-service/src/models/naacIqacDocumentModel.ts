import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacIqacDocumentAttributes {
  id: number;
  tenant_id: number ;
  academic_year_id?: number | null;
  doc_type: string;
  title?: string | null;
  file_url: string;
  meeting_date?: Date | null;
  status: 'SAVED' | 'FINAL';
  uploaded_by?: number | null;
  created_at?: Date;
}

export interface NaacIqacDocumentCreationAttributes
  extends Optional<
    NaacIqacDocumentAttributes,
    | "id"
    | "academic_year_id"
    | "title"
    | "meeting_date"
    | "uploaded_by"
    | "created_at"
  > {}

class NaacIqacDocument
  extends Model<
    NaacIqacDocumentAttributes,
    NaacIqacDocumentCreationAttributes
  >
  implements NaacIqacDocumentAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public academic_year_id?: number | null;
  public doc_type!: string;
  public title?: string | null;
  public file_url!: string;
  public meeting_date?: Date | null;
  public status!: 'SAVED' | 'FINAL';
  public uploaded_by?: number | null;
  public created_at?: Date;

  static initModel(
    sequelize: Sequelize
  ): typeof NaacIqacDocument {
    NaacIqacDocument.init(
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

        doc_type: {
          type: DataTypes.STRING(30),
          allowNull: false,
        },

        title: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        file_url: {
          type: DataTypes.TEXT,
          allowNull: false,
        },

        meeting_date: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },

        status: {
          type: DataTypes.ENUM('SAVED', 'FINAL'),
          allowNull: false,
          defaultValue: 'SAVED',
        },

        uploaded_by: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },

        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "naac_iqac_documents",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacIqacDocument;
  }

  static associate(_models: any) {}
}

export default NaacIqacDocument;