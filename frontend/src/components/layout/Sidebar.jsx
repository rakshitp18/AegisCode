import { useRef, useState, useEffect } from "react";
import { importFolder } from "../../services/folderImportService";
import { importGitHubRepository } from "../../services/githubImportService";
import { buildFileTree } from "../../utils/treeBuilder";

// Recursive Component for Tree Nodes
const FileTreeNode = ({
  node,
  depth = 0,
  currentFileId,
  onSelectFile,
  onDeleteFile,
  openFolders,
  onToggleFolder,
  filesCount,
}) => {
  const indentClass = depth > 0 ? "pl-2" : "";

  if (node.isFolder) {
    const isOpen = !!openFolders[node.path];
    
    // Sort folder children: folders first, then files, both alphabetically
    const sortedKeys = Object.keys(node.children).sort((a, b) => {
      const childA = node.children[a];
      const childB = node.children[b];
      if (childA.isFolder && !childB.isFolder) return -1;
      if (!childA.isFolder && childB.isFolder) return 1;
      return a.localeCompare(b);
    });

    return (
      <div className={`select-none ${indentClass}`}>
        <div
          onClick={() => onToggleFolder(node.path)}
          className="flex items-center gap-1.5 py-1.5 px-2 hover:bg-slate-800/60 rounded cursor-pointer text-slate-300 text-sm font-medium transition-colors"
        >
          <span className="text-slate-400">{isOpen ? "📂" : "📁"}</span>
          <span className="truncate">{node.name}</span>
        </div>
        {isOpen && (
          <div className="border-l border-slate-800 ml-3.5 pl-2 mt-0.5 space-y-0.5">
            {sortedKeys.map((key) => (
              <FileTreeNode
                key={key}
                node={node.children[key]}
                depth={depth + 1}
                currentFileId={currentFileId}
                onSelectFile={onSelectFile}
                onDeleteFile={onDeleteFile}
                openFolders={openFolders}
                onToggleFolder={onToggleFolder}
                filesCount={filesCount}
              />
            ))}
          </div>
        )}
      </div>
    );
  } else {
    const isActive = node.id === currentFileId;
    
    const getFileIcon = (language) => {
      switch (language) {
        case "java":
          return <span className="text-orange-400 mr-2 font-semibold">☕</span>;
        case "python":
          return <span className="text-sky-400 mr-2 font-semibold">🐍</span>;
        case "cpp":
          return <span className="text-blue-400 mr-2 font-bold font-mono text-xs">C++</span>;
        case "javascript":
          return <span className="text-yellow-400 mr-2 font-bold font-mono text-xs">JS</span>;
        case "html":
          return <span className="text-orange-500 mr-2 font-semibold">🌐</span>;
        case "css":
          return <span className="text-blue-500 mr-2 font-semibold">🎨</span>;
        case "json":
          return <span className="text-emerald-400 mr-2 font-semibold">{}</span>;
        case "markdown":
          return <span className="text-indigo-400 mr-2 font-semibold">📝</span>;
        default:
          return <span className="text-slate-400 mr-2">📄</span>;
      }
    };

    return (
      <div
        onClick={() => onSelectFile(node.id)}
        className={`group flex items-center justify-between py-1.5 px-2 rounded cursor-pointer transition-all ${
          isActive
            ? "bg-slate-800 border-l-2 border-blue-500 text-white font-medium shadow-sm"
            : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
        }`}
      >
        <div className="flex items-center min-w-0">
          {getFileIcon(node.language)}
          <span className="truncate text-sm">{node.name}</span>
        </div>

        {filesCount > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile(node.id);
            }}
            className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-slate-500 transition-opacity p-0.5"
            title="Delete File"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
};

function Sidebar({
  projectName = "My Project",
  files = [],
  currentFileId,
  onSelectFile,
  onAddNewFile,
  onDeleteFile,
  onImportProject,
  setAlertInfo,
  stats = { totalFiles: 0, totalFolders: 0, languages: [] },
  filterType = "all",
  onSelectFilter,
  analysisResults = null,
}) {
  const fileInputRef = useRef(null);
  const [openFolders, setOpenFolders] = useState({});

  // GitHub Import Modal State
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [gitHubUrl, setGitHubUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");

  // Auto-expand all folders when new files are loaded/imported
  useEffect(() => {
    const initialOpen = {};
    files.forEach((file) => {
      const path = file.path || file.name;
      const parts = path.split("/");
      let currentPath = "";
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
        initialOpen[currentPath] = true;
      }
    });
    setOpenFolders(initialOpen);
  }, [files]);

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
      onImportProject(result.projectName, result.files);
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
      onImportProject(result.projectName, result.files, result.metadata);
      setIsGitHubModalOpen(false);
      setGitHubUrl("");
    } catch (err) {
      console.error(err);
      setImportError(err.message || "Failed to import GitHub repository.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleToggleFolder = (folderPath) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  // Convert flat files array to dynamic folder tree representation
  const fileTree = buildFileTree(files);
  const sortedRootKeys = Object.keys(fileTree.children).sort((a, b) => {
    const childA = fileTree.children[a];
    const childB = fileTree.children[b];
    if (childA.isFolder && !childB.isFolder) return -1;
    if (!childA.isFolder && childB.isFolder) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="h-full bg-slate-900 p-4 flex flex-col justify-between select-none">
      <div className="flex flex-col min-h-0">
        <h2 className="text-xl font-bold mb-6 text-slate-200">
          Explorer
        </h2>

        {/* Project Header and Actions */}
        <div className="flex flex-col gap-2.5 mb-4 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 truncate pr-2" title={projectName}>
              <span>📁</span> {projectName}
            </span>
            <button
              onClick={onAddNewFile}
              className="text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-1 shrink-0 font-medium"
              title="Create New File"
            >
              <span>+</span> New File
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleOpenFolderClick}
                className="text-xs bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-semibold py-2 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm border border-slate-700 cursor-pointer"
              >
                <span>📁</span> Open Folder
              </button>
              <button
                onClick={() => setIsGitHubModalOpen(true)}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm border border-blue-500/20 cursor-pointer"
              >
                <span>🐙</span> GitHub
              </button>
            </div>
            
            <button
              onClick={() => onSelectFile(null)}
              className={`w-full text-xs font-semibold py-2 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm border cursor-pointer ${
                currentFileId === null
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-805"
              }`}
            >
              <span>📊</span> Project Overview Dashboard
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFolderUpload}
            webkitdirectory="true"
            directory="true"
            multiple
            className="hidden"
          />
        </div>

        {/* Dynamic Overview Filters Cards Grid */}
        {analysisResults && (
          <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 space-y-2 mt-1 shrink-0">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Project Overview</div>
            <div className="grid grid-cols-2 gap-1.5 text-center">
              <div
                onClick={() => onSelectFilter("all")}
                className={`p-1.5 rounded border cursor-pointer transition-all ${
                  filterType === "all"
                    ? "bg-slate-800 border-blue-500 text-white font-bold"
                    : "bg-slate-900/30 border-slate-800/80 hover:border-slate-750 text-slate-400 text-[11px]"
                }`}
              >
                <span className="block text-[8px] uppercase tracking-wider text-slate-500">Files</span>
                <span className="text-xs font-black">{analysisResults.projectOverview.totalFiles}</span>
              </div>
              <div
                onClick={() => onSelectFilter("loc")}
                className={`p-1.5 rounded border cursor-pointer transition-all ${
                  filterType === "loc"
                    ? "bg-slate-800 border-blue-500 text-white font-bold"
                    : "bg-slate-900/30 border-slate-800/80 hover:border-slate-750 text-slate-400 text-[11px]"
                }`}
              >
                <span className="block text-[8px] uppercase tracking-wider text-slate-500">LOC</span>
                <span className="text-xs font-black truncate max-w-full block">{analysisResults.projectOverview.loc}</span>
              </div>
              <div
                onClick={() => onSelectFilter("classes")}
                className={`p-1.5 rounded border cursor-pointer transition-all ${
                  filterType === "classes"
                    ? "bg-slate-800 border-blue-500 text-white font-bold"
                    : "bg-slate-900/30 border-slate-800/80 hover:border-slate-750 text-slate-400 text-[11px]"
                }`}
              >
                <span className="block text-[8px] uppercase tracking-wider text-slate-500">Classes</span>
                <span className="text-xs font-black">{analysisResults.javaMetrics.classes}</span>
              </div>
              <div
                onClick={() => onSelectFilter("methods")}
                className={`p-1.5 rounded border cursor-pointer transition-all ${
                  filterType === "methods"
                    ? "bg-slate-800 border-blue-500 text-white font-bold"
                    : "bg-slate-900/30 border-slate-800/80 hover:border-slate-750 text-slate-400 text-[11px]"
                }`}
              >
                <span className="block text-[8px] uppercase tracking-wider text-slate-500">Methods</span>
                <span className="text-xs font-black">{analysisResults.javaMetrics.methods}</span>
              </div>
              <div
                onClick={() => onSelectFilter("complexity")}
                className={`p-1.5 rounded border cursor-pointer transition-all ${
                  filterType === "complexity"
                    ? "bg-slate-800 border-blue-500 text-white font-bold"
                    : "bg-slate-900/30 border-slate-800/80 hover:border-slate-750 text-slate-400 text-[11px]"
                }`}
              >
                <span className="block text-[8px] uppercase tracking-wider text-slate-500">Complexity</span>
                <span className="text-xs font-black">{analysisResults.complexityMetrics.score}</span>
              </div>
              <div
                onClick={() => onSelectFilter("todos")}
                className={`p-1.5 rounded border cursor-pointer transition-all ${
                  filterType === "todos"
                    ? "bg-slate-800 border-blue-500 text-white font-bold"
                    : "bg-slate-900/30 border-slate-800/80 hover:border-slate-750 text-slate-400 text-[11px]"
                }`}
              >
                <span className="block text-[8px] uppercase tracking-wider text-slate-500">TODOs</span>
                <span className="text-xs font-black">{analysisResults.qualityMetrics.todos}</span>
              </div>
              <div
                onClick={() => onSelectFilter("security")}
                className={`col-span-2 p-1.5 rounded border cursor-pointer transition-all ${
                  filterType === "security"
                    ? "bg-red-950 border-red-500 text-red-100 font-bold"
                    : analysisResults.securityWarnings.length > 0
                    ? "bg-red-950/20 border-red-900/40 text-red-300 hover:border-red-800/80"
                    : "bg-slate-900/30 border-slate-800/80 hover:border-slate-750 text-slate-400 text-[11px]"
                }`}
              >
                <div className="flex justify-between items-center px-1 text-[11px]">
                  <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Security Alerts</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                    analysisResults.securityWarnings.length > 0 ? "bg-red-600 text-white animate-pulse" : "bg-slate-800 text-slate-400"
                  }`}>
                    {analysisResults.securityWarnings.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Recursive File Tree */}
        <div className="flex-1 overflow-y-auto space-y-0.5 border-t border-b border-slate-800/80 py-2.5 my-1 min-h-[150px]">
          {sortedRootKeys.length > 0 ? (
            sortedRootKeys.map((key) => (
              <FileTreeNode
                key={key}
                node={fileTree.children[key]}
                currentFileId={currentFileId}
                onSelectFile={onSelectFile}
                onDeleteFile={onDeleteFile}
                openFolders={openFolders}
                onToggleFolder={handleToggleFolder}
                filesCount={files.length}
              />
            ))
          ) : (
            <div className="text-xs text-slate-500 italic p-2 text-center">
              {filterType !== "all" ? "No files matching active filter" : "No files in project"}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 space-y-4">
        {/* Project Statistics UI Panel */}
        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
          <div className="font-bold text-slate-300 uppercase tracking-wider text-[9px] mb-1.5 flex items-center gap-1">
            <span>📊</span> Project Statistics
          </div>
          <div className="flex justify-between">
            <span>Total Files:</span>
            <span className="font-semibold text-slate-200">{stats.totalFiles}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Folders:</span>
            <span className="font-semibold text-slate-200">{stats.totalFolders}</span>
          </div>
          <div className="flex flex-col gap-1 mt-1 border-t border-slate-800/40 pt-1.5">
            <span>Languages:</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {stats.languages && stats.languages.length > 0 ? (
                stats.languages.map((lang) => (
                  <span
                    key={lang}
                    className="bg-slate-800/80 text-slate-300 border border-slate-700/60 px-1.5 py-0.5 rounded text-[9px] font-mono capitalize"
                  >
                    {lang}
                  </span>
                ))
              ) : (
                <span className="italic text-slate-600 text-[10px]">None detected</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3.5 text-xs text-slate-400 border-t border-slate-800 pt-3">
          <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
            <span>🐙</span> GitHub Repository
          </div>
          <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
            <span>🕘</span> History
          </div>
          <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
            <span>⚙</span> Settings
          </div>
        </div>
      </div>

      {/* GitHub Repository Import Modal Dialog */}
      {isGitHubModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl max-w-sm w-full space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>🐙</span> Import from GitHub
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
    </div>
  );
}

export default Sidebar;