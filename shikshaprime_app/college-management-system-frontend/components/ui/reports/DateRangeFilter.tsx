export default function DateRangeFilter({ from, to, setFrom, setTo }) {
  return (
    <div className="filter-range">
      <div className="filter-field">
        <label className="filter-label">From</label>
        <input
          type="date"
          className="filter-input"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </div>

      <div className="filter-field">
        <label className="filter-label">To</label>
        <input
          type="date"
          className="filter-input"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>
    </div>
  );
}