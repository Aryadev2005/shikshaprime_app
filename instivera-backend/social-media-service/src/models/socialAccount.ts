import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface SocialAccountAttributes {
  id: number;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'x';
  account_name: string;
  account_id: string;
  access_token: string;
  refresh_token?: string | null;
  expires_at?: Date | null;
  is_active?: boolean | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface SocialAccountCreationAttributes
  extends Optional<
    SocialAccountAttributes,
    'id' | 'refresh_token' | 'expires_at' | 'is_active' | 'created_at' | 'updated_at'
  > {}

class SocialAccount
  extends Model<SocialAccountAttributes, SocialAccountCreationAttributes>
  implements SocialAccountAttributes
{
  public id!: number;
  public platform!: 'facebook' | 'instagram' | 'linkedin' | 'x';
  public account_name!: string;
  public account_id!: string;
  public access_token!: string;
  public refresh_token?: string | null;
  public expires_at?: Date | null;
  public is_active?: boolean | null;
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(sequelize: Sequelize): typeof SocialAccount {
    SocialAccount.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        platform: {
          type: DataTypes.ENUM('facebook', 'instagram', 'linkedin', 'x'),
          allowNull: false,
        },
        account_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        account_id: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        access_token: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        refresh_token: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        expires_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "social_accounts",
        timestamps: false,
        underscored: true,
        indexes: [
          {
            name: "idx_account_id",
            fields: ["account_id"],
          },
          {
            name: "idx_platform",
            fields: ["platform"],
          },
        ],
      }
    );

    return SocialAccount;
  }

  static associate(models: any) {
    // Define associations here
  }
}

export default SocialAccount;
