
export class FinanceIntegrationService {
  private baseURL: string;

  constructor() {
    // You can configure this in your config file
    this.baseURL = process.env.FINANCE_SERVICE_URL || 'http://localhost:3001/api';
  }
  async createJournalVoucher(
    payload: any, token: string, tenant: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/finance/vouchers/journal`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token, // Pass the admin token
          'X-TENANT': tenant,
        }, 
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000)
    });
    console.log("Sending voucher payload:", payload);
    const responseData: any = await response.json();
    console.log("Received voucher:", responseData.data);
    return responseData.data;
  }
}