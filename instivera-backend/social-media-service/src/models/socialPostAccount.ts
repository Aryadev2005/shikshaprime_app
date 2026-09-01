import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface SocialPostAccountAttributes {
  id: number;
  post_id: number;
  social_account_id: number;
  platform_post_id?: string | null;
  status?: 'pending' | 'success' | 'failed';
  error_message?: string | null;
  published_at?: Date | null;
  created_at?: Date;
}

export interface SocialPostAccountCreationAttributes
  extends Optional<
    SocialPostAccountAttributes,
    'id' | 'platform_post_id' | 'status' | 'error_message' | 'published_at' | 'created_at'
  > {}

class SocialPostAccount
  extends Model<SocialPostAccountAttributes, SocialPostAccountCreationAttributes>
  implements SocialPostAccountAttributes
{
  public id!: number;
  public post_id!: number;
  public social_account_id!: number;
  public platform_post_id?: string | null;
  public status?: 'pending' | 'success' | 'failed';
  public error_message?: string | null;
  public published_at?: Date | null;
  public created_at?: Date;

  static initModel(sequelize: Sequelize): typeof SocialPostAccount {
    SocialPostAccount.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        post_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        social_account_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        platform_post_id: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('pending', 'success', 'failed'),
          allowNull: true,
          defaultValue: 'pending',
        },
        error_message: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        published_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "social_post_accounts",
        timestamps: false,
        underscored: true,
      }
    );

    return SocialPostAccount;
  }

  static associate(models: any) {
    SocialPostAccount.belongsTo(models.SocialPost, {
      foreignKey: "post_id",
      as: "post",
    });
    SocialPostAccount.belongsTo(models.SocialAccount, {
      foreignKey: "social_account_id",
      as: "social_account",
    });
  }
}

export default SocialPostAccount;
