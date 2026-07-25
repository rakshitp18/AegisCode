import { useOutletContext } from "react-router-dom";
import AnalysisHistoryPanel from "../../components/analysis/AnalysisHistoryPanel";

export default function HistoryPage() {
  const { currentProject } = useOutletContext();

  return (
    <div className="flex-1 overflow-y-auto bg-slate-955 p-6 flex flex-col h-full min-h-0">
      <div className="max-w-4xl mx-auto w-full space-y-6 flex flex-col flex-1 min-h-0 animate-fadeIn">
        <div className="border-b border-slate-800 pb-4 shrink-0">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>🕒</span> Analysis & Commit History
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review past file analysis logs and repository commits
          </p>
        </div>

        <div className="bg-slate-900/30 border border-slate-800/85 rounded-3xl p-5 flex-1 min-h-0 overflow-y-auto relative">
          <AnalysisHistoryPanel projectId={currentProject?.id || null} />
        </div>
      </div>
    </div>
  );
}
