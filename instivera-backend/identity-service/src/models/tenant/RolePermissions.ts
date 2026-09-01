import { DataTypes, Model, ModelStatic, Optional, Sequelize } from "sequelize";

// =========================
// Attributes Interface
// =========================
interface RolePermissionAttributes {
  id: number;
  role_id: number;
  permission_id: number;
  created_at?: Date;
}

// =========================
// Creation Interface
// =========================
interface RolePermissionCreationAttributes
  extends Optional<RolePermissionAttributes, "id" | "created_at"> {}

// =========================
// Model Class
// =========================
export class RolePermission
  extends Model<RolePermissionAttributes, RolePermissionCreationAttributes>
  implements RolePermissionAttributes {

  public id!: number;
  public role_id!: number;
  public permission_id!: number;
  public created_at?: Date;
}

export function defineRolePermission(sequelize: Sequelize): ModelStatic<RolePermission> {
  const existingRolePermissionModel = sequelize.models.RolePermission as ModelStatic<RolePermission> | undefined;

  if (existingRolePermissionModel) {
    return existingRolePermissionModel;
  }

  return sequelize.define<RolePermission>(
    "RolePermission",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      role_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      permission_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "role_permissions",
      timestamps: false,
    }
  );
}

export default RolePermission;
