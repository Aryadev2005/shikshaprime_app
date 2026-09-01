import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface StudentFeeAssignmentAttributes {
  id: number;
  student_id?: number;
  application_id?: string;
  academic_year_id: number;
  fee_head_id: number;
  amount: number;
  discount_amount?: number;
  fine_amount?: number;
  due_date: Date;
  status: "PENDING" | "PARTIAL" | "PAID" | "";
  paid_at?: Date;
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
  public student_id!: number | null;
  public application_id!: string | null;
  public academic_year_id!: number;
  public fee_head_id!: number;
  public amount!: number;
  public discount_amount!: number | null;
  public fine_amount!: number | null;
  public due_date!: Date;
  public status!: "PENDING" | "PARTIAL" | "PAID" | "";
  public paid_at!: Date;
  public created_at!: Date;
  public updated_at!: Date;  
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
        allowNull: true,
      },
      application_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
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
        allowNull: true,
      },
      fine_amount: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: true,
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("PENDING", "PARTIAL", "PAID", ""),
        allowNull: false,
      },
      paid_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
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