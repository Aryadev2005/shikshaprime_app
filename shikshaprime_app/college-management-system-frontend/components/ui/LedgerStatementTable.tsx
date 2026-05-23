"use client";

interface LedgerStatementTableProps {
  loading: boolean;
  entries: any[];
  openingBalance: number;
}

export default function LedgerStatementTable({
  loading,
  entries,
  openingBalance
}: LedgerStatementTableProps) {
  if (loading) {
    return <p className="ledgerstatement-loading-text">Loading...</p>;
  }

  if (!entries || entries.length === 0) {
    return (
      <p className="ledgerstatement-empty-text">
        No transactions found for this period
      </p>
    );
  }

  let runningBalance = openingBalance;

  return (
    <table className="ledgerstatement-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Voucher No</th>
          <th>Type</th>
          <th>Particulars</th>
          <th>Debit</th>
          <th>Credit</th>
          <th>Running Balance</th>
        </tr>
      </thead>

      <tbody>
        {/* Opening Balance Row */}
        <tr className="ledgerstatement-opening-row">
          <td colSpan={6} className="ledgerstatement-opening-label">
            Opening Balance
          </td>
          <td className="ledgerstatement-opening-value">
            ₹ {openingBalance.toLocaleString()}
          </td>
        </tr>

        {/* Entries */}
        {entries.map((entry: any, idx: number) => {
          const debit = Number(entry.debit_amount || 0);
          const credit = Number(entry.credit_amount || 0);

          runningBalance += debit - credit;

          return (
            <tr key={idx}>
              <td>{entry.voucher?.voucher_date}</td>
              <td>{entry.voucher?.voucher_no}</td>
              <td>{entry.voucher?.voucher_type}</td>
              <td>{entry.ledger?.name}</td>
              <td className="text-green">
                {debit > 0 ? `₹ ${debit.toLocaleString()}` : "-"}
              </td>
              <td className="text-red">
                {credit > 0 ? `₹ ${credit.toLocaleString()}` : "-"}
              </td>
              <td className="ledgerstatement-running-balance">
                ₹ {runningBalance.toLocaleString()}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}