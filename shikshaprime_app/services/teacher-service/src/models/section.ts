import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

// Define attributes interface
export interface SectionAttributes {
  id: number;
  program_id: number;
  class_id: number;
  code: string;
  name: string;
}

// For creation, id is optional
export interface SectionCreationAttributes extends Optional<SectionAttributes, 'id'> {}

class Section extends Model<SectionAttributes, SectionCreationAttributes>
  implements SectionAttributes {
  public id!: number;
  public program_id!: number;
  public class_id!: number;
  public code!: string;
  public name!: string;
}
export function defineSection(sequelize: Sequelize) {
  Section.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      program_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      class_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'sections',
      timestamps: false,
      underscored: true,
    }
  );
  return Section;
}