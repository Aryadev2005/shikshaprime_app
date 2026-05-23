export default function BankBookTable({ entries }: { entries: any[] }) {
    return (
        <div className="report-table-container">
            <table className="report-table">
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
                    {entries.map((e, i) => (
                        <tr key={i}>
                            <td>{e.voucher_no}</td>
                            <td>{e.voucher_date}</td>
                            <td>{e.voucher_type}</td>
                            <td>{e.ledger_name}</td>
                            <td>{e.debit_amount || "-"}</td>
                            <td>{e.credit_amount || "-"}</td>
                            <td>{e.narration}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}