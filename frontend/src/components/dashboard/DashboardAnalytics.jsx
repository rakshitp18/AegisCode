import { useEffect } from "react";
import { useAnalysisContext } from "../../contexts/AnalysisContext";

// ─── SVG Pie Chart (Language Distribution) ───────────────────────────────────
function LanguagePieChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-xs text-slate-500 italic py-8 text-center">No language data available</p>;
  }

  const entries = Object.entries(data);
  const total = entries.reduce((sum, [_, val]) => sum + val, 0);

  // Curated premium language colors
  const colors = {
    java: "#ea580c",        // orange
    python: "#38bdf8",      // sky
    javascript: "#facc15",  // yellow
    typescript: "#3178c6",  // ts blue
    cpp: "#2563eb",         // blue
    html: "#e34c26",        // html red
    css: "#563d7c",         // purple
    go: "#00add8",          // cyan
  };
  const getCol = (lang) => colors[lang.toLowerCase()] || "#64748b"; // fallback slate

  // Calculate arc parameters
  let accumulatedAngle = 0;
  const radius = 60;
  const cx = 80;
  const cy = 80;

  const slices = entries.map(([lang, val]) => {
    const percentage = val / total;
    const angle = percentage * 360;
    
    // Coordinates for slice arc
    const radStart = ((accumulatedAngle - 90) * Math.PI) / 180;
    const radEnd = ((accumulatedAngle + angle - 90) * Math.PI) / 180;
    
    const x1 = cx + radius * Math.cos(radStart);
    const y1 = cy + radius * Math.sin(radStart);
    const x2 = cx + radius * Math.cos(radEnd);
    const y2 = cy + radius * Math.sin(radEnd);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    const pathData = angle === 360
      ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`
      : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    accumulatedAngle += angle;

    return {
      lang,
      val,
      pct: (percentage * 100).toFixed(1),
      path: pathData,
      color: getCol(lang)
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
      <svg width="160" height="160" className="shrink-0 drop-shadow-md">
        {slices.map((slice, i) => (
          <path
            key={i}
            d={slice.path}
            fill={slice.color}
            className="hover:opacity-90 transition-opacity cursor-pointer duration-200"
            title={`${slice.lang}: ${slice.val} (${slice.pct}%)`}
          />
        ))}
        {/* Inner cutout for donut chart effect */}
        <circle cx={cx} cy={cy} r="35" fill="#0f172a" />
      </svg>

      <div className="flex flex-col gap-2 flex-1 w-full max-h-[160px] overflow-y-auto custom-scrollbar">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
              <span className="text-slate-300 font-medium capitalize truncate">{slice.lang}</span>
            </div>
            <span className="text-slate-500 font-mono font-semibold shrink-0 ml-3">
              {slice.val} ({slice.pct}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SVG Bar Chart (Complexity & Categories) ────────────────────────────────
function BarChart({ data, color = "#4f46e5" }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-xs text-slate-500 italic py-8 text-center">No distribution data available</p>;
  }

  const entries = Object.entries(data);
  const maxVal = Math.max(...entries.map(([_, v]) => v), 1);

  return (
    <div className="flex flex-col gap-3 py-2">
      {entries.map(([label, val], i) => {
        const percentage = (val / maxVal) * 100;
        return (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              <span>{label}</span>
              <span className="font-mono text-slate-300">{val}</span>
            </div>
            <div className="h-3 bg-slate-950/80 border border-slate-800/60 rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${percentage}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SVG Line Chart (Analyses Over Time) ──────────────────────────────────────
function TrendLineChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-xs text-slate-500 italic py-10 text-center">No trend activity available</p>;
  }

  const width = 360;
  const height = 110;
  const padding = 20;

  const maxVal = Math.max(...data.map(d => d.count), 1);
  const pointsCount = data.length;

  // Calculate pixel coordinates
  const coords = data.map((d, i) => {
    const x = padding + (i / Math.max(pointsCount - 1, 1)) * (width - 2 * padding);
    const y = height - padding - (d.count / maxVal) * (height - 2 * padding);
    return { x, y, ...d };
  });

  const linePath = coords.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");
  const areaPath = coords.length > 0
    ? `${linePath} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`
    : "";

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeDasharray="3 3" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" />

        {/* Shaded Area */}
        {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}

        {/* Trend line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Plot points */}
        {coords.map((pt, i) => (
          <g key={i} className="group cursor-pointer">
            <circle
              cx={pt.x}
              cy={pt.y}
              r="4.5"
              fill="#0f172a"
              stroke="#3b82f6"
              strokeWidth="2.5"
            />
            <circle
              cx={pt.x}
              cy={pt.y}
              r="8"
              fill="transparent"
              title={`${pt.date}: ${pt.count}`}
            />
          </g>
        ))}
      </svg>

      {/* Date Labels */}
      <div className="flex justify-between px-3 text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">
        {coords.map((pt, i) => (
          <span key={i} style={{ width: `${100 / coords.length}%`, textAlign: "center" }}>
            {pt.date}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 h-20" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 h-56 md:col-span-2" />
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 h-56" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 h-64" />
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 h-64 md:col-span-2" />
      </div>
    </div>
  );
}

// ─── Overview Stat Card ──────────────────────────────────────────────────────
function StatCard({ title, value, icon, bgClass = "bg-indigo-600/10 border-indigo-500/20 text-indigo-400" }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition rounded-xl p-4 flex items-center justify-between gap-3 shadow-md">
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">{title}</span>
        <span className="text-xl font-black text-slate-100">{value ?? 0}</span>
      </div>
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm shrink-0 ${bgClass}`}>
        {icon}
      </div>
    </div>
  );
}

// ─── Activity Item Row ───────────────────────────────────────────────────────
function ActivityRow({ item }) {
  const dateStr = item.timestamp
    ? new Date(item.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

  const icons = {
    analysis: { emoji: "📄", cls: "bg-blue-600/10 text-blue-400 border-blue-500/20" },
    project_creation: { emoji: "➕", cls: "bg-emerald-600/10 text-emerald-400 border-emerald-500/20" },
    github_import: { emoji: "📥", cls: "bg-purple-600/10 text-purple-400 border-purple-500/20" },
    refactor: { emoji: "⚙️", cls: "bg-amber-600/10 text-amber-400 border-amber-500/20" }
  };
  const config = icons[item.type] || { emoji: "🔔", cls: "bg-slate-800 text-slate-400" };

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
      <div className={`w-7.5 h-7.5 rounded-lg border flex items-center justify-center text-[11px] shrink-0 ${config.cls}`}>
        {config.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11.5px] font-medium text-slate-300 truncate">{item.description}</p>
        <span className="text-[9.5px] text-slate-500 font-mono mt-0.5 block">{dateStr}</span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function DashboardAnalytics({ projectId }) {
  const { dashboardData, dashboardLoading, fetchDashboardData } = useAnalysisContext();

  useEffect(() => {
    fetchDashboardData(projectId);
  }, [projectId]);

  if (dashboardLoading && !dashboardData) {
    return <DashboardSkeleton />;
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-4xl">📊</span>
        <h3 className="text-base font-bold text-slate-300 mt-3">Failed to load statistics</h3>
        <p className="text-xs text-slate-500 mt-1">Make sure you are logged in and your connection is stable.</p>
      </div>
    );
  }

  const {
    totalProjects,
    totalAnalyses,
    totalFilesAnalyzed,
    bugsFound,
    refactorsPerformed,
    githubReposImported,
    languagesAnalysed = {},
    complexityDistribution = {},
    activityOverTime = [],
    bugCategories = {},
    recentActivity = [],
    activeProjectInsights
  } = dashboardData;

  const totalBugs = Object.values(bugCategories).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      
      {/* 1. Overview Widgets Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Projects" value={totalProjects} icon="📁" bgClass="bg-blue-600/10 border-blue-500/20 text-blue-400" />
        <StatCard title="Total Analyses" value={totalAnalyses} icon="📊" bgClass="bg-purple-600/10 border-purple-500/20 text-purple-400" />
        <StatCard title="Files Analyzed" value={totalFilesAnalyzed} icon="📄" bgClass="bg-emerald-600/10 border-emerald-500/20 text-emerald-400" />
        <StatCard title="Bugs Found" value={bugsFound} icon="🐞" bgClass="bg-red-600/10 border-red-500/20 text-red-400" />
        <StatCard title="Refactors Runs" value={refactorsPerformed} icon="⚙️" bgClass="bg-amber-600/10 border-amber-500/20 text-amber-400" />
        <StatCard title="Github Repos" value={githubReposImported} icon="📥" bgClass="bg-indigo-600/10 border-indigo-500/20 text-indigo-400" />
      </div>

      {/* 2. Charts row 1: Languages & Complexity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Languages Pie */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-5 md:col-span-2 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Languages Analysed</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Codebase language frequency across historical audits.</p>
          </div>
          <LanguagePieChart data={languagesAnalysed} />
        </div>

        {/* Complexity Bar */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Complexity Distribution</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Code complexity level frequencies in audit results.</p>
          </div>
          <BarChart data={complexityDistribution} color="#8b5cf6" />
        </div>

      </div>

      {/* 3. Charts row 2: Activity Over Time & Bug Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Bug Categories Bar */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bug Categories</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Categorized diagnostics from code analysis logs.</p>
          </div>
          {totalBugs > 0 ? (
            <BarChart data={bugCategories} color="#ef4444" />
          ) : (
            <p className="text-xs text-slate-500 italic py-10 text-center">No bugs logged yet</p>
          )}
        </div>

        {/* Activity Over Time Line */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-5 md:col-span-2 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Analyses Over Time</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Daily code analyses counts trend.</p>
          </div>
          <TrendLineChart data={activityOverTime} />
        </div>

      </div>

      {/* 4. Bottom Row: Recent Activity & Selected Project Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Recent Activity */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-5 md:col-span-2 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Chronological record of recent modifications.</p>
          </div>
          <div className="flex flex-col max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-10 text-center">No recent activity</p>
            ) : (
              recentActivity.map((act, i) => <ActivityRow key={i} item={act} />)
            )}
          </div>
        </div>

        {/* Selected Project Insights */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Project Insights</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Statistics for the active project selection.</p>
            </div>
            
            {activeProjectInsights ? (
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-500 font-medium">Analyses Run</span>
                  <span className="font-bold text-slate-200">{activeProjectInsights.totalAnalyses}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-500 font-medium">Average Complexity</span>
                  <span className="font-bold text-slate-200 capitalize">{activeProjectInsights.averageComplexity}</span>
                </div>
                <div className="py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-500 font-medium block">Languages Detected</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {activeProjectInsights.languagesUsed && activeProjectInsights.languagesUsed.length > 0 ? (
                      activeProjectInsights.languagesUsed.map(lang => (
                        <span key={lang} className="bg-slate-950 border border-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded capitalize text-slate-300">
                          {lang}
                        </span>
                      ))
                    ) : (
                      <span className="italic text-slate-600">None detected</span>
                    )}
                  </div>
                </div>
                <div className="py-1.5 last:border-none">
                  <span className="text-slate-500 font-medium block">Latest File Audited</span>
                  {activeProjectInsights.latestAnalysisFileName ? (
                    <div className="mt-1">
                      <p className="font-mono text-slate-200 font-semibold truncate">{activeProjectInsights.latestAnalysisFileName}</p>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                        {new Date(activeProjectInsights.latestAnalysisTimestamp).toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <span className="italic text-slate-600 block mt-1">No file analyzed yet</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-500 italic">
                No project selected to show insights.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
