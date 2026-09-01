import {
  Model,
  DataTypes,
  Optional,
  Sequelize,
} from 'sequelize';

export interface ExamScheduleAttributes {
  id: number;
  exam_id: number;
  scheduled_date: string | Date;
  start_time: string;
  end_time: string;
  venue: string | null;
  invigilator_id: number | null;
  total_seats: number;
  is_cancelled: number | null;
  created_at: Date | string | null;
}

export interface ExamScheduleCreationAttributes
  extends Optional<
    ExamScheduleAttributes,
    'id' | 'venue' | 'invigilator_id' | 'is_cancelled' | 'created_at'
  > {}

export class ExamSchedule
  extends Model<ExamScheduleAttributes, ExamScheduleCreationAttributes>
  implements ExamScheduleAttributes
{
  public id!: number;
  public exam_id!: number;
  public scheduled_date!: string | Date;
  public start_time!: string;
  public end_time!: string;
  public venue!: string | null;
  public invigilator_id!: number | null;
  public total_seats!: number;
  public is_cancelled!: number | null;
  public created_at!: Date | string | null;
}

export function defineExamSchedule(sequelize: Sequelize) {
  ExamSchedule.init(
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
        comment: 'Foreign key: reference to exam',
      },
      scheduled_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      start_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      end_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      venue: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      invigilator_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      total_seats: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      is_cancelled: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'exam_schedules',
      timestamps: false,
    }
  );

  return ExamSchedule;
}