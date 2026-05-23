"use client";

import { useState } from "react";
import { useApi } from "@/src/hooks/useApi";
import { getBalanceSheet } from "@/src/services/financeService";
import "./balancesheet.css";
import BalanceSheetTable from "@/components/ui/BalanceSheetTable";

export default function BalanceSheetPage() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  const { data, loading, call: fetchReport } = useApi(getBalanceSheet);

  const sheet = data || {
    assets: [],
    liabilities: [],
    capital: []
  };

  return (
    <div className="bs-container">

      {/* Filter */}
      <div className="bs-filter-card">
        <label>Select Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bs-date-input"
        />
        <button className="bs-view-btn" onClick={() => fetchReport(date)}>
          View
        </button>
      </div>

      {/* Assets */}
      <div className="bs-table-card">
        <h3 className="bs-title">Assets</h3>
        <BalanceSheetTable loading={loading} rows={sheet.assets} />
      </div>

      {/* Liabilities */}
      <div className="bs-table-card">
        <h3 className="bs-title">Liabilities</h3>
        <BalanceSheetTable loading={loading} rows={sheet.liabilities} />
      </div>

      {/* Capital */}
      <div className="bs-table-card">
        <h3 className="bs-title">Capital</h3>
        <BalanceSheetTable loading={loading} rows={sheet.capital} />
      </div>
    </div>
  );
}