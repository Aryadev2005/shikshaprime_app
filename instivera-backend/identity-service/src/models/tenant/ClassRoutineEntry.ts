import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface ClassRoutineEntryAttributes {
  id: number;
  routine_id: number;
  day_of_week: string;
  period_number: number;
  start_time: string;
  end_time: string;
  subject_id: number;
  teacher_id: number;
  is_break: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ClassRoutineEntryCreationAttributes
  extends Optional<
    ClassRoutineEntryAttributes,
    "id" | "period_number" | "is_break" | "created_at" | "updated_at"
  > {}

export class ClassRoutineEntry
  extends Model<ClassRoutineEntryAttributes, ClassRoutineEntryCreationAttributes>
  implements ClassRoutineEntryAttributes
{
  public id!: number;
  public routine_id!: number;
  public day_of_week!: string;
  public period_number!: number;
  public start_time!: string;
  public end_time!: string;
  public subject_id!: number;
  public teacher_id!: number;
  public is_break!: number;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineClassRoutineEntry(sequelize: Sequelize) {
  ClassRoutineEntry.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      routine_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      day_of_week: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      period_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      start_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      end_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      subject_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      teacher_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      is_break: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "class_routine_entries",
      timestamps: false,
      underscored: true,
      indexes: [
        { fields: ["routine_id", "day_of_week"] },
        { fields: ["teacher_id", "day_of_week"] },
        { fields: ["subject_id"] },
        { fields: ["teacher_id"] },
      ],
    }
  );
  return ClassRoutineEntry;
}
