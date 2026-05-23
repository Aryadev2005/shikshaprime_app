function formatHeader(label) {
  return label
    .replace(/_/g, " ")          // replace underscores with spaces
    .replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );                           // convert to Proper Case
}
export default function ReportTable({ columns = [], data = [] }) {
  return (
    <div className="report-table-wrapper">
      <table className="report-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{formatHeader(col)}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="no-data">
                No records found
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col, cIdx) => (
                  <td key={cIdx} data-label={formatHeader(col)}>{row[col]}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}