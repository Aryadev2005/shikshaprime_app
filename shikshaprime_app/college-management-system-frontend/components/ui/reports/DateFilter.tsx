export default function DateFilter({ label, value, onChange }) {
  return (
    <div className="filter-field">
      <label className="filter-label">{label}</label>
      <input
        type="date"
        className="filter-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}