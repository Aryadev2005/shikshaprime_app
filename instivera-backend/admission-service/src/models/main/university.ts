import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from 'sequelize';

export interface UniversityAttributes {
  id: number;
  name: string;
  code: string;
  is_fyugp_enabled: boolean;
  is_cbcs_enabled: boolean;
  default_admission_mode_id: number;
  academic_year_start_month: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface UniversityCreationAttributes
  extends Optional<
    UniversityAttributes,
    'id' | 'created_at' | 'updated_at'
  > {}

export class University
  extends Model<UniversityAttributes, UniversityCreationAttributes>
  implements UniversityAttributes 
{
  public id!: number;
  public name!: string;
  public code!: string;
  public is_fyugp_enabled!: boolean;
  public is_cbcs_enabled!: boolean;
  public default_admission_mode_id!: number;
  public academic_year_start_month!: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export function defineUniversity(sequelize: Sequelize) {
    University.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING(200),
          allowNull: false
        },
        code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        is_fyugp_enabled: {
          type: DataTypes.TINYINT({ length: 1 }),
          allowNull: false,
          defaultValue: 1
        },
        is_cbcs_enabled: {
          type: DataTypes.TINYINT({ length: 1 }),
          allowNull: false,
          defaultValue: 1
        },
        default_admission_mode_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false
        },
        academic_year_start_month: {
          type: DataTypes.TINYINT({ length: 2 }),
          allowNull: false,
          defaultValue: 4
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      },
      {
        sequelize,
        tableName: 'universities',
        timestamps: false,
        underscored: true
      }
    );
    return University;
  }