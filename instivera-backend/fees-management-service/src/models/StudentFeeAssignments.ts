import {
  Model,
  DataTypes,
  Optional,
  Sequelize,
  Association,
  BelongsToGetAssociationMixin
} from "sequelize";
import { FeeHead } from "./FeeHeads";

export interface StudentFeeAssignmentAttributes {
  id: number;
  student_id: number;
  academic_year_id: number;
  fee_head_id: number;
  amount: number;
  discount_amount: number;
  fine_amount: number;
  due_date: Date;
  status: "PENDING" | "PARTIAL" | "PAID" | "";
  created_at?: Date;
  updated_at?: Date;
}

export interface StudentFeeAssignmentCreationAttributes
  extends Optional<
    StudentFeeAssignmentAttributes,
    "id" | "discount_amount" | "fine_amount" | "created_at" | "updated_at"
  > {}

// ⭐ Add association typing
export class StudentFeeAssignment
  extends Model<StudentFeeAssignmentAttributes, StudentFeeAssignmentCreationAttributes>
  implements StudentFeeAssignmentAttributes
{
  public id!: number;
  public student_id!: number;
  public academic_year_id!: number;
  public fee_head_id!: number;
  public amount!: number;
  public discount_amount!: number;
  public fine_amount!: number;
  public due_date!: Date;
  public status!: "PENDING" | "PARTIAL" | "PAID" | "";
  public created_at!: Date;
  public updated_at!: Date;

  public fee_head?: FeeHead;

  public getFee_head!: BelongsToGetAssociationMixin<FeeHead>;

  public static associations: {
    fee_head: Association<StudentFeeAssignment, FeeHead>;
  };
}

export function defineStudentFeeAssignment(sequelize: Sequelize) {
  StudentFeeAssignment.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      academic_year_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      fee_head_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: false,
      },
      discount_amount: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: false,
      },
      fine_amount: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: false,
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("PENDING", "PARTIAL", "PAID", ""),
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
      tableName: "student_fee_assignments",
      timestamps: false,
    }
  );

  return StudentFeeAssignment;
}