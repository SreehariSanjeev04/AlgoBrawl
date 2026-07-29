export default function StatusDot({ status = "offline", className = "" }) {
  const colors = {
    online: "bg-accent",
    away: "bg-warning",
    offline: "bg-zinc-600",
    busy: "bg-danger",
  };

  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      <span
        className={`inline-block w-[6px] h-[6px] rounded-full ${colors[status] || colors.offline}`}
      />
      {status === "online" && (
        <span
          className={`absolute inline-block w-[6px] h-[6px] rounded-full ${colors[status]} pulse-dot opacity-75`}
        />
      )}
    </span>
  );
}