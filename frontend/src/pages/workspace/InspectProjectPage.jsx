import { useOutletContext } from "react-router-dom";
import ProjectDashboard from "../../components/dashboard/ProjectDashboard";

export default function InspectProjectPage() {
  const {
    projectName,
    analysisResults,
    gitMetadata,
    projectAiResult,
    projectAiLoading,
    projectAiError,
    handleAnalyzeProject,
    staticLoading,
    currentProject,
    setCurrentFileId,
    setActiveNavbarTab
  } = useOutletContext();

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 flex flex-col h-full min-h-0">
      <div className="max-w-6xl mx-auto w-full space-y-6 flex flex-col flex-1 min-h-0 animate-fadeIn">
        <div className="border-b border-slate-800 pb-4 shrink-0">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>📊</span> Project Analysis Overview
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Structural codebase metrics, Java logic complexity, duplicate patterns, and AI-driven architecture reviews
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <ProjectDashboard
            analysisResults={analysisResults}
            onOpenFile={(fileId) => {
              // Direct navigation to editor on file select
              setCurrentFileId(fileId);
            }}
            gitMetadata={gitMetadata}
            onRunProjectAiAnalysis={handleAnalyzeProject}
            projectAiLoading={projectAiLoading}
            projectAiResult={projectAiResult}
            projectAiError={projectAiError}
            staticLoading={staticLoading}
            projectId={currentProject?.id || null}
          />
        </div>
      </div>
    </div>
  );
}
