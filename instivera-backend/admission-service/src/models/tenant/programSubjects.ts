import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface ProgramSubjectAttributes {
  id: number;
  program_id: number;
  subject_id: number;
  semester_id: number;
  course_type_id: number;
  elective_group: string;
  is_core: boolean;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface ProgramSubjectCreationAttributes
  extends Optional<
    ProgramSubjectAttributes,
    "id" | "is_core" | "is_active" | "created_at" | "updated_at"
  > {}

export class ProgramSubjects
  extends Model<ProgramSubjectAttributes, ProgramSubjectCreationAttributes>
  implements ProgramSubjectAttributes
{
  public id!: number;
  public program_id!: number;
  public subject_id!: number;
  public semester_id!: number;
  public course_type_id!: number;
  public is_core!: boolean;
  public is_active!: boolean;
  public elective_group!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export function defineProgramSubjects(sequelize: Sequelize) {
  ProgramSubjects.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      program_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      subject_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      semester_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      course_type_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      elective_group: {
        type: DataTypes.STRING(),
        allowNull: true
      },
      is_core: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: false,
        defaultValue: 0
      },
      is_active: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: false,
        defaultValue: 1
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        )
      }
    },
    {
      sequelize,
      tableName: "program_subjects",
      timestamps: false,
      underscored: true
    }
  );

  return ProgramSubjects;
}