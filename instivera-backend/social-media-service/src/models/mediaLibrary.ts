import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface MediaLibraryAttributes {
  id: number;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  created_at?: Date;
}

export interface MediaLibraryCreationAttributes
  extends Optional<
    MediaLibraryAttributes,
    'id' | 'created_at'
  > {}

class MediaLibrary
  extends Model<MediaLibraryAttributes, MediaLibraryCreationAttributes>
  implements MediaLibraryAttributes
{
  public id!: number;
  public file_name!: string;
  public file_path!: string;
  public mime_type!: string;
  public file_size!: number;
  public created_at?: Date;

  static initModel(sequelize: Sequelize): typeof MediaLibrary {
    MediaLibrary.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        file_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        file_path: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        mime_type: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        file_size: {
          type: DataTypes.BIGINT.UNSIGNED,
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
        tableName: "media_library",
        timestamps: false,
        underscored: true,
      }
    );

    return MediaLibrary;
  }

  static associate(models: any) {
    // Define associations here
  }
}

export default MediaLibrary;
