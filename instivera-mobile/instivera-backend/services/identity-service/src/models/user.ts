import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  user_type: string;
  user_code: string;
  is_active: number;
  created_at?: Date;
  updated_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public password_hash!: string;
  public role!: string;
  public user_type!: string;
  public user_code!: string;
  public is_active!: number;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineUser(sequelize: Sequelize): typeof User {
  User.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('admin', 'teacher', 'student'),
        allowNull: false,
      },
      user_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      user_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      is_active: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
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
