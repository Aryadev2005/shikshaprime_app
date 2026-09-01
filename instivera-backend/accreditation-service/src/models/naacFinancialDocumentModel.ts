import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacFinancialDocumentAttributes {
  id: number;
  tenant_id: number ;
  academic_year_id?: number | null;
  doc_type?: string | null;
  title: string;
  file_url: string;
  naac_metric_ref?: string | null;
  status: 'SAVED' | 'FINAL';
  created_at?: Date;
  updated_at?: Date;
}

export interface NaacFinancialDocumentCreationAttributes
  extends Optional<
    NaacFinancialDocumentAttributes,
    | "id"
    | "academic_year_id"
    | "doc_type"
    | "naac_metric_ref"
    | "created_at"
    | "updated_at"
  > {}

class NaacFinancialDocument
  extends Model<
    NaacFinancialDocumentAttributes,
    NaacFinancialDocumentCreationAttributes
  >
  implements NaacFinancialDocumentAttributes
{
  public id!: number;
  public tenant_id!: number ;
  public academic_year_id?: number | null;
  public doc_type?: string | null;
  public title!: string;
  public file_url!: string;
  public naac_metric_ref?: string | null;
  public status!: 'SAVED' | 'FINAL';
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(
    sequelize: Sequelize
  ): typeof NaacFinancialDocument {
    NaacFinancialDocument.init(
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
          type: DataTypes.STRING(50),
          allowNull: true,
        },

        title: {
          type: DataTypes.TEXT,
          allowNull: false,
        },

        file_url: {
          type: DataTypes.TEXT,
          allowNull: false,
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
        tableName: "naac_financial_documents",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacFinancialDocument;
  }

  static associate(_models: any) {}
}

export default NaacFinancialDocument;