"use client";

import { useState } from "react";
import "./reports.css";
import DayBookPage from "../day-book/page";
import CashBookPage from "../cash-book/page";
import BankBookPage from "../bank-book/page";
import LedgerStatementPage from "../ledger-statement/page";
import TrialBalancePage from "../trial-balance/page";
import IncomeExpenditurePage from "../income-expenditure/page";
import BalanceSheetPage from "../balance-sheet/page";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

const tabs = [
  { key: "daybook", label: "Day Book" },
  { key: "cashbook", label: "Cash Book" },
  { key: "bankbook", label: "Bank Book" },
  { key: "ledger", label: "Ledger Statement" },
  { key: "trialbalance", label: "Trial Balance" },
  { key: "incomeexpense", label: "Income & Expenditure" },
  { key: "balancesheet", label: "Balance Sheet" }
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("daybook");

  const renderTab = () => {
    switch (activeTab) {
      case "daybook":
        return <DayBookPage />;
      case "cashbook":
        return <CashBookPage />;
      case "bankbook":
        return <BankBookPage />;
      case "ledger":
        return <LedgerStatementPage />;
      case "trialbalance":
        return <TrialBalancePage />;
      case "incomeexpense":
        return <IncomeExpenditurePage />;
      case "balancesheet":
        return <BalanceSheetPage />;
      default:
        return (
          <p className="reports-empty">
            This report will be available soon
          </p>
        );
    }
  };

  return (
    <div className="reports-container">
      {/* Header */}
      <div className="reports-header">
        <div className="flex items-center mb-3">
          <Link href={'/admin/finance/dashboard'} className="bg-primary rounded-md p-2 text-white me-3 w-8 h-8 flex items-center"><ChevronLeft className="h-5 w-5" /></Link><h3 className="text-dark text-lg font-semibold">Finance Reports</h3>
        </div>
        {/* Tabs */}
        <div className="form-card">
          <div className="reports-tabs-container flex items-center gap-4">
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`reports-tab ${activeTab === t.key ? "active" : ""
                  }`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="">{renderTab()}</div>

        </div>
      </div>

      {/* Content */}
    </div>
  );
}