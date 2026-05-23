export default function DayBookTable({ loading, entries }) {
  if (loading) {
    return (
      <p className="daybook-empty">
        Loading...
      </p>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <p className="daybook-empty">
        No voucher entries found for this date
      </p>
    );
  }

  return (
    <table className="daybook-table">
      <thead>
        <tr>
          <th>Voucher No</th>
          <th>Date</th>
          <th>Type</th>
          <th>Ledger</th>
          <th>Debit</th>
          <th>Credit</th>
          <th>Narration</th>
          <th>Created By</th>
        </tr>
      </thead>

      <tbody>
        {entries.map((e, idx) => (
          <tr key={idx} className={e?.credit_amount > 0 ? 'credit_amount' : e?.debit_amount > 0 ? 'debit_amount' : ''}>
            <td>{e.voucher_no}</td>
            <td>{e.voucher_date}</td>
            <td>{e.voucher_type}</td>
            <td>{e.ledger_name}</td>

            {/* Debit */}
            <td className="daybook-debit">
              {e.debit_amount > 0 ? e.debit_amount : "-"}
            </td>

            {/* Credit */}
            <td className="daybook-credit">
              {e.credit_amount > 0 ? e.credit_amount : "-"}
            </td>

            <td>{e.narration}</td>
            <td>{e.created_by}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}