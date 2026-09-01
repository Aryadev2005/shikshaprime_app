import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface LeadChannelAttributes {
  id: number;
  channel_code: string;
  description?: string | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface LeadChannelCreationAttributes
  extends Optional<LeadChannelAttributes, 'id' | 'description' | 'is_active'> {}

export class LeadChannel
  extends Model<LeadChannelAttributes, LeadChannelCreationAttributes>
  implements LeadChannelAttributes
{
  public id!: number;
  public channel_code!: string;
  public description!: string | null;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

export function defineLeadChannel(sequelize: Sequelize) {
  LeadChannel.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      channel_code: {
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
      tableName: 'lead_channels_master',
      timestamps: true,
      underscored: true
    }
  );

  return LeadChannel;
}