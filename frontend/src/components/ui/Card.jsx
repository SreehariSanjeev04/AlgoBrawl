export default function Card({
  children,
  className = "",
  hover = true,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-surface-1 border border-[var(--border-default)]
        ${hover ? "card-spotlight" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}