export default function StatusPill({ label, variant = "default", className = "" }) {
  const variants = {
    default: "bg-zinc-800 text-zinc-400",
    success: "bg-accent-subtle/40 text-accent-light",
    danger: "bg-danger-subtle/40 text-danger",
    warning: "bg-warning-subtle/40 text-warning",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider ${variants[variant] || variants.default} ${className}`}
    >
      {label}
    </span>
  );
}