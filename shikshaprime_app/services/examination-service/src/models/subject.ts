
import { DataTypes, Model, Optional, Sequelize } from "sequelize";

// Define attributes interface
interface SubjectAttributes {
  id: number;
  department_id: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// For creation, id is optional
interface SubjectCreationAttributes extends Optional<SubjectAttributes, "id"> {}

export class Subject extends Model<SubjectAttributes, SubjectCreationAttributes>
  implements SubjectAttributes {
  public id!: number;
  public department_id!: number;
  public name!: string;
  public code!: string;
  public description?: string;
  public is_active!: boolean;
  public created_at?: Date;
  public updated_at?: Date;
}
export function defineSubject(sequelize: Sequelize) {
  Subject.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      department_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      }
    },
    {
      sequelize,
      tableName: "subjects",
      timestamps: false,      
    }
  );
  return Subject;
}