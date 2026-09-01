import {
  Model,
  DataTypes,
  Optional,
  Sequelize
} from "sequelize";

export interface ReadmissionRequestAttributes {
  id: number;
  student_id: number;

  program_id: number;
  department_id?: number | null;

  from_class_id: number;
  to_class_id: number;

  from_semester_id: number;
  to_semester_id: number;

  academic_year_id: number;

  status: "PENDING" | "AWAITING_FEE_PAYMENT" | "APPROVED" | "REJECTED" | "COMPLETED";

  student_confirmed?: boolean | null;
  student_confirmed_at?: Date | null;

  fee_required: boolean;
  fee_amount: number;
  fee_paid: boolean;

  remarks?: string | null;

  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface ReadmissionRequestCreationAttributes
  extends Optional<
    ReadmissionRequestAttributes,
    | "id"
    | "department_id"
    | "status"
    | "student_confirmed"
    | "student_confirmed_at"
    | "fee_required"
    | "fee_amount"
    | "fee_paid"
    | "remarks"
    | "created_at"
    | "updated_at"
  > {}

export class ReadmissionRequests
  extends Model<
    ReadmissionRequestAttributes,
    ReadmissionRequestCreationAttributes
  >
  implements ReadmissionRequestAttributes
{
  public id!: number;
  public student_id!: number;

  public program_id!: number;
  public department_id!: number | null;

  public from_class_id!: number;
  public to_class_id!: number;

  public from_semester_id!: number;
  public to_semester_id!: number;

  public academic_year_id!: number;

  public status!: "PENDING" | "AWAITING_FEE_PAYMENT" | "APPROVED" | "REJECTED" | "COMPLETED";

  public fee_paid!: boolean;

  public fee_required!: boolean;
  public fee_amount!: number;

  public student_confirmed!: boolean;
  public student_confirmed_at!: Date | null;

  public remarks!: string | null;

  public readonly created_at!: Date | null;
  public readonly updated_at!: Date | null;
}

export function defineReadmissionRequests(sequelize: Sequelize) {
  ReadmissionRequests.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },

      student_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },

      program_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },

      department_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
      },

      from_class_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },

      to_class_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },

      from_semester_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },

      to_semester_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },

      academic_year_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
      },

      status: {
        type: DataTypes.ENUM("PENDING", "AWAITING_FEE_PAYMENT", "APPROVED", "REJECTED", "COMPLETED"),
        allowNull: false,
        defaultValue: "PENDING"
      },

      student_confirmed: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: true,
        defaultValue: 0
      },

      student_confirmed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },

      fee_required: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: false,
        defaultValue: 0
      },

      fee_amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },

      fee_paid: {
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: false,
        defaultValue: 0
      },

      remarks: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: "readmission_requests",
      timestamps: false,
      underscored: true
    }
  );

  return ReadmissionRequests;
}