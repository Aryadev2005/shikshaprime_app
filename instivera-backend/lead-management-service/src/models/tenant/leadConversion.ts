import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface LeadConversionAttributes {
  id: number;
  lead_id: number;
  application_id: number;
  converted_at: Date;
}

export interface LeadConversionCreationAttributes
  extends Optional<LeadConversionAttributes, 'id' | 'converted_at'> {}

export class LeadConversion
  extends Model<LeadConversionAttributes, LeadConversionCreationAttributes>
  implements LeadConversionAttributes
{
  public id!: number;
  public lead_id!: number;
  public application_id!: number;
  public converted_at!: Date;
}

export function defineLeadConversion(sequelize: Sequelize) {
  LeadConversion.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      lead_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true
      },
      application_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },
      converted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: 'lead_conversion',
      timestamps: false,
      underscored: true
    }
  );

  return LeadConversion;
}