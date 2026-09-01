import {
  DataTypes,
  Model,
  Optional,
  Sequelize,
} from "sequelize";

export interface NaacDocsAttributes {
  id: number;

  tenant_id: number ;

  academic_year_id?: number | null;

  title: string;

  description?: string | null;

  doc_type:
    | "PDF"
    | "IMAGE"
    | "DOC"
    | "EXCEL"
    | "OTHER";

  documents?: any[] | null;

  is_public: boolean;

  uploaded_by: string;

  status: "SAVED" | "FINAL";

  is_deleted: boolean;

  created_at?: Date;

  updated_at?: Date;
}

export interface NaacDocsCreationAttributes
  extends Optional<
    NaacDocsAttributes,
    | "id"
    | "academic_year_id"
    | "description"
    | "documents"
    | "created_at"
    | "updated_at"
  > {}

class NaacDocs
  extends Model<
    NaacDocsAttributes,
    NaacDocsCreationAttributes
  >
  implements NaacDocsAttributes
{
  public id!: number;

  public tenant_id!: number ;

  public academic_year_id?: number | null;

  public title!: string;

  public description?: string | null;

  public doc_type!:
    | "PDF"
    | "IMAGE"
    | "DOC"
    | "EXCEL"
    | "OTHER";

  public documents?: any[] | null;

  public is_public!: boolean;

  public uploaded_by!: string;

  public status!: "SAVED" | "FINAL";

  public is_deleted!: boolean;

  public created_at?: Date;

  public updated_at?: Date;

  static initModel(
    sequelize: Sequelize
  ): typeof NaacDocs {
    NaacDocs.init(
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

        title: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },

        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        doc_type: {
          type: DataTypes.ENUM(
            "PDF",
            "IMAGE",
            "DOC",
            "EXCEL",
            "OTHER"
          ),
          allowNull: false,
          defaultValue: "PDF",
        },

        documents: {
          type: DataTypes.JSON,
          allowNull: true,
        },

        is_public: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },

        uploaded_by: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },

        status: {
          type: DataTypes.ENUM(
            "SAVED",
            "FINAL"
          ),
          allowNull: false,
          defaultValue: "SAVED",
        },

        is_deleted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },

        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },

        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "naac_docs",
        timestamps: false,
        underscored: true,
      }
    );

    return NaacDocs;
  }

  static associate(models: any) {
    NaacDocs.belongsTo(
      models.NaacAcademicYear,
      {
        foreignKey: "academic_year_id",
        as: "academicYear",
      }
    );
  }
}

export default NaacDocs;