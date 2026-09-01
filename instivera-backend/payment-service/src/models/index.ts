import { definePaymentType } from "./PaymentType";
import { defineStudentPayment } from "./StudentPayment";
import { definePaymentTransaction } from "./PaymentTransaction";
import { Sequelize } from "sequelize";
import { config } from "../config";
import { getTenantSequelize } from "../server";
import { definePaymentWebhook } from "./PaymentWebhook";
import { definePaymentTypeLedgerMapping } from "./PaymentTypeLedgerMapping";
import { defineStudentFeeAssignment } from "./StudentFeeAssignments";

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
  const PaymentTransaction = definePaymentTransaction(sequelize);
  const PaymentType = definePaymentType(sequelize);
  const StudentPayment = defineStudentPayment(sequelize);
  const PaymentWebhook = definePaymentWebhook(sequelize);
  const PaymentTypeLedgerMapping = definePaymentTypeLedgerMapping(sequelize);
  const StudentFeeAssignment = defineStudentFeeAssignment(sequelize);
  
  // Step 2: define associations
  PaymentType.hasMany(StudentPayment, { foreignKey: 'payment_type_id', as: 'studentPayments' });
  StudentPayment.belongsTo(PaymentType, { foreignKey: 'payment_type_id', as: 'paymentType' });
  StudentPayment.hasMany(PaymentTransaction, { foreignKey: 'student_payment_id', as: 'transactions' });
  PaymentTransaction.belongsTo(StudentPayment, { foreignKey: 'student_payment_id', as: 'studentPayment' });
  PaymentType.hasOne(PaymentTypeLedgerMapping, {  foreignKey: "payment_type_id",  as: "ledgerMappings",});
  PaymentTypeLedgerMapping.belongsTo(PaymentType, {  foreignKey: "payment_type_id",  as: "paymentType",});
  
  return { PaymentTransaction, PaymentType, StudentPayment, PaymentWebhook, PaymentTypeLedgerMapping, StudentFeeAssignment };
}
