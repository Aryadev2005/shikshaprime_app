"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/src/hooks/useApi";

import ReportContainer from "@/components/ui/reports/ReportContainer";
import ReportFilters from "@/components/ui/reports/ReportFilters";
import DateFilter from "@/components/ui/reports/DateFilter";
import SelectFilter from "@/components/ui/reports/SelectFilter";
import ReportTable from "@/components/ui/reports/ReportTable";
import { getDailyCollection } from "@/src/services/feeReportService";

export default function DailyCollectionReport() {
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [paymentMode, setPaymentMode] = useState("");

  const {
    data,
    loading,
    call: loadReport,
  } = useApi(getDailyCollection);

  useEffect(() => {
    loadReport({ date, payment_mode: paymentMode });
  }, [date, paymentMode]);

  const columns = [
    "receipt_no",
    "student_name",
    "class_name",
    "payment_mode",
    "amount",
    "time",
    "collected_by",
  ];

  return (
    <ReportContainer
      title="Daily Fee Collection Report"
      filters={
        <ReportFilters className="daily-collection-filters">
          <DateFilter label="Date" value={date} onChange={setDate} />

          <SelectFilter
            label="Payment Mode"
            value={paymentMode}
            onChange={setPaymentMode}
            options={[
              { value: "CASH", label: "Cash" },
              { value: "BANK", label: "Bank" },
              { value: "ONLINE", label: "Online" },
            ]}
          />
        </ReportFilters>
      }
    >
      <ReportTable columns={columns} data={data?.data || []} />

      {loading && <p style={{ marginTop: 20 }}>Loading...</p>}
    </ReportContainer>
  );
}