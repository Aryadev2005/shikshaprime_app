import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface SocialPostTagAttributes {
  id: number;
  post_id: number;
  tag: string;
  created_at?: Date;
}

export interface SocialPostTagCreationAttributes
  extends Optional<
    SocialPostTagAttributes,
    'id' | 'created_at'
  > {}

class SocialPostTag
  extends Model<SocialPostTagAttributes, SocialPostTagCreationAttributes>
  implements SocialPostTagAttributes
{
  public id!: number;
  public post_id!: number;
  public tag!: string;
  public created_at?: Date;

  static initModel(sequelize: Sequelize): typeof SocialPostTag {
    SocialPostTag.init(
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
        tag: {
          type: DataTypes.STRING(255),
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
        tableName: "social_post_tags",
        timestamps: false,
        underscored: true,
      }
    );

    return SocialPostTag;
  }

  static associate(models: any) {
    SocialPostTag.belongsTo(models.SocialPost, {
      foreignKey: "post_id",
      as: "post",
    });
  }
}

export default SocialPostTag;
