import { DataTypes, Model, ModelStatic, Optional, Sequelize } from "sequelize";

// Attributes Interface
interface ModuleAttributes {
  module_id: number;
  module_name: string;
  module_key: string;
  created_at?: Date;
}

// Creation Interface
interface ModuleCreationAttributes
  extends Optional<ModuleAttributes, "module_id" | "created_at"> {}

// Model Class
export class Module
  extends Model<ModuleAttributes, ModuleCreationAttributes>
  implements ModuleAttributes {

  public module_id!: number;
  public module_name!: string;
  public module_key!: string;
  public created_at?: Date;
}

export function defineModule(sequelize: Sequelize): ModelStatic<Module> {
  const existingModuleModel = sequelize.models.Module as ModelStatic<Module> | undefined;

  if (existingModuleModel) {
    return existingModuleModel;
  }

  return sequelize.define<Module>(
    "Module",
    {
      module_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      module_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      module_key: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "modules",
      timestamps: false,
    }
  );
}

export default Module;
