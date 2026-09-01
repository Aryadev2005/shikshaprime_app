import { DataTypes, Model, ModelStatic, Optional, Sequelize } from "sequelize";

// =========================
// Attributes Interface
// =========================
interface PermissionAttributes {
  permission_id: number;
  module_id: number;
  permission_key: string;
  permission_name: string;
  created_at?: Date;
}

// =========================
// Creation Interface
// =========================
interface PermissionCreationAttributes
  extends Optional<PermissionAttributes, "permission_id" | "created_at"> {}

// =========================
// Model Class
// =========================
export class Permission
  extends Model<PermissionAttributes, PermissionCreationAttributes>
  implements PermissionAttributes {

  public permission_id!: number;
  public module_id!: number;
  public permission_key!: string;
  public permission_name!: string;
  public created_at?: Date;
}

export function definePermission(sequelize: Sequelize): ModelStatic<Permission> {
  const existingPermissionModel = sequelize.models.Permission as ModelStatic<Permission> | undefined;

  if (existingPermissionModel) {
    return existingPermissionModel;
  }

  return sequelize.define<Permission>(
    "Permission",
    {
      permission_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      module_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      permission_key: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      permission_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "permissions",
      timestamps: false,
    }
  );
}

export default Permission;
