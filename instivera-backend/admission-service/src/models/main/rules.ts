import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from 'sequelize';

export interface RuleAttributes {
  id: number;
  university_id: number | null;
  tenant_id: number | null;
  rule_key: string;
  rule_value: string;
  rule_type: 'INT' | 'BOOL' | 'STRING' | 'JSON';
  description: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface RuleCreationAttributes
  extends Optional<
    RuleAttributes,
    'id' | 'university_id' | 'tenant_id' | 'description' | 'created_at' | 'updated_at'
  > {}

export class Rule
  extends Model<RuleAttributes, RuleCreationAttributes>
  implements RuleAttributes 
{
  public id!: number;
  public university_id!: number | null;
  public tenant_id!: number | null;
  public rule_key!: string;
  public rule_value!: string;
  public rule_type!: 'INT' | 'BOOL' | 'STRING' | 'JSON';
  public description!: string | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export function defineRule(sequelize: Sequelize) {
    Rule.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        university_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true
        },
        tenant_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true
        },
        rule_key: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        rule_value: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        rule_type: {
          type: DataTypes.ENUM('INT', 'BOOL', 'STRING', 'JSON'),
          allowNull: false
        },
        description: {
          type: DataTypes.STRING(150),
          allowNull: true
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      },
      {
        sequelize,
        tableName: 'rules',
        timestamps: false,
        underscored: true
      }
    );

    return Rule;
  }

  // Associations (to be wired later)
  // static associate(models: any) {
  //   Rule.belongsTo(models.University, { foreignKey: 'university_id' });
  //   Rule.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
  // }