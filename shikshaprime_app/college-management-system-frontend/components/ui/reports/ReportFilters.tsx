export default function ReportFilters({ children, className = "" }) {
  return <div className={`report-filters ${className}`.trim()}>{children}</div>;
}