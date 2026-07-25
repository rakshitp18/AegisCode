import { useOutletContext, useNavigate } from "react-router-dom";
import ResultsPanel from "../../components/analysis/ResultsPanel";

export default function InspectFilePage() {
  const { analysisResult, analysisLoading, currentFile } = useOutletContext();
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 flex flex-col h-full min-h-0">
      <div className="max-w-4xl mx-auto w-full space-y-6 flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>📄</span> Inspect File Analysis
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Code diagnostics and heuristics review for {currentFile ? <span className="font-semibold text-blue-400">{currentFile.name}</span> : "selected file"}
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-xs bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white font-semibold py-1.5 px-3.5 rounded-xl transition cursor-pointer"
          >
            ← Back to Editor
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {analysisLoading ? (
            <div className="space-y-4 py-20 text-center select-none bg-slate-900/10 border border-slate-900 rounded-3xl animate-fadeIn">
              <div className="w-10 h-10 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-sm text-slate-200 font-semibold">Running Code Heuristics...</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">AI is scanning your class nodes for bugs, style smells and optimization recommendations.</p>
              </div>
            </div>
          ) : !analysisResult ? (
            <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10 animate-fadeIn">
              <span className="text-4xl">📄</span>
              <h3 className="text-base font-bold text-slate-300 mt-3">No File Analysis Performed Yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Open the <span className="text-blue-400 font-semibold">Editor</span> tab, select a file, and click <span className="text-blue-400 font-semibold">Run Analysis</span> to view detailed AST reports here.
              </p>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <ResultsPanel result={analysisResult} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
