import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface ClassAttributes {
  id: number;
  code: string;
  name: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ClassCreationAttributes extends Optional<ClassAttributes, 'id'> {}

class Class extends Model<ClassAttributes, ClassCreationAttributes> implements ClassAttributes {
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
        type: DataTypes.BIGINT,
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
    },
    {
      sequelize,
      tableName: 'classes',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  return Class;
}
