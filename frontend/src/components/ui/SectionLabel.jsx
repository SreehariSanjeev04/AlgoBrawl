export default function SectionLabel({ children, className = "" }) {
  return (
    <span className={`text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-zinc-500 ${className}`}>
      {children}
    </span>
  );
}