"use client";

interface AdminQueryFilterOption {
  value: string;
  label: string;
}

interface AdminQueryFilterProps {
  parameter: string;
  value: string;
  options: AdminQueryFilterOption[];
  label: string;
}

export function AdminQueryFilter({
  parameter,
  value,
  options,
  label,
}: AdminQueryFilterProps) {
  const handleChange = (nextValue: string) => {
    const url = new URL(window.location.href);
    if (nextValue === "all") {
      url.searchParams.delete(parameter);
    } else {
      url.searchParams.set(parameter, nextValue);
    }
    url.searchParams.delete("page");
    window.location.assign(url.toString());
  };

  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => handleChange(event.target.value)}
      className="bg-brand-ivory border border-brand-mocha/20 rounded-xl px-3 py-2 text-xs text-brand-mocha cursor-pointer"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
