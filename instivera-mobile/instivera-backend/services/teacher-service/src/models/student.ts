import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface StudentAttributes {
  id: number;
  user_id?: number;
  student_id: string;
  roll_number?: string;
  student_name?: string;
  class_id?: number;
  department_id?: number;
  email?: string;
  mobile?: string;
  status?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface StudentCreationAttributes extends Optional<StudentAttributes, 'id'> {}

class Student extends Model<StudentAttributes, StudentCreationAttributes> implements StudentAttributes {
  public id!: number;
  public user_id?: number;
  public student_id!: string;
  public roll_number?: string;
  public student_name?: string;
  public class_id?: number;
  public department_id?: number;
  public email?: string;
  public mobile?: string;
  public status?: number;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineStudent(sequelize: Sequelize) {
  Student.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      student_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      roll_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      student_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      class_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      department_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      mobile: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      status: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      tableName: 'students',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  return Student;
}
