import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface StudentSubjectAttributes {
  id: number;
  student_id: number;
  semester_id: number;
  subject_id: number;
  is_core?: boolean;
  grade?: string;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface StudentSubjectCreationAttributes extends Optional<StudentSubjectAttributes, "id"> {}

class StudentSubject extends Model<StudentSubjectAttributes, StudentSubjectCreationAttributes> implements StudentSubjectAttributes {
  public id!: number;
  public student_id!: number;
  public semester_id!: number;
  public subject_id!: number;
  public is_core?: boolean;
  public grade?: string;
  public status?: string;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineStudentSubject(sequelize: Sequelize) {
  StudentSubject.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      student_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      semester_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      subject_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      is_core: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      grade: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: "student_subjects",
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );
  return StudentSubject;
}
