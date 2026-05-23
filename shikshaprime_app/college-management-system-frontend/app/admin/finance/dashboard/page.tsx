"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/src/hooks/useApi";
import "./finance-dashboard.css";
// <-- You will create this API function

import { Loader2 } from "lucide-react";
import { getFinanceDashboardStats, getRecentTransactions } from "@/src/services/financeService";
import { useRouter } from "next/navigation";

export default function FinanceDashboardPage() {

  // -----------------------------
  // API HOOK
  // -----------------------------
  const { call: fetchDashboardStats } = useApi(getFinanceDashboardStats);
  const { call: fetchRecentTx } = useApi(getRecentTransactions);

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // -----------------------------
  // FETCH DASHBOARD DATA
  // -----------------------------
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const statsRes = await fetchDashboardStats();
      const txRes = await fetchRecentTx();

      setStats({
        ...statsRes?.data,
        recentTransactions: txRes?.data || []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="p-0 md:p-0 with-full">
      {/* Header */}
      {/* <div className="content-header">
        <h3></h3>
      </div> */}
      <div className="flex justify-between mb-3 items-center">
        <h3 className="text-dark text-md font-semibold ">Finance Dashboard</h3>
        <div className="flex gap-3 items-center">
          <h3 className="text-sm text-dark/30 mb-0">Quick Action:</h3>
          <ul className="flex bg-flower rounded-sm gap-0 boreder border-flower">
            <li><button className="cursor-pointer cust text-sm text-white border-r px-3 py-1 hover:bg-white hover:text-flower"
              onClick={() => router.push("/admin/fees/collection")}>
              Collect Fees
            </button>
            </li>
            <li><button className="cursor-pointer cust text-sm text-white border-r px-3 py-1 hover:bg-white hover:text-flower"
              onClick={() => router.push("/admin/finance/create-voucher")}>
              Create Voucher
            </button>
            </li>
            <li>
              <button
                className="cursor-pointer cust text-sm text-white border-r px-3 py-1 hover:bg-white hover:text-flower"
                onClick={() => router.push("/admin/finance/reports")}
              >
                View Reports
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Stats Section */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="stats-card card-total">
            <div className="stat-icon-wrapper"><img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/total-collection-icon.svg`} width={'40px'} /></div>
            <div className="stat-info">
              <span className="text-2xl font-bold leading-none text-[#E96B43]">₹{stats?.totalCollection || 0}</span>
              <span className="mt-1 text-md font-medium text-[#01244E]">Total Collection</span>
            </div>
          </div>

          <div className="stats-card card-pending">
            <div className="stat-icon-wrapper"><img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/due-icon.svg`} width={'40px'} /></div>
            <div className="stat-info">
              <span className="text-2xl font-bold leading-none text-[#146CDF]">₹{stats?.pendingDues || 0}</span>
              <span className="mt-1 text-md font-medium text-[#01244E]">Pending Dues</span>
            </div>
          </div>

          <div className="stats-card card-graded">
            <div className="stat-icon-wrapper"><img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/bank-account-icon.svg`} width={'40px'} /></div>
            <div className="stat-info">
              <span className="text-2xl font-bold leading-none text-[#2dae75]">{stats?.bankAccounts || 0}</span>
              <span className="mt-1 text-md font-medium text-[#01244E]">Bank Accounts</span>
            </div>
          </div>

          <div className="stats-card card-submitted">
            <div className="stat-icon-wrapper"><img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/vouchers-icon.svg`} width={'40px'} /></div>
            <div className="stat-info">
              <span className="text-2xl font-bold leading-none text-[#941B74]">{stats?.vouchersToday || 0}</span>
              <span className="mt-1 text-md font-medium text-[#01244E]">Vouchers Today</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="form-card">
        <h3 className="text-lg font-semibold mb-4 text-[var(--text-dark)]">
          Recent Transactions
        </h3>

        <div className="scroll-table">
          <table className="custom-student-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Voucher No</th>
                <th>Type</th>
                <th>Dr/Cr</th>
                <th>Amount</th>
                <th>Ledger</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentTransactions?.length > 0 ? (
                stats.recentTransactions.flatMap((voucher: any) =>
                  voucher.entries.map((entry: any, idx: number) => {
                    const isDebit = Number(entry.debit_amount) > 0;
                    const amount = isDebit
                      ? entry.debit_amount
                      : entry.credit_amount;

                    return (
                      <tr key={`${voucher.id}-${entry.id}-${idx}`}>
                        <td>{voucher.voucher_date}</td>
                        <td>{voucher.voucher_no}</td>
                        <td>{voucher.voucher_type}</td>

                        {/* Dr/Cr */}
                        <td className={isDebit ? "text-green-600" : "text-red-600"}>
                          {isDebit ? "Debit" : "Credit"}
                        </td>

                        {/* Amount */}
                        <td>₹{amount}</td>

                        {/* Ledger */}
                        <td>{entry.ledger?.name}</td>
                      </tr>
                    );
                  })
                )
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
}