export default function SelectFilter({ label, value, onChange, options }) {
  return (
    <div className="filter-field">
      <label className="filter-label">{label}</label>
      <select
        className="filter-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select {label}</option>
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}