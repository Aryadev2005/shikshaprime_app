import {
  DataTypes,
  Model,
  Optional,
  Sequelize,
} from "sequelize";

export interface SemesterAttributes {
  id: number;
  program_id: number;
  class_id: number;
  semester_number: number;
  name: string;
  is_active?: boolean;
}

export interface SemesterCreationAttributes
  extends Optional<
    SemesterAttributes,
    | "id"
    | "is_active"
  > { }

export class Semester
  extends Model<
    SemesterAttributes,
    SemesterCreationAttributes
  >
  implements SemesterAttributes {
  public id!: number;
  public program_id!: number;
  public class_id!: number;
  public semester_number!: number;
  public name!: string;
  public is_active?: boolean;
}

export function defineSemester(
  sequelize: Sequelize
): typeof Semester {
  Semester.init(
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
      semester_number: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: "semesters",
      timestamps: false,
      indexes: [
        {
          fields: ["program_id"],
        },
        {
          fields: ["class_id"],
        },
      ],
    }
  );

  return Semester;
}

export default Semester;