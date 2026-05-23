import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { sequelize } from ".";

// Define attributes interface
interface StudentSubjectAttributes {
  id: number;
  student_id: number;
  semester_id: number;
  subject_id: number;
  is_core: boolean;
  grade?: string;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
}

// For creation, id is optional
interface StudentSubjectCreationAttributes extends Optional<StudentSubjectAttributes, "id"> {}

class StudentSubject extends Model<StudentSubjectAttributes, StudentSubjectCreationAttributes>
  implements StudentSubjectAttributes {
  public id!: number;
  public student_id!: number;
  public semester_id!: number;
  public subject_id!: number;
  public is_core!: boolean;
  public grade?: string;
  public status?: string;
  public created_at?: Date;
  public updated_at?: Date;
}
export function defineStudentSubject(sequelize: Sequelize) {
  StudentSubject.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
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
      is_core: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      grade: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
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
      tableName: "student_subjects",
      timestamps: false, // you already manage created_at/updated_at manually
      underscored: true,
    }
  );
  return StudentSubject;
}