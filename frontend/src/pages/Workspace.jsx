import { useState, useRef, useEffect } from "react";
import Navbar from "../components/common/Navbar";
import AlertModal from "../components/common/AlertModal";
import CreateProjectModal from "../components/dashboard/CreateProjectModal";
import UploadFolderModal from "../components/common/UploadFolderModal";

import { useParams, useNavigate, Outlet } from "react-router-dom";
import useProject from "../hooks/useProject";
import useProjectAnalysis from "../hooks/useProjectAnalysis";
import useProjectAiAnalysis from "../hooks/useProjectAiAnalysis";
import { useProjectContext } from "../contexts/ProjectContext";
import { useAnalysisContext } from "../contexts/AnalysisContext";
import { parseGitHubUrl } from "../services/githubImportService";

function Workspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentProject, projects, selectProject, loading: projectsLoading, error: projectsError, refreshProjects } = useProjectContext();
  const [isFirstProjectModalOpen, setIsFirstProjectModalOpen] = useState(false);
  const [loadedProjectId, setLoadedProjectId] = useState(null);

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

  const [lastOpenedFileId, setLastOpenedFileId] = useState(null);

  const editorRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [gitHubUrl, setGitHubUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importStage, setImportStage] = useState("");
  const [importError, setImportError] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);



  const {
    files,
    currentFile,
    currentFileId,
    setCurrentFileId,
    updateCurrentFile,
    updateCurrentFileLanguage,
    addNewFile,
    addNewFolder,
    renameItem,
    deleteItem,
    moveItem,
    importProject,
    getProjectStats,
    gitMetadata,
  } = useProject(projectId);

  const {
    analysisResult: result,
    loading: analysisLoading,
    analyzeCode,
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
    if (isImporting) return;

    // Stage 1: Validating repository...
    setIsImporting(true);
    setImportStage("Validating repository...");
    setImportError("");

    const validationMsg = validateGitHubUrl(url);
    if (validationMsg) {
      setImportError(validationMsg);
      setAlertInfo({
        title: "Invalid Repository URL",
        message: validationMsg
      });
      setIsImporting(false);
      return;
    }

    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      const errMsg = "Invalid repository URL format. Use: https://github.com/owner/repository";
      setImportError(errMsg);
      setAlertInfo({
        title: "Invalid Repository URL",
        message: errMsg
      });
      setIsImporting(false);
      return;
    }

    // Stage 2: Cloning repository...
    setImportStage("Cloning repository...");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await importGithubRepository({ url }, controller.signal);
      if (controller.signal.aborted) return;

      if (!res || res.success === false) {
        if (res?.message === "canceled") return;
        const errToThrow = res?.error || new Error(res?.message || "Failed to import GitHub repository.");
        throw errToThrow;
      }

      // Stage 3: Processing files...
      setImportStage("Processing files...");

      let targetData = res.data;
      if (targetData && targetData.data) {
        targetData = targetData.data;
      }

      if (targetData && (targetData.files || targetData.projectName)) {
        // Stage 4: Saving project...
        setImportStage("Saving project...");

        importProject(targetData.projectName, targetData.files || [], targetData.metadata);

        if (targetData.id) {
          localStorage.setItem(`aegis_project_files_${targetData.id}`, JSON.stringify(targetData.files || []));
          localStorage.setItem(
            `aegis_project_meta_${targetData.id}`,
            JSON.stringify({ name: targetData.projectName, gitMetadata: targetData.metadata })
          );
        }

        if (refreshProjects) {
          await refreshProjects();
        }

        // Stage 5: Completed.
        setImportStage("Completed.");
        setIsGitHubModalOpen(false);
        setGitHubUrl("");

        if (targetData.id) {
          navigate(`/workspace/${targetData.id}`);
        }
      } else {
        throw new Error("Invalid response format received from server.");
      }
    } catch (err) {
      if (controller.signal.aborted) return;

      const code = err.response?.data?.code || err.response?.data?.errorCode;
      const backendMessage = err.response?.data?.message;

      let errorMsg = backendMessage;
      if (!errorMsg) {
        switch (code) {
          case "INVALID_URL":
            errorMsg = "Invalid repository URL. Please verify the URL and try again.";
            break;
          case "PRIVATE_REPOSITORY":
            errorMsg = "Access denied. AegisCode only supports public GitHub repositories.";
            break;
          case "REPOSITORY_NOT_FOUND":
            errorMsg = "Repository not found. Please verify the repository is public and the URL is correct.";
            break;
          case "CLONE_FAILED":
            errorMsg = "Failed to clone repository. Please try again later.";
            break;
          case "NETWORK_ERROR":
            errorMsg = "Network failure while connecting to GitHub. Please check your connection.";
            break;
          case "IMPORT_FAILED":
          default:
            errorMsg = err.message || "Failed to import GitHub repository.";
            break;
        }
      }

      setImportError(errorMsg);
      setAlertInfo({
        title: "Repository Import Failed",
        message: errorMsg
      });
    } finally {
      setIsImporting(false);
      setImportStage("");
    }
  };

  // Reset/sync files when project switches, or auto-import if GitHub URL exists
  useEffect(() => {
    if (currentProject) {
      if (currentProject.id !== loadedProjectId) {
        // Abort any active imports from previous projects
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        setIsImporting(false);
        setImportError("");
        setAlertInfo(null);

        setLoadedProjectId(currentProject.id);

        const savedFiles = localStorage.getItem(`aegis_project_files_${currentProject.id}`);
        let hasFiles = false;
        if (savedFiles) {
          try {
            const parsed = JSON.parse(savedFiles);
            if (Array.isArray(parsed) && parsed.length > 0) {
              importProject(currentProject.name, parsed);
              hasFiles = true;
            }
          } catch (e) {}
        }

        if (!hasFiles && currentProject.githubUrl) {
          runGitHubImport(currentProject.githubUrl);
        }
      }
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [currentProject, loadedProjectId]);

  const handleAnalyzeProject = (startOffset = 0) => {
    const offset = (typeof startOffset === "number") ? startOffset : 0;
    analyzeProjectAi(projectName, files, offset);
  };


  const handleOpenFolderClick = () => {
    if (!currentProject) return;
    setIsUploadModalOpen(true);
  };

  const handleUploadSuccess = (result) => {
    importProject(result.projectName, result.files);
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
    if (isImporting) return;
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
    return files;
  };

  const handleImportGitHubClick = () => {
    if (isImporting) return;
    if (currentProject && currentProject.githubUrl) {
      runGitHubImport(currentProject.githubUrl);
    } else {
      setIsGitHubModalOpen(true);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-white flex flex-col">
      <Navbar
        onOpenFolder={handleOpenFolderClick}
        githubUrl={currentProject?.githubUrl || null}
        onImportGitHub={handleImportGitHubClick}
        isSyncing={isImporting}
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
        /* 4. Complete Workspace Layout Container */
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <Outlet
            context={{
              files: getFilteredFiles(),
              currentFile,
              currentFileId,
              setCurrentFileId,
              updateCurrentFile,
              updateCurrentFileLanguage,
              addNewFile,
              addNewFolder,
              renameItem,
              deleteItem,
              moveItem,
              importProject,
              getProjectStats,
              gitMetadata,
              projectName,
              analysisResults,
              projectAiResult,
              projectAiLoading,
              projectAiError,
              handleAnalyzeProject,
              isImporting,
              runGitHubImport,
              githubUrl: gitHubUrl,
              setAlertInfo,
              filterType,
              setFilterType,
              onLoadAnalysisResult: (summary, loc, classes, methods) => {
                setResult({
                  summary,
                  bugs: [],
                  suggestions: [],
                  complexity: "Unknown",
                  tests: [],
                  metrics: { lines: loc, classes, methods, todos: 0, printStatements: 0 }
                });
                navigate(`/workspace/${projectId}/inspect-file`);
              },
              analyzeCode,
              analysisLoading,
              analysisResult: result,
              setResult,
              currentProject,
              editorRef,
              staticLoading
            }}
          />
        </div>
      )}

      {/* Upload Folder / Files Modal */}
      <UploadFolderModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
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
                      <span>{importStage}</span>
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