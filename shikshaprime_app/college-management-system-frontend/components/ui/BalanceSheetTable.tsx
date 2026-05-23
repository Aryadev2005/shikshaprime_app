export default function BalanceSheetTable({ loading, rows }) {
  if (loading) return <p className="bs-loading">Loading...</p>;
  if (!rows || rows.length === 0) return <p className="bs-empty">No data found</p>;

  return (
    <table className="bs-table">
      <thead>
        <tr>
          <th className="bs-col-ledger">Ledger Name</th>
          <th className="bs-col-amount">Amount</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((r, idx) => (
          <tr key={idx}>
            <td className="bs-col-ledger">{r.ledger_name}</td>
            <td className="bs-col-amount">₹ {r.amount.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}