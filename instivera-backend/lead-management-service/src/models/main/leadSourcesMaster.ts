import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface LeadSourceAttributes {
  id: number;
  source_code: string;
  description?: string | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface LeadSourceCreationAttributes
  extends Optional<LeadSourceAttributes, 'id' | 'description' | 'is_active'> {}

export class LeadSource
  extends Model<LeadSourceAttributes, LeadSourceCreationAttributes>
  implements LeadSourceAttributes
{
  public id!: number;
  public source_code!: string;
  public description!: string | null;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

export function defineLeadSource(sequelize: Sequelize) {
  LeadSource.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      source_code: {
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
      tableName: 'lead_sources_master',
      timestamps: true,
      underscored: true
    }
  );

  return LeadSource;
}