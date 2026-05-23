import { DataTypes, Model, Sequelize } from "sequelize";

export interface StudentPaymentAttributes {
  id?: number;
  student_id?: number | null;
  registration_id?: number | null;
  payment_type_id: number;
  amount: number;
  due_date: Date;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  paid_amount?: number;
  paid_date?: Date;
  created_at?: Date;
  updated_at?: Date;
  gateway_transaction_id?: string;
  gateway_provider?: string;
  last_payment_attempt_date?: Date;
  payment_attempts_count?: number;
  gateway_response?: any;
  gateway_status?: string;
  fee_head_id?: number;
  voucher_id?: number;
  receipt_id?: number;
}

class StudentPayment extends Model<StudentPaymentAttributes> implements StudentPaymentAttributes {
  public id!: number;
  public student_id!: number | null;
  public registration_id!: number | null;
  public payment_type_id!: number;
  public amount!: number;
  public due_date!: Date;
  public status!: 'pending' | 'paid' | 'overdue' | 'partial';
  public paid_amount!: number;
  public paid_date!: Date;
  public created_at!: Date;
  public updated_at!: Date;
  public gateway_transaction_id!: string;
  public gateway_provider!: string;
  public last_payment_attempt_date!: Date;
  public payment_attempts_count!: number;
  public gateway_response!: any;
  public gateway_status!: string;
  public fee_head_id!: number | null;
  public voucher_id!: number | null;
  public receipt_id!: number | null;
}                       

export function defineStudentPayment(sequelize: Sequelize) {
  StudentPayment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },      
      student_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      registration_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },    
      payment_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'paid', 'overdue', 'partial'),
        defaultValue: 'pending',
      },
      paid_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      paid_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      gateway_transaction_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      gateway_provider: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      last_payment_attempt_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      payment_attempts_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      gateway_response: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      gateway_status: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      fee_head_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      voucher_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      receipt_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "student_payments",
      timestamps: false,
    }
  );
  return StudentPayment;
}