import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface StudentAttributes {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  class_id: number;
  program_id: number;
  roll_number: string;
  profile_picture?: string;
  is_active: number;
  created_at?: Date;
  updated_at?: Date;
}

interface StudentCreationAttributes extends Optional<StudentAttributes, 'id'> {}

export class Student extends Model<StudentAttributes, StudentCreationAttributes>
  implements StudentAttributes {
  public id!: number;
  public student_id!: string;
  public first_name!: string;
  public last_name!: string;
  public email!: string;
  public phone!: string;
  public class_id!: number;
  public program_id!: number;
  public roll_number!: string;
  public profile_picture?: string;
  public is_active!: number;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineStudent(sequelize: Sequelize): typeof Student {
  Student.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      class_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      program_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      roll_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      profile_picture: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      is_active: {
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
