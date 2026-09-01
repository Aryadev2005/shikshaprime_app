import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

// Define attributes interface
export interface SubjectAttributes {
  id: number;
  code: string;
  name: string;
  description: string;
  is_active?: number;
  created_at?: Date;
  updated_at?: Date;
}

// For creation, id is optional
export interface SubjectCreationAttributes extends Optional<SubjectAttributes, 'id'> {}

class Subject extends Model<SubjectAttributes, SubjectCreationAttributes>
  implements SubjectAttributes {
  public id!: number;
  public code!: string;
  public name!: string;
  public description!: string;
  public is_active?: number;
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
      code: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
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
      tableName: 'subjects',
      timestamps: false,
      underscored: true,
    }
  );
  return Subject;
}