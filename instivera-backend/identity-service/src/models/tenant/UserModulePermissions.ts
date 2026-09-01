import {
  DataTypes,
  Model,
  ModelStatic,
  Optional,
  Sequelize,
} from "sequelize";

interface UserModulePermissionAttributes {
  id: number;
  user_id?: number | null;
  role_id?: number | null;
  module_id?: number | null;
  can_view?: boolean;
  can_edit?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface UserModulePermissionCreationAttributes
  extends Optional<
    UserModulePermissionAttributes,
    | "id"
    | "user_id"
    | "role_id"
    | "module_id"
    | "can_view"
    | "can_edit"
    | "created_at"
    | "updated_at"
  > {}

export class UserModulePermission
  extends Model<
    UserModulePermissionAttributes,
    UserModulePermissionCreationAttributes
  >
  implements UserModulePermissionAttributes
{
  public id!: number;
  public user_id?: number | null;
  public role_id?: number | null;
  public module_id?: number | null;
  public can_view?: boolean;
  public can_edit?: boolean;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineUserModulePermission(
  sequelize: Sequelize
): ModelStatic<UserModulePermission> {
  const existingModel = sequelize.models
    .UserModulePermission as ModelStatic<UserModulePermission> | undefined;

  if (existingModel) {
    return existingModel;
  }

  return sequelize.define<UserModulePermission>(
    "UserModulePermission",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      role_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      module_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      can_view: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      can_edit: {
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
      tableName: "user_module_permissions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
}

export default UserModulePermission;