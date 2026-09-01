import {
  DataTypes,
  Model,
  Optional,
  Sequelize,
} from "sequelize";

export interface LearningMaterialAttributes {
  id: number;

  title: string;
  description?: string | null;

  department_id: number;
  program_id: number;
  academic_year_id: number;
  class_id: number;

  semester_id: number;

  subject_id: number;

  material_type?:
  | "notes"
  | "pdf"
  | "ppt"
  | "assignment"
  | "question-paper"
  | "syllabus"
  | "video"
  | "other";

  file_name: string;
  file_path: string;

  file_size?: number | null;
  mime_type?: string | null;

  uploaded_by: number;

  is_active?: boolean;

  created_at?: Date;
  updated_at?: Date;
}

export interface LearningMaterialCreationAttributes
  extends Optional<
    LearningMaterialAttributes,
    | "id"
    | "description"
    | "material_type"
    | "file_size"
    | "mime_type"
    | "is_active"
    | "created_at"
    | "updated_at"
  > { }

export class LearningMaterial
  extends Model<
    LearningMaterialAttributes,
    LearningMaterialCreationAttributes
  >
  implements LearningMaterialAttributes {
  public id!: number;

  public title!: string;
  public description?: string | null;

  public department_id!: number;
  public program_id!: number;
  public academic_year_id!: number;
  public class_id!: number;

  public semester_id!: number;

  public subject_id!: number;

  public material_type?:
    | "notes"
    | "pdf"
    | "ppt"
    | "assignment"
    | "question-paper"
    | "syllabus"
    | "video"
    | "other";

  public file_name!: string;
  public file_path!: string;

  public file_size?: number | null;
  public mime_type?: string | null;

  public uploaded_by!: number;

  public is_active?: boolean;

  public created_at?: Date;
  public updated_at?: Date;
}

export function defineLearningMaterial(sequelize: Sequelize): typeof LearningMaterial {
  LearningMaterial.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      department_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      program_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      academic_year_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      class_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      semester_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      subject_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      material_type: {
        type: DataTypes.ENUM(
          "notes",
          "pdf",
          "ppt",
          "assignment",
          "question-paper",
          "syllabus",
          "video",
          "other"
        ),
        allowNull: false,
        defaultValue: "pdf",
      },

      file_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      file_path: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },

      file_size: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },

      mime_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      uploaded_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      tableName: "learning_materials",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "idx_learning_material_filter",
          fields: [
            "department_id",
            "program_id",
            "academic_year_id",
            "class_id",
            "semester_id",
            "subject_id",
            "is_active",
          ],
        },
      ],
    }
  );

  return LearningMaterial;
}

export default LearningMaterial;
