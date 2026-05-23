// src/models/User.ts
import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface UserAttributes {
  user_id: number;
  username: string;
  email?: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  role: string;
  user_type?: string;
  tenant_id?: number;
  is_active?: number;
  access_code?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'user_id'> {}

export class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  public user_id!: number;
  public username!: string;
  public email?: string;
  public password_hash!: string;
  public first_name?: string;
  public last_name?: string;
  public role!: string;
  public user_type?: string;
  public tenant_id?: number;
  public is_active?: number;
  public access_code?: string;
  public created_at?: Date;
  public updated_at?: Date;
}

// Factory function to bind model to a specific Sequelize instance
export function defineUser(sequelize: Sequelize) {
  User.init(
    {
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      user_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
      },
      access_code: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'users',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return User;
}