import apiClient from "./apiClient";

/* ============================================================
   GET FINANCE DASHBOARD STATS
   ============================================================ */
export async function getFinanceDashboardStats() {
    const { data } = await apiClient.get("/finance/dashboard-stats");

    return {
        status: data.status,
        data: data.data,
        message: data.message
    };
}

/* ============================================================
   GET RECENT TRANSACTIONS (Optional separate API)
   ============================================================ */
export async function getRecentTransactions() {
    const { data } = await apiClient.get("/finance/recent-transactions");

    return {
        status: data.status,
        data: data.data,
        message: data.message
    };
}

/* ============================================================
   CREATE VOUCHER
   ============================================================ */
export async function createVoucher(payload: any) {
    const { data } = await apiClient.post("/finance/vouchers/create", payload);

    return {
        status: data.status,
        data: data.data,
        message: data.message
    };
}

/* ============================================================
   GET ALL LEDGERS
   ============================================================ */
export async function getLedgers() {
    const { data } = await apiClient.get("/finance/ledgers");

    return {
        status: data.status,
        data: data.data,
        message: data.message
    };
}

/* ============================================================
   GET BANK ACCOUNTS
   ============================================================ */
export async function getBankAccounts() {
    const { data } = await apiClient.get("/finance/bank-accounts");

    return {
        status: data.status,
        data: data.data,
        message: data.message
    };
}

/* ============================================================
   COLLECT FEES (Student-wise)
   ============================================================ */
export async function collectFees(payload: any) {
    const { data } = await apiClient.post("/finance/collect-fees", payload);

    return {
        status: data.status,
        data: data.data,
        message: data.message
    };
}

/* ============================================================
   SEARCH STUDENT WITH DUES
   ============================================================ */
export async function searchStudentWithDues(searchText: string) {
    const { data } = await apiClient.get("/finance/search-student-dues", {
        params: { q: searchText }
    });

    return {
        status: data.status,
        data: data.data,
        message: data.message
    };
}

export async function getDayBook(date: string) {
    const { data } = await apiClient.get("/finance/reports/day-book", {
        params: { date }
    });

    return {
        status: data.status,
        data: data.data,
        message: data.message
    };
}
export async function getCashBook(date: string) {
    const { data } = await apiClient.get("/finance/reports/cash-book", {
        params: { date }
    });

    return {
        status: data.status,
        data: data.data,
        message: data.message
    };
}

export async function getBankBook(bankAccountId: number, date: string) {
    const { data } = await apiClient.get("/finance/reports/bank-book", {
        params: { bankAccountId, date }
    });

    return {
        status: data.status,
        data: data.data,
        message: data.message
    };
}
export async function getLedgerStatement(ledger_id: string, from: string, to: string) {
    const { data } = await apiClient.get("/finance/reports/ledger-statement", {
        params: { ledger_id, from, to }
    });

    return {
        status: data.status,
        data: data.data,
        message: data.message
    };
}
export async function getTrialBalance(date: string) {
    const { data } = await apiClient.get("/finance/reports/trial-balance", {
        params: { date }
    });

    const rows = data.data || [];

    // Compute totals
    const totalDebit = rows.reduce((sum, r) => sum + (r.total_debit || 0), 0);
    const totalCredit = rows.reduce((sum, r) => sum + (r.total_credit || 0), 0);

    return {
        status: data.status,
        data: {
            totalDebit,
            totalCredit,
            entries: rows
        },
        message: data.message
    };
}
export async function getIncomeExpenditure(from: string, to: string) {
  const { data } = await apiClient.get("/finance/reports/income-expenditure", {
    params: { from, to }
  });

  const income = data.data.income || [];
  const expense = data.data.expense || [];

  const totalIncome = income.reduce((s, r) => s + r.total, 0);
  const totalExpense = expense.reduce((s, r) => s + r.total, 0);

  return {
    income,
    expense,
    totalIncome,
    totalExpense,
    surplus: totalIncome - totalExpense
  };
}
export async function getBalanceSheet(date: string) {
  const { data } = await apiClient.get("/finance/reports/balance-sheet", {
    params: { date }
  });

  return {
    assets: data.data.assets,
    liabilities: data.data.liabilities,
    capital: data.data.capital
  };
}
export async function createManualVoucher(payload: any) {
    const { data } = await apiClient.post("/finance/vouchers/manual", payload);
    return {
        status: data.status,
        data: data.data,
        message: data.message
    };
}