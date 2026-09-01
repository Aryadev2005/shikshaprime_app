import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface SocialPostAnalyticsAttributes {
  id: number;
  social_post_account_id: number;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  impressions?: number | null;
  fetched_at: Date;
  created_at?: Date;
}

export interface SocialPostAnalyticsCreationAttributes
  extends Optional<
    SocialPostAnalyticsAttributes,
    'id' | 'likes' | 'comments' | 'shares' | 'impressions' | 'created_at'
  > {}

class SocialPostAnalytics
  extends Model<SocialPostAnalyticsAttributes, SocialPostAnalyticsCreationAttributes>
  implements SocialPostAnalyticsAttributes
{
  public id!: number;
  public social_post_account_id!: number;
  public likes?: number | null;
  public comments?: number | null;
  public shares?: number | null;
  public impressions?: number | null;
  public fetched_at!: Date;
  public created_at?: Date;

  static initModel(sequelize: Sequelize): typeof SocialPostAnalytics {
    SocialPostAnalytics.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        social_post_account_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        likes: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          defaultValue: 0,
        },
        comments: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          defaultValue: 0,
        },
        shares: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          defaultValue: 0,
        },
        impressions: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          defaultValue: 0,
        },
        fetched_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "social_post_analytics",
        timestamps: false,
        underscored: true,
      }
    );

    return SocialPostAnalytics;
  }

  static associate(models: any) {
    SocialPostAnalytics.belongsTo(models.SocialPostAccount, {
      foreignKey: "social_post_account_id",
      as: "social_post_account",
    });
  }
}

export default SocialPostAnalytics;
