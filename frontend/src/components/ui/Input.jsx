export default function Input({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  className = "",
  label,
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-[12px] font-medium text-zinc-400"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`
          w-full px-3 py-2 text-[13px]
          bg-surface-1 border border-[var(--border-default)]
          text-zinc-200 placeholder-zinc-600
          rounded-[var(--radius-sm)]
          focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20
          transition-all duration-150
          ${className}
        `}
      />
    </div>
  );
}