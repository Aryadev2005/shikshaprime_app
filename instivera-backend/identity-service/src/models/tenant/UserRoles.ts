import { DataTypes, Model, ModelStatic, Optional, Sequelize } from "sequelize";

// =========================
// Attributes Interface
// =========================
interface UserRoleAttributes {
  id: number;
  user_id: number;
  role_id: number;
  created_at?: Date;
}

// =========================
// Creation Interface
// =========================
interface UserRoleCreationAttributes
  extends Optional<UserRoleAttributes, "id" | "created_at"> {}

// =========================
// Model Class
// =========================
export class UserRole
  extends Model<UserRoleAttributes, UserRoleCreationAttributes>
  implements UserRoleAttributes {

  public id!: number;
  public user_id!: number;
  public role_id!: number;
  public created_at?: Date;
}

export function defineUserRole(sequelize: Sequelize): ModelStatic<UserRole> {
  const existingUserRoleModel = sequelize.models.UserRole as ModelStatic<UserRole> | undefined;

  if (existingUserRoleModel) {
    return existingUserRoleModel;
  }

  return sequelize.define<UserRole>(
    "UserRole",
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

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "user_roles",
      timestamps: false,
    }
  );
}

export default UserRole;
