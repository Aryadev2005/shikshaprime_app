import { QueryTypes } from "sequelize";
import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";

export class VoucherService {
    async createVoucher(payload: any, tenant: string) {
        const {
            voucher_type, voucher_date, reference_id, narration, created_by, lines } = payload;
        const models = getTenantModels(tenant);
        const sequelize = getTenantSequelize(tenant);
        return await sequelize.transaction(async (t: any) => {

      // 1. Generate voucher number
      const voucherNo = await this.generateVoucherNumber(models, voucher_type, t);
      const financial_year_id = await this.getCurrentFinancialYearId(sequelize);

      // 2. Insert voucher header
      const voucher = await models.Voucher.create(
        {
          voucher_no: voucherNo,
          voucher_type,
          voucher_date,
          financial_year_id,
          reference_no: reference_id,
          narration,
          created_by
        },
        { transaction: t }
      );

      // 3. Insert voucher entries
      for (const line of lines) {
        await models.VoucherEntry.create(
          {
            voucher_id: voucher.id,
            ledger_id: line.ledger_id,
            debit_amount: line.debit || 0,
            credit_amount: line.credit || 0,
            particulars: line.particulars || null
          },
          { transaction: t }
        );

        // 4. Update ledger balance cache
        await this.updateLedgerBalance(tenant, line.ledger_id, line.debit, line.credit, t);
      }     

      return {
        voucher_id: voucher.id,
        voucher_no: voucherNo,
        status: "POSTED",
        posted_at: new Date()
      };
    });
  }
  
  // Generate voucher number
  async generateVoucherNumber(models: any, type: string, t: any) {
        const prefix = {
            RECEIPT: "RV",
            PAYMENT: "PV",
            CONTRA: "CV",
            JOURNAL: "JV"
        }[type];

        const lastVoucher = await models.Voucher.findOne({
            where: { voucher_type: type },
            order: [["id", "DESC"]],
            transaction: t
        });

        const next = lastVoucher ? lastVoucher.id + 1 : 1;

        return `${prefix}-${new Date().getFullYear()}-${String(next).padStart(6, "0")}`;
  }
  // Update ledger balance
    async updateLedgerBalance(tenant: string, ledgerId: number, debit: number, credit: number, t: any) {
        const delta = Number(debit || 0) - Number(credit || 0);
        const models = getTenantModels(tenant);
        const existing = await models.LedgerBalanceCache.findOne({
            where: { ledger_id: ledgerId },
            transaction: t
        });

        if (!existing) {
            await models.LedgerBalanceCache.create(
            {
                ledger_id: ledgerId,
                opening_balance: 0,
                current_balance: delta,
                updated_at: new Date()
            },
            { transaction: t }
            );
        } else {
            await existing.update(
            {
                current_balance: Number(existing.current_balance) + Number(delta),
                updated_at: new Date()
            },
            { transaction: t }
            );
        }
    }
    async deleteVoucher(tenant: string, voucherId: number, userId: number) {
        const models = getTenantModels(tenant);
        const sequelize = getTenantSequelize(tenant);
        return await sequelize.transaction(async (t: any) => {

            const voucher = await models.Voucher.findOne({
            where: { id: voucherId },
            include: [{ model: models.VoucherEntry, as: "entries" }],
            transaction: t
            });

            if (!voucher) throw new Error("Voucher not found");
            if (voucher.voided) throw new Error("Voucher already voided");

            // Reverse ledger balances
            for (const entry of voucher.entries) {
            const reverseDebit = entry.credit_amount;
            const reverseCredit = entry.debit_amount;

            await this.updateLedgerBalance(
                tenant,
                entry.ledger_id,
                reverseDebit,
                reverseCredit,
                t
            );
            }

            // Mark voucher as voided
            await voucher.update(
            { voided: true },
            { transaction: t }
            );           

            return { message: "Voucher voided successfully" };
        });
    }

    async getCurrentFinancialYearId(sequelize) {
      const rows = await sequelize.query(
        `SELECT id FROM financial_years WHERE start_date <= CURDATE() AND end_date >= CURDATE()
         LIMIT 1`,
        { type: QueryTypes.SELECT }
      );

      if (!rows || rows.length === 0) {
        throw new Error("No active financial year found");
      }
      return rows[0].id;
    }

}