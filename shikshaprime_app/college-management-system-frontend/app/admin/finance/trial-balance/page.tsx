"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/src/hooks/useApi";
import { getTrialBalance } from "@/src/services/financeService";
import "./trialbalance.css";
import TrialBalanceTable from "@/components/ui/TrialBalanceTable";

export default function TrialBalancePage() {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const { data, loading, call: fetchTrialBalance } = useApi(getTrialBalance);

  // Fetch on date change
  const handleDateChange = (value: string) => {
    setDate(value);
    fetchTrialBalance(value);
  };

  // Initial load
  useEffect(() => {
    fetchTrialBalance(date);
  }, []);

  const totals = data?.data || {
    totalDebit: 0,
    totalCredit: 0,
    entries: []
  };

  const summary = {
    totalDebit: totals.totalDebit,
    totalCredit: totals.totalCredit,
    difference: totals.totalDebit - totals.totalCredit
  };

  return (
    <div className="trialbalance-container">

      {/* Date Filter */}
      <div className="trialbalance-filter-card">
        <label className="font-medium">Select Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="trialbalance-date-input"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-3 grid-cols-1">
        <div className="stats-card">
          <div className="stat-icon-wrapper flex h-12 w-12 shrink-0 items-center justify-center rounded-md md:h-18 md:w-18 bg-[#E96B4320] text-[#E96B4320]"><img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/debit-icon.svg`} width={'40px'} /></div>
          <div className="stat-info">
            <p className="text-2xl font-bold leading-none text-[#E96B43]">
              ₹ {summary.totalDebit?.toLocaleString()}
            </p>
            <h3 className="mt-1 text-md font-medium text-[#01244E]">Total Debit</h3>

          </div>
        </div>

        <div className="stats-card">
          <div className="stat-icon-wrapper flex h-12 w-12 shrink-0 items-center justify-center rounded-md md:h-18 md:w-18 bg-[#146CDF20] text-[#146CDF20]"><img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/cradit-icon.svg`} width={'40px'} /></div>
          <div className="stat-info">
            <p className="text-2xl font-bold leading-none text-[#146CDF]">
              ₹ {summary.totalCredit?.toLocaleString()}
            </p>
            <h3 className="mt-1 text-md font-medium text-[#01244E]">Total Credit</h3>
          </div>
        </div>

        <div className="stats-card">
          <div className="stat-icon-wrapper flex h-12 w-12 shrink-0 items-center justify-center rounded-md md:h-18 md:w-18 bg-[#2dae7520] text-[#2dae7520]"><img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/difference-icon.svg`} width={'40px'} /></div>
          <div className="stat-info">
            <p
              className="text-2xl font-bold leading-none text-[#2dae75]">
              ₹ {summary?.difference?.toLocaleString()}
            </p>
            <h3 className="mt-1 text-md font-medium text-[#01244E]">Difference</h3>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="trialbalance-table-card">
        <div className="trialbalance-table-wrapper">
          <TrialBalanceTable loading={loading} entries={totals.entries} />
        </div>
      </div>
    </div>
  );
}