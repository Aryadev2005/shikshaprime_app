"use client";

export default function IncomeExpenseTable({ loading, rows }) {
  if (loading) {
    return <p className="ie-loading">Loading...</p>;
  }

  if (!rows || rows.length === 0) {
    return <p className="ie-empty">No data found</p>;
  }

  return (
    <table className="ie-table">
    <thead>
        <tr>
        <th className="ie-col-ledger">Ledger Name</th>
        <th className="ie-col-amount">Total Amount</th>
        </tr>
    </thead>

    <tbody>
        {rows.map((r, idx) => (
        <tr key={idx}>
            <td className="ie-col-ledger">{r.ledger_name}</td>
            <td className="ie-col-amount">₹ {r.total.toLocaleString()}</td>
        </tr>
        ))}
    </tbody>
    </table>
  );
}