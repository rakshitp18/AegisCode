import { useState, useRef, useEffect } from "react";
import Navbar from "../components/common/Navbar";
import AnalyzeButton from "../components/common/AnalyzeButton";
import AlertModal from "../components/common/AlertModal";
import RefactorModal from "../components/analysis/RefactorModal";

import CodeEditor from "../components/editor/CodeEditor";
import EditorToolbar from "../components/editor/EditorToolbar";

import Sidebar from "../components/layout/Sidebar";
import RightPanel from "../components/layout/RightPanel";
import StatusBar from "../components/layout/StatusBar";
import WorkspaceLayout from "../components/layout/WorkspaceLayout";

import ProjectDashboard from "../components/dashboard/ProjectDashboard";
import CreateProjectModal from "../components/dashboard/CreateProjectModal";

import { useParams, useNavigate } from "react-router-dom";
import useProject from "../hooks/useProject";
import useProjectAnalysis from "../hooks/useProjectAnalysis";
import useProjectAiAnalysis from "../hooks/useProjectAiAnalysis";
import { useProjectContext } from "../contexts/ProjectContext";
import { useAnalysisContext } from "../contexts/AnalysisContext";

import { importFolder } from "../services/folderImportService";
import { parseGitHubUrl, importGitHubRepositoryViaZip } from "../services/githubImportService";

function Workspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentProject, projects, selectProject, loading: projectsLoading, error: projectsError } = useProjectContext();
  const [isFirstProjectModalOpen, setIsFirstProjectModalOpen] = useState(false);

  // Sync active project with the route :projectId parameter
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const found = projects.find((p) => p.id === Number(projectId));
      if (found) {
        if (!currentProject || currentProject.id !== found.id) {
          selectProject(found);
        }
      } else if (!projectsLoading) {
        // Redirection if project is not found
        navigate("/dashboard");
      }
    }
  }, [projectId, projects, currentProject, projectsLoading, selectProject, navigate]);

  const projectName = currentProject?.name || "No Project Selected";

  const [activeAnalysisTab, setActiveAnalysisTab] = useState("file");
  const [lastOpenedFileId, setLastOpenedFileId] = useState(null);

  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const abortControllerRef = useRef(null);

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
    analysisResult: result,
    loading: analysisLoading,
    analyzeCode,
    refactorCode,
    importGithubRepository,
    setAnalysisResult: setResult,
  } = useAnalysisContext();

  const [alertInfo, setAlertInfo] = useState(null);

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

  const runGitHubImport = async (url) => {
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      setImportError("Invalid URL format. Please use a valid GitHub repository URL.");
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let isResolved = false;

    // Helper for browser-side fallback
    const runClientSideFallback = async (reason) => {
      if (isResolved) return;
      isResolved = true;
      console.warn(`GitHub import failed or timed out (${reason}). Launching client-side zip downloader...`);
      try {
        const clientRes = await importGitHubRepositoryViaZip(parsed.owner, parsed.repo, parsed.branch);
        if (controller.signal.aborted) return;
        importProject(clientRes.projectName, clientRes.files, clientRes.metadata);
        setIsGitHubModalOpen(false);
        setGitHubUrl("");
      } catch (clientErr) {
        if (controller.signal.aborted) return;
        console.error("Client-side fallback failed:", clientErr);
        const errText = "Failed to sync repository files. Please verify it is a public repository.";
        setImportError(errText);
        setAlertInfo({
          title: "Repository Sync Failed",
          message: errText
        });
      } finally {
        if (!controller.signal.aborted) {
          setIsImporting(false);
        }
      }
    };

    // Trigger browser fallback if backend hangs for more than 7 seconds
    const timeoutId = setTimeout(() => {
      runClientSideFallback("Timeout");
    }, 7000);

    try {
      setIsImporting(true);
      setImportError("");
      
      const res = await importGithubRepository({ url });
      clearTimeout(timeoutId);

      if (controller.signal.aborted) return;

      if (res.success && !isResolved) {
        isResolved = true;
        importProject(res.data.projectName, res.data.files, res.data.metadata);
        setIsGitHubModalOpen(false);
        setGitHubUrl("");
        setIsImporting(false);
      } else if (!isResolved) {
        await runClientSideFallback(res.message || "Backend error");
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (controller.signal.aborted) return;
      if (!isResolved) {
        await runClientSideFallback(err.message || "Connection refused");
      }
    }
  };

  const autoImportGitHubRepo = async (url) => {
    await runGitHubImport(url);
  };

  // Reset/sync files to empty when project switches, or auto-import if configured
  useEffect(() => {
    if (currentProject) {
      // 1. Immediately reset files list and details
      importProject(currentProject.name, []);

      // 2. Trigger sync if URL exists
      if (currentProject.githubUrl) {
        autoImportGitHubRepo(currentProject.githubUrl);
      }
    }
  }, [currentProject]);

  const handleAnalyzeProject = (startOffset = 0) => {
    const offset = (typeof startOffset === "number") ? startOffset : 0;
    setActiveAnalysisTab("project");
    analyzeProjectAi(projectName, files, offset);
  };

  const handleRefactorRequest = async () => {
    if (!currentFile || !editorRef.current) return;
    if (isRefactoring) return; // Prevent duplicate submissions

    const editor = editorRef.current;
    const model = editor.getModel();
    const selection = editor.getSelection();
    const selectedText = model ? model.getValueInRange(selection) : "";
    const cursorLine = selection ? selection.startLineNumber : 1;
    const fileContent = currentFile.content || "";
    const language = currentFile.language || "text";

    if (!fileContent.trim()) {
      setAlertInfo({
        title: "No Code to Refactor",
        message: "The current file is empty. Please write some code before requesting a refactor."
      });
      return;
    }

    let scope = refactorScope;
    if (!selectedText.trim() && scope === "selection") {
      scope = "method";
    }

    const intent = refactorIntent.trim() || "Improve readability, reduce complexity, and apply best practices";

    setIsRefactoring(true);
    setShowRefactorSetup(false);

    const res = await refactorCode({
      language,
      fileContent,
      selectedText,
      scope,
      cursorLine,
      intent
    });

    setIsRefactoring(false);

    if (res && res.success) {
      setRefactorResult(res.data);
    } else {
      setAlertInfo({
        title: "Refactoring Failed",
        message: res?.message || "An error occurred while communicating with the AI refactoring service. Please try again."
      });
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
    if (!currentProject) return;
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

  const validateGitHubUrl = (url) => {
    if (!url || !url.trim()) {
      return "Repository URL is required";
    }
    const cleanUrl = url.trim().replace(/\.git$/, "");
    const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/);
    if (!match) {
      return "Invalid URL format. Use: https://github.com/owner/repository";
    }
    return null;
  };

  const handleGitHubImport = async (e) => {
    e.preventDefault();
    const url = gitHubUrl.trim();

    const validationMsg = validateGitHubUrl(url);
    if (validationMsg) {
      setImportError(validationMsg);
      return;
    }

    await runGitHubImport(url);
  };

  const handleCancelGitHubImport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsImporting(false);
    setIsGitHubModalOpen(false);
    setGitHubUrl("");
    setImportError("");
  };

  useEffect(() => {
    if (currentFileId !== null) {
      const timer = setTimeout(() => {
        setLastOpenedFileId(currentFileId);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentFileId]);

  useEffect(() => {
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
        onShowDashboard={() => setCurrentFileId(null)}
        onAIChat={() => { setCurrentFileId(null); setActiveAnalysisTab("chat"); }}
        currentFileId={currentFileId}
      />

      {projectsLoading ? (
        /* 1. Loading Skeleton */
        <div className="flex-1 flex items-center justify-center p-8 bg-slate-950">
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin mx-auto"></div>
            <p className="text-sm text-slate-400 font-medium">Syncing projects metadata...</p>
          </div>
        </div>
      ) : projectsError ? (
        /* 2. Error State */
        <div className="flex-1 flex items-center justify-center p-8 bg-slate-950">
          <div className="max-w-md w-full bg-[#1b1212]/50 border border-red-500/10 p-6 rounded-3xl text-center space-y-3">
            <span className="text-3xl text-red-500">⚠️</span>
            <h3 className="text-base font-bold text-slate-200">Synchronization Error</h3>
            <p className="text-xs text-slate-400">{projectsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs bg-slate-850 hover:bg-slate-800 text-slate-250 py-1.5 px-4 rounded-xl border border-slate-800 cursor-pointer shadow-sm"
            >
              Retry
            </button>
          </div>
        </div>
      ) : !currentProject ? (
        /* 3. Loading Workspace / Selection Redirection */
        <div className="flex-1 flex items-center justify-center p-8 bg-slate-950">
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin mx-auto"></div>
            <p className="text-sm text-slate-400 font-medium">Loading workspace...</p>
          </div>
        </div>
      ) : (
        /* 4. Complete Workspace Layout */
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
              isImporting={isImporting}
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
                  onLanguageChange={updateCurrentFileLanguage}
                />
                <div className="flex-1 min-h-0 relative">
                  <CodeEditor
                    language={currentFile.language}
                    code={currentFile.content}
                    setCode={updateCurrentFile}
                    editorRef={editorRef}
                  />
                </div>

                <div className="p-4 border-t border-slate-800 flex flex-col gap-3 relative">
                  {/* Analyze Row */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <AnalyzeButton
                        onAnalyze={async () => {
                          if (currentFile) {
                            setActiveAnalysisTab("file");
                            const res = await analyzeCode({
                              language: currentFile.language,
                              code: currentFile.content,
                              projectName: projectName,
                              fileName: currentFile.name,
                              projectId: currentProject?.id || null
                            });
                            if (!res.success) {
                              setAlertInfo({
                                title: "Analysis Failed",
                                message: res.message
                              });
                            }
                          }
                        }}
                        loading={analysisLoading}
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
                          <span>AI Refactor</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Refactor setup menu overlay */}
                  {showRefactorSetup && (
                    <div className="absolute bottom-[72px] right-4 left-4 sm:left-auto sm:w-80 z-20 bg-slate-950/95 backdrop-blur-md border border-slate-800 p-4 rounded-xl shadow-2xl flex flex-col gap-3 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Refactor Scope</span>
                        <div className="flex gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-850">
                          {["selection", "method", "file"].map(scope => (
                            <button
                              key={scope}
                              onClick={() => setRefactorScope(scope)}
                              className={`text-[10px] font-semibold py-1 px-2.5 rounded-md capitalize cursor-pointer transition ${
                                refactorScope === scope ? "bg-indigo-600 text-white font-bold" : "text-slate-500 hover:text-white"
                              }`}
                            >
                              {scope}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Prompt */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Instructions for AI (optional)</label>
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
                projectId={currentProject?.id || null}
              />
            )
          }
          rightPanel={
            <RightPanel
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
              projectId={currentProject?.id || null}
            />
          }
          statusBar={
            <StatusBar
              language={currentFile?.language || ""}
              code={currentFile?.content || ""}
            />
          }
        />
      )}

      {/* Reusable file input for folder uploading */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFolderUpload}
        className="hidden"
        webkitdirectory="true"
        directory="true"
        multiple
      />

      {/* GitHub Repo Import Modal */}
      {isGitHubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-[#141417] border border-white/5 p-6 rounded-3xl shadow-2xl relative">
            <button
              onClick={handleCancelGitHubImport}
              className="absolute top-4 right-4 text-white/40 hover:text-white text-lg transition-colors cursor-pointer border-none bg-transparent"
            >
              ✕
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold tracking-tight mb-1">Import from GitHub</h3>
              <p className="text-xs text-white/50">Load public source code repositories dynamically</p>
            </div>

            {importError && (
              <div className="mb-4 p-3 bg-red-955/40 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <span>⚠️</span>
                <span>{importError}</span>
              </div>
            )}

            <form onSubmit={handleGitHubImport} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Repository URL</label>
                <input
                  type="text"
                  value={gitHubUrl}
                  onChange={(e) => setGitHubUrl(e.target.value)}
                  placeholder="https://github.com/owner/repository"
                  disabled={isImporting}
                  className="w-full bg-[#1e1e24]/50 border border-white/5 rounded-xl py-2 px-3.5 text-xs text-white/90 placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleCancelGitHubImport}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting}
                  className="bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isImporting ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-black" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <span>Import</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refactor confirmation alert modal */}
      {refactorResult && (
        <RefactorModal
          isOpen={true}
          onClose={() => setRefactorResult(null)}
          onAccept={handleAcceptRefactor}
          originalCode={refactorResult.originalCode}
          refactoredCode={refactorResult.refactoredCode}
          explanation={refactorResult.explanation}
          improvements={refactorResult.improvements || []}
          language={currentFile?.language || "text"}
          fileName={currentFile?.name || "file"}
        />
      )}

      {/* AlertModal Dialog */}
      <AlertModal
        isOpen={!!alertInfo}
        onClose={() => setAlertInfo(null)}
        title={alertInfo?.title}
        message={alertInfo?.message}
      />

      {/* First Project Create Modal */}
      <CreateProjectModal
        isOpen={isFirstProjectModalOpen}
        onClose={() => setIsFirstProjectModalOpen(false)}
      />
    </div>
  );
}

export default Workspace;