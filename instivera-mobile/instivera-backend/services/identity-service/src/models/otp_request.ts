import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface OtpRequestAttributes {
  id: number;
  email: string;
  otp_hash: string;
  expires_at: Date;
  attempts: number;
  is_used: number;
  created_at?: Date;
  updated_at?: Date;
}

interface OtpRequestCreationAttributes extends Optional<OtpRequestAttributes, 'id'> {}

export class OtpRequest extends Model<OtpRequestAttributes, OtpRequestCreationAttributes>
  implements OtpRequestAttributes {
  public id!: number;
  public email!: string;
  public otp_hash!: string;
  public expires_at!: Date;
  public attempts!: number;
  public is_used!: number;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineOtpRequest(sequelize: Sequelize): typeof OtpRequest {
  OtpRequest.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      otp_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      is_used: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      tableName: 'otp_requests',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return OtpRequest;
}
