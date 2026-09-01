import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from 'sequelize';

export interface AcademicYearAttributes {
  id: number;
  name: string;
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface AcademicYearCreationAttributes
  extends Optional<
    AcademicYearAttributes,
    'id' | 'is_active' | 'created_at' | 'updated_at'
  > {}

export class AcademicYear
  extends Model<AcademicYearAttributes, AcademicYearCreationAttributes>
  implements AcademicYearAttributes 
{
  public id!: number;
  public name!: string;
  public start_date!: Date;
  public end_date!: Date;
  public is_active!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export function defineAcademicYear(sequelize: Sequelize) {
    AcademicYear.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING(32),
          allowNull: false
        },
        start_date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        end_date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        is_active: {
          type: DataTypes.TINYINT({ length: 1 }),
          allowNull: false,
          defaultValue: 0
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      },
      {
        sequelize,
        tableName: 'academic_years',
        timestamps: false,
        underscored: true
      }
    );

    return AcademicYear;
  }

  // Associations (to be added later)
  // static associate(models: any) {
  //   AcademicYear.hasMany(models.Student, { foreignKey: 'academic_year_id' });
  //   AcademicYear.hasMany(models.StudentFeeAssignment, { foreignKey: 'academic_year_id' });
  // }