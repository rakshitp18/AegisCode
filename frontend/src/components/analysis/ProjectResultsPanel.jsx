import React from "react";

function ProjectResultsPanel({ result, loading, error, onRunAnalysis }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-200">Analyzing Project Codebase...</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Reviewing architecture directories, detecting design patterns, checking security flaws, and assessing logic duplication.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/20 border border-red-900/40 p-6 rounded-xl space-y-4 text-center">
        <span className="text-3xl block">⚠️</span>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-red-400">Analysis Request Failed</h3>
          <p className="text-xs text-red-400/80">{error}</p>
        </div>
        <button
          onClick={() => onRunAnalysis(0)}
          className="bg-red-900 hover:bg-red-850 text-red-200 font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center space-y-4 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
        <span className="text-4xl">🤖</span>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-350">Project-wide AI Analysis</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Generate an architectural overview, security analysis, performance bottlenecks, and design patterns across the entire project structure.
          </p>
        </div>
        <button
          onClick={() => onRunAnalysis(0)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
        >
          Run Project AI Scan
        </button>
      </div>
    );
  }

  const score = result.healthScore || 0;
  
  // Resolve health level attributes
  let scoreColorClass = "text-emerald-400";
  let scoreBgClass = "stroke-emerald-500";
  let scoreBadgeText = "Excellent";
  let badgeColorClass = "bg-emerald-950/60 text-emerald-400 border-emerald-900/50";
  
  if (score < 60) {
    scoreColorClass = "text-rose-400";
    scoreBgClass = "stroke-rose-500";
    scoreBadgeText = "Action Required";
    badgeColorClass = "bg-rose-950/60 text-rose-400 border-rose-900/50";
  } else if (score < 80) {
    scoreColorClass = "text-amber-400";
    scoreBgClass = "stroke-amber-500";
    scoreBadgeText = "Needs Refactoring";
    badgeColorClass = "bg-amber-950/60 text-amber-400 border-amber-900/50";
  }

  // Calculate Dash offset (radius = 40, circumference = 2 * PI * r = 251.3)
  const circumference = 251.3;
  const strokeDashoffset = circumference - (circumference * score) / 100;

  return (
    <div className="space-y-6">
      
      {/* 1. Project Health Gauge */}
      <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl flex items-center gap-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              className="stroke-slate-800"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              className={`${scoreBgClass} transition-all duration-1000 ease-out`}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white">{score}</span>
            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Health</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-100">
              {result.isCombinedReport ? "Master Project Quality Score" : "Project Quality Score"}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase font-sans ${result.isCombinedReport ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/80" : badgeColorClass}`}>
              {result.isCombinedReport ? "✨ Master Report" : scoreBadgeText}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            {result.isCombinedReport 
              ? "Synthesized evaluation combining all file batch scans across your entire codebase."
              : "This rating shows the health of your codebase. A higher score means your code is clean, secure, and easy to maintain."}
          </p>
          
          {result.isCombinedReport ? (
            <div className="mt-3 text-[10.5px] bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-xl flex flex-col gap-2 font-sans select-none w-full max-w-sm">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <span className="text-xs">🏆</span>
                <span>Combined Master Analysis Complete!</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-normal">
                Groq AI has evaluated all {result.totalFiles} files across {result.totalBatchesAnalyzed || 1} scan batches and synthesized a unified report.
              </p>
              <div className="pt-1">
                <button
                  onClick={() => onRunAnalysis(0)}
                  className="bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 font-bold py-1.5 px-3 rounded-md text-[10px] transition-all cursor-pointer border border-emerald-700/50 inline-flex items-center gap-1 shadow-sm"
                >
                  <span>🔄</span> Re-Run Full Project Scan
                </button>
              </div>
            </div>
          ) : result.totalFiles !== undefined && result.totalFiles > 0 && (
            <div className="mt-3 text-[10.5px] text-slate-400 bg-slate-950/40 border border-slate-800 px-3 py-2.5 rounded-lg flex flex-col gap-2 select-none font-sans leading-normal w-full max-w-sm">
              <div className="flex items-center gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${result.contextOmitted ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                <span className="font-semibold text-slate-350">
                  AI Context Coverage: Files {(result.startOffset || 0) + 1} to {(result.startOffset || 0) + (result.filesAnalyzed || 0)} of {result.totalFiles} fully read
                </span>
              </div>
              
              {result.contextOmitted && (
                <div className="space-y-2">
                  <span className="text-[10px] text-amber-500 font-medium pl-3 block">
                    ⚠️ Remaining {result.totalFiles - ((result.startOffset || 0) + (result.filesAnalyzed || 0))} files bypassed to stay under AI size limits.
                  </span>
                  
                  {result.nextOffset !== undefined && result.nextOffset < result.totalFiles && (
                    <div className="pl-3">
                      <button
                        onClick={() => onRunAnalysis(result.nextOffset)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-3 rounded-md text-[10px] transition-all cursor-pointer border border-blue-500/20 shadow-sm inline-flex items-center gap-1"
                      >
                        <span>🔍</span> Analyze Further Files (Start from #{result.nextOffset + 1})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Architecture Summary */}
      <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <span>🏛️</span> Architecture Summary
        </h3>
        <p className="text-xs text-slate-350 leading-relaxed font-sans">
          {result.architectureSummary}
        </p>
      </div>

      {/* 3. Code Quality Overview */}
      <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <span>🔬</span> Code Quality Overview
        </h3>
        <p className="text-xs text-slate-350 leading-relaxed font-sans">
          {result.codeQualityOverview}
        </p>
      </div>

      {/* 4. Design Patterns Detected */}
      <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <span>🧩</span> Design Patterns Detected
        </h3>
        {result.designPatterns && result.designPatterns.length > 0 ? (
          <ul className="space-y-2 text-xs">
            {result.designPatterns.map((pattern, i) => (
              <li key={i} className="flex gap-2 text-slate-300">
                <span className="text-blue-500 font-mono">▸</span>
                <span>{pattern}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500 italic">No formal object-oriented design patterns detected.</p>
        )}
      </div>

      {/* 5. Duplicate Logic */}
      <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <span>👥</span> Duplicate Logic & Redundancy
        </h3>
        {result.duplicateLogic && result.duplicateLogic.length > 0 ? (
          <ul className="space-y-2 text-xs">
            {result.duplicateLogic.map((item, i) => (
              <li key={i} className="flex gap-2 text-slate-300 bg-slate-950/40 p-2.5 rounded border border-slate-850">
                <span className="text-amber-500">⌥</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            ✓ No significant duplicate logic observed across project components.
          </p>
        )}
      </div>

      {/* 6. Security Observations */}
      <div className={`p-4 rounded-xl space-y-3 border ${
        result.securityObservations && result.securityObservations.length > 0
          ? "bg-red-950/15 border-red-900/30 text-red-200"
          : "bg-slate-900 border-slate-800/80"
      }`}>
        <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 ${
          result.securityObservations && result.securityObservations.length > 0 ? "text-red-400 border-red-900/40" : "text-slate-200 border-slate-800"
        }`}>
          <span>🛡️</span> Security Observations
        </h3>
        {result.securityObservations && result.securityObservations.length > 0 ? (
          <ul className="space-y-2 text-xs text-slate-300">
            {result.securityObservations.map((obs, i) => (
              <li key={i} className="flex gap-2 bg-red-950/20 p-2 rounded border border-red-900/30">
                <span className="text-red-400">⚠️</span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            ✓ No key security exposures detected in source contents.
          </p>
        )}
      </div>

      {/* 7. Performance Observations */}
      <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <span>⚡</span> Performance Observations
        </h3>
        {result.performanceObservations && result.performanceObservations.length > 0 ? (
          <ul className="space-y-2 text-xs">
            {result.performanceObservations.map((obs, i) => (
              <li key={i} className="flex gap-2 text-slate-300 bg-slate-950/30 p-2 rounded border border-slate-850">
                <span className="text-amber-400">⚡</span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400">No primary performance issues observed in static outlines.</p>
        )}
      </div>

      {/* 8. Refactoring Suggestions */}
      <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <span>🛠️</span> Actionable Refactoring Suggestions
        </h3>
        {result.refactoringSuggestions && result.refactoringSuggestions.length > 0 ? (
          <ul className="space-y-2.5 text-xs">
            {result.refactoringSuggestions.map((item, i) => (
              <li key={i} className="flex gap-2 text-slate-300 items-start">
                <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500 italic">No refactoring ideas generated.</p>
        )}
      </div>

    </div>
  );
}

export default ProjectResultsPanel;
