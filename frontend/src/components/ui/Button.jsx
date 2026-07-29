export default function Button({
  children,
  variant = "primary",
  size = "sm",
  disabled = false,
  onClick,
  className = "",
  type = "button",
}) {
  const variants = {
    primary:
      "bg-accent/90 text-black hover:bg-accent active:bg-accent-light",
    secondary:
      "bg-surface-2 text-zinc-300 border border-[var(--border-default)] hover:bg-surface-3 hover:border-[var(--border-hover)] active:bg-surface-3",
    danger:
      "bg-danger/90 text-white hover:bg-danger active:bg-red-500",
    ghost:
      "text-zinc-400 hover:text-zinc-200 hover:bg-surface-2",
  };

  const sizes = {
    xs: "px-2 py-1 text-[11px]",
    sm: "px-3 py-1.5 text-[12px]",
    md: "px-4 py-2 text-[13px]",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-1.5 font-medium
        rounded-[var(--radius-sm)] transition-all duration-150
        focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/50
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}