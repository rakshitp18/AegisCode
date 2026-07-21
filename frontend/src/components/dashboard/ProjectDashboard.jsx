import React from "react";

function ProjectDashboard({ projectName, analysisResults, onOpenFile, gitMetadata = null }) {
  if (!analysisResults) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-955 text-slate-400 select-none">
        <div className="text-center space-y-2">
          <span className="text-4xl">📊</span>
          <h3 className="text-lg font-semibold text-slate-200">No Analysis Available</h3>
          <p className="text-sm text-slate-500">Upload a project folder or add files to generate metrics.</p>
        </div>
      </div>
    );
  }

  const {
    projectOverview,
    javaMetrics,
    qualityMetrics,
    complexityMetrics,
    securityWarnings,
    fileInsights
  } = analysisResults;

  // Format timestamp helper
  const formatTime = (ts) => {
    if (!ts) return "-";
    return new Date(ts).toLocaleTimeString();
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-950 p-6 text-slate-200 space-y-6">
      
      {/* 1. Project Overview Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
        <div>
          <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Project Identity</span>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2 mt-0.5">
            <span>📁</span> {projectOverview.projectName}
          </h1>
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
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🐙</span>
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
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
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
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Complexity</span>
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
            Dynamic execution pathways
          </div>
        </div>

        {/* Code Quality Issues Card */}
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Quality Issues</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white">{qualityMetrics.issues.length}</span>
            <span className="text-[10px] text-slate-500">smells detected</span>
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between border-t border-slate-800/60 pt-2 mt-2">
            <span>TODOs: {qualityMetrics.todos}</span>
            <span>FIXMEs: {qualityMetrics.fixmes}</span>
          </div>
        </div>

        {/* Security Warnings Card */}
        <div className={`border p-4 rounded-xl flex flex-col justify-between ${
          securityWarnings.length > 0 
            ? "bg-red-950/20 border-red-900/40 text-red-200"
            : "bg-slate-900 border-slate-800/80"
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
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
              Java Specific Metrics
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
        <div className={`bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 ${javaMetrics && javaMetrics.classes > 0 ? "lg:col-span-2" : "lg:col-span-3"}`}>
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
              <span className="text-blue-400 block font-semibold">Total Paths</span>
              <span className="text-sm font-black text-white">{complexityMetrics.score}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Security Warnings Details */}
      {securityWarnings.length > 0 && (
        <div className="bg-slate-900 border border-red-950/80 p-5 rounded-xl space-y-3">
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
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
            Static Quality Smells Detail
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

      {/* 7. File Insights Table */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
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
                const actualLang = analysisResults.cache[fileId]?.result.language || "";

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

    </div>
  );
}

export default ProjectDashboard;
