import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from 'sequelize';

export interface ProgramCourseStructureAttributes {
  id: number;
  university_id: number;
  program_type: string;
  course_type_id: number;
  min_credits: number | null;
  max_credits: number | null;
  is_required: boolean;
}

export interface ProgramCourseStructureCreationAttributes
  extends Optional<
    ProgramCourseStructureAttributes,
    'id' | 'min_credits' | 'max_credits'
  > {}

export class ProgramCourseStructure
  extends Model<
    ProgramCourseStructureAttributes,
    ProgramCourseStructureCreationAttributes
  >
  implements ProgramCourseStructureAttributes 
{
  public id!: number;
  public university_id!: number;
  public program_type!: string;
  public course_type_id!: number;
  public min_credits!: number | null;
  public max_credits!: number | null;
  public is_required!: boolean;
}

export function defineProgramCourseStructure(sequelize: Sequelize) {
    ProgramCourseStructure.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        university_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false
        },
        program_type: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        course_type_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false
        },
        min_credits: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        max_credits: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        is_required: {
          type: DataTypes.TINYINT({ length: 1 }),
          allowNull: false,
          defaultValue: 1
        }
      },
      {
        sequelize,
        tableName: 'program_course_structure',
        timestamps: false,
        underscored: true
      }
    );

    return ProgramCourseStructure;
  }

  // Associations (to be wired later)
  // static associate(models: any) {
  //   ProgramCourseStructure.belongsTo(models.University, { foreignKey: 'university_id' });
  //   ProgramCourseStructure.belongsTo(models.CourseType, { foreignKey: 'course_type_id' });
  // }