import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";
import { UtilService } from "./utilService";

export class OnlinePaymentService {  
  private utilService: UtilService;
  
  constructor() {    
    this.utilService = new UtilService();
  }
  
  async processOnlinePayment(orderId: string, tenant: string) {
    const models = getTenantModels(tenant);
    const sequelize = getTenantSequelize(tenant);

    return await sequelize.transaction(async (t) => {

      // 1) Load payment transaction (source of truth)
      const txn = await models.PaymentTransaction.findOne({
        where: { gateway_order_id: orderId },
        transaction: t
      });

      if (!txn || txn.gateway_status !== "COMPLETED") {
        throw new Error("Payment not successful");
      }

      // 2) Load student payment
      const studentPayment = await models.StudentPayment.findOne({
        where: { gateway_transaction_id: txn.gateway_transaction_id },
        transaction: t
      });

      if (!studentPayment) {
        throw new Error("Student payment not found");
      }

      const studentId = studentPayment.student_id;
      const amount = Number(studentPayment.amount);

      // 3) Create fee receipt
      const receiptNo = await this.utilService.generateReceiptNo(models, t);
      const academic_year_id = await this.utilService.getCurrentAcademicYearId(sequelize);

      const receipt = await models.FeeReceipt.create(
        {
          receipt_no: receiptNo,
          student_id: studentId,
          academic_year_id: academic_year_id,
          payment_mode: "ONLINE",
          total_amount: amount,
          reference_no: txn.gateway_transaction_id,
          narration: "Online fee payment",
          collected_by: 0,
          collected_at: new Date()
        },
        { transaction: t }
      );

      // 4) Create fee receipt item
      // 5) Resolve ledger mapping
      const mappingOne = await models.PaymentTypeLedgerMapping.findOne({
        where: { payment_type_id: studentPayment.payment_type_id },
        transaction: t
      });

      const incomeLedgerId = mappingOne.ledger_id;

      const mappingTwo = await models.FeeHead.findOne({
        where: { ledger_id: incomeLedgerId },
        transaction: t
      });

      const feeHeadId = mappingTwo.id;
      await models.FeeReceiptItem.create(
        {
          receipt_id: receipt.id,
          fee_head_id: feeHeadId,
          amount: amount
        },
        { transaction: t }
      );

      // 5) Resolve ledger mapping
      const mappingThree = await models.Ledger.findOne({
        where: { name: 'Online Payments Settlement Account' },
        transaction: t
      });
      
      const bankLedgerId = mappingThree.id;

      // 6) Create voucher
      const voucherNo = await this.utilService.generateVoucherNumber(models, "RECEIPT", t);
      const financial_year_id = await this.utilService.getCurrentFinancialYearId(sequelize);

      const voucher = await models.Voucher.create(
        {
          voucher_no: voucherNo,
          voucher_type: "RECEIPT",
          voucher_date: new Date(),
          reference_no: receipt.receipt_no,
          narration: `Online fee receipt ${receipt.receipt_no}`,
          financial_year_id: financial_year_id,
          created_by: null
        },
        { transaction: t }
      );

      // 7) Voucher entries
      await models.VoucherEntry.bulkCreate(
        [
          { voucher_id: voucher.id, ledger_id: bankLedgerId, debit_amount: amount },
          { voucher_id: voucher.id, ledger_id: incomeLedgerId, credit_amount: amount }
        ],
        { transaction: t }
      );

      // 8) Backlink IDs
      await receipt.update({ voucher_id: voucher.id }, { transaction: t });

      await studentPayment.update(
        {
          status: "paid",
          paid_amount: amount,
          paid_date: new Date(),
          voucher_id: voucher.id,
          receipt_id: receipt.id,
          fee_head_id: feeHeadId
        },
        { transaction: t }
      );

      await txn.update(
        {
          voucher_id: voucher.id,
          receipt_number: receipt.receipt_no,
        },
        { transaction: t }
      );

      return {
        receipt_no: receipt.receipt_no,
        voucher_no: voucher.voucher_no,
        amount,
        student_id: studentId
      };
    });
  }
  
  async processRegistrationPayment(orderId, tenant) {
    const models = getTenantModels(tenant);
    const sequelize = getTenantSequelize(tenant);

    return await sequelize.transaction(async (t) => {

      // 1) Load payment from payments table
      const payment = await models.Payment.findOne({
        where: { gateway_transaction_id: orderId, status: "SUCCESS" },
        transaction: t
      });

      if (!payment) {
        throw new Error("Registration payment not found or not successful");
      }

      const amount = Number(payment.amount);

      // 2) Create fee_receipt (student_id = null)
      const receiptNo = await this.utilService.generateReceiptNo(models, t);
      const academic_year_id = await this.utilService.getCurrentAcademicYearId(sequelize);

      const receipt = await models.FeeReceipt.create(
        {
          receipt_no: receiptNo,
          student_id: null,
          academic_year_id: academic_year_id,
          payment_mode: "ONLINE",
          total_amount: amount,
          reference_no: payment.gateway_transaction_id,
          narration: "Registration Fee Payment",
          collected_by: 0,
          collected_at: new Date()
        },
        { transaction: t }
      );

      // 3) Create fee_receipt_items (fee_head_id = null)
      await models.FeeReceiptItem.create(
        {
          receipt_id: receipt.id,
          fee_head_id: null,
          amount: amount
        },
        { transaction: t }
      );

      // 4) Resolve ledger mapping
      const mapping = await models.PaymentTypeLedgerMapping.findOne({
        include: [
          {
            model: models.PaymentType, as: "paymentType",
            required: true,
            where: { name: 'Registration Fee' }
          }
        ],
        transaction: t
      });

      const incomeLedgerId = mapping.ledger_id;
      const mappingThree = await models.Ledger.findOne({
        where: { name: 'Online Payments Settlement Account' },
        transaction: t
      });
      
      const bankLedgerId = mappingThree.id;

      // 5) Create voucher
      const voucherNo = await this.utilService.generateVoucherNumber(models, "RECEIPT", t);
      const financial_year_id = await this.utilService.getCurrentFinancialYearId(sequelize);
      const voucher = await models.Voucher.create(
        {
          voucher_no: voucherNo,
          voucher_type: "RECEIPT",
          voucher_date: new Date(),
          reference_no: receipt.receipt_no,
          narration: `Online fee receipt ${receipt.receipt_no}`,
          financial_year_id: financial_year_id,
          created_by: null
        },
        { transaction: t }
      );

      // 6) Voucher entries
      await models.VoucherEntry.bulkCreate(
        [
          { voucher_id: voucher.id, ledger_id: bankLedgerId, debit_amount: amount },
          { voucher_id: voucher.id, ledger_id: incomeLedgerId, credit_amount: amount }
        ],
        { transaction: t }
      );

      // 7) Update payments table
      await payment.update(
        {
          receipt_no: receipt.receipt_no,
          voucher_id: voucher.id,
          receipt_id: receipt.id
        },
        { transaction: t }
      );

      return {
        receipt_no: receipt.receipt_no,
        voucher_no: voucher.voucher_no,
        amount
      };
    });
  }

}
