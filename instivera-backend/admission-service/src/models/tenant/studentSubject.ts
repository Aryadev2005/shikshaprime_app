import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface StudentSubjectAttributes {
  id: number;
  user_id: number;
  student_id?: number | null;
  semester_id: number;
  course_type_id: number;
  subject_id: number;

  is_core: boolean;
  assigned_by?: string | null;

  status?: string | null; // ENROLLED | PASSED | FAILED | BACKLOG | DROPPED
  is_active: boolean;

  created_at: Date;
  updated_at: Date;
}

export interface StudentSubjectCreationAttributes
  extends Optional<
    StudentSubjectAttributes,
    | "id"
    | "assigned_by"
    | "status"
    | "created_at"
    | "updated_at"
  > {}

export class StudentSubject
  extends Model<StudentSubjectAttributes, StudentSubjectCreationAttributes>
  implements StudentSubjectAttributes
{
  public id!: number;
  public user_id!: number;
  public student_id!: number | null;
  public semester_id!: number;
  public course_type_id!: number;
  public subject_id!: number;

  public is_core!: boolean;
  public assigned_by!: string | null;

  public status!: string | null;
  public is_active!: boolean;

  public created_at!: Date;
  public updated_at!: Date;
}

export function defineStudentSubject(sequelize: Sequelize) {
    StudentSubject.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        user_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false
        },
        student_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true
        },
        semester_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false
        },
        course_type_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false
        },
        subject_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false
        },
        is_core: {
          type: DataTypes.TINYINT({ length: 1 }),
          allowNull: false,
          defaultValue: 0
        },
        assigned_by: {
          type: DataTypes.STRING(10),
          allowNull: true
        },
        status: {
          type: DataTypes.STRING(50),
          allowNull: true,
          comment: "ENROLLED, PASSED, FAILED, BACKLOG, DROPPED"
        },
        is_active: {
          type: DataTypes.TINYINT({ length: 1 }),
          allowNull: false,
          defaultValue: 1
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
        }
      },
      {
        sequelize,
        tableName: "student_subjects",
        timestamps: false,
        underscored: true
      }
    );

    return StudentSubject;
  }