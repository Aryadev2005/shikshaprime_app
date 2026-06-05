import { getTenantSequelize } from '../server';
import { definePayment } from './payment';
import { definePaymentTransaction } from './paymentTransaction';

export function getTenantModels(tenant: string) {
  const sequelize = getTenantSequelize(tenant);

  const Payment = definePayment(sequelize);
  const PaymentTransaction = definePaymentTransaction(sequelize);

  Payment.hasMany(PaymentTransaction, { foreignKey: 'payment_id', as: 'transactions' });
  PaymentTransaction.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });

  return { Payment, PaymentTransaction };
}
