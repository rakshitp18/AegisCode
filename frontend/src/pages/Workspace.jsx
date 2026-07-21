import Navbar from "../components/common/Navbar";
import AnalyzeButton from "../components/common/AnalyzeButton";
import AlertModal from "../components/common/AlertModal";

import LanguageSelector from "../components/editor/LanguageSelector";
import CodeEditor from "../components/editor/CodeEditor";
import EditorToolbar from "../components/editor/EditorToolbar";

import Sidebar from "../components/layout/Sidebar";
import RightPanel from "../components/layout/RightPanel";
import StatusBar from "../components/layout/StatusBar";
import WorkspaceLayout from "../components/layout/WorkspaceLayout";

import ProjectDashboard from "../components/dashboard/ProjectDashboard";

import useProject from "../hooks/useProject";
import useAnalysis from "../hooks/useAnalysis";
import useProjectAnalysis from "../hooks/useProjectAnalysis";

function Workspace() {
  const {
    projectName,
    files,
    currentFile,
    currentFileId,
    setCurrentFileId,
    updateCurrentFile,
    updateCurrentFileLanguage,
    addNewFile,
    deleteFile,
    importProject,
    getProjectStats,
  } = useProject();

  const {
    result,
    loading,
    analyzeCode,
    alertInfo,
    setAlertInfo,
  } = useAnalysis();

  const {
    analysisResults,
    filterType,
    setFilterType
  } = useProjectAnalysis(files, projectName);

  // Filter files dynamically based on selected card in Project Overview
  const getFilteredFiles = () => {
    if (!analysisResults || filterType === "all") return files;

    return files.filter(file => {
      const insight = analysisResults.fileInsights[file.id];
      if (!insight) return false;

      switch (filterType) {
        case "classes":
          return insight.classes > 0;
        case "methods":
          return insight.methods > 0;
        case "loc":
          return insight.lines > 0;
        case "complexity":
          return insight.complexity > 10;
        case "todos":
          return insight.todoCount > 0;
        case "security":
          return analysisResults.securityWarnings.some(w => w.file === (file.path || file.name));
        default:
          return true;
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-955 text-white">
      <Navbar />

      <WorkspaceLayout
        sidebar={
          <Sidebar
            projectName={projectName}
            files={getFilteredFiles()}
            currentFileId={currentFileId}
            onSelectFile={setCurrentFileId}
            onAddNewFile={addNewFile}
            onDeleteFile={deleteFile}
            onImportProject={importProject}
            setAlertInfo={setAlertInfo}
            stats={getProjectStats()}
            filterType={filterType}
            onSelectFilter={setFilterType}
            analysisResults={analysisResults}
          />
        }
        editor={
          currentFile ? (
            <div className="h-full flex flex-col">
              <EditorToolbar
                currentFile={currentFile}
                onCopy={() => {
                  if (currentFile) {
                    navigator.clipboard.writeText(currentFile.content);
                  }
                }}
                onClear={() => updateCurrentFile("")}
              />

              <div className="p-4 border-b border-slate-800">
                <LanguageSelector
                  language={currentFile?.language || "java"}
                  setLanguage={updateCurrentFileLanguage}
                />
              </div>

              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  language={currentFile?.language || "java"}
                  code={currentFile?.content || ""}
                  setCode={updateCurrentFile}
                />
              </div>

              <div className="p-4 border-t border-slate-800">
                <AnalyzeButton
                  onAnalyze={() => {
                    if (currentFile) {
                      analyzeCode(currentFile.language, currentFile.content);
                    }
                  }}
                  loading={loading}
                />
              </div>
            </div>
          ) : (
            <ProjectDashboard
              projectName={projectName}
              analysisResults={analysisResults}
              onOpenFile={setCurrentFileId}
            />
          )
        }
        rightPanel={<RightPanel result={result} />}
        statusBar={
          <StatusBar
            language={currentFile?.language || ""}
            code={currentFile?.content || ""}
          />
        }
      />

      <AlertModal
        isOpen={!!alertInfo}
        onClose={() => setAlertInfo(null)}
        title={alertInfo?.title}
        message={alertInfo?.message}
      />
    </div>
  );
}

export default Workspace;