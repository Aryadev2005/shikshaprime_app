import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface DepartmentAttributes {
  id: number;
  parent_id?: number;
  name: string;
  code: string;
  level?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, "id"> {}

export class Department extends Model<DepartmentAttributes, DepartmentCreationAttributes> implements DepartmentAttributes {
  public id!: number;
  public parent_id?: number;
  public name!: string;
  public code!: string;
  public level?: number;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineDepartment(sequelize: Sequelize) {
  Department.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      parent_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      name: {
        type: DataTypes.STRING(128),
        allowNull: false
      },
      code: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true
      },
      level: {
        type: DataTypes.TINYINT,
        allowNull: true
      },
    },
    {
      sequelize,
      tableName: "departments",
      timestamps: false,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );
  return Department;
}