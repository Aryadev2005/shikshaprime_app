"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/src/hooks/useApi";
import { getCashBook } from "@/src/services/financeService";
import "./cashbook.css";
import CashBookTable from "@/components/ui/CashBookTable";

export default function CashBookPage() {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const { data, loading, call: fetchCashBook } = useApi(getCashBook);

  // Fetch on date change
  const handleDateChange = (value: string) => {
    setDate(value);
    fetchCashBook(value);
  };

  // Initial load
  useEffect(() => {
    fetchCashBook(date);
  }, []);

  const totals = data?.data || {
    openingBalance: 0,
    totalReceipts: 0,
    totalPayments: 0,
    closingBalance: 0,
    entries: []
  };

  return (
    <div className="cashbook-container">
      
      {/* Date Filter */}
      <div className="cashbook-filter-card">
        <label className="font-medium">Select Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="cashbook-date-input"
        />
      </div>

      {/* Summary Cards */}
      <div className="cashbook-summary-grid">
        <div className="stats-card">
          <div className="stat-icon-wrapper flex h-12 w-12 shrink-0 items-center justify-center rounded-md md:h-18 md:w-18 bg-[#E96B4320] text-[#E96B4320]"><img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/opening-balence-icon.svg`} width={'40px'} /></div>
          <div className="stat-info">
            
            <p className="text-2xl font-bold leading-none text-[#E96B43]">
              ₹ {totals.openingBalance.toLocaleString()}
            </p>
            <h3 className="mt-1 text-md font-medium text-[#01244E]">Opening Balance</h3>

          </div>
        </div>

        <div className="stats-card">
          <div className="stat-icon-wrapper flex h-12 w-12 shrink-0 items-center justify-center rounded-md md:h-18 md:w-18 bg-[#146CDF20] text-[#146CDF20]"><img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/receipts-icon.svg`} width={'40px'} /></div>
          <div className="stat-info">
            <p className="text-2xl font-bold leading-none text-[#146CDF]">
              ₹ {totals.totalReceipts.toLocaleString()}
            </p>
            <h3 className="mt-1 text-md font-medium text-[#01244E]">Total Receipts</h3>
          </div>
        </div>

        <div className="stats-card">
          <div className="stat-icon-wrapper flex h-12 w-12 shrink-0 items-center justify-center rounded-md md:h-18 md:w-18 bg-[#2dae7520] text-[#2dae7520]"><img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/payment-icon-02.svg`} width={'40px'} /></div>
          <div className="stat-info">
            <p className="text-2xl font-bold leading-none text-[#2dae75]">
              ₹ {totals.totalPayments.toLocaleString()}
            </p>
            <h3 className="mt-1 text-md font-medium text-[#01244E]">Total Payments</h3>
          </div>
        </div>

        <div className="stats-card">
          <div className="stat-icon-wrapper flex h-12 w-12 shrink-0 items-center justify-center rounded-md md:h-18 md:w-18 bg-[#941B7420] text-[#941B7420]"><img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/opening-balence-icon.svg`} width={'40px'} /></div>
          <div className="stat-info">
            <p className="text-2xl font-bold leading-none text-[#941B74]">
              ₹ {totals.closingBalance.toLocaleString()}
            </p>
            <h3 className="mt-1 text-md font-medium text-[#01244E]">Closing Balance</h3>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="cashbook-table-card">
        <div className="cashbook-table-wrapper">
          <CashBookTable loading={loading} entries={totals.entries} />
        </div>
      </div>
    </div>
  );
}