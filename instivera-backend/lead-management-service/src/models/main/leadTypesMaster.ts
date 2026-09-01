import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface LeadTypeAttributes {
  id: number;
  type_code: string;
  description?: string | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface LeadTypeCreationAttributes
  extends Optional<LeadTypeAttributes, 'id' | 'description' | 'is_active'> {}

export class LeadType
  extends Model<LeadTypeAttributes, LeadTypeCreationAttributes>
  implements LeadTypeAttributes
{
  public id!: number;
  public type_code!: string;
  public description!: string | null;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

export function defineLeadType(sequelize: Sequelize) {
  LeadType.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      type_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      tableName: 'lead_types_master',
      timestamps: true,
      underscored: true
    }
  );

  return LeadType;
}