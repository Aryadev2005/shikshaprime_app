import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface RepositoryCategoryAttributes {
  id: number;
  name: string;
  subject_id?: number;
  class_id?: number;
  description?: string;
  is_active?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface RepositoryCategoryCreationAttributes
  extends Optional<RepositoryCategoryAttributes, 'id'> {}

class RepositoryCategory
  extends Model<RepositoryCategoryAttributes, RepositoryCategoryCreationAttributes>
  implements RepositoryCategoryAttributes
{
  public id!: number;
  public name!: string;
  public subject_id?: number;
  public class_id?: number;
  public description?: string;
  public is_active?: number;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineRepositoryCategory(sequelize: Sequelize) {
  RepositoryCategory.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(200), allowNull: false },
      subject_id: { type: DataTypes.BIGINT, allowNull: true },
      class_id: { type: DataTypes.BIGINT, allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
    },
    {
      sequelize,
      tableName: 'repository_categories',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );
  return RepositoryCategory;
}
