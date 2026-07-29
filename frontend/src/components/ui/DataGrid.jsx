export default function DataGrid({ items, className = "" }) {
  return (
    <div className={`grid grid-cols-2 gap-x-6 gap-y-2 ${className}`}>
      {items.map(({ label, value }, i) => (
        <div key={i} className="flex items-center justify-between py-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
            {label}
          </span>
          <span className="text-[13px] font-medium font-mono text-zinc-200">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}