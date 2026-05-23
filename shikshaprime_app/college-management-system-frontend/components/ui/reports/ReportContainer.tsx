"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import "./reports.css";

export default function ReportContainer({ title, filters, filterWrapperClass = "mb-5 bg-gray-50 p-4 rounded-md border border-gray-200", children }) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="report-page">
      <div className="report-container">
        <div className="flex justify-between items-center mb-3">
          <h1 className="report-title text-dark text-lg font-semibold">{title}</h1>
          {filters && (
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-[#9531ba] cursor-pointer rounded-xs shadow-sm hover:bg-[#9531ba] focus:outline-none focus:ring-2 focus:ring-[#9531ba]"
            >
              <Filter size={16} />
              Filters
            </button>
          )}
        </div>

        {filters && showFilters && (
          <div className={filterWrapperClass}>
            {filters}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}