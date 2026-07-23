import { useState, useEffect, useMemo } from "react";
import { useAnalysisContext } from "../../contexts/AnalysisContext";

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-slate-800/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <div className="h-3 w-32 bg-slate-700 rounded-full" />
            <div className="h-3 w-12 bg-slate-700/60 rounded-full ml-auto" />
          </div>
          <div className="h-2.5 w-48 bg-slate-700/50 rounded-full" />
          <div className="h-2 w-24 bg-slate-700/40 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center">
        <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      </div>
      <div>
        <p className="text-slate-400 font-medium text-sm">{message || "No analyses yet"}</p>
        <p className="text-slate-600 text-xs mt-1">Run a file analysis to see history here</p>
      </div>
    </div>
  );
}

// ─── Complexity badge ─────────────────────────────────────────────────────────
function ComplexityBadge({ complexity }) {
  if (!complexity) return null;
  const lower = complexity.toLowerCase();
  const color = lower.includes("low") ? "emerald"
    : lower.includes("medium") || lower.includes("moderate") ? "amber"
    : lower.includes("high") || lower.includes("complex") ? "red"
    : "slate";
  const cls = {
    emerald: "bg-emerald-950/40 text-emerald-400 border-emerald-900/40",
    amber:   "bg-amber-950/40 text-amber-400 border-amber-900/40",
    red:     "bg-red-950/40 text-red-400 border-red-900/40",
    slate:   "bg-slate-800/60 text-slate-400 border-slate-700/40",
  }[color];
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${cls}`}>
      {complexity}
    </span>
  );
}

// ─── Language badge ───────────────────────────────────────────────────────────
function LangBadge({ language }) {
  if (!language) return null;
  return (
    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border bg-indigo-950/40 text-indigo-400 border-indigo-900/40">
      {language}
    </span>
  );
}

// ─── History entry row card ───────────────────────────────────────────────────
function HistoryEntryCard({ entry, isSelected, onSelect, onDelete, isDeleting }) {
  const ts = entry.createdAt
    ? new Date(entry.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div
      onClick={onSelect}
      className={`group relative border rounded-xl p-3.5 cursor-pointer transition-all ${
        isSelected
          ? "bg-indigo-950/30 border-indigo-700/50 shadow-lg shadow-indigo-950/20"
          : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-200 truncate font-mono">
              {entry.fileName || "unknown"}
            </span>
            <LangBadge language={entry.language} />
            <ComplexityBadge complexity={entry.complexity} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
            {entry.summary || "No summary available"}
          </p>
          <p className="text-[10px] text-slate-600 mt-1">{ts}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(entry.id); }}
          disabled={isDeleting}
          title="Delete analysis"
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-950/30 rounded-lg cursor-pointer disabled:opacity-30"
        >
          {isDeleting ? (
            <span className="text-[10px]">⟳</span>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 rounded-l-xl" />
      )}
    </div>
  );
}

// ─── Detail view ──────────────────────────────────────────────────────────────
function HistoryDetailPanel({ entry }) {
  if (!entry) return null;

  const ts = entry.createdAt
    ? new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "—";

  const Section = ({ icon, title, children }) => (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-xs">{icon}</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{title}</span>
      </div>
      <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed">
        {children}
      </div>
    </div>
  );

  const ListSection = ({ icon, title, items, emptyText }) => (
    <Section icon={icon} title={title}>
      {!items || items.length === 0 ? (
        <span className="text-slate-600 italic">{emptyText}</span>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="text-slate-600 shrink-0 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );

  return (
    <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pb-4">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-bold text-slate-100">{entry.fileName || "unknown"}</span>
          <LangBadge language={entry.language} />
          <ComplexityBadge complexity={entry.complexity} />
        </div>
        <p className="text-[11px] text-slate-500 mt-1">{ts}</p>
      </div>

      <Section icon="📋" title="Summary">
        <p className="whitespace-pre-wrap">{entry.summary || "No summary available."}</p>
      </Section>

      <ListSection icon="🐛" title="Bugs" items={entry.bugs} emptyText="No bugs detected." />
      <ListSection icon="💡" title="Suggestions" items={entry.suggestions} emptyText="No suggestions." />
      <ListSection icon="🧪" title="Recommended Tests" items={entry.tests} emptyText="No tests suggested." />

      {/* Metrics */}
      {entry.metrics && (
        <Section icon="📊" title="Code Metrics">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Lines", value: entry.metrics.lines },
              { label: "Classes", value: entry.metrics.classes },
              { label: "Methods", value: entry.metrics.methods },
              { label: "TODOs", value: entry.metrics.todos },
              { label: "Print Stmts", value: entry.metrics.print_statements ?? entry.metrics.printStatements },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-900/60 border border-slate-800/40 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="text-lg font-bold text-slate-200 mt-0.5">{value ?? "—"}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function AnalysisHistoryPanel({ projectId }) {
  const { analysisHistory, historyLoading, fetchProjectHistory, deleteAnalysisById } = useAnalysisContext();

  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const [complexityFilter, setComplexityFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id to confirm
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch when project changes
  useEffect(() => {
    if (!projectId) return;
    setSelectedId(null);
    setSearchQuery("");
    setLangFilter("all");
    setComplexityFilter("all");
    fetchProjectHistory(projectId);
  }, [projectId]);

  // Derive distinct language options from the fetched list
  const languages = useMemo(() => {
    const langs = [...new Set((analysisHistory || []).map(a => a.language).filter(Boolean))];
    return langs.sort();
  }, [analysisHistory]);

  // Filtered list
  const filtered = useMemo(() => {
    return (analysisHistory || []).filter(a => {
      const matchSearch = !searchQuery || (a.fileName || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchLang = langFilter === "all" || a.language === langFilter;
      const matchComplexity = complexityFilter === "all" || (a.complexity || "").toLowerCase().includes(complexityFilter.toLowerCase());
      return matchSearch && matchLang && matchComplexity;
    });
  }, [analysisHistory, searchQuery, langFilter, complexityFilter]);

  const selectedEntry = useMemo(
    () => (analysisHistory || []).find(a => a.id === selectedId) || null,
    [analysisHistory, selectedId]
  );

  const handleDelete = (id) => setDeleteConfirm(id);

  const confirmDelete = async () => {
    const id = deleteConfirm;
    setDeleteConfirm(null);
    setDeletingId(id);
    if (selectedId === id) setSelectedId(null);
    const res = await deleteAnalysisById(id);
    setDeletingId(null);
    if (!res.success) setErrorMsg(res.message || "Delete failed");
  };

  const handleRetry = () => {
    setErrorMsg(null);
    fetchProjectHistory(projectId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400 fill-current" viewBox="0 0 24 24">
              <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
            </svg>
            <h3 className="text-sm font-bold text-slate-200">Analysis History</h3>
          </div>
          <button
            onClick={() => fetchProjectHistory(projectId)}
            disabled={historyLoading}
            title="Refresh"
            className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all cursor-pointer disabled:opacity-40"
          >
            <svg className={`w-3.5 h-3.5 ${historyLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Search & filters */}
        {!historyLoading && (analysisHistory || []).length > 0 && (
          <div className="flex flex-col gap-2 mt-3">
            <input
              type="text"
              placeholder="Search by filename…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg py-1.5 px-3 text-xs text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-indigo-500/40 transition"
            />
            <div className="flex gap-2">
              <select
                value={langFilter}
                onChange={e => setLangFilter(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 text-xs text-slate-300 outline-none cursor-pointer"
              >
                <option value="all">All languages</option>
                {languages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <select
                value={complexityFilter}
                onChange={e => setComplexityFilter(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 text-xs text-slate-300 outline-none cursor-pointer"
              >
                <option value="all">All complexity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="mx-4 mt-3 bg-red-950/30 border border-red-900/40 rounded-xl p-3 flex items-center justify-between shrink-0">
          <p className="text-xs text-red-400">{errorMsg}</p>
          <button onClick={handleRetry} className="text-xs text-red-400 underline cursor-pointer ml-2">Retry</button>
        </div>
      )}

      {/* Body: list + detail side-by-side when entry selected */}
      <div className="flex-1 overflow-hidden flex min-h-0">
        {/* List column */}
        <div className={`overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2 ${selectedEntry ? "w-2/5 border-r border-slate-800" : "w-full"}`}>
          {historyLoading ? (
            <HistorySkeleton />
          ) : !projectId ? (
            <EmptyState message="Select a project to view history" />
          ) : filtered.length === 0 ? (
            searchQuery || langFilter !== "all" || complexityFilter !== "all" ? (
              <EmptyState message="No analyses match your filters" />
            ) : (
              <EmptyState message="No analyses yet for this project" />
            )
          ) : (
            filtered.map(entry => (
              <HistoryEntryCard
                key={entry.id}
                entry={entry}
                isSelected={selectedId === entry.id}
                onSelect={() => setSelectedId(selectedId === entry.id ? null : entry.id)}
                onDelete={handleDelete}
                isDeleting={deletingId === entry.id}
              />
            ))
          )}
        </div>

        {/* Detail column */}
        {selectedEntry && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <HistoryDetailPanel entry={selectedEntry} />
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 max-w-xs w-full mx-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-950/30 border border-red-900/30 flex items-center justify-center shrink-0">
                <span className="text-red-400">🗑</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Delete Analysis?</h4>
                <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={confirmDelete} className="flex-1 text-xs bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-all cursor-pointer">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
