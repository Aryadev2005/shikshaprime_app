import { getTenantSequelize } from '../server';
import { defineFeeHead } from './feeHead';
import { defineFeeCollection } from './feeCollection';
import { defineReceipt } from './receipt';
import { defineLedgerEntry } from './ledgerEntry';

export function getTenantModels(tenant: string) {
  const sequelize = getTenantSequelize(tenant);

  const FeeHead = defineFeeHead(sequelize);
  const FeeCollection = defineFeeCollection(sequelize);
  const Receipt = defineReceipt(sequelize);
  const LedgerEntry = defineLedgerEntry(sequelize);

  // FeeCollection joins FeeHead for the fee_head_name
  FeeCollection.belongsTo(FeeHead, { foreignKey: 'fee_head_id', as: 'feeHead' });
  FeeHead.hasMany(FeeCollection, { foreignKey: 'fee_head_id', as: 'collections' });

  return { FeeHead, FeeCollection, Receipt, LedgerEntry };
}
