"use client";

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/src/context/authContext";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useApi } from "@/src/hooks/useApi";
import { collectFees, searchStudentWithDues } from "@/src/services/feeCollectionService";
import "./fee-collection.css";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { getBankAccounts } from "@/src/services/financeService";

export default function FeeCollectionPage() {
  const router = useRouter();
  const { user, isInitialized } = useContext(AuthContext)!;

  // -----------------------------
  // STATE
  // -----------------------------
  const [searchText, setSearchText] = useState("");
  const [student, setStudent] = useState<any>(null);
  const [dues, setDues] = useState<any[]>([]);
  const [selectedHeads, setSelectedHeads] = useState<any[]>([]);
  const [paymentMode, setPaymentMode] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [narration, setNarration] = useState("");
  const [loading, setLoading] = useState(false);

  const { call: searchStudent } = useApi(searchStudentWithDues);
  const { call: collectFeesFromStudents } = useApi(collectFees);
  // Fetch bank accounts
      const {
          data: bankAccounts,
          call: fetchBankAccounts
      } = useApi(getBankAccounts);

  useEffect(() => {
    if (isInitialized) {
      fetchBankAccounts();
    }
  }, [isInitialized]);

  // -----------------------------
  // FETCH STUDENT
  // -----------------------------
  const handleSearch = async () => {
    if (!searchText.trim()) return;

    setLoading(true);
    try {
      const response = await searchStudent(searchText);
      setStudent(response.data.student || null);
      setDues(response.data.dues || []);
      setSelectedHeads([]);
    } catch (err) {
      console.error("Error fetching student:", err);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // SELECT FEE HEADS
  // -----------------------------
  const toggleHead = (head: any) => {
    const exists = selectedHeads.find((h) => h.id === head.id);

    if (exists) {
      setSelectedHeads(selectedHeads.filter((h) => h.id !== head.id));
    } else {
      setSelectedHeads([...selectedHeads, head]);
    }
  };

  // -----------------------------
  // CALCULATE TOTALS
  // -----------------------------
  const totalAmount = selectedHeads.reduce(
    (sum, h) => sum + Number(h.amount),
    0
  );

  const totalDiscount = selectedHeads.reduce(
    (sum, h) => sum + Number(h.discount || 0),
    0
  );

  const totalFine = selectedHeads.reduce(
    (sum, h) => sum + Number(h.fine || 0),
    0
  );

  const grandTotal = totalAmount - totalDiscount + totalFine;

  // -----------------------------
  // SUBMIT FEE COLLECTION
  // -----------------------------
  const handleCollectFee = async () => {
    if (!student || selectedHeads.length === 0) return;

    setLoading(true);
    try {
      const payload = {
        student_id: student.id,
        payment_mode: paymentMode,
        bank_account_id: bankAccount || null,
        reference_no: referenceNo,
        narration,
        fee_heads: selectedHeads.map((h) => ({
          fee_head_id: h.fee_head_id,
          amount: h.amount,
        })),
      };

      const response = await collectFeesFromStudents(payload);
      console.log("Fee collected:", response);
    } catch (err) {
      console.error("Error collecting fee:", err);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="fee-collection-wrapper">
      <div className="flex items-center mb-3">
        <button type="button" onClick={() => router.back()} className="bg-primary rounded-md p-2 text-white me-3 w-8 h-8 flex items-center cursor-pointer border-none">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-dark text-lg font-semibold">Fee Collection</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">

          {/* STUDENT SEARCH */}
          <div className="form-card">
            <h4 className="text-lg font-semibold mb-4">Search Student</h4>

            <div className="form-group">
              <Label className="form-L">Search by Name / Student ID / Email</Label>
              <Input
                type="text"
                className="sa-date-input w-full"
                placeholder="Enter search text..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <Button
              className="primary-btn text-white mt-2 flex items-center justify-center gap-2 h-10"
              disabled={loading}
              onClick={handleSearch}
            >
              {loading ? (
                <>
                  <Loader />
                  <span>Searching...</span>
                </>
              ) : (
                "Search"
              )}
            </Button>

            {student && (
              <div className="mt-4 p-3 bg-white rounded-md shadow-sm border">
                <p className="text-sm">Name: <strong>{student.student_name}</strong></p>
                <p className="text-sm">Email: <strong>{student.email}</strong></p>
                <p className="text-sm">Student ID: <strong>{student.student_id}</strong></p>
              </div>
            )}
          </div>

          {/* FEE DUES TABLE */}
          {student && (
            <div className="form-card">
              <h4 className="text-lg font-semibold mb-4">Fee Dues</h4>

              <table className="custom-student-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Fee Head</th>
                    <th>Due</th>
                    <th>Discount</th>
                    <th>Fine</th>
                    <th>Payable</th>
                  </tr>
                </thead>
                <tbody>
                  {dues.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedHeads.some((h) => h.id === item.id)}
                          onChange={() => toggleHead(item)}
                        />
                      </td>
                      <td>{item.name}</td>
                      <td>₹{item.amount}</td>
                      <td>₹{item.discount || 0}</td>
                      <td>₹{item.fine || 0}</td>
                      <td>₹{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">

          {/* PAYMENT DETAILS */}
          {student && (
            <div className="form-card">
              <h4 className="text-lg font-semibold mb-4">Payment Details</h4>

              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select
                  className="fee-dropdown-select"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="">Select Mode</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank</option>
                  <option value="ONLINE">Online</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              {paymentMode === "BANK" || paymentMode === "ONLINE" ? (
                <div className="form-group">
                  <label className="form-label">Bank Account</label>
                  <select
                    className="fee-dropdown-select"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                  >
                    <option value="">Select Bank</option>
                     {bankAccounts?.data?.map((b: any) => (
                          <option key={b.id} value={b.id}>
                              {b.account_name} ({b.account_number})
                          </option>
                      ))}
                  </select>
                </div>
              ) : null}

              <div className="form-group">
                <label className="form-label">Reference No</label>
                <input
                  type="text"
                  className="sa-date-input w-full"
                  placeholder="RRN / UTR / Cheque No"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Narration</label>
                <textarea
                  className="sa-date-input w-full"
                  rows={3}
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                ></textarea>
              </div>
            </div>
          )}

          {/* SUMMARY */}
          {student && (
            <div className="form-card">
              <h4 className="text-lg font-semibold mb-4">Summary</h4>

              <div className="flex justify-between text-sm mb-2">
                <span>Total Selected Amount</span>
                <strong>₹{totalAmount}</strong>
              </div>

              <div className="flex justify-between text-sm mb-2">
                <span>Total Discount</span>
                <strong>₹{totalDiscount}</strong>
              </div>

              <div className="flex justify-between text-sm mb-2">
                <span>Total Fine</span>
                <strong>₹{totalFine}</strong>
              </div>

              <hr className="my-3" />

              <div className="flex justify-between text-base font-semibold mb-4">
                <span>Grand Total</span>
                <strong>₹{grandTotal}</strong>
              </div>

              <Button
                className="primary-btn text-white w-full py-3 rounded-md text-base font-semibold"
                onClick={handleCollectFee}
              >
                {loading ? <Loader /> : "Collect Fee"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}