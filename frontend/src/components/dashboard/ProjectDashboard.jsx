
import { useState } from "react";
import DashboardAnalytics from "./DashboardAnalytics";

function ProjectDashboard({
  analysisResults,
  onOpenFile,
  gitMetadata = null,
  onRunProjectAiAnalysis,
  projectAiLoading,
  staticLoading,
  lastOpenedFileId = null,
  lastOpenedFileName = "",
  projectId = null
}) {
  const [activeViewTab, setActiveViewTab] = useState("codebase"); // "codebase" | "analytics"

  if (staticLoading && !analysisResults && activeViewTab === "codebase") {
    return (
      <div className="h-full flex items-center justify-center bg-slate-955 text-slate-450 select-none py-20">
        <div className="text-center space-y-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-200">Running Static AST Analysis...</h3>
            <p className="text-sm text-slate-500">Compiling Java AST nodes and calculating codebase complexity.</p>
          </div>
        </div>
      </div>
    );
  }

  // Format timestamp helper
  const formatTime = (ts) => {
    if (!ts) return "-";
    return new Date(ts).toLocaleTimeString();
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-955 p-4 text-slate-200 space-y-4">
      {/* View Selector Bar */}
      <div className="flex bg-slate-900 border border-slate-800/80 p-1 rounded-xl gap-1 max-w-sm shrink-0">
        <button
          onClick={() => setActiveViewTab("codebase")}
          className={`flex-1 text-xs font-bold py-2 px-4 rounded-lg transition-all cursor-pointer ${
            activeViewTab === "codebase"
              ? "bg-blue-600 text-white shadow-md shadow-blue-950/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          📄 Codebase Metrics
        </button>
        <button
          onClick={() => setActiveViewTab("analytics")}
          className={`flex-1 text-xs font-bold py-2 px-4 rounded-lg transition-all cursor-pointer ${
            activeViewTab === "analytics"
              ? "bg-blue-600 text-white shadow-md shadow-blue-950/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          📈 Analytics & Trends
        </button>
      </div>

      {activeViewTab === "analytics" ? (
        <DashboardAnalytics projectId={projectId} />
      ) : !analysisResults ? (
        <div className="flex items-center justify-center text-slate-400 select-none py-24">
          <div className="text-center space-y-2">
            <span className="text-4xl">📊</span>
            <h3 className="text-lg font-semibold text-slate-200">No AST Analysis Available</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">Upload a project folder or select files to generate codebase metrics.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Main Codebase AST Content */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 glow-card p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            {lastOpenedFileId && (
              <button
                onClick={() => onOpenFile(lastOpenedFileId)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0 border-none bg-transparent"
                title={`Back to Editor (${lastOpenedFileName})`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Project Identity</span>
              <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="leading-tight">{projectOverview.projectName}</span>
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onRunProjectAiAnalysis(0)}
              disabled={projectAiLoading}
              className="text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white font-bold py-2 px-3.5 rounded-lg transition-all flex items-center gap-1.5 shadow-md border border-blue-500/20 cursor-pointer"
            >
              {projectAiLoading ? (
                <>
                  <span className="animate-spin block w-3 h-3 border-2 border-t-white border-white/20 rounded-full"></span>
                  Analyzing...
                </>
              ) : (
                <>
                  <span>🤖</span> Analyze Project
                </>
              )}
            </button>
            {staticLoading && (
              <span className="text-[10px] bg-slate-800 text-slate-400 font-medium px-2 py-1.5 rounded-lg flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Re-evaluating AST...
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
          <div className="bg-slate-950/40 border border-slate-800/80 px-3.5 py-2 rounded-lg">
            <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Files</span>
            <span className="text-base font-bold text-slate-200">{projectOverview.totalFiles}</span>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/80 px-3.5 py-2 rounded-lg">
            <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Folders</span>
            <span className="text-base font-bold text-slate-200">{projectOverview.totalFolders}</span>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/80 px-3.5 py-2 rounded-lg">
            <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Languages</span>
            <span className="text-xs font-bold text-slate-300 flex gap-1 mt-0.5 capitalize">
              {projectOverview.languages.join(", ") || "None"}
            </span>
          </div>
        </div>
      </div>

      {/* GitHub Repository Metadata Card */}
      {gitMetadata && (
        <div className="glow-card p-5 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 fill-current text-slate-200" viewBox="0 0 16 16">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-mono">GitHub Repository Source</span>
                <a
                  href={gitMetadata.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                >
                  {gitMetadata.owner}/{gitMetadata.repo}
                </a>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs">
                <span className="text-yellow-500 text-sm">★</span>
                <span className="text-slate-400 font-medium">Stars:</span>
                <span className="font-bold text-slate-200">{gitMetadata.stars}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs">
                <span className="text-blue-500 text-sm">⌥</span>
                <span className="text-slate-400 font-medium">Branch:</span>
                <span className="font-bold text-slate-200 font-mono">{gitMetadata.branch}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/60 pt-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">GitHub Project Languages</span>
            <div className="flex flex-wrap gap-1.5">
              {gitMetadata.languages && gitMetadata.languages.length > 0 ? (
                gitMetadata.languages.map((lang) => (
                  <span
                    key={lang}
                    className="bg-slate-950/80 border border-slate-800/80 text-slate-350 px-2 py-0.5 rounded text-xs font-medium capitalize"
                  >
                    {lang}
                  </span>
                ))
              ) : (
                <span className="italic text-slate-600 text-xs">None declared</span>
              )}
            </div>
          </div>

          {gitMetadata.truncated > 0 && (
            <div className="bg-amber-955/20 border border-amber-900/30 text-amber-300 text-xs p-3.5 rounded-lg flex gap-2">
              <span className="text-base leading-none">⚠️</span>
              <div>
                <p className="font-bold">Large Repository Warning</p>
                <p className="text-amber-400/80 mt-0.5">
                  This repository contains {gitMetadata.truncated + 100} supported source files. We imported the first 100 files for local static analysis compliance. Future project-wide indexers will run full semantic analysis.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Top Metric Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* LOC Card */}
        <div className="glow-card p-4 rounded-xl flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Lines of Code</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white">{projectOverview.loc}</span>
            <span className="text-[10px] text-slate-500">lines</span>
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between border-t border-slate-800/60 pt-2 mt-2">
            <span>Comments: {projectOverview.commentLines}</span>
            <span>Blank: {projectOverview.blankLines}</span>
          </div>
        </div>

        {/* Complexity Card */}
        <div className="glow-card p-4 rounded-xl flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Complexity (Cyclomatic)</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white">{complexityMetrics.score}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded font-bold uppercase ${
              complexityMetrics.rating === "High"
                ? "bg-red-950 text-red-400 border border-red-900/50"
                : complexityMetrics.rating === "Medium"
                ? "bg-amber-950 text-amber-400 border border-amber-900/50"
                : "bg-emerald-950 text-emerald-400 border border-emerald-900/50"
            }`}>{complexityMetrics.rating}</span>
          </div>
          <div className="text-[10px] text-slate-500 border-t border-slate-800/60 pt-2 mt-2">
            AST decision points detected
          </div>
        </div>

        {/* Code Quality Issues Card */}
        <div className="glow-card p-4 rounded-xl flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Quality Issues</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white">
              {qualityMetrics.issues.length + 
               (qualityMetrics.unusedImports ? qualityMetrics.unusedImports.length : 0) +
               (qualityMetrics.duplicateMethods ? qualityMetrics.duplicateMethods.length : 0)}
            </span>
            <span className="text-[10px] text-slate-500">issues detected</span>
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between border-t border-slate-800/60 pt-2 mt-2">
            <span>TODOs: {qualityMetrics.todos}</span>
            <span>Dupes: {qualityMetrics.duplicateMethods ? qualityMetrics.duplicateMethods.length : 0}</span>
          </div>
        </div>

        {/* Security Warnings Card */}
        <div className={`rounded-xl flex flex-col justify-between p-4 ${
          securityWarnings.length > 0 
            ? "bg-red-950/20 border border-red-900/40 text-red-250"
            : "glow-card"
        }`}>
          <span className="text-xs font-bold uppercase tracking-wider">Security Alerts</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white">{securityWarnings.length}</span>
            <span className="text-[10px]">vulnerabilities</span>
          </div>
          <div className="text-[10px] border-t border-slate-800/60 pt-2 mt-2">
            {securityWarnings.length > 0 ? "⚠️ Immediate review recommended" : "✓ No threats found"}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 3. Detailed Java Metrics Sub-Panel */}
        {javaMetrics && javaMetrics.classes > 0 && (
          <div className="glow-card p-5 rounded-xl lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
              Java Specific Metrics (AST)
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/40">
                <span className="text-slate-500 block">Classes</span>
                <span className="text-base font-bold text-slate-200">{javaMetrics.classes}</span>
                {javaMetrics.abstractClasses > 0 && (
                  <span className="text-[10px] text-slate-500 block">Abstract: {javaMetrics.abstractClasses}</span>
                )}
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/40">
                <span className="text-slate-500 block">Interfaces</span>
                <span className="text-base font-bold text-slate-200">{javaMetrics.interfaces}</span>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/40">
                <span className="text-slate-500 block">Enums</span>
                <span className="text-base font-bold text-slate-200">{javaMetrics.enums}</span>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/40">
                <span className="text-slate-500 block">Records</span>
                <span className="text-base font-bold text-slate-200">{javaMetrics.records}</span>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/40">
                <span className="text-slate-500 block">Methods</span>
                <span className="text-base font-bold text-slate-200">{javaMetrics.methods}</span>
                {javaMetrics.staticMethods > 0 && (
                  <span className="text-[10px] text-slate-500 block">Static: {javaMetrics.staticMethods}</span>
                )}
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/40">
                <span className="text-slate-500 block">Fields</span>
                <span className="text-base font-bold text-slate-200">{javaMetrics.fields}</span>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/40">
                <span className="text-slate-500 block">Constructors</span>
                <span className="text-base font-bold text-slate-200">{javaMetrics.constructors}</span>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/40">
                <span className="text-slate-500 block">Packages / Imports</span>
                <span className="text-xs font-semibold text-slate-300 block">Pkgs: {javaMetrics.packages}</span>
                <span className="text-xs font-semibold text-slate-300 block">Imports: {javaMetrics.imports}</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. Complexity Branching breakdown */}
        <div className={`glow-card p-5 rounded-xl space-y-4 ${javaMetrics && javaMetrics.classes > 0 ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
            Logic & Complexity Breakdown
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-xs text-center">
            <div className="bg-slate-950/30 p-2 rounded-lg border border-slate-800/40">
              <span className="text-slate-500 block">If statement</span>
              <span className="text-sm font-bold text-slate-300">{complexityMetrics.ifs}</span>
            </div>
            <div className="bg-slate-950/30 p-2 rounded-lg border border-slate-800/40">
              <span className="text-slate-500 block">Else If</span>
              <span className="text-sm font-bold text-slate-300">{complexityMetrics.elseIfs}</span>
            </div>
            <div className="bg-slate-950/30 p-2 rounded-lg border border-slate-800/40">
              <span className="text-slate-500 block">Switch Cases</span>
              <span className="text-sm font-bold text-slate-300">{complexityMetrics.switches}</span>
            </div>
            <div className="bg-slate-950/30 p-2 rounded-lg border border-slate-800/40">
              <span className="text-slate-500 block">For loops</span>
              <span className="text-sm font-bold text-slate-300">{complexityMetrics.fors}</span>
            </div>
            <div className="bg-slate-950/30 p-2 rounded-lg border border-slate-800/40">
              <span className="text-slate-500 block">While loops</span>
              <span className="text-sm font-bold text-slate-300">{complexityMetrics.whiles}</span>
            </div>
            <div className="bg-slate-950/30 p-2 rounded-lg border border-slate-800/40">
              <span className="text-slate-500 block">Do While</span>
              <span className="text-sm font-bold text-slate-300">{complexityMetrics.dos}</span>
            </div>
            <div className="bg-slate-950/30 p-2 rounded-lg border border-slate-800/40">
              <span className="text-slate-500 block">Try Catch</span>
              <span className="text-sm font-bold text-slate-300">{complexityMetrics.catches}</span>
            </div>
            <div className="bg-slate-950/30 p-2 rounded-lg border border-slate-800/40">
              <span className="text-slate-500 block">Lambdas</span>
              <span className="text-sm font-bold text-slate-300">{complexityMetrics.lambdas}</span>
            </div>
            <div className="bg-slate-950/30 p-2 rounded-lg border border-slate-800/40">
              <span className="text-slate-500 block">Ternary ops</span>
              <span className="text-sm font-bold text-slate-300">{complexityMetrics.ternaries}</span>
            </div>
            <div className="bg-slate-950/40 p-2 rounded-lg border border-blue-500/20">
              <span className="text-blue-400 block font-semibold">Complexity Index</span>
              <span className="text-sm font-black text-white">{complexityMetrics.score}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Security Warnings Details */}
      {securityWarnings.length > 0 && (
        <div className="glow-card p-5 rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest border-b border-red-950 pb-2 flex items-center gap-1.5">
            <span>⚠️</span> Security Alerts Detail
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead className="bg-slate-950 text-slate-300 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Warning Type</th>
                  <th className="py-2.5 px-3">File Location</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Code Snippet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {securityWarnings.map((warning, index) => (
                  <tr key={index} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-3 font-semibold text-red-400">{warning.title}</td>
                    <td className="py-3 px-3">
                      <span className="text-slate-300 block font-mono">{warning.file}</span>
                      <span className="text-slate-500 text-[10px]">Line: {warning.lineNumber}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{warning.description}</td>
                    <td className="py-3 px-3">
                      <code className="bg-slate-950 px-2 py-1 rounded text-[10px] text-slate-400 block font-mono overflow-x-auto max-w-[250px] truncate">
                        {warning.snippet}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Code Quality Smells Detail */}
      {qualityMetrics.issues.length > 0 && (
        <div className="glow-card p-5 rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
            Code Improvement Suggestions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {qualityMetrics.issues.map((issue, index) => (
              <div key={index} className="bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-300 text-xs">{issue.title}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      issue.severity === "warning" ? "bg-amber-950 text-amber-400 border border-amber-900/40" : "bg-blue-950 text-blue-400 border border-blue-900/40"
                    }`}>{issue.severity}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block font-mono truncate mb-2">{issue.file}</span>
                  <p className="text-xs text-slate-400">{issue.message}</p>
                </div>
                {issue.details && issue.details.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-850 text-[10px] text-slate-500 max-h-[80px] overflow-y-auto space-y-1">
                    {issue.details.map((d, dIdx) => (
                      <div key={dIdx} className="flex justify-between font-mono bg-slate-950/80 px-2 py-0.5 rounded">
                        <span>{d.name}</span>
                        <span className="text-slate-400">{d.lines} lines</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AST Java Code Smells Card */}
      {((qualityMetrics.unusedImports && qualityMetrics.unusedImports.length > 0) ||
        (qualityMetrics.duplicateMethods && qualityMetrics.duplicateMethods.length > 0) ||
        (qualityMetrics.largeClasses && qualityMetrics.largeClasses.length > 0) ||
        (qualityMetrics.longMethods && qualityMetrics.longMethods.length > 0)) && (
        <div className="glow-card p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest border-b border-slate-800 pb-2">
            ⚠️ AST Diagnostics & Warnings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Unused Imports */}
            {qualityMetrics.unusedImports && qualityMetrics.unusedImports.length > 0 && (
              <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-lg space-y-2">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Unused Imports ({qualityMetrics.unusedImports.length})</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-400 max-h-[150px] overflow-y-auto">
                  {qualityMetrics.unusedImports.map((imp, idx) => (
                    <li key={idx} className="font-mono text-[10px] truncate" title={imp}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Duplicate Methods */}
            {qualityMetrics.duplicateMethods && qualityMetrics.duplicateMethods.length > 0 && (
              <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-lg space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Duplicate Methods ({qualityMetrics.duplicateMethods.length})</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-400 max-h-[150px] overflow-y-auto">
                  {qualityMetrics.duplicateMethods.map((dup, idx) => (
                    <li key={idx} className="text-[10px]">{dup}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Large Classes */}
            {qualityMetrics.largeClasses && qualityMetrics.largeClasses.length > 0 && (
              <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-lg space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Large Classes (&gt;300 LOC)</span>
                <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1">
                  {qualityMetrics.largeClasses.map((cls, idx) => (
                    <div key={idx} className="flex justify-between font-mono text-[10px] text-slate-400">
                      <span className="truncate" title={cls.path}>{cls.name}</span>
                      <span className="text-slate-500 font-bold shrink-0">{cls.loc} lines</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Long Methods */}
            {qualityMetrics.longMethods && qualityMetrics.longMethods.length > 0 && (
              <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-lg space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Long Methods (&gt;50 LOC)</span>
                <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1">
                  {qualityMetrics.longMethods.map((met, idx) => (
                    <div key={idx} className="flex justify-between font-mono text-[10px] text-slate-400">
                      <span className="truncate" title={met.path}>{met.className}.{met.name}()</span>
                      <span className="text-slate-500 font-bold shrink-0">{met.loc} lines</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. File Insights Table */}
      <div className="glow-card p-5 rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
          File Diagnostics & Insights
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-400">
            <thead className="bg-slate-950 text-slate-300 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">Filename</th>
                <th className="py-2.5 px-3">Path</th>
                <th className="py-2.5 px-3 text-center">Lines</th>
                <th className="py-2.5 px-3 text-center">Classes</th>
                <th className="py-2.5 px-3 text-center">Methods</th>
                <th className="py-2.5 px-3 text-center">TODOs</th>
                <th className="py-2.5 px-3 text-center">Complexity</th>
                <th className="py-2.5 px-3 text-center">Last Modified</th>
                <th className="py-2.5 px-3 text-center rounded-r-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {Object.keys(fileInsights).map((fileId) => {
                const insight = fileInsights[fileId];
                // Find matching file name/path
                const fileObj = qualityMetrics.issues.find(i => i.fileId === fileId) || 
                                (analysisResults.cache[fileId] ? { name: fileId, path: analysisResults.cache[fileId].result.path } : { name: "File", path: "" });
                const actualName = analysisResults.cache[fileId]?.result.name || fileObj.name;
                const actualPath = analysisResults.cache[fileId]?.result.path || fileObj.path;

                return (
                  <tr key={fileId} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <span>📄</span> {actualName}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[10px] text-slate-500 max-w-[200px] truncate" title={actualPath}>
                      {actualPath}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-300">{insight.lines}</td>
                    <td className="py-3 px-3 text-center text-slate-300">{insight.classes}</td>
                    <td className="py-3 px-3 text-center text-slate-300">{insight.methods}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        insight.todoCount > 0 ? "bg-amber-950/80 text-amber-400 border border-amber-900/30" : "text-slate-500"
                      }`}>{insight.todoCount}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        insight.complexity > 25
                          ? "bg-red-950 text-red-400 border border-red-900/30"
                          : insight.complexity > 10
                          ? "bg-amber-950 text-amber-400 border border-amber-900/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700/30"
                      }`}>{insight.complexity}</span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500 font-mono text-[10px]">
                      {formatTime(insight.lastModified)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onOpenFile(fileId)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-2.5 py-1 rounded transition-colors text-[10px]"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. Dependency Coupling Graph */}
      {analysisResults.dependencyNodes && analysisResults.dependencyNodes.length > 0 && (
        <div className="glow-card p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest border-b border-slate-800 pb-2">
            🔗 Class Coupling & Dependency Graph
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Coupling Details</span>
              {analysisResults.dependencyEdges && analysisResults.dependencyEdges.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-800/60 pr-2">
                  {analysisResults.dependencyEdges.map((edge, index) => (
                    <div key={index} className="py-2 flex items-center justify-between text-xs">
                      <span className="font-mono text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/30">{edge.source}</span>
                      <span className="text-slate-500 font-mono text-[10px]">references ➔</span>
                      <span className="font-mono text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-900/30">{edge.target}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No class couplings found in codebase.</p>
              )}
            </div>
            
            <div className="bg-slate-955/40 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Coupling Insights</span>
                <div className="space-y-3.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Analyzed Classes:</span>
                    <span className="font-bold text-slate-200">{analysisResults.dependencyNodes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Couplings:</span>
                    <span className="font-bold text-slate-200">{analysisResults.dependencyEdges ? analysisResults.dependencyEdges.length : 0}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-800/60 pt-3">
                    Class coupling metrics represent references mapped from AST analysis. High coupling indexes indicate tightly coupled architectures that may benefit from dependency inversion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </>)}
    </div>
  );
}

export default ProjectDashboard;
