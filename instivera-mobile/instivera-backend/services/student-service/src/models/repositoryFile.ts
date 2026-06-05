import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface RepositoryFileAttributes {
  id: number;
  category_id: number;
  title: string;
  description?: string;
  file_path: string;
  file_type?: string;
  file_size_kb?: number;
  uploaded_by?: string;
  uploaded_by_type?: 'ADMIN' | 'TEACHER';
  is_active?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface RepositoryFileCreationAttributes
  extends Optional<RepositoryFileAttributes, 'id'> {}

class RepositoryFile
  extends Model<RepositoryFileAttributes, RepositoryFileCreationAttributes>
  implements RepositoryFileAttributes
{
  public id!: number;
  public category_id!: number;
  public title!: string;
  public description?: string;
  public file_path!: string;
  public file_type?: string;
  public file_size_kb?: number;
  public uploaded_by?: string;
  public uploaded_by_type?: 'ADMIN' | 'TEACHER';
  public is_active?: number;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineRepositoryFile(sequelize: Sequelize) {
  RepositoryFile.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      category_id: { type: DataTypes.BIGINT, allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      file_path: { type: DataTypes.STRING(500), allowNull: false },
      file_type: { type: DataTypes.STRING(50), allowNull: true },
      file_size_kb: { type: DataTypes.INTEGER, allowNull: true },
      uploaded_by: { type: DataTypes.STRING(255), allowNull: true },
      uploaded_by_type: {
        type: DataTypes.ENUM('ADMIN', 'TEACHER'),
        allowNull: true,
        defaultValue: 'TEACHER',
      },
      is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
    },
    {
      sequelize,
      tableName: 'repository_files',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );
  return RepositoryFile;
}
