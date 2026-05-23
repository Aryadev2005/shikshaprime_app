import { Sequelize } from "sequelize";
import { config } from "../config";
import { getTenantSequelize } from "../server";
import { defineFeeHead } from "./FeeHeads";
import { defineFeeParticular } from "./FeeParticulars";
import { defineFeeReceipt } from "./FeeReceipts";
import { defineFeeReceiptItem } from "./FeeReceiptItems";
import { defineFeePaymentOnline } from "./FeePaymentsOnline";
import { defineStudentFeeAssignment } from "./StudentFeeAssignments";
import { defineStudent } from "./Student";
import { definePaymentTransaction } from "./PaymentTransaction";
import { defineStudentPayment } from "./StudentPayment";
import { definePaymentTypeLedgerMapping } from "./PaymentTypeLedgerMapping";
import { defineVoucher } from "./Voucher";
import { defineVoucherEntry } from "./VoucherEntry";
import { defineLedger } from "./Ledger";
import { defineFinancialYear } from "./FinancialYear";
import { definePayment } from "./Payment";
import { definePaymentType } from "./PaymentType";
import { defineAuditTrail } from "./AuditTrail";



// Global (shared) Sequelize instance – for system tables, tenant registry, etc.
export const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
  host: config.db.host,
  port: Number(config.db.port),
  dialect: "mysql",
});

// Test the global connection
export async function testConnection(): Promise<boolean> {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
}

// Tenant‑aware model loader
export function getTenantModels(tenant: string) {
  const sequelize = getTenantSequelize(tenant);
  // Step 1: define models
  const FeeHead = defineFeeHead(sequelize);
  const FeeParticular = defineFeeParticular(sequelize);
  const FeeReceipt = defineFeeReceipt(sequelize);
  const FeeReceiptItem = defineFeeReceiptItem(sequelize);
  const FeePaymentOnline = defineFeePaymentOnline(sequelize);
  const StudentFeeAssignment = defineStudentFeeAssignment(sequelize);
  const Student = defineStudent(sequelize);
  const PaymentTransaction = definePaymentTransaction(sequelize);
  const StudentPayment = defineStudentPayment(sequelize);
  const PaymentTypeLedgerMapping = definePaymentTypeLedgerMapping(sequelize);
  const Voucher = defineVoucher(sequelize);
  const VoucherEntry = defineVoucherEntry(sequelize);
  const Ledger = defineLedger(sequelize);
  const FinancialYear = defineFinancialYear(sequelize);
  const Payment = definePayment(sequelize);
  const PaymentType = definePaymentType(sequelize);
  const AuditTrail = defineAuditTrail(sequelize);
  
  // Step 2: define associations
  FeeHead.hasMany(FeeParticular, {
    foreignKey: 'fee_head_id',
    as: 'particulars',
  });
  FeeParticular.belongsTo(FeeHead, {
    foreignKey: 'fee_head_id',
    as: 'fee_head',
  });

  // FeeHead → FeeReceiptItems (1:M)
  FeeHead.hasMany(FeeReceiptItem, {
    foreignKey: 'fee_head_id',
    as: 'receipt_items',
  });

  FeeReceiptItem.belongsTo(FeeHead, {
    foreignKey: 'fee_head_id',
    as: 'fee_head',
  });
  FeeReceipt.hasMany(FeeReceiptItem, {
    foreignKey: 'receipt_id',
    as: 'items',
  });
  FeeReceiptItem.belongsTo(FeeReceipt, {
    foreignKey: 'receipt_id',
    as: 'receipt',
  });
  FeeReceipt.hasOne(FeePaymentOnline, {
    foreignKey: 'voucher_id',
    sourceKey: 'voucher_id',
    as: 'online_payment',
  });

  FeePaymentOnline.belongsTo(FeeReceipt, {
    foreignKey: 'voucher_id',
    targetKey: 'voucher_id',
    as: 'receipt',
  });

  StudentFeeAssignment.belongsTo(FeeHead, {
    foreignKey: "fee_head_id",
    as: "fee_head"
  });
  FeeHead.hasMany(StudentFeeAssignment, {
    foreignKey: "fee_head_id",
    as: "student_fee_assignments"
  });
  PaymentTypeLedgerMapping.belongsTo(PaymentType, {
    foreignKey: "payment_type_id",
    as: "paymentType",
  });

  PaymentType.hasMany(PaymentTypeLedgerMapping, {
    foreignKey: "payment_type_id",
    as: "ledgerMappings",
  });
  FeeReceipt.belongsTo(Student, {
    foreignKey: "student_id",
    as: "student",
  });
  Student.hasMany(FeeReceipt, {
    foreignKey: "student_id",
    as: "fee_receipts",
  });
  
  return  { AuditTrail, FeeHead, FeeParticular, FeeReceipt, FeeReceiptItem, FeePaymentOnline, 
    StudentFeeAssignment, Student, PaymentTransaction, StudentPayment, PaymentTypeLedgerMapping,
    Voucher, VoucherEntry, Ledger, FinancialYear, Payment, PaymentType };
}