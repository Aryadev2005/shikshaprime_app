"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import "./create-voucher.css";

import { useApi } from "@/src/hooks/useApi";
import { getLedgers, createManualVoucher } from "@/src/services/financeService";

import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Button } from "@/components/ui/button";

export default function CreateVoucherPage() {
  const router = useRouter();

  // -----------------------------
  // STATE
  // -----------------------------
  const [voucherType, setVoucherType] = useState("RECEIPT");
  const [voucherDate, setVoucherDate] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [narration, setNarration] = useState("");

  // MULTI-LINE VOUCHER ENTRIES
  const [lines, setLines] = useState([
    { ledger_id: "", debit: "", credit: "" }
  ]);

  const {
    data: ledgerList,
    loading: loadingLedgers,
    call: loadLedgers,
  } = useApi(getLedgers);

  const {
    loading: saving,
    call: saveVoucher,
  } = useApi(createManualVoucher);

  useEffect(() => {
    loadLedgers();
  }, []);

  // -----------------------------
  // LINE HANDLERS
  // -----------------------------
  const addLine = () => {
    setLines([...lines, { ledger_id: "", debit: "", credit: "" }]);
  };

  const removeLine = (index) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;
    setLines(updated);
  };

  // -----------------------------
  // SUBMIT
  // -----------------------------
  const handleSubmit = async () => {
    if (!voucherDate) {
      alert("Voucher date is required");
      return;
    }

    const formattedLines = lines.map((l) => ({
      ledger_id: Number(l.ledger_id),
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
    }));

    const payload = {
      voucher_type: voucherType,
      voucher_date: voucherDate,
      reference_id: referenceNo,
      narration,
      lines: formattedLines,
    };

    const result = await saveVoucher(payload);

    if (result?.data?.voucher_no) {
      router.push("/admin/finance/dashboard");
    }
  };

  return (
    <div className="create-voucher-page">
      <div className="voucher-container">
        <div className="flex items-center mb-3">
          <Link
            href={"/admin/finance/dashboard"}
            className="bg-primary rounded-md p-2 text-white me-3 w-8 h-8 flex items-center"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h3 className="text-dark text-lg font-semibold">Create Voucher</h3>
        </div>

        {loadingLedgers ? (
          <div className="voucher-loader">
            <Loader />
          </div>
        ) : (
          <div className="form-card gap-y-3">

            {/* Voucher Type */}
            <div className="voucher-field">
              <Label className="voucher-label">Voucher Type</Label>
              <select
                className="voucher-select"
                value={voucherType}
                onChange={(e) => setVoucherType(e.target.value)}
              >
                <option value="RECEIPT">Receipt Voucher</option>
                <option value="PAYMENT">Payment Voucher</option>
                <option value="CONTRA">Contra Voucher</option>
                <option value="JOURNAL">Journal Voucher</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Voucher Date */}
              <div className="voucher-field">
                <Label className="voucher-label">Voucher Date</Label>
                <Input
                  type="date"
                  className="voucher-input"
                  value={voucherDate}
                  onChange={(e) => setVoucherDate(e.target.value)}
                />
              </div>

              {/* Reference No */}
              <div className="voucher-field">
                <Label className="voucher-label">Reference No</Label>
                <Input
                  type="text"
                  className="voucher-input"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                />
              </div>
            </div>

            {/* MULTI-LINE VOUCHER ENTRIES */}
            <div className="voucher-lines mt-4 bg-white p-3 rounded-md">
              <div className="flex align-items-center justify-between">
                <p className="mb-0 text-primary font-semibold">Voucher Lines</p>
                <Button variant={"success"} onClick={addLine} className="w-10 h-10 p-0">< img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/plus-icon.svg`} width={'18px'} height={'18px'} /></Button>
              </div>

              {lines.map((line, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 mb-0 items-end"
                >
                  {/* Ledger */}
                  <div>
                    <Label className="voucher-label">Ledger</Label>
                    <select
                      className="voucher-select"
                      value={line.ledger_id}
                      onChange={(e) =>
                        updateLine(index, "ledger_id", e.target.value)
                      }
                    >
                      <option value="">Select Ledger</option>
                      {ledgerList?.data?.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Debit */}
                  <div>
                    <label className="voucher-label">Debit</label>
                    <Input
                      type="number"
                      className="voucher-input"
                      value={line.debit}
                      onChange={(e) =>
                        updateLine(index, "debit", e.target.value)
                      }
                    />
                  </div>

                  {/* Credit */}
                  <div>
                    <label className="voucher-label">Credit</label>
                    <Input
                      type="number"
                      className="voucher-input"
                      value={line.credit}
                      onChange={(e) =>
                        updateLine(index, "credit", e.target.value)
                      }
                    />
                  </div>

                  {/* Remove */}
                  <div className="mt-8 flex">
                    <Button
                      variant={"remove"}
                      onClick={() => removeLine(index)}
                      disabled={lines.length === 1}
                      className="p-3"
                    >
                      <img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/remove-icon.svg`} width={'40px'} height={'20px'} />
                    </Button>
                  </div>
                </div>
              ))}


            </div>

            {/* Narration */}
            <div className="voucher-field mt-4">
              <Label className="voucher-label">Narration</Label>
              <textarea
                className="voucher-textarea"
                rows={3}
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
              />
            </div>

            {/* Submit */}
            <div className="mt-8 flex justify-end">
              <Button
                variant={"primary"}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? <Loader /> : "Create Voucher"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
