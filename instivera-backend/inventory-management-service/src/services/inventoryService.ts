import { getTenantModels } from "../models";

interface FinanceJournalLine {
  ledger_id: number;
  debit: number;
  credit: number;
  meta?: Record<string, any>;
}

interface FinanceJournalPayload {
  tenant: string;
  source: 'inventory';
  source_reference: string;
  type: 'ASSET_PURCHASE';
  date: string;
  lines: FinanceJournalLine[];
}

export class InventoryService {
    async getLedgerMappingForCategory(categoryId: number, tenant: string) {
        const mapping: any = await getTenantModels(tenant).InventoryCategoryLedgerMapping.findOne({
            where: { category_id: categoryId },
        });

        if (!mapping) {
            throw new Error(`No ledger mapping found for category_id ${categoryId}`);
        }

        return {
            ledgerId: mapping.ledger_id,
            isConsumable: mapping.is_consumable,
        };
    }
    async buildFinanceJournalPayload({
        procurement,
        items,
        vendorLedgerId,
        tenant
        }: {
        procurement: any;
        items: any[];
        vendorLedgerId: number;
        tenant: string;
        }): Promise<FinanceJournalPayload> {
        const lines: FinanceJournalLine[] = [];

        for (const item of items) {
            const totalCost = item.estimated_unit_cost * item.quantity;

            // Load category → ledger mapping
            const { ledgerId, isConsumable } = await this.getLedgerMappingForCategory(
            item.category_id,
            tenant
            );

            if (isConsumable) {
            // Debit: Consumables Expense
            lines.push({
                ledger_id: ledgerId,
                debit: totalCost,
                credit: 0,
                meta: {
                item_name: item.item_name,
                quantity: item.quantity,
                category_id: item.category_id,
                type: 'CONSUMABLE',
                },
            });
            } else {
            // Debit: Asset Ledger
            lines.push({
                ledger_id: ledgerId,
                debit: totalCost,
                credit: 0,
                meta: {
                item_name: item.item_name,
                quantity: item.quantity,
                category_id: item.category_id,
                type: 'CAPITAL_ASSET',
                },
            });
            }
        }

        // Total credit amount
        const totalAmount = items.reduce(
            (sum, item) => sum + item.estimated_unit_cost * item.quantity,
            0
        );

        // Credit: Vendor / Cash / Bank
        lines.push({
            ledger_id: vendorLedgerId,
            debit: 0,
            credit: totalAmount,
            meta: {
            vendor_id: procurement.vendor_id,
            payment_mode: procurement.payment_mode,
            },
        });

        return {
            tenant: tenant,
            source: 'inventory',
            source_reference: procurement.request_number,
            type: 'ASSET_PURCHASE',
            date: new Date().toISOString().slice(0, 10),
            lines,
        };
    }

    async getVendorLedgerId(procurement: any, tenant: string) {
        const models = getTenantModels(tenant);
        // 1. If vendor exists → Accounts Payable
        if (procurement.vendor_id) {
            const accountsPayable: any = await models.Ledgers.findOne({
            where: { name: 'Accounts Payable' },
            });

            if (!accountsPayable) {
            throw new Error('Accounts Payable ledger not found');
            }

            return accountsPayable.id; // usually 15
        }

        // 2. If payment mode is CASH
        if (procurement.payment_mode === 'CASH') {
            const cashLedger: any = await models.Ledgers.findOne({
            where: { name: 'Cash in Hand' },
            });

            if (!cashLedger) {
            throw new Error('Cash in Hand ledger not found');
            }

            return cashLedger.id; // usually 1
        }

        // 3. If payment mode is BANK
        if (procurement.payment_mode === 'BANK') {
            const bankAccount: any = await models.BankAccounts.findOne({
            where: { id: procurement.bank_account_id },
            });

            if (!bankAccount) {
            throw new Error('Bank account not found');
            }

            return bankAccount.ledger_id; // bank ledger
        }

        // 4. If nothing matches
        throw new Error('Unable to determine vendor ledger for procurement');
    }

}