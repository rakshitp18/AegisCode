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
      <div className="select-none">
        <div
          onClick={() => onToggleFolder(node.path)}
          className="flex items-center gap-1 py-0.5 px-1.5 hover:bg-slate-800/60 rounded cursor-pointer text-slate-350 hover:text-white text-xs font-semibold transition-colors"
        >
          <span className="mr-1.5 w-3.5 h-3.5 flex items-center justify-center shrink-0 select-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-3 w-3 text-slate-500 transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
          <span className="truncate">{node.name}</span>
        </div>
        {isOpen && (
          <div className="border-l border-slate-800/80 ml-1.5 pl-1.5 mt-0.5 space-y-0.5">
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
          return <span className="text-orange-400 mr-1.5 font-semibold text-xs shrink-0">☕</span>;
        case "python":
          return <span className="text-sky-400 mr-1.5 font-semibold text-xs shrink-0">🐍</span>;
        case "cpp":
          return <span className="text-blue-400 mr-1.5 font-bold font-mono text-[10px] shrink-0">C++</span>;
        case "javascript":
          return <span className="text-yellow-400 mr-1.5 font-bold font-mono text-[10px] shrink-0">JS</span>;
        case "html":
          return <span className="text-orange-500 mr-1.5 font-semibold text-xs shrink-0">🌐</span>;
        case "css":
          return <span className="text-blue-500 mr-1.5 font-semibold text-xs shrink-0">🎨</span>;
        case "json":
          return <span className="text-emerald-400 mr-1.5 font-semibold text-xs shrink-0">{}</span>;
        case "markdown":
          return <span className="text-indigo-400 mr-1.5 font-semibold text-xs shrink-0">📝</span>;
        default:
          return <span className="text-slate-400 mr-1.5 text-xs shrink-0">📄</span>;
      }
    };

    return (
      <div
        onClick={() => onSelectFile(node.id)}
        className={`group flex items-center justify-between py-0.5 px-1.5 rounded cursor-pointer transition-all ${
          isActive
            ? "bg-slate-800 border-l-2 border-blue-500 text-white font-medium shadow-sm"
            : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
        }`}
      >
        <div className="flex items-center min-w-0">
          {getFileIcon(node.language)}
          <span className="truncate text-xs">{node.name}</span>
        </div>

        {filesCount > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile(node.id);
            }}
            className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-slate-500 transition-opacity p-0.5 shrink-0"
            title="Delete File"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
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

// History Modal Component
const HistoryModal = ({ isOpen, onClose, gitMetadata, onLoadAnalysisResult }) => {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localHistory, setLocalHistory] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    if (gitMetadata) {
      const fetchCommits = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await fetch(
            `https://api.github.com/repos/${gitMetadata.owner}/${gitMetadata.repo}/commits?sha=${gitMetadata.branch || "main"}`
          );
          if (!response.ok) {
            throw new Error(`GitHub API returned status ${response.status}`);
          }
          const data = await response.json();
          setCommits(data.slice(0, 10));
        } catch (err) {
          console.error(err);
          setError(err.message || "Failed to load commits.");
        } finally {
          setLoading(false);
        }
      };
      fetchCommits();
    } else {
      const history = JSON.parse(localStorage.getItem("analysis_history") || "[]");
      setLocalHistory(history);
    }
  }, [isOpen, gitMetadata]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-955/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl max-w-md w-full flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-4 shrink-0">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>🕘</span> {gitMetadata ? "Repository Commit Log" : "Code Analysis History"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer border-none bg-transparent text-sm"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1 text-xs">
          {loading && (
            <div className="flex justify-center py-8">
              <span className="animate-spin rounded-full h-6 w-6 border-2 border-t-blue-500 border-blue-500/20"></span>
            </div>
          )}
          
          {error && (
            <div className="bg-red-950/20 border border-red-900/40 text-red-405 p-3 rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          {!loading && !error && gitMetadata && commits.length === 0 && (
            <p className="text-slate-500 text-center py-4 italic">No commits found.</p>
          )}

          {!loading && !error && !gitMetadata && localHistory.length === 0 && (
            <p className="text-slate-500 text-center py-4 italic">No past analyses recorded. Run analysis on a file to log it here.</p>
          )}

          {!loading && !error && gitMetadata && commits.map((commitObj) => {
            const commit = commitObj.commit;
            const author = commit.author;
            const date = new Date(author.date).toLocaleDateString();
            const message = commit.message.split("\n")[0];
            const sha = commitObj.sha.substring(0, 7);

            return (
              <div key={commitObj.sha} className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg space-y-1.5 hover:border-slate-800 transition-colors">
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>{author.name}</span>
                  <span>{date}</span>
                </div>
                <p className="font-semibold text-slate-250 text-xs leading-relaxed">{message}</p>
                <div className="flex justify-between items-center text-[10px] pt-1">
                  <span className="bg-slate-850 px-1.5 py-0.5 rounded text-slate-400 font-mono">SHA: {sha}</span>
                  <a
                    href={commitObj.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    View on GitHub ↗
                  </a>
                </div>
              </div>
            );
          })}

          {!loading && !error && !gitMetadata && localHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onLoadAnalysisResult(item.summary, item.loc, item.classes, item.methods);
                onClose();
              }}
              className="bg-slate-955/40 border border-slate-850 p-3 rounded-lg space-y-1.5 hover:border-blue-500 cursor-pointer transition-all text-left"
              title="Click to restore this analysis result"
            >
              <div className="flex justify-between text-[10px] text-slate-500">
                <span className="font-mono text-blue-450 font-bold">{item.fileName} ({item.language})</span>
                <span>{item.timestamp}</span>
              </div>
              <p className="text-slate-300 italic line-clamp-2">"{item.summary}"</p>
              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1.5 border-t border-slate-800/40">
                <span>LOC: {item.loc} | Classes: {item.classes} | Methods: {item.methods}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
  gitMetadata = null,
  lastOpenedFileId = null,
  lastOpenedFileName = "",
  onLoadAnalysisResult
}) {
  const fileInputRef = useRef(null);
  const [openFolders, setOpenFolders] = useState({});
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

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
    <div className="h-full bg-slate-900 p-3.5 flex flex-col justify-between select-none">
      <div className="flex flex-col min-h-0 flex-1">
        {/* Project Header */}
        <div className="flex items-center justify-between min-w-0 gap-2 mb-2 shrink-0">
          <span className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1 truncate min-w-0 pr-1" title={projectName}>
            <span className="text-slate-550 mr-0.5">/</span>{projectName}
          </span>
          <button
            onClick={onAddNewFile}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors shrink-0 cursor-pointer"
            title="Create New File"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>

        {/* Dynamic Overview Filters Cards Grid */}
        {analysisResults && (
          <div className="bg-slate-955/30 p-2 rounded-lg border border-slate-800 space-y-1.5 mt-1 shrink-0">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Filters</div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div
                onClick={() => onSelectFilter("all")}
                className={`py-1 px-0.5 rounded border cursor-pointer transition-all ${
                  filterType === "all"
                    ? "bg-blue-600/20 border-blue-500 text-blue-450 font-bold"
                    : "bg-slate-900/40 border-slate-800/60 hover:border-slate-700 text-slate-400 text-[10px]"
                }`}
                title="All Files"
              >
                <span className="block text-[7px] uppercase tracking-wider text-slate-500">Files</span>
                <span className="text-xs font-bold">{analysisResults.projectOverview.totalFiles}</span>
              </div>
              <div
                onClick={() => onSelectFilter(filterType === "loc" ? "all" : "loc")}
                className={`py-1 px-0.5 rounded border cursor-pointer transition-all ${
                  filterType === "loc"
                    ? "bg-blue-600/20 border-blue-500 text-blue-450 font-bold"
                    : "bg-slate-900/40 border-slate-800/60 hover:border-slate-700 text-slate-400 text-[10px]"
                }`}
                title="Lines of Code"
              >
                <span className="block text-[7px] uppercase tracking-wider text-slate-500">LOC</span>
                <span className="text-xs font-bold truncate block">{analysisResults.projectOverview.loc}</span>
              </div>
              <div
                onClick={() => onSelectFilter(filterType === "classes" ? "all" : "classes")}
                className={`py-1 px-0.5 rounded border cursor-pointer transition-all ${
                  filterType === "classes"
                    ? "bg-blue-600/20 border-blue-500 text-blue-450 font-bold"
                    : "bg-slate-900/40 border-slate-800/60 hover:border-slate-700 text-slate-400 text-[10px]"
                }`}
                title="Java Classes"
              >
                <span className="block text-[7px] uppercase tracking-wider text-slate-500">Classes</span>
                <span className="text-xs font-bold">{analysisResults.javaMetrics.classes}</span>
              </div>
              <div
                onClick={() => onSelectFilter(filterType === "methods" ? "all" : "methods")}
                className={`py-1 px-0.5 rounded border cursor-pointer transition-all ${
                  filterType === "methods"
                    ? "bg-blue-600/20 border-blue-500 text-blue-450 font-bold"
                    : "bg-slate-900/40 border-slate-800/60 hover:border-slate-700 text-slate-400 text-[10px]"
                }`}
                title="Java Methods"
              >
                <span className="block text-[7px] uppercase tracking-wider text-slate-500">Methods</span>
                <span className="text-xs font-bold">{analysisResults.javaMetrics.methods}</span>
              </div>
              <div
                onClick={() => onSelectFilter(filterType === "complexity" ? "all" : "complexity")}
                className={`py-1 px-0.5 rounded border cursor-pointer transition-all ${
                  filterType === "complexity"
                    ? "bg-blue-600/20 border-blue-500 text-blue-450 font-bold"
                    : "bg-slate-900/40 border-slate-800/60 hover:border-slate-700 text-slate-400 text-[10px]"
                }`}
                title="Complexity Index"
              >
                <span className="block text-[7px] uppercase tracking-wider text-slate-500">Complex</span>
                <span className="text-xs font-bold">{analysisResults.complexityMetrics.score}</span>
              </div>
              <div
                onClick={() => onSelectFilter(filterType === "todos" ? "all" : "todos")}
                className={`py-1 px-0.5 rounded border cursor-pointer transition-all ${
                  filterType === "todos"
                    ? "bg-blue-600/20 border-blue-500 text-blue-450 font-bold"
                    : "bg-slate-900/40 border-slate-800/60 hover:border-slate-700 text-slate-400 text-[10px]"
                }`}
                title="TODOs"
              >
                <span className="block text-[7px] uppercase tracking-wider text-slate-500">TODOs</span>
                <span className="text-xs font-bold">{analysisResults.qualityMetrics.todos}</span>
              </div>
              <div
                onClick={() => onSelectFilter(filterType === "security" ? "all" : "security")}
                className={`col-span-3 py-1 px-2 rounded border cursor-pointer transition-all ${
                  filterType === "security"
                    ? "bg-red-950/40 border-red-500 text-red-400 font-bold"
                    : analysisResults.securityWarnings.length > 0
                    ? "bg-red-950/10 border-red-900/30 text-red-455 hover:border-red-800"
                    : "bg-slate-900/40 border-slate-800/60 hover:border-slate-750 text-slate-400 text-[10px]"
                }`}
              >
                <div className="flex justify-between items-center px-1 text-[10px]">
                  <span className="text-[7.5px] uppercase tracking-wider text-slate-500 font-bold">Security Alerts</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                    analysisResults.securityWarnings.length > 0 ? "bg-red-650 text-white animate-pulse" : "bg-slate-800 text-slate-400"
                  }`}>
                    {analysisResults.securityWarnings.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Clear Bar */}
        {analysisResults && filterType !== "all" && (
          <div className="flex justify-between items-center bg-blue-950/20 border border-blue-900/30 px-2.5 py-1.5 rounded-lg shrink-0 mt-2 text-[10px]">
            <span className="text-slate-450 font-medium">
              Filtered by: <span className="font-bold text-blue-400 capitalize">{filterType}</span>
            </span>
            <button
              onClick={() => onSelectFilter("all")}
              className="text-blue-400 hover:text-blue-300 font-bold border-none bg-transparent cursor-pointer text-[10px]"
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* Dynamic Recursive File Tree */}
        <div className="flex-1 overflow-y-auto space-y-0.5 border-t border-b border-slate-800/80 py-2.5 my-2 min-h-0">
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

      <div className="shrink-0 pt-3 border-t border-slate-855 space-y-3 mt-1.5">
        {gitMetadata && (
          <a
            href={gitMetadata.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <svg className="w-3.5 h-3.5 fill-current text-slate-400" viewBox="0 0 16 16">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub Repository
          </a>
        )}
        <button
          onClick={() => setIsHistoryModalOpen(true)}
          className="w-full text-left bg-transparent border-none p-0 flex items-center gap-2 text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          <span>🕘</span> History
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-400 hover:text-white cursor-pointer transition-colors">
          <span>⚙</span> Settings
        </div>
      </div>

      {/* GitHub Repository Import Modal Dialog */}
      {isGitHubModalOpen && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl max-w-sm w-full space-y-4">
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

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        gitMetadata={gitMetadata}
        onLoadAnalysisResult={onLoadAnalysisResult}
      />
    </div>
  );
}

export default Sidebar;