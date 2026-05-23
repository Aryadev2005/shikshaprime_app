"use client";

interface TrialBalanceTableProps {
  loading: boolean;
  entries: any[];
}

export default function TrialBalanceTable({
  loading,
  entries
}: TrialBalanceTableProps) {
  if (loading) {
    return <p className="trialbalance-loading-text">Loading...</p>;
  }

  if (!entries || entries.length === 0) {
    return (
      <p className="trialbalance-empty-text">
        No trial balance data found for this date
      </p>
    );
  }

  return (
    <table className="trialbalance-table">
      <thead>
        <tr>
          <th>Ledger Name</th>
          <th>Opening Balance</th>
          <th>Total Debit</th>
          <th>Total Credit</th>
          <th>Closing Balance</th>
        </tr>
      </thead>

      <tbody>
        {entries.map((e: any, idx: number) => (
          <tr key={idx}>
            <td>{e.ledger_name}</td>
            <td>{e.opening_balance}</td>
            <td className="text-green">{e.total_debit}</td>
            <td className="text-red">{e.total_credit}</td>
            <td>{e.closing_balance}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}