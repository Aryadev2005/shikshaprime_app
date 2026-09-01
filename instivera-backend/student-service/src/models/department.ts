import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { sequelize } from ".";

interface DepartmentAttributes {
  id: number;
  parent_id?: number;
  name: string;
  code: string;
  level?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, "id"> { }

class Department extends Model<DepartmentAttributes, DepartmentCreationAttributes> implements DepartmentAttributes {
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
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      parent_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
      },
      name: {
        type: DataTypes.STRING(128),
        allowNull: false
      },
      code: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      level: {
        type: DataTypes.TINYINT,
        allowNull: true
      },
    },
    {
      sequelize,
      tableName: "departments",
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ["parent_id"] },
        { fields: ["code"] }
      ]
    }
  );
  return Department;
}