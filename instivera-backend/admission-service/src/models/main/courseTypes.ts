import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from 'sequelize';

export interface CourseTypeAttributes {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

export interface CourseTypeCreationAttributes
  extends Optional<CourseTypeAttributes, 'id' | 'description'> {}

export class CourseType
  extends Model<CourseTypeAttributes, CourseTypeCreationAttributes>
  implements CourseTypeAttributes 
{
  public id!: number;
  public code!: string;
  public name!: string;
  public description!: string | null;
}

export function defineCourseType(sequelize: Sequelize) {
    CourseType.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        code: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        description: {
          type: DataTypes.STRING(150),
          allowNull: true
        }
      },
      {
        sequelize,
        tableName: 'course_types',
        timestamps: false,
        underscored: true
      }
    );

    return CourseType;
  }

  // Associations (to be wired later)
  // static associate(models: any) {
  //   CourseType.hasMany(models.ProgramCourseStructure, { foreignKey: 'course_type_id' });
  // }