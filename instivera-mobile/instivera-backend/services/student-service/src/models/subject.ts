import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface SubjectAttributes {
  id: number;
  department_id: number;
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface SubjectCreationAttributes extends Optional<SubjectAttributes, "id"> {}

class Subject extends Model<SubjectAttributes, SubjectCreationAttributes> implements SubjectAttributes {
  public id!: number;
  public department_id!: number;
  public name!: string;
  public code!: string;
  public description?: string;
  public is_active?: boolean;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineSubject(sequelize: Sequelize) {
  Subject.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      department_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      code: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      sequelize,
      tableName: "subjects",
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );
  return Subject;
}
