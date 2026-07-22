import React, { useState, useRef } from "react";
import Navbar from "../components/common/Navbar";
import AnalyzeButton from "../components/common/AnalyzeButton";
import AlertModal from "../components/common/AlertModal";
import RefactorModal from "../components/analysis/RefactorModal";

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
import useProjectAiAnalysis from "../hooks/useProjectAiAnalysis";

import { importFolder } from "../services/folderImportService";
import { importGitHubRepository } from "../services/githubImportService";
import { refactorCodeRequest } from "../services/analysisService";

function Workspace() {
  const [activeAnalysisTab, setActiveAnalysisTab] = useState("file");
  const [lastOpenedFileId, setLastOpenedFileId] = useState(null);

  const fileInputRef = useRef(null);
  const editorRef = useRef(null);

  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [gitHubUrl, setGitHubUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");

  // Refactor state
  const [isRefactoring, setIsRefactoring] = useState(false);
  const [refactorResult, setRefactorResult] = useState(null);
  const [refactorScope, setRefactorScope] = useState("selection");
  const [refactorIntent, setRefactorIntent] = useState("");
  const [showRefactorSetup, setShowRefactorSetup] = useState(false);

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
    gitMetadata,
  } = useProject();

  const {
    result,
    setResult,
    loading,
    analyzeCode,
    alertInfo,
    setAlertInfo,
  } = useAnalysis();

  const {
    analysisResults,
    filterType,
    setFilterType,
    staticLoading
  } = useProjectAnalysis(files, projectName);

  const {
    projectAiResult,
    projectAiLoading,
    projectAiError,
    analyzeProjectAi
  } = useProjectAiAnalysis();

  const handleAnalyzeProject = (startOffset = 0) => {
    const offset = (typeof startOffset === "number") ? startOffset : 0;
    setActiveAnalysisTab("project");
    analyzeProjectAi(projectName, files, offset);
  };

  const handleRefactorRequest = async () => {
    if (!currentFile || !editorRef.current) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    const selection = editor.getSelection();
    const selectedText = model ? model.getValueInRange(selection) : "";
    const cursorLine = selection ? selection.startLineNumber : 1;
    const fileContent = currentFile.content || "";
    const language = currentFile.language || "text";

    let scope = refactorScope;
    // If nothing selected, default to method scope
    if (!selectedText.trim() && scope === "selection") {
      scope = "method";
    }

    const intent = refactorIntent.trim() || "Improve readability, reduce complexity, and apply best practices";

    try {
      setIsRefactoring(true);
      setShowRefactorSetup(false);
      const response = await refactorCodeRequest(
        language,
        fileContent,
        selectedText,
        scope,
        cursorLine,
        intent
      );
      setRefactorResult(response);
    } catch (err) {
      console.error("Refactor error:", err);
      setAlertInfo({
        title: "Refactoring Failed",
        message: err.message || "An error occurred while communicating with the AI refactoring service."
      });
    } finally {
      setIsRefactoring(false);
    }
  };

  const handleAcceptRefactor = () => {
    if (!refactorResult || !editorRef.current) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    const original = refactorResult.originalCode || "";
    const refactored = refactorResult.refactoredCode || "";

    if (refactorScope === "file") {
      // Replace entire file content
      updateCurrentFile(refactored);
    } else {
      // Find-and-replace the original segment in the file
      const currentContent = model ? model.getValue() : currentFile.content;
      const idx = currentContent.indexOf(original);
      if (idx !== -1) {
        const updated = currentContent.slice(0, idx) + refactored + currentContent.slice(idx + original.length);
        updateCurrentFile(updated);
      } else {
        // Fallback: replace entire file with the AI refactored code
        updateCurrentFile(refactored);
      }
    }
    setRefactorResult(null);
  };

  const handleOpenFolderClick = () => {
    const isSupported =
      typeof HTMLInputElement !== "undefined" &&
      "webkitdirectory" in HTMLInputElement.prototype;

    if (!isSupported) {
      setAlertInfo({
        title: "Browser Unsupported",
        message: "Your browser does not support folder uploading. Please try using a modern browser like Chrome, Edge, or Firefox."
      });
      return;
    }
    fileInputRef.current.click();
  };

  const handleFolderUpload = async (e) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    try {
      const result = await importFolder(rawFiles);
      importProject(result.projectName, result.files);
    } catch (err) {
      console.error(err);
      setAlertInfo({
        title: "Folder Import Failed",
        message: err.message || "An unexpected error occurred while importing the folder."
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleGitHubImport = async (e) => {
    e.preventDefault();
    if (!gitHubUrl.trim()) return;

    try {
      setIsImporting(true);
      setImportError("");
      const result = await importGitHubRepository(gitHubUrl);
      importProject(result.projectName, result.files, result.metadata);
      setIsGitHubModalOpen(false);
      setGitHubUrl("");
    } catch (err) {
      console.error(err);
      setImportError(err.message || "Failed to import GitHub repository.");
    } finally {
      setIsImporting(false);
    }
  };

  React.useEffect(() => {
    if (currentFileId !== null) {
      setLastOpenedFileId(currentFileId);
    }
  }, [currentFileId]);

  React.useEffect(() => {
    if (result && currentFile) {
      try {
        const history = JSON.parse(localStorage.getItem("analysis_history") || "[]");
        const exists = history.some(h => h.summary === result.summary && h.fileName === currentFile.name);
        if (!exists) {
          const newEntry = {
            id: Date.now(),
            fileName: currentFile.name,
            language: currentFile.language,
            timestamp: new Date().toLocaleTimeString(),
            summary: result.summary || "No summary available",
            loc: result.metrics?.lines || 0,
            classes: result.metrics?.classes || 0,
            methods: result.metrics?.methods || 0
          };
          localStorage.setItem("analysis_history", JSON.stringify([newEntry, ...history].slice(0, 15)));
        }
      } catch (e) {
        console.error("Failed to save analysis to history:", e);
      }
    }
  }, [result, currentFile]);

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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar
        onOpenFolder={handleOpenFolderClick}
        onGitHub={() => setIsGitHubModalOpen(true)}
        onShowDashboard={() => setCurrentFileId(null)}
        currentFileId={currentFileId}
      />

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
            gitMetadata={gitMetadata}
            lastOpenedFileId={lastOpenedFileId}
            lastOpenedFileName={files.find(f => f.id === lastOpenedFileId)?.name || ""}
            onLoadAnalysisResult={(summary, loc, classes, methods) => {
              setResult({
                summary,
                bugs: [],
                suggestions: [],
                complexity: "Unknown",
                tests: [],
                metrics: { lines: loc, classes, methods, todos: 0, printStatements: 0 }
              });
              setActiveAnalysisTab("file");
            }}
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
                  editorRef={editorRef}
                />
              </div>

              <div className="p-4 border-t border-slate-800 flex flex-col gap-3">
                {/* Analyze Row */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <AnalyzeButton
                      onAnalyze={() => {
                        if (currentFile) {
                          setActiveAnalysisTab("file");
                          analyzeCode(currentFile.language, currentFile.content);
                        }
                      }}
                      loading={loading}
                    />
                  </div>

                  {/* Refactor Button */}
                  <button
                    onClick={() => setShowRefactorSetup(prev => !prev)}
                    disabled={isRefactoring}
                    className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-indigo-950/30 transform hover:-translate-y-0.5 cursor-pointer text-sm"
                  >
                    {isRefactoring ? (
                      <>
                        <span className="animate-spin">⟳</span> Refactoring…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M17.65 6.35A7.958 7.958 0 0012 4C7.58 4 4 7.58 4 12s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                        </svg>
                        Refactor
                      </>
                    )}
                  </button>
                </div>

                {/* Refactor Options Panel */}
                {showRefactorSetup && (
                  <div className="bg-slate-950/60 border border-indigo-900/40 rounded-xl p-4 space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-indigo-400 fill-current" viewBox="0 0 24 24">
                        <path d="M17.65 6.35A7.958 7.958 0 0012 4C7.58 4 4 7.58 4 12s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                      </svg>
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">AI Refactor Options</span>
                    </div>

                    {/* Scope selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Scope</label>
                      <div className="flex gap-2">
                        {["selection", "method", "file"].map(s => (
                          <button
                            key={s}
                            onClick={() => setRefactorScope(s)}
                            className={`text-xs font-semibold py-1.5 px-3 rounded-lg border transition-all cursor-pointer capitalize ${
                              refactorScope === s
                                ? "bg-indigo-700 border-indigo-500 text-white"
                                : "bg-slate-850 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
                            }`}
                          >
                            {s === "selection" ? "📝 Selection" : s === "method" ? "🔧 Method" : "📄 Entire File"}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1.5">
                        {refactorScope === "selection"
                          ? "Refactors the currently highlighted code selection."
                          : refactorScope === "method"
                          ? "Extracts and refactors the enclosing method at cursor position."
                          : "Refactors the entire file content."}
                      </p>
                    </div>

                    {/* Intent input */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Intent (optional)</label>
                      <input
                        type="text"
                        value={refactorIntent}
                        onChange={e => setRefactorIntent(e.target.value)}
                        placeholder="e.g. Simplify the loop, rename variables for clarity…"
                        className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg py-2 px-3 text-xs text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-indigo-500/40 transition"
                      />
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleRefactorRequest}
                      disabled={isRefactoring}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-lg transition-all cursor-pointer"
                    >
                      {isRefactoring ? "Refactoring…" : "Run AI Refactor"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <ProjectDashboard
              projectName={projectName}
              analysisResults={analysisResults}
              onOpenFile={setCurrentFileId}
              gitMetadata={gitMetadata}
              onRunProjectAiAnalysis={handleAnalyzeProject}
              projectAiLoading={projectAiLoading}
              staticLoading={staticLoading}
              lastOpenedFileId={lastOpenedFileId}
              lastOpenedFileName={files.find(f => f.id === lastOpenedFileId)?.name || ""}
            />
          )
        }
        rightPanel={
          <RightPanel
            result={result}
            projectAiResult={projectAiResult}
            projectAiLoading={projectAiLoading}
            projectAiError={projectAiError}
            onRunProjectAnalysis={handleAnalyzeProject}
            activeTab={activeAnalysisTab}
            setActiveTab={setActiveAnalysisTab}
            projectName={projectName}
            currentFile={currentFile}
            files={files}
            analysisResults={analysisResults}
          />
        }
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

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFolderUpload}
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
      />

      {/* GitHub Repository Import Modal Dialog */}
      {isGitHubModalOpen && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl max-w-sm w-full space-y-4 text-left">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <svg className="w-4 h-4 fill-current text-slate-200" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                Import from GitHub
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter the URL of a public repository to download and scan source code files.
              </p>
            </div>

            <form onSubmit={handleGitHubImport} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Repository URL
                </label>
                <input
                  type="text"
                  value={gitHubUrl}
                  onChange={(e) => setGitHubUrl(e.target.value)}
                  placeholder="https://github.com/owner/repository"
                  disabled={isImporting}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50"
                  required
                />
              </div>

              {importError && (
                <div className="bg-red-950/30 border border-red-900/40 text-red-400 text-xs p-2.5 rounded-lg font-medium">
                  {importError}
                </div>
              )}

              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsGitHubModalOpen(false);
                    setGitHubUrl("");
                    setImportError("");
                  }}
                  disabled={isImporting}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-755 text-slate-300 font-semibold cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !gitHubUrl.trim()}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Importing...
                    </>
                  ) : (
                    "Import"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Refactor Result Diff Modal */}
      <RefactorModal
        isOpen={!!refactorResult}
        onClose={() => setRefactorResult(null)}
        originalCode={refactorResult?.originalCode || ""}
        refactoredCode={refactorResult?.refactoredCode || ""}
        explanation={refactorResult?.explanation || ""}
        improvements={refactorResult?.improvements || []}
        language={currentFile?.language || "text"}
        fileName={currentFile?.name || ""}
        onAccept={handleAcceptRefactor}
      />
    </div>
  );
}

export default Workspace;