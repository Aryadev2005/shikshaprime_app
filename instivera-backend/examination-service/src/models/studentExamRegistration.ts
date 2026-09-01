import {
  Model,
  DataTypes,
  Optional,
  Sequelize,
} from "sequelize";

export interface StudentExamRegistrationAttributes {
  id: number;
  exam_id: number;
  student_id: number;
  status: "REGISTERED" | "BLOCKED" | "CANCELLED" | "";
  created_at?: Date;
  updated_at?: Date;
}

export interface StudentExamRegistrationCreationAttributes
  extends Optional<StudentExamRegistrationAttributes, "id" | "created_at" | "updated_at"> {}

export class StudentExamRegistration
  extends Model<
    StudentExamRegistrationAttributes,
    StudentExamRegistrationCreationAttributes
  >
  implements StudentExamRegistrationAttributes
{
  public id!: number;
  public exam_id!: number;
  public student_id!: number;
  public status!: "REGISTERED" | "BLOCKED" | "CANCELLED" | "";
  public created_at!: Date;
  public updated_at!: Date;
}

  export function defineStudentExamRegistration(sequelize: Sequelize) {
    StudentExamRegistration.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },

        exam_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },

        student_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },

        status: {
          type: DataTypes.ENUM("REGISTERED", "BLOCKED", "CANCELLED", ""),
          allowNull: false,
          defaultValue: "REGISTERED",
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
        tableName: "student_exam_registrations",
        timestamps: false,
      }
    );
    return StudentExamRegistration;
  }