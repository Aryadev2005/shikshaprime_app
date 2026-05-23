"use client";

import { useState } from "react";
import { useApi } from "@/src/hooks/useApi";
import { getIncomeExpenditure } from "@/src/services/financeService";
import "./incomeexpenditure.css";
import IncomeExpenseTable from "@/components/ui/IncomeExpenseTable";
import { Button } from "@/components/ui/button";

export default function IncomeExpenditurePage() {
  const today = new Date().toISOString().split("T")[0];

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const { data, loading, call: fetchReport } = useApi(getIncomeExpenditure);

  const handleView = () => fetchReport(from, to);

  const summary = data || {
    income: [],
    expense: [],
    totalIncome: 0,
    totalExpense: 0,
    surplus: 0
  };

  return (
    <div className="ie-container">

      {/* Filter Bar */}
      <div className="ie-filter-card">
        <div className="ie-filter-row">
          <div className="ie-filter-item">
            <label>From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="ie-date-input"
            />
          </div>

          <div className="ie-filter-item">
            <label>To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="ie-date-input"
            />
          </div>

          <Button variant="primary" onClick={handleView}>
            View
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="ie-summary-grid">
        <div className="stats-card">
          <div className="stat-icon-wrapper flex h-12 w-12 shrink-0 items-center justify-center rounded-md md:h-18 md:w-18 bg-[#E96B4320] text-[#E96B4320]"><img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/payment-icon-02.svg`} width={'40px'} /></div>
          <div className="stat-info">
            <p className="text-2xl font-bold leading-none text-[#E96B43]">₹ {summary.totalIncome.toLocaleString()}</p>
            <h3 className="mt-1 text-md font-medium text-[#01244E]">Total Income</h3>
          </div>
        </div>

        <div className="stats-card">
          <div className="stat-icon-wrapper flex h-12 w-12 shrink-0 items-center justify-center rounded-md md:h-18 md:w-18 bg-[#146CDF20] text-[#146CDF20]"><img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/receipts-icon.svg`} width={'40px'} /></div>
          <div className="stat-info">
            <p className="text-2xl font-bold leading-none text-[#E96B43]">₹ {summary.totalExpense.toLocaleString()}</p>
            <h3 className="mt-1 text-md font-medium text-[#01244E]">Total Expense</h3>
          </div>
        </div>

        <div className="stats-card">
          <div className="stat-icon-wrapper flex h-12 w-12 shrink-0 items-center justify-center rounded-md md:h-18 md:w-18 bg-[#2dae7520] text-[#2dae7520]"><img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/deficit-icon.svg`} width={'40px'} /></div>
          <div className="stat-info">
            <p className={summary.surplus >= 0 ? "text-green text-2xl font-bold leading-none" : "text-red text-2xl font-bold leading-none"}>
              ₹ {summary.surplus.toLocaleString()}
            </p>
            <h3 className="mt-1 text-md font-medium text-[#01244E]">Surplus / Deficit</h3>
          </div>

        </div>
      </div>

      {/* Income Table */}
      <div className="ie-table-card">
        <h3 className="ie-table-title">Income</h3>
        <IncomeExpenseTable loading={loading} rows={summary.income} />
      </div>

      {/* Expense Table */}
      <div className="ie-table-card">
        <h3 className="ie-table-title">Expense</h3>
        <IncomeExpenseTable loading={loading} rows={summary.expense} />
      </div>
    </div>
  );
}