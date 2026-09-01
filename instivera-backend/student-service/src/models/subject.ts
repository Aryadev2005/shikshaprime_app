import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface SubjectAttributes {
  id: number;
  department_id: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface SubjectCreationAttributes extends Optional<SubjectAttributes, "id" | "is_active"> { }

export class Subject extends Model<SubjectAttributes, SubjectCreationAttributes>
  implements SubjectAttributes {
  public id!: number;
  public department_id!: number;
  public name!: string;
  public code!: string;
  public description!: string;
  public is_active!: boolean;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineSubject(sequelize: Sequelize): typeof Subject {
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
      },
      description: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      tableName: "subjects",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
      indexes: [
        { fields: ["department_id"] },
      ]
    }
  );
  return Subject;
}

export default Subject;