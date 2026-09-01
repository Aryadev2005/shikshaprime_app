import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface ProgramRulesAttributes {
  id: number;
  program_id: number;
  rules_json: any; // JSON field
  created_at?: Date;
  updated_at?: Date;
}

export interface ProgramRulesCreationAttributes
  extends Optional<
    ProgramRulesAttributes,
    "id" | "created_at" | "updated_at"
  > {}

export class ProgramRules
  extends Model<ProgramRulesAttributes, ProgramRulesCreationAttributes>
  implements ProgramRulesAttributes
{
  public id!: number;
  public program_id!: number;
  public rules_json!: any;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export function defineProgramRules(sequelize: Sequelize) {
  ProgramRules.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      program_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      rules_json: {
        type: DataTypes.JSON,
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        )
      }
    },
    {
      sequelize,
      tableName: "program_rules",
      timestamps: false,
      underscored: true
    }
  );

  return ProgramRules;
}