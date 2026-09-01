import {
  Model,
  DataTypes,
  Optional,
  Sequelize,
} from 'sequelize';

export interface ExamComponentAttributes {
  id: number;
  exam_id: number;
  component_name: string;
  component_type: 'THEORY' | 'PRACTICAL' | 'PROJECT' | 'VIVA' | 'ASSIGNMENT';
  max_marks: number;
  min_marks: number | null;
  weightage: number;
  duration_minutes: number | null;
  pass_required: number | null;
  sequence: number;
  is_active: number | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

export interface ExamComponentCreationAttributes
  extends Optional<
    ExamComponentAttributes,
    | 'id'
    | 'min_marks'
    | 'duration_minutes'
    | 'pass_required'
    | 'is_active'
    | 'created_at'
    | 'updated_at'
  > {}

export class ExamComponent
  extends Model<ExamComponentAttributes, ExamComponentCreationAttributes>
  implements ExamComponentAttributes
{
  public id!: number;
  public exam_id!: number;
  public component_name!: string;
  public component_type!: 'THEORY' | 'PRACTICAL' | 'PROJECT' | 'VIVA' | 'ASSIGNMENT';
  public max_marks!: number;
  public min_marks!: number | null;
  public weightage!: number;
  public duration_minutes!: number | null;
  public pass_required!: number | null;
  public sequence!: number;
  public is_active!: number | null;
  public created_at!: Date | string | null;
  public updated_at!: Date | string | null;
}

export function defineExamComponent(sequelize: Sequelize) {
  ExamComponent.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      exam_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        comment: 'Foreign key: reference to parent exam',
      },
      component_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Name of component (Theory, Practical, Project, Viva)',
      },
      component_type: {
        type: DataTypes.ENUM('THEORY', 'PRACTICAL', 'PROJECT', 'VIVA', 'ASSIGNMENT'),
        allowNull: false,
        defaultValue: 'THEORY',
      },
      max_marks: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
      },
      min_marks: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      weightage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 100.0,
      },
      duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pass_required: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      sequence: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      is_active: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 1,
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
      tableName: 'exam_components',
      timestamps: false,
    }
  );

  return ExamComponent;
}