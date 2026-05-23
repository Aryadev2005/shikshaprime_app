import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

// Define attributes interface
export interface ClassAttributes {
  id: number;
  code: string;
  name: string;
  created_at?: Date;
  updated_at?: Date;
}

// For creation, id is optional
export interface ClassCreationAttributes extends Optional<ClassAttributes, 'id'> {}

class Class extends Model<ClassAttributes, ClassCreationAttributes>
  implements ClassAttributes {
  public id!: number;
  public code!: string;
  public name!: string;
  public created_at?: Date;
  public updated_at?: Date;
}
export function defineClass(sequelize: Sequelize) {
  Class.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(128),
        allowNull: false,
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
      tableName: 'classes',
      timestamps: false, 
      underscored: true,
    }
  );
  return Class;
}