"use client";

import { useState } from "react";
import "./reports.css";

// Fee report pages
import DailyCollectionPage from "./daily-collection/page";
import HeadwiseCollectionPage from "./headwise-collection/page";
import OutstandingDuesPage from "./outstanding-dues/page";
import StudentLedgerPage from "./student-ledger/page";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
// import OnlinePaymentReconPage from "./online-payment-recon/page"; // later

const tabs = [
  { key: "daily", label: "Daily Collection" },
  { key: "headwise", label: "Head-wise Collection" },
  { key: "dues", label: "Outstanding Dues" },
  { key: "ledger", label: "Student Ledger" },
  // { key: "recon", label: "Online Payment Reconciliation" }, // later
];

export default function FeeReportsPage() {
  const [activeTab, setActiveTab] = useState("daily");

  const renderTab = () => {
    switch (activeTab) {
      case "daily":
        return <DailyCollectionPage />;
      case "headwise":
        return <HeadwiseCollectionPage />;
      case "dues":
        return <OutstandingDuesPage />;
      case "ledger":
        return <StudentLedgerPage />;
      default:
        return (
          <p className="reports-empty">
            This report will be available soon
          </p>
        );
    }
  };

  return (
    <div className="reports-container form-card">
      {/* Header */}
      <div className="reports-header">
        <div className="flex items-center mb-3">
          <Link href={'/admin/fees'} className="bg-primary rounded-md p-2 text-white me-3 w-8 h-8 flex items-center"><ChevronLeft className="h-5 w-5" /></Link><h3 className="text-dark text-lg font-semibold">Fee Reports</h3>
        </div>
        {/* Tabs */}
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
        {/* Content */}
        <div className="reports-content">{renderTab()}</div>
      </div>


    </div>
  );
}