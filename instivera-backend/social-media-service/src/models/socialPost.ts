import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface SocialPostAttributes {
  id: number;
  title?: string | null;
  content: string;
  media_url?: string | null;
  status?: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface SocialPostCreationAttributes
  extends Optional<
    SocialPostAttributes,
    'id' | 'title' | 'media_url' | 'status' | 'scheduled_at' | 'created_at' | 'updated_at'
  > { }

class SocialPost
  extends Model<SocialPostAttributes, SocialPostCreationAttributes>
  implements SocialPostAttributes {
  public id!: number;
  public title?: string | null;
  public content!: string;
  public media_url?: string | null;
  public status?: 'draft' | 'scheduled' | 'published' | 'failed';
  public scheduled_at?: Date | null;
  public created_at?: Date;
  public updated_at?: Date;

  static initModel(sequelize: Sequelize): typeof SocialPost {
    SocialPost.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        title: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        content: {
          type: DataTypes.TEXT('long'),
          allowNull: false,
        },
        media_url: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('draft', 'scheduled', 'published', 'failed'),
          allowNull: true,
          defaultValue: 'draft',
        },
        scheduled_at: {
          type: DataTypes.DATE,
          allowNull: true,
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
        tableName: "social_posts",
        timestamps: false,
        underscored: true,
        indexes: [
          {
            name: "idx_status",
            fields: ["status"],
          },
          {
            name: "idx_scheduled_at",
            fields: ["scheduled_at"],
          },
        ],
      }
    );

    return SocialPost;
  }

  static associate(models: any) {
    // Define associations here
  }
}

export default SocialPost;
