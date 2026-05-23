"use client";

import BankBookTable from "@/components/ui/BankBookTable";
import { useApi } from "@/src/hooks/useApi";
import { getBankAccounts, getBankBook } from "@/src/services/financeService";
import { useState, useEffect } from "react";
import "./bankbook.css";


export default function BankBookPage() {
    const today = new Date().toISOString().slice(0, 10);

    const [date, setDate] = useState(today);
    const [bankAccountId, setBankAccountId] = useState<number | null>(null);

    // Fetch bank accounts
    const {
        data: bankAccounts,
        call: fetchBankAccounts
    } = useApi(getBankAccounts);

    // Fetch bank book
    const {
        data: bankBook,
        loading: loadingBook,
        call: fetchBankBook
    } = useApi(() => getBankBook(bankAccountId!, date));

    useEffect(() => {
        fetchBankAccounts();
    }, []);

    const handleView = () => {
        if (bankAccountId) fetchBankBook();
    };

    return (
        <div className="report-container">
     
            {/* FILTER WRAPPER (same as Cash Book) */}
            <div className="report-filters-wrapper">
                <div className="report-filters">
                    <div className="filter-item">
                        <label>Bank Account</label>
                        <select
                            className="filter-select"
                            value={bankAccountId || ""}
                            onChange={(e) => setBankAccountId(Number(e.target.value))}
                        >
                            <option value="">-- Select Bank --</option>
                            {bankAccounts?.data?.map((b: any) => (
                                <option key={b.id} value={b.id}>
                                    {b.account_name} ({b.account_number})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-item">
                        <label>Date</label>
                        <input
                            type="date"
                            className="filter-date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    {/* Correct button class */}
                    <button className="primary-btn text-white py-3 rounded-md font-semibold" onClick={handleView}>
                        View
                    </button>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            {bankBook?.data && (
                <div className="report-summary-grid">
                    <div className="summary-card">
                        <p>Opening Balance</p>
                        <h3>₹{bankBook.data.openingBalance}</h3>
                    </div>
                    <div className="summary-card">
                        <p>Total Receipts</p>
                        <h3>₹{bankBook.data.totalReceipts}</h3>
                    </div>
                    <div className="summary-card">
                        <p>Total Payments</p>
                        <h3>₹{bankBook.data.totalPayments}</h3>
                    </div>
                    <div className="summary-card">
                        <p>Closing Balance</p>
                        <h3>₹{bankBook.data.closingBalance}</h3>
                    </div>
                </div>
            )}

            {/* TABLE */}
            {loadingBook ? (
                <p className="loading-text">Loading...</p>
            ) : bankBook?.data?.entries?.length ? (
                <BankBookTable entries={bankBook.data.entries} />
            ) : (
                <p className="empty-state">No entries found.</p>
            )}
        </div>
    );
}