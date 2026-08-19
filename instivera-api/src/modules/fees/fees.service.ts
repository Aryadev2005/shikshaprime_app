import { getTenantModels } from '../../models';
import { AppError } from '../../utils/appError';

export class FeesService {
  static async getDues(studentId: string, tenant: string) {
    const { FeeCollection, FeeHead } = getTenantModels(tenant) as any;
    const dues = await FeeCollection.findAll({
      where: { student_id: studentId, status: ['PENDING', 'OVERDUE', 'PARTIAL'] },
      include: [{ model: FeeHead, as: 'feeHead', attributes: ['id', 'name', 'amount'] }],
      order: [['due_date', 'ASC']],
    });
    return { dues };
  }

  static async getReceipts(studentId: string, tenant: string) {
    const { Receipt } = getTenantModels(tenant);
    const receipts = await Receipt.findAll({
      where: { student_id: studentId },
      order: [['date', 'DESC']],
    });
    return { receipts };
  }

  static async getLedger(studentId: string, tenant: string) {
    const { LedgerEntry } = getTenantModels(tenant);
    const entries = await LedgerEntry.findAll({
      where: { student_id: studentId },
      order: [['date', 'ASC']],
    });
    return { entries };
  }
}
