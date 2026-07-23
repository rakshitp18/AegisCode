import ResultsPanel from "../analysis/ResultsPanel";
import ProjectResultsPanel from "../analysis/ProjectResultsPanel";
import ChatPanel from "../chat/ChatPanel";
import AnalysisHistoryPanel from "../analysis/AnalysisHistoryPanel";
import { useAnalysisContext } from "../../contexts/AnalysisContext";

function RightPanel({
  projectAiResult,
  projectAiLoading,
  projectAiError,
  onRunProjectAnalysis,
  activeTab = "file",
  setActiveTab,
  projectName,
  currentFile,
  files,
  analysisResults,
  projectId,
}) {
  const { analysisResult, loading: analysisLoading } = useAnalysisContext();

  const tabs = [
    { id: "file",    label: "📄 File" },
    { id: "project", label: "🤖 Project AI" },
    { id: "chat",    label: "💬 Chat" },
    { id: "history", label: "🕒 History" },
  ];

  return (
    <div className="h-full flex flex-col min-h-0 bg-slate-900/40">
      {/* Tab Switcher Headers */}
      <div className="flex border-b border-slate-800 shrink-0 bg-slate-950/20 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-fit py-3 px-2 text-[10px] font-bold uppercase tracking-wider text-center transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-400 font-extrabold bg-blue-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className={`flex-1 min-h-0 ${activeTab === "history" ? "overflow-hidden relative" : "overflow-y-auto p-3"}`}>
        {activeTab === "file" && (
          analysisLoading ? (
            <div className="space-y-4 py-12 text-center select-none">
              <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-xs text-slate-200 font-semibold">Running Code Heuristics...</p>
                <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto">AI is scanning your class nodes for bugs and suggestions.</p>
              </div>
            </div>
          ) : (
            <ResultsPanel result={analysisResult} />
          )
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

        {activeTab === "history" && (
          <AnalysisHistoryPanel projectId={projectId} />
        )}
      </div>
    </div>
  );
}

export default RightPanel;