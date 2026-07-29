export default function CodeSnippet({ children, language, className = "" }) {
  return (
    <div
      className={`bg-black/40 border border-[var(--border-default)] rounded-[var(--radius-sm)] overflow-hidden ${className}`}
    >
      {language && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-default)]">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            {language}
          </span>
        </div>
      )}
      <pre className="px-3 py-2 text-[12px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap">
        {children}
      </pre>
    </div>
  );
}