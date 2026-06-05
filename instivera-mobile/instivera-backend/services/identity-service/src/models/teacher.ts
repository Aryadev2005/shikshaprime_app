import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface TeacherAttributes {
  id: number;
  teacher_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department_id: number;
  designation: string;
  profile_picture?: string;
  employee_id: string;
  is_active: number;
  created_at?: Date;
  updated_at?: Date;
}

interface TeacherCreationAttributes extends Optional<TeacherAttributes, 'id'> {}

export class Teacher extends Model<TeacherAttributes, TeacherCreationAttributes>
  implements TeacherAttributes {
  public id!: number;
  public teacher_id!: string;
  public first_name!: string;
  public last_name!: string;
  public email!: string;
  public phone!: string;
  public department_id!: number;
  public designation!: string;
  public profile_picture?: string;
  public employee_id!: string;
  public is_active!: number;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineTeacher(sequelize: Sequelize): typeof Teacher {
  Teacher.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      teacher_id: {
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
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      designation: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      profile_picture: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      employee_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      is_active: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      tableName: 'teachers',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Teacher;
}
