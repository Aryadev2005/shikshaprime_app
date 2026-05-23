"use client";

import DayBookTable from "@/components/ui/DayBookTable";
import { useApi } from "@/src/hooks/useApi";
import { useEffect, useState } from "react";
import { getDayBook } from "@/src/services/financeService";
import "./daybook.css";
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";

export default function DayBookPage() {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const { data, loading, call: fetchDayBook } = useApi(getDayBook);

  // Fetch on date change
  const handleDateChange = (value: string) => {
    setDate(value);
    fetchDayBook(value);
  };

  // Initial load
  useEffect(() => {
    fetchDayBook(date);
  }, []);

  const totals = data?.data || {
    totalReceipts: 0,
    totalPayments: 0,
    entries: []
  };

  const summary = {
    totalReceipts: totals.totalReceipts,
    totalPayments: totals.totalPayments,
    netFlow: totals.totalReceipts - totals.totalPayments
  };

  return (
    <div className="daybook-container">

      {/* Date Filter */}
      <div className="daybook-filter-card">
        <Label className="font-medium">Select Date</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="daybook-date-input"
        />
      </div>

      {/* Summary Cards */}
      <div className="daybook-summary-grid">
        <div className="stats-card card-total">
          <div className="stat-icon-wrapper"><img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/receipts-icon.svg`} width={'40px'} /></div>
          <div className="stat-info">
            <span className="text-2xl font-bold leading-none text-[#E96B43]">
              ₹ {summary.totalReceipts.toLocaleString()}
            </span>
            <span className="mt-1 text-md font-medium text-[#01244E]">Total Receipts</span>
          </div>
        </div>

        <div className="stats-card card-pending">
          <div className="stat-icon-wrapper"><img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/payment-icon-02.svg`} width={'40px'} /></div>
          <div className="stat-info">
            <p className="text-2xl font-bold leading-none text-[#146CDF]">
              ₹ {summary.totalPayments.toLocaleString()}
            </p>
            <h3 className="mt-1 text-md font-medium text-[#01244E]">Total Payments</h3>
          </div>
        </div>

        <div className="stats-card card-submitted">
          <div className="stat-icon-wrapper"><img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/cash-flow-icon.svg`} width={'40px'} /></div>
          <div className="stat-info">
            <span
              className="text-2xl font-bold leading-none text-[#2dae75]"
            >
              ₹ {summary.netFlow.toLocaleString()}
            </span>
            <span className="mt-1 text-md font-medium text-[#01244E]">Net Cash Flow</span>

          </div>
        </div>
      </div>

      {/* Table */}
      <div className="daybook-table-card">
        <div className="daybook-table-wrapper">
          <DayBookTable loading={loading} entries={totals.entries} />
        </div>
      </div>
    </div>
  );
}