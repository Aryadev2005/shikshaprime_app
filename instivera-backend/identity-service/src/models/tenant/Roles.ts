// src/models/Role.ts
import { DataTypes, Model, ModelStatic, Optional, Sequelize } from "sequelize";

interface RoleAttributes {
  role_id: number;
  role_name: string;
  module_ids?: string | null;
  is_system_role?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface RoleCreationAttributes
  extends Optional<
    RoleAttributes,
    "role_id" | "module_ids" | "is_system_role" | "created_at" | "updated_at"
  > {}

export class Role
  extends Model<RoleAttributes, RoleCreationAttributes>
  implements RoleAttributes {

  public role_id!: number;
  public role_name!: string;
  public module_ids?: string | null;
  public is_system_role?: boolean;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineRole(sequelize: Sequelize): ModelStatic<Role> {
  const existingRoleModel = sequelize.models.Role as ModelStatic<Role> | undefined;

  if (existingRoleModel) {
    return existingRoleModel;
  }

  return sequelize.define<Role>(
    "Role",
    {
      role_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      role_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      module_ids: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_system_role: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "roles",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
}

export default Role;
