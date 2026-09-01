import { QueryTypes } from "sequelize";

export class UtilService {
    async getCurrentAcademicYearId(sequelize) {
      const rows = await sequelize.query(
        `SELECT id FROM academic_years WHERE start_date <= CURDATE() AND end_date >= CURDATE()
         LIMIT 1`,
        { type: QueryTypes.SELECT }
      );

      if (!rows || rows.length === 0) {
        throw new Error("No active financial year found");
      }
      return rows[0].id;
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
    async generateReceiptNo(models, t) {
        // Step 1: Create a dummy row to get the auto-increment ID
        const temp = await models.FeeReceipt.create(
        {
            receipt_no: "TEMP", // placeholder
            student_id: 0,
            academic_year_id: 0,
            payment_mode: "ONLINE",
            total_amount: 0,
            narration: "Online fee payment",
            collected_by: 0,
            collected_at: new Date()
        },
        { transaction: t }
        );

        const id = temp.id;

        // Step 2: Format the receipt number
        const year = new Date().getFullYear();
        const padded = String(id).padStart(6, "0");

        const receiptNo = `FR-${year}-${padded}`;

        // Step 3: Update the row with the real receipt number
        await temp.update({ receipt_no: receiptNo }, { transaction: t });

        return receiptNo;
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
}