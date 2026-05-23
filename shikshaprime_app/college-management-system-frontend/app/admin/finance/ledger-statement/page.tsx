"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/src/hooks/useApi";
import { getLedgerStatement, getLedgers } from "@/src/services/financeService";
import "./ledgerstatement.css";
import LedgerStatementTable from "@/components/ui/LedgerStatementTable";

export default function LedgerStatementPage() {
  const today = new Date().toISOString().split("T")[0];

  const [ledgerId, setLedgerId] = useState<number | "">("");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  // Fetch ledgers
  const {
    data: ledgerList,
    call: fetchLedgers
  } = useApi(getLedgers);

  // Fetch ledger statement
  const {
    data,
    loading,
    call: fetchStatement
  } = useApi(getLedgerStatement);

  // Initial load
  useEffect(() => {
    fetchLedgers();
  }, []);

  const handleView = () => {
    if (!ledgerId) return;
    fetchStatement(ledgerId, fromDate, toDate);
  };

  const statement = data?.data || {
    openingBalance: 0,
    entries: []
  };

  return (
    <div className="ledgerstatement-container">

      {/* Filters */}
      <div className="ledgerstatement-filter-card">
        <div className="ledgerstatement-filter-row">

          {/* Ledger Dropdown */}
          <div className="ledgerstatement-filter-item">
            <label>Ledger</label>
            <select
              className="ledgerstatement-select"
              value={ledgerId}
              onChange={(e) => setLedgerId(Number(e.target.value))}
            >
              <option value="">-- Select Ledger --</option>
              {ledgerList?.data?.map((l: any) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div className="ledgerstatement-filter-item">
            <label>From</label>
            <input
              type="date"
              className="ledgerstatement-date-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          {/* To Date */}
          <div className="ledgerstatement-filter-item">
            <label>To</label>
            <input
              type="date"
              className="ledgerstatement-date-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {/* View Button */}
          <button className="ledgerstatement-view-btn" onClick={handleView}>
            View
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="ledgerstatement-table-card">
        <div className="ledgerstatement-table-wrapper">
          <LedgerStatementTable
            loading={loading}
            entries={statement.entries}
            openingBalance={statement.openingBalance}
          />
        </div>
      </div>
    </div>
  );
}