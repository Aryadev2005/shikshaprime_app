import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

// Define attributes
export interface DepartmentAttributes {
  id: number;
  parent_id?: number | null;
  code: string;
  name: string;
  level?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

// Define creation attributes (id, timestamps auto-generated)
export interface DepartmentCreationAttributes
  extends Optional<DepartmentAttributes, "id" | "parent_id" | "level" | "created_at" | "updated_at"> {}

export class Department
  extends Model<DepartmentAttributes, DepartmentCreationAttributes>
  implements DepartmentAttributes {
  public id!: number;
  public parent_id!: number | null;
  public code!: string;
  public name!: string;
  public level!: number | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export function defineDepartment(sequelize: Sequelize) {
  Department.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        parent_id: {
          type: DataTypes.BIGINT,
          allowNull: true,
        },
        code: {
          type: DataTypes.STRING(64),
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING(128),
          allowNull: false,
        },
        level: {
          type: DataTypes.TINYINT,
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
        tableName: "departments",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
      }
    );
    return Department;
}