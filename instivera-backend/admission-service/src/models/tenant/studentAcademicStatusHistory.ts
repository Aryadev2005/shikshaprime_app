import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface StudentAcademicStatusHistoryAttributes {
  id: number;
  student_id: number;
  program_id: number;
  class_id: number;
  semester_id: number;
  academic_year_id: number;

  status: "ADMITTED" | "PROMOTED_FYUGP" | "PROMOTED" | "RE_ADMITTED" | "EXITED_FYUGP" | 
          "RE_ADMISSION_PENDING" | "RE_ADMISSION_CONFIRMED" | "NOT_PROMOTED" | "COMPLETED";
  remarks?: string | null;

  created_at?: Date | null;
}

export interface StudentAcademicStatusHistoryCreationAttributes
  extends Optional<
    StudentAcademicStatusHistoryAttributes,
    "id" | "remarks" | "created_at"
  > {}

export class StudentAcademicStatusHistory
  extends Model<
    StudentAcademicStatusHistoryAttributes,
    StudentAcademicStatusHistoryCreationAttributes
  >
  implements StudentAcademicStatusHistoryAttributes
{
  public id!: number;
  public student_id!: number;
  public program_id!: number;
  public class_id!: number;
  public semester_id!: number;
  public academic_year_id!: number;

  public status!: "ADMITTED" | "PROMOTED_FYUGP" | "PROMOTED" | "RE_ADMITTED" | "EXITED_FYUGP" 
  | "RE_ADMISSION_PENDING" | "RE_ADMISSION_CONFIRMED" | "NOT_PROMOTED" | "COMPLETED";
  public remarks!: string | null;

  public readonly created_at!: Date | null;
}

export function defineStudentAcademicStatusHistory(sequelize: Sequelize) {
  StudentAcademicStatusHistory.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      student_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      program_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      class_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      semester_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      academic_year_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM("ADMITTED", "PROMOTED_FYUGP", "PROMOTED", "RE_ADMITTED", 
          "EXITED_FYUGP", "RE_ADMISSION_PENDING", "RE_ADMISSION_CONFIRMED", "NOT_PROMOTED", "COMPLETED"),
        allowNull: false
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: "student_academic_status_history",
      modelName: "StudentAcademicStatusHistory",
      timestamps: false,
      underscored: true
    }
  );

  return StudentAcademicStatusHistory;
}