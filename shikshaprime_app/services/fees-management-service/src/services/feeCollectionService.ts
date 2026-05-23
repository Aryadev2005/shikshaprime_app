import { QueryTypes } from "sequelize";
import { FinanceIntegrationService } from "../client/financeServiceIntegration";
import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";
import { UtilService } from "./utilService";


export class FeeCollectionService {
  private financeService: FinanceIntegrationService;
  private utilService: UtilService;

  constructor() {
    this.financeService = new FinanceIntegrationService();
    this.utilService = new UtilService();
  }
  

  async collectFee(payload, token, tenant): Promise<any> {
    const {
      student_id,
      payment_mode,
      bank_account_id,
      reference_no,
      narration,
      fee_heads,
      collected_by
    } = payload;
    const sequelize = getTenantSequelize(tenant);
    const models = getTenantModels(tenant);
    const academic_year_id = await this.utilService.getCurrentAcademicYearId(sequelize);
    return await sequelize.transaction(async (t) => {
      // -----------------------------------------
      // 1. Validate fee heads & fetch ledger IDs
      // -----------------------------------------
      const headIds = fee_heads.map((h) => h.fee_head_id);

      const heads = await models.FeeHead.findAll({
        where: { id: headIds },
        transaction: t,
      });

      if (heads.length !== headIds.length) {
        throw new Error("Invalid fee head(s) selected");
      }

      // -----------------------------------------
      // 2. Create Fee Receipt
      // -----------------------------------------
      const fee_heads_numeric = fee_heads.map(h => ({
        ...h,
        amount: Number(h.amount),
        discount: Number(h.discount || 0),
        fine: Number(h.fine || 0)
      }));
      const totalAmount = fee_heads_numeric.reduce((sum, h) => sum + h.amount, 0);

      const receipt = await models.FeeReceipt.create(
        {
          receipt_no: `FEE-${Date.now()}`,
          student_id,
          academic_year_id,
          payment_mode,
          bank_account_id: bank_account_id || null,
          total_amount: totalAmount,
          reference_no,
          narration,
          collected_by,
          collected_at: new Date()          
        },
        { transaction: t }
      );

      // -----------------------------------------
      // 3. Create Fee Receipt Items
      // -----------------------------------------
      const items = fee_heads.map((h) => ({
        receipt_id: receipt.id,
        fee_head_id: h.fee_head_id,
        amount: h.amount,
        discount_amount: 0,
        fine_amount: 0
      }));

      await models.FeeReceiptItem.bulkCreate(items, { transaction: t });

      // -----------------------------------------
      // 4. Prepare payload for finance-service
      // -----------------------------------------
      const voucherPayload = {
        payment_mode,
        bank_account_id,
        student_id,
        narration,
        fee_heads: heads.map((h, index) => ({
          ledger_id: h.ledger_id,
          amount: fee_heads[index].amount,
        })),
        created_by: collected_by
      };

      // -----------------------------------------
      // 5. Call finance-service
      // -----------------------------------------
      const voucher = await this.financeService.createReceiptVoucher(voucherPayload, token, tenant);

      // -----------------------------------------
      // 6. Update receipt with voucher_id
      // -----------------------------------------
      receipt.voucher_id = voucher.voucher_id;
      await receipt.save({ transaction: t });

      // -----------------------------------------
      // 7. Return final response
      // -----------------------------------------
      return {
        receipt_id: receipt.id,
        receipt_no: receipt.receipt_no,
        voucher_id: voucher.voucher_id,
        total_amount: totalAmount,
        collected_at: receipt.collected_at,
      };
    });
  }
  async getReceipt(receipt_id: number, tenant: string) {
    if (!receipt_id) {
      throw new Error("receipt_id is required");
    }
    const models = getTenantModels(tenant);
    const receipt = await models.FeeReceipt.findOne({
      where: { id: receipt_id },
      include: [
        {
          model: models.FeeReceiptItem,
          as: "items",
          include: [
            {
              model: models.FeeHead,
              as: "fee_head",
              attributes: ["id", "name", "ledger_id"],
            },
          ],
        },
      ],
      order: [["id", "ASC"]],
    });

    if (!receipt) {
      throw new Error("Receipt not found");
    }

    return receipt;
  }

  async getStudentReceipts(student_id: number, tenant: string) {
    if (!student_id) {
      throw new Error("student_id is required");
    }
    const models = getTenantModels(tenant);
    const receipts = await models.FeeReceipt.findAll({
      where: { student_id },
      include: [
        {
          model: models.FeeReceiptItem,
          as: "items",
          include: [
            {
              model: models.FeeHead,
              as: "fee_head",
              attributes: ["id", "name", "ledger_id"],
            },
          ],
        },
      ],
      order: [["collected_at", "DESC"]],
    });
    return receipts;
  }
}