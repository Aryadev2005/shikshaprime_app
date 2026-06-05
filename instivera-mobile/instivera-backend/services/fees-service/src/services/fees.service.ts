import { getTenantModels } from '../models';
import type {
  UpstreamFeesDue,
  UpstreamReceipt,
  UpstreamLedgerEntry,
} from '../types/payment.types';

export class FeesService {
  /**
   * Returns { dues: UpstreamFeesDue[] } — matches UpstreamFeesDuesResponse.data exactly.
   */
  async getDues(studentId: string, tenant: string): Promise<{ dues: UpstreamFeesDue[] }> {
    const { FeeCollection, FeeHead } = getTenantModels(tenant);

    const collections: any[] = await (FeeCollection as any).findAll({
      where: { student_id: studentId },
      include: [{ model: FeeHead, as: 'feeHead', attributes: ['name'] }],
      order: [['due_date', 'ASC']],
    });

    const dues: UpstreamFeesDue[] = collections.map((c: any) => ({
      id: c.collection_id || String(c.id),
      fee_head_name: c.feeHead?.name || 'Fee',
      amount: parseFloat(c.amount) || 0,
      paid_amount: parseFloat(c.paid_amount) || 0,
      balance: parseFloat(c.balance) || parseFloat(c.amount) - parseFloat(c.paid_amount || 0),
      due_date: c.due_date ? String(c.due_date) : new Date().toISOString().split('T')[0],
      status: (c.status || 'PENDING') as UpstreamFeesDue['status'],
    }));

    return { dues };
  }

  /**
   * Returns UpstreamReceipt[] — matches UpstreamReceiptsResponse.data exactly.
   */
  async getReceipts(studentId: string, tenant: string): Promise<UpstreamReceipt[]> {
    const { Receipt } = getTenantModels(tenant);

    const receipts: any[] = await (Receipt as any).findAll({
      where: { student_id: studentId },
      order: [['created_at', 'DESC']],
    });

    return receipts.map((r: any): UpstreamReceipt => ({
      id: r.receipt_id || String(r.id),
      receipt_number: r.receipt_number || String(r.id),
      date: r.date ? String(r.date) : (r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : ''),
      amount: parseFloat(r.amount) || 0,
      payment_mode: r.payment_mode || 'CASH',
      description: r.description || undefined,
    }));
  }

  /**
   * Returns { entries, openingBalance, closingBalance } — matches UpstreamLedgerResponse.data exactly.
   */
  async getLedger(
    studentId: string,
    tenant: string
  ): Promise<{ entries: UpstreamLedgerEntry[]; openingBalance: number; closingBalance: number }> {
    const { LedgerEntry } = getTenantModels(tenant);

    const rows: any[] = await (LedgerEntry as any).findAll({
      where: { student_id: studentId },
      order: [['date', 'ASC'], ['id', 'ASC']],
    });

    const entries: UpstreamLedgerEntry[] = rows.map((r: any): UpstreamLedgerEntry => ({
      date: r.date ? String(r.date) : new Date().toISOString().split('T')[0],
      description: r.description || '',
      debit: r.debit ? parseFloat(r.debit) : undefined,
      credit: r.credit ? parseFloat(r.credit) : undefined,
      balance: parseFloat(r.balance) || 0,
    }));

    const openingBalance = entries.length > 0 ? entries[0].balance : 0;
    const closingBalance = entries.length > 0 ? entries[entries.length - 1].balance : 0;

    return { entries, openingBalance, closingBalance };
  }
}

export default new FeesService();
