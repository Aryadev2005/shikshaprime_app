import { DataTypes, Model, Optional, Sequelize } from 'sequelize';


// Define attributes interface
export interface TeacherAttributes {
  id: number;
  user_id?: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  designation?: string;
  department_id?: number;
  qualification?: string;
  experience_years?: number;
  phone?: string;
  email?: string;
  emergency_contact?: string;
  address?: string;
  date_of_birth?: Date;
  date_of_joining?: Date;
  is_active?: number;
  created_at?: Date;
  updated_at?: Date;
}

// For creation, id is optional
export interface TeacherCreationAttributes extends Optional<TeacherAttributes, 'id'> {}

class Teacher extends Model<TeacherAttributes, TeacherCreationAttributes>
  implements TeacherAttributes {
  public id!: number;
  public user_id?: number;
  public employee_id!: string;
  public first_name!: string;
  public last_name!: string;
  public designation?: string;
  public department_id?: number;
  public qualification?: string;
  public experience_years?: number;
  public phone?: string;
  public email?: string;
  public emergency_contact?: string;
  public address?: string;
  public date_of_birth?: Date;
  public date_of_joining?: Date;
  public is_active?: number;
  public created_at?: Date;
  public updated_at?: Date;
}
export function defineTeacher(sequelize: Sequelize) {
  Teacher.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      employee_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      designation: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      department_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      qualification: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      experience_years: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      emergency_contact: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      date_of_joining: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 1,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'teachers',
      timestamps: false, // since created_at and updated_at are managed manually
      underscored: true,
    }
  );
  return Teacher;
}