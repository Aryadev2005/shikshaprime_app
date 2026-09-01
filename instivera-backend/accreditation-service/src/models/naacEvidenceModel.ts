import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface NaacEvidenceAttributes {
  id: number;
  metric_id?: number | null;
  document_id?: number | null;
  academic_year_id?: number | null;
  notes?: string | null;
  sort_order?: number;
  created_at?: Date;
}

export interface NaacEvidenceCreationAttributes
  extends Optional<
    NaacEvidenceAttributes,
    | "id"
    | "metric_id"
    | "document_id"
    | "academic_year_id"
    | "notes"
    | "sort_order"
    | "created_at"
  > {}

class NaacEvidence
  extends Model<
    NaacEvidenceAttributes,
    NaacEvidenceCreationAttributes
  >
  implements NaacEvidenceAttributes
{
  public id!: number;
  public metric_id?: number | null;
  public document_id?: number | null;
  public academic_year_id?: number | null;
  public notes?: string | null;
  public sort_order?: number;
  public created_at?: Date;

  static initModel(
    sequelize: Sequelize
  ): typeof NaacEvidence {
    NaacEvidence.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },

        metric_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },

        document_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },

        academic_year_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },

        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        sort_order: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },

        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "naac_evidence",
        timestamps: false,
        underscored: true,
        indexes: [
          {
            name: "idx_evidence_metric",
            fields: ["metric_id"],
          },
          {
            name: "idx_evidence_year",
            fields: ["academic_year_id"],
          },
        ],
      }
    );

    return NaacEvidence;
  }

  static associate(models: any) {
    if (models.NaacDocument) {
      NaacEvidence.belongsTo(models.NaacDocument, {
        foreignKey: "document_id",
        as: "document",
      });
    }
  }
}

export default NaacEvidence;