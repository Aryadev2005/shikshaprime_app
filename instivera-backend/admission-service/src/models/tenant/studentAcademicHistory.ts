import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface StudentAcademicHistoryAttributes {
  id: number;
  student_id?: number | null;
  user_id: number;

  exam_name: string;
  board_name?: string | null;
  year_of_passing?: string | null;
  division?: string | null;
  stream?: "ARTS" | "COMMERCE" | "SCIENCE";

  subject_name?: string | null;
  full_marks?: number | null;
  obtained_marks?: number | null;

  total_full_marks?: number | null;
  total_obtained_marks?: number | null;
  percentage?: number | null;
  status?: boolean | null;
  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface StudentAcademicHistoryCreationAttributes
  extends Optional<
    StudentAcademicHistoryAttributes,
    | "id"
    | "board_name"
    | "year_of_passing"
    | "division"
    | "subject_name"
    | "full_marks"
    | "obtained_marks"
    | "total_full_marks"
    | "total_obtained_marks"
    | "percentage"
    | "status"
    | "created_at"
    | "updated_at"
  > { }

export class StudentAcademicHistory
  extends Model<
    StudentAcademicHistoryAttributes,
    StudentAcademicHistoryCreationAttributes
  >
  implements StudentAcademicHistoryAttributes {
  public id!: number;
  public student_id!: number | null;
  public user_id!: number;

  public exam_name!: string;
  public board_name!: string | null;
  public year_of_passing!: string | null;
  public division!: string | null;
  public stream!: "ARTS" | "COMMERCE" | "SCIENCE";

  public subject_name!: string | null;
  public full_marks!: number | null;
  public obtained_marks!: number | null;

  public total_full_marks!: number | null;
  public total_obtained_marks!: number | null;
  public percentage!: number | null;
  public status!: boolean | null;
  public readonly created_at!: Date | null;
  public readonly updated_at!: Date | null;
}

export function defineStudentAcademicHistory(sequelize: Sequelize) {
  StudentAcademicHistory.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      student_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
      },
      exam_name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      board_name: {
        type: DataTypes.STRING(150),
        allowNull: true
      },
      year_of_passing: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      division: {
        type: DataTypes.ENUM("1ST-DIVISION", "2ND-DIVISION", "3RD-DIVISION", "PASS"),
        allowNull: true
      },
      stream: {
        type: DataTypes.ENUM("ARTS", "COMMERCE", "SCIENCE"),
        allowNull: true
      },
      subject_name: {
        type: DataTypes.STRING(150),
        allowNull: true
      },
      full_marks: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      obtained_marks: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      // total_full_marks: {
      //   type: DataTypes.INTEGER,
      //   allowNull: true
      // },
      // total_obtained_marks: {
      //   type: DataTypes.INTEGER,
      //   allowNull: true
      // },
      // percentage: {
      //   type: DataTypes.DECIMAL(5, 2),
      //   allowNull: true
      // },
      status: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: true,
        defaultValue: 0
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
      }
    },
    {
      sequelize,
      tableName: "student_academic_history",
      timestamps: false,
      underscored: true
    }
  );

  return StudentAcademicHistory;
}