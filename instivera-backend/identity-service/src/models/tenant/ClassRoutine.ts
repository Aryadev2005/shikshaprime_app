import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface ClassRoutineAttributes {
  id: number;
  routine_number: string;
  title: string;
  effective_date: string | Date;
  status: string;
  class_id: number;
  academic_year_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ClassRoutineCreationAttributes
  extends Optional<ClassRoutineAttributes, "id" | "status" | "created_at" | "updated_at"> {}

export class ClassRoutine
  extends Model<ClassRoutineAttributes, ClassRoutineCreationAttributes>
  implements ClassRoutineAttributes
{
  public id!: number;
  public routine_number!: string;
  public title!: string;
  public effective_date!: string | Date;
  public status!: string;
  public class_id!: number;
  public academic_year_id!: number;
  public created_at?: Date;
  public updated_at?: Date;
}

export function defineClassRoutine(sequelize: Sequelize) {
  ClassRoutine.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      routine_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      effective_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "ACTIVE",
      },
      class_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      academic_year_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
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
      tableName: "class_routines",
      timestamps: false,
      underscored: true,
      indexes: [
        { unique: true, fields: ["routine_number"] },
        { fields: ["status"] },
        { fields: ["class_id"] },
        { fields: ["academic_year_id"] },
      ],
    }
  );
  return ClassRoutine;
}
