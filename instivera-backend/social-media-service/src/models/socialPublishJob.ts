import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface SocialPublishJobAttributes {
  id: number;
  post_id: number;
  run_at: Date;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  attempts?: number | null;
  error_message?: string | null;
  created_at?: Date;
}

export interface SocialPublishJobCreationAttributes
  extends Optional<
    SocialPublishJobAttributes,
    'id' | 'status' | 'attempts' | 'error_message' | 'created_at'
  > {}

class SocialPublishJob
  extends Model<SocialPublishJobAttributes, SocialPublishJobCreationAttributes>
  implements SocialPublishJobAttributes
{
  public id!: number;
  public post_id!: number;
  public run_at!: Date;
  public status?: 'pending' | 'processing' | 'completed' | 'failed';
  public attempts?: number | null;
  public error_message?: string | null;
  public created_at?: Date;

  static initModel(sequelize: Sequelize): typeof SocialPublishJob {
    SocialPublishJob.init(
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
        run_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
          allowNull: true,
          defaultValue: 'pending',
        },
        attempts: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        error_message: {
          type: DataTypes.TEXT,
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
        tableName: "social_publish_jobs",
        timestamps: false,
        underscored: true,
      }
    );

    return SocialPublishJob;
  }

  static associate(models: any) {
    SocialPublishJob.belongsTo(models.SocialPost, {
      foreignKey: "post_id",
      as: "post",
    });
  }
}

export default SocialPublishJob;
