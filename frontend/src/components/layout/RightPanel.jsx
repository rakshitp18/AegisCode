import React from "react";
import ResultsPanel from "../analysis/ResultsPanel";
import ProjectResultsPanel from "../analysis/ProjectResultsPanel";
import ChatPanel from "../chat/ChatPanel";

function RightPanel({
  result,
  projectAiResult,
  projectAiLoading,
  projectAiError,
  onRunProjectAnalysis,
  activeTab = "file",
  setActiveTab,
  projectName,
  currentFile,
  files,
  analysisResults
}) {
  return (
    <div className="h-full flex flex-col min-h-0 bg-slate-900/40">
      {/* Tab Switcher Headers */}
      <div className="flex border-b border-slate-800 shrink-0 bg-slate-950/20">
        <button
          onClick={() => setActiveTab("file")}
          className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-center transition-all border-b-2 cursor-pointer ${
            activeTab === "file"
              ? "border-blue-500 text-blue-400 font-extrabold bg-blue-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/10"
          }`}
        >
          📄 File Analysis
        </button>
        <button
          onClick={() => setActiveTab("project")}
          className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-center transition-all border-b-2 cursor-pointer ${
            activeTab === "project"
              ? "border-blue-500 text-blue-400 font-extrabold bg-blue-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/10"
          }`}
        >
          🤖 Project AI
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-center transition-all border-b-2 cursor-pointer ${
            activeTab === "chat"
              ? "border-blue-500 text-blue-400 font-extrabold bg-blue-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/10"
          }`}
        >
          💬 AI Chat
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {activeTab === "file" && (
          <ResultsPanel result={result} />
        )}
        
        {activeTab === "project" && (
          <ProjectResultsPanel
            result={projectAiResult}
            loading={projectAiLoading}
            error={projectAiError}
            onRunAnalysis={onRunProjectAnalysis}
          />
        )}

        {activeTab === "chat" && (
          <ChatPanel
            projectName={projectName}
            currentFile={currentFile}
            files={files}
            analysisResults={analysisResults}
          />
        )}
      </div>
    </div>
  );
}

export default RightPanel;