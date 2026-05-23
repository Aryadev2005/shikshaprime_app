export default function CashBookTable({ loading, entries }) {
  if (loading) {
    return <p className="cashbook-empty">Loading...</p>;
  }

  if (!entries || entries.length === 0) {
    return (
      <p className="cashbook-empty">
        No cash transactions found for this date
      </p>
    );
  }

  return (
    <table className="cashbook-table">
      <thead>
        <tr>
          <th>Voucher No</th>
          <th>Date</th>
          <th>Type</th>
          <th>Ledger</th>
          <th>Debit</th>
          <th>Credit</th>
          <th>Narration</th>
        </tr>
      </thead>

      <tbody>
        {entries.map((e, idx) => (
          <tr key={idx}>
            <td>{e.voucher_no}</td>
            <td>{e.voucher_date}</td>
            <td>{e.voucher_type}</td>
            <td>{e.ledger_name}</td>

            <td className="cashbook-debit">
              {e.debit_amount > 0 ? e.debit_amount : "-"}
            </td>

            <td className="cashbook-credit">
              {e.credit_amount > 0 ? e.credit_amount : "-"}
            </td>

            <td>{e.narration}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}